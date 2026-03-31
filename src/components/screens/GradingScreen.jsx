import { useState, useEffect } from "react";
import { T, serif, mono } from "../../data/tokens";
import { submissionAPI, testAPI } from "../../services/api";
import Btn from "../ui/Btn";
import Badge from "../ui/Badge";

const STATUS_COLOR  = { pending_review: T.amber, reviewed: T.mint };
const STATUS_LABEL  = { pending_review: "Pending Review", reviewed: "Reviewed" };

// Individual question review row
function QuestionRow({ index, question, answer, marksAwarded, maxMarks, onChange }) {
  const [localMark, setLocalMark] = useState(String(marksAwarded ?? 0));

  const isSubjective = question?.type === "subjective";
  const isEditable   = true; // teacher can override any question's mark

  const handleBlur = () => {
    const v = parseFloat(localMark);
    if (!isNaN(v) && v >= 0 && v <= maxMarks) onChange(index, v);
    else setLocalMark(String(marksAwarded ?? 0)); // revert invalid
  };

  return (
    <div style={{
      background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 14,
      padding: "18px 20px", marginBottom: 12,
    }}>
      {/* Question header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, paddingRight: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span style={{ ...mono, fontSize: 10, color: T.muted }}>Q{index + 1}</span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
              background: question?.type === "subjective" ? "#a855f718" : T.blueLight,
              color: question?.type === "subjective" ? "#a855f7" : T.blue,
            }}>
              {question?.type === "single" ? "Single Choice"
               : question?.type === "multiple" ? "Multiple Choice"
               : "Subjective"}
            </span>
          </div>
          <div style={{ fontSize: 14, color: T.ghost, lineHeight: 1.6 }}>
            {question?.questionText || "—"}
          </div>
        </div>

        {/* Mark input */}
        <div style={{ flexShrink: 0, textAlign: "center", minWidth: 80 }}>
          <div style={{ fontSize: 10, color: T.muted, marginBottom: 4, ...mono }}>MARKS</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="number"
              value={localMark}
              min={0}
              max={maxMarks}
              onChange={e => setLocalMark(e.target.value)}
              onBlur={handleBlur}
              style={{
                width: 52, padding: "6px 8px", borderRadius: 8, textAlign: "center",
                background: T.ink3, border: `1.5px solid ${T.ink4}`,
                color: T.ghost, fontSize: 14, fontWeight: 600,
                fontFamily: "'Sora', system-ui, sans-serif", outline: "none",
              }}
            />
            <span style={{ fontSize: 11, color: T.muted }}>/ {maxMarks}</span>
          </div>
        </div>
      </div>

      {/* Student's answer */}
      <div style={{ background: T.ink3, borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ ...mono, fontSize: 10, color: T.muted, marginBottom: 6 }}>STUDENT'S ANSWER</div>
        {isSubjective ? (
          <div style={{ fontSize: 13, color: T.ghost, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {answer?.textAnswer || <em style={{ color: T.muted }}>No answer provided</em>}
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(question?.options || []).map((opt, oi) => {
              const selected = (answer?.selectedOptions || []).includes(oi);
              const isCorrect = (question?.correctOptions || []).includes(oi);
              return (
                <div key={oi} style={{
                  padding: "5px 12px", borderRadius: 8, fontSize: 12,
                  border: `1.5px solid ${selected ? (isCorrect ? T.mint : T.pink) : T.ink4}`,
                  background: selected ? (isCorrect ? T.mint + "18" : T.pink + "18") : "transparent",
                  color: selected ? (isCorrect ? T.mint : T.pink) : T.muted,
                }}>
                  {String.fromCharCode(65 + oi)}. {opt}
                  {isCorrect && " ✓"}
                </div>
              );
            })}
            {!(answer?.selectedOptions?.length) && (
              <span style={{ fontSize: 12, color: T.muted, fontStyle: "italic" }}>No answer selected</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Submission list item
function SubmissionRow({ sub, onReview }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 0", borderBottom: `1px solid ${T.ink3}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: T.ghost, fontWeight: 500 }}>
          {sub.studentId?.name || "—"}
        </div>
        <div style={{ ...mono, fontSize: 10, color: T.muted, marginTop: 2 }}>
          {sub.studentId?.username} · submitted {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "—"}
        </div>
      </div>
      <div style={{ ...mono, fontSize: 13, fontWeight: 600, color: T.ghost, minWidth: 50, textAlign: "right" }}>
        {sub.totalScore ?? "?"}
      </div>
      <Badge
        color={STATUS_COLOR[sub.status] || T.muted}
        bg={(STATUS_COLOR[sub.status] || T.muted) + "18"}
        style={{ fontSize: 9 }}
      >
        {STATUS_LABEL[sub.status] || sub.status}
      </Badge>
      <Btn variant="primary" onClick={() => onReview(sub)} style={{ fontSize: 11, padding: "6px 14px" }}>
        {sub.status === "reviewed" ? "Edit Marks" : "Grade →"}
      </Btn>
    </div>
  );
}

export default function GradingScreen({ user, setScreen, notify }) {
  const [tests,       setTests]       = useState([]);
  const [activeTest,  setActiveTest]  = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Review modal state
  const [reviewSub,    setReviewSub]    = useState(null); // submission being graded
  const [localMarks,   setLocalMarks]   = useState({});   // { questionIndex: marks }
  const [saving,       setSaving]       = useState(false);

  const backScreen = user?.role === "admin" ? "adminDash" : "teacherDash";

  // Load teacher's tests on mount
  useEffect(() => {
    async function load() {
      try {
        const all = user?.role === "admin"
          ? await testAPI.getAll()
          : await testAPI.getMyTests();
        setTests(all);
        if (all.length > 0) await loadSubmissions(all[0]);
      } catch (err) {
        notify("Could not load tests: " + err.message, "critical");
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSubmissions = async (test) => {
    setActiveTest(test);
    setSubmissions([]);
    setLoadingSubs(true);
    try {
      const subs = await submissionAPI.getForTest(test._id);
      setSubmissions(subs);
    } catch (err) {
      notify("Could not load submissions: " + err.message, "critical");
    } finally {
      setLoadingSubs(false);
    }
  };

  const openReview = (sub) => {
    // Build initial localMarks from existing marksAwarded
    const init = {};
    (sub.answers || []).forEach(a => { init[a.questionIndex] = a.marksAwarded ?? 0; });
    setLocalMarks(init);
    setReviewSub(sub);
  };

  const handleMarkChange = (qIndex, value) => {
    setLocalMarks(prev => ({ ...prev, [qIndex]: value }));
  };

  const handleSaveReview = async () => {
    setSaving(true);
    try {
      const manualScores = Object.entries(localMarks).map(([qi, marks]) => ({
        questionIndex: Number(qi),
        marks: Number(marks),
      }));
      const result = await submissionAPI.review(reviewSub._id, manualScores);
      // Update local list
      setSubmissions(prev => prev.map(s => s._id === reviewSub._id ? result.submission : s));
      notify("Marks saved successfully!");
      setReviewSub(null);
    } catch (err) {
      notify("Error saving marks: " + err.message, "critical");
    } finally {
      setSaving(false);
    }
  };

  const currentSubmission = reviewSub;
  const testQuestions = currentSubmission?.testId?.questions || [];
  const totalPossible = testQuestions.reduce((s, q) => s + (q.marks || 0), 0);
  const currentTotal  = Object.values(localMarks).reduce((s, v) => s + Number(v || 0), 0);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.ink }}>
      {/* Header */}
      <div style={{
        height: 56, background: "#0c0b18", borderBottom: `1px solid ${T.ink3}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setScreen(backScreen)}
            style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif" }}>←</button>
          <div style={{ ...serif, fontSize: 18, color: T.ghost }}>Grade Submissions</div>
        </div>
        {activeTest && (
          <Badge color={T.blue} bg={T.blueLight}>{submissions.length} submissions</Badge>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Exam selector sidebar */}
        <div style={{ width: 240, borderRight: `1px solid ${T.ink3}`, overflow: "auto", padding: "16px", flexShrink: 0 }}>
          <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: T.muted, marginBottom: 12 }}>
            Select Exam
          </div>
          {loading ? (
            <div style={{ color: T.muted, fontSize: 12 }}>Loading…</div>
          ) : tests.length === 0 ? (
            <div style={{ color: T.muted, fontSize: 12 }}>No exams yet.</div>
          ) : tests.map(t => (
            <div key={t._id}
              onClick={() => loadSubmissions(t)}
              style={{
                padding: "10px 14px", borderRadius: 10, marginBottom: 6, cursor: "pointer",
                background: activeTest?._id === t._id ? T.ink3 : "transparent",
                border: `1px solid ${activeTest?._id === t._id ? T.ink4 : "transparent"}`,
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: T.ghost }}>{t.name}</div>
              <div style={{ ...mono, fontSize: 10, color: T.muted, marginTop: 3 }}>
                {t.classId?.classId || "—"} · {t.questions?.length || 0} Qs
              </div>
            </div>
          ))}
        </div>

        {/* Submission list */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {!activeTest ? (
            <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "80px 0" }}>
              Select an exam from the left panel.
            </div>
          ) : loadingSubs ? (
            <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "80px 0" }}>Loading submissions…</div>
          ) : submissions.length === 0 ? (
            <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              No submissions yet for this exam.
            </div>
          ) : (
            <>
              {/* Summary row */}
              <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                {[
                  { l: "Total Submissions", v: submissions.length,                                     c: T.ghost },
                  { l: "Pending Review",   v: submissions.filter(s => s.status === "pending_review").length, c: T.amber },
                  { l: "Reviewed",          v: submissions.filter(s => s.status === "reviewed").length, c: T.mint  },
                  { l: "Avg Score",
                    v: submissions.length
                      ? (submissions.reduce((s, x) => s + (x.totalScore || 0), 0) / submissions.length).toFixed(1)
                      : "—",
                    c: T.blue },
                ].map(s => (
                  <div key={s.l} style={{ flex: 1, background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontSize: 22, fontWeight: 600, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "0 20px" }}>
                {submissions.map(sub => (
                  <SubmissionRow key={sub._id} sub={sub} onReview={openReview} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Grading modal ── */}
      {reviewSub && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,14,23,0.8)",
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          zIndex: 1000, overflow: "auto", padding: "24px",
        }}>
          <div className="fade-in" style={{
            background: T.ink, border: `1px solid ${T.ink3}`, borderRadius: 20,
            width: "100%", maxWidth: 720, padding: "28px",
          }}>
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <div style={{ ...mono, fontSize: 10, color: T.muted, marginBottom: 4 }}>GRADING</div>
                <div style={{ ...serif, fontSize: 22, color: T.ghost }}>
                  {reviewSub.studentId?.name || "Student"}
                </div>
                <div style={{ ...mono, fontSize: 11, color: T.muted, marginTop: 2 }}>
                  {reviewSub.testId?.name || "Exam"} · submitted {reviewSub.submittedAt ? new Date(reviewSub.submittedAt).toLocaleString() : "—"}
                </div>
              </div>
              {/* Live total */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: T.blue, lineHeight: 1 }}>{currentTotal}</div>
                <div style={{ fontSize: 12, color: T.muted }}>/ {totalPossible} pts</div>
                <div style={{ height: 4, background: T.ink3, borderRadius: 3, marginTop: 8, width: 80, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, background: T.blue, width: (totalPossible ? currentTotal / totalPossible * 100 : 0) + "%" }} />
                </div>
              </div>
            </div>

            {/* Per-question rows */}
            {testQuestions.length === 0 ? (
              <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                Question data not available — questions may have been deleted.
              </div>
            ) : testQuestions.map((q, qi) => {
              const ans = (reviewSub.answers || []).find(a => a.questionIndex === qi) || {};
              return (
                <QuestionRow
                  key={qi}
                  index={qi}
                  question={q}
                  answer={ans}
                  marksAwarded={localMarks[qi] ?? ans.marksAwarded ?? 0}
                  maxMarks={q.marks || 1}
                  onChange={handleMarkChange}
                />
              );
            })}

            {/* Footer */}
            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setReviewSub(null)} style={{ padding: "10px 20px" }}>Cancel</Btn>
              <Btn variant="primary" onClick={handleSaveReview} disabled={saving} style={{ padding: "10px 24px" }}>
                {saving ? "Saving…" : `Save Marks (${currentTotal} / ${totalPossible})`}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
