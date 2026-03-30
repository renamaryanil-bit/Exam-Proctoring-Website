import { useState, useEffect } from "react";
import { T, serif, mono } from "../../data/tokens";
import { submissionAPI, violationAPI } from "../../services/api";
import LiveDot from "../ui/LiveDot";
import Btn from "../ui/Btn";

function formatTime(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

const Q_COLORS = {
  current:   { bg: T.blue,      color: "white",   border: T.blue          },
  attempted: { bg: T.blueLight, color: T.blue,    border: T.blueMid       },
  review:    { bg: T.amberLight,color: "#b07a10", border: T.amber + "60"  },
  visited:   { bg: T.paper2,    color: T.ink3,    border: T.paper3        },
  unvisited: { bg: "white",     color: T.paper4,  border: T.paper3, opacity: 0.45 },
};

export default function ExamScreen({ user, test, onSubmit, notify }) {
  const questions = test?.questions || [];
  const totalQ    = questions.length;

  const [current, setCurrent]         = useState(0);
  const [answers, setAnswers]         = useState({});
  const [review, setReview]           = useState(new Set());
  const [visited, setVisited]         = useState(new Set([0]));
  const [time, setTime]               = useState((test?.duration || 90) * 60);
  const [violations, setViolations]   = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => setTime(s => {
      if (s <= 1) { handleSubmit(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tab-switch detection
  useEffect(() => {
    const handler = async () => {
      const nv = violations + 1;
      setViolations(nv);

      const maxViolations = test?.strictness === "strict" ? 3 : test?.strictness === "lenient" ? 10 : 5;
      const severity = nv >= maxViolations ? "critical" : "warn";

      if (test?._id) {
        try { await violationAPI.log(test._id, "tab_switch", severity); } catch {}
      }

      if (nv < maxViolations) {
        notify(`Tab switch detected! Violation ${nv} of ${maxViolations}.`, "warn");
      } else {
        notify("Auto-submit threshold reached!", "critical");
        setTimeout(() => handleSubmit(), 2000);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [violations, notify, test]);

  const q      = questions[current] || {};
  const urgent = time < 600;

  const isAnswered = (i) => {
    const a = answers[i];
    if (a === undefined || a === "") return false;
    if (Array.isArray(a)) return a.length > 0;
    return true;
  };

  const getQStatus = (i) => {
    if (i === current) return "current";
    if (isAnswered(i))  return review.has(i) ? "review" : "attempted";
    if (visited.has(i)) return "visited";
    return "unvisited";
  };

  const navTo = (i) => { setCurrent(i); setVisited(v => new Set([...v, i])); };

  // MCQ selection (single)
  const handleSelectSingle = (optIdx) => setAnswers(a => ({ ...a, [current]: optIdx }));

  // MCQ selection (multiple)
  const handleToggleMultiple = (optIdx) => {
    setAnswers(a => {
      const prev = Array.isArray(a[current]) ? a[current] : [];
      const next = prev.includes(optIdx) ? prev.filter(x => x !== optIdx) : [...prev, optIdx];
      return { ...a, [current]: next };
    });
  };

  // Text/subjective input
  const handleText = (val) => setAnswers(a => ({ ...a, [current]: val }));

  const toggleReview = () => {
    setReview(r => { const n = new Set(r); r.has(current) ? n.delete(current) : n.add(current); return n; });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    // Build answers array for API
    const answersArray = questions.map((q, i) => {
      const ans = answers[i];
      if (q.type === "single") {
        return { questionIndex: i, selectedOptions: ans !== undefined ? [ans] : [], textAnswer: "" };
      } else if (q.type === "multiple") {
        return { questionIndex: i, selectedOptions: Array.isArray(ans) ? ans : [], textAnswer: "" };
      } else {
        return { questionIndex: i, selectedOptions: [], textAnswer: ans || "" };
      }
    });

    try {
      const result = await submissionAPI.submit(test._id, answersArray);
      onSubmit({ submission: result, answers, questions });
    } catch (err) {
      notify("Submission error: " + err.message, "critical");
      // Still navigate to analytics with local data
      onSubmit({ answers, questions });
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).filter(k => isAnswered(Number(k))).length;

  if (!test || questions.length === 0) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.paper, flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <div style={{ fontSize: 16, color: T.ink3 }}>No exam data found. Please go back and select an exam.</div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", background: T.paper, color: T.ink, overflow: "hidden" }}>
      {/* ── Main panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          padding: "14px 28px", background: "white", borderBottom: `1px solid ${T.paper3}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <div style={{ ...mono, fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {test.classId?.classId || "—"} · {test.classId?.name || ""}
            </div>
            <div style={{ ...serif, fontSize: 18, color: T.ink }}>{test.name}</div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 24,
            background: urgent ? "#fff0f3" : T.amberLight,
            border: `1px solid ${urgent ? T.pink + "40" : T.amber + "40"}`,
            animation: urgent ? "timerPulse 2s ease infinite" : "none",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: urgent ? T.pink : T.amber, animation: "pulse 1.2s ease infinite" }} />
            <span style={{ ...mono, fontSize: 15, fontWeight: 500, color: urgent ? T.pink : "#b07a10" }}>
              {formatTime(time)}
            </span>
          </div>
        </div>

        {/* Question body */}
        <div style={{ flex: 1, overflow: "auto", padding: "32px 36px" }}>
          <div className="fade-in" key={current}>
            <div style={{ ...mono, fontSize: 11, color: T.muted, marginBottom: 8 }}>
              Question {current + 1} of {totalQ}
              <span style={{
                marginLeft: 10, padding: "2px 8px", borderRadius: 10, fontSize: 10,
                background: q.type === "subjective" ? T.purpleLight : T.blueLight,
                color: q.type === "subjective" ? "#a855f7" : T.blue, fontWeight: 600,
              }}>
                {q.type === "single" ? "Single Choice" : q.type === "multiple" ? "Multiple Choice" : "Subjective"}
              </span>
              {q.marks && <span style={{ marginLeft: 8, ...mono, fontSize: 10, color: T.muted }}>{q.marks} mark{q.marks > 1 ? "s" : ""}</span>}
            </div>

            <p style={{ fontSize: 16, lineHeight: 1.75, color: T.ink, marginBottom: 28, maxWidth: 640 }}>
              {q.questionText}
            </p>

            {/* Single choice */}
            {q.type === "single" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 560 }}>
                {(q.options || []).map((opt, i) => {
                  const sel = answers[current] === i;
                  return (
                    <div key={i} onClick={() => handleSelectSingle(i)} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "13px 16px", borderRadius: 12, cursor: "pointer",
                      border: `1.5px solid ${sel ? T.blue : T.paper3}`,
                      background: sel ? T.blueLight : "white",
                      transition: "all 0.15s", color: sel ? T.blue : T.ink,
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${sel ? T.blue : T.paper4}`,
                        background: sel ? T.blue : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 600, flexShrink: 0, color: sel ? "white" : T.ink3, transition: "all 0.15s" }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span style={{ fontSize: 14 }}>{opt}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Multiple choice */}
            {q.type === "multiple" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 560 }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Select all that apply</div>
                {(q.options || []).map((opt, i) => {
                  const sel = Array.isArray(answers[current]) && answers[current].includes(i);
                  return (
                    <div key={i} onClick={() => handleToggleMultiple(i)} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "13px 16px", borderRadius: 12, cursor: "pointer",
                      border: `1.5px solid ${sel ? T.blue : T.paper3}`,
                      background: sel ? T.blueLight : "white", transition: "all 0.15s",
                    }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${sel ? T.blue : T.paper4}`,
                        background: sel ? T.blue : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, color: "white", flexShrink: 0 }}>
                        {sel ? "✓" : ""}
                      </div>
                      <span style={{ fontSize: 14, color: sel ? T.blue : T.ink }}>{opt}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Subjective */}
            {q.type === "subjective" && (
              <div style={{ maxWidth: 560 }}>
                <textarea
                  value={answers[current] || ""}
                  onChange={e => handleText(e.target.value)}
                  placeholder="Write your answer here…"
                  rows={6}
                  style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 14,
                    border: `1.5px solid ${answers[current] ? T.blue : T.paper3}`,
                    background: answers[current] ? T.blueLight : "white", color: T.ink,
                    resize: "vertical", fontFamily: "'Sora', system-ui, sans-serif", outline: "none", lineHeight: 1.6 }}
                />
                {q.wordLimit && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Word limit: {q.wordLimit}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Footer nav */}
        <div style={{
          padding: "14px 28px", background: "white", borderTop: `1px solid ${T.paper3}`,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
        }}>
          <Btn variant="light-secondary" onClick={() => current > 0 && navTo(current - 1)} disabled={current === 0} style={{ color: T.ink2 }}>
            ← Previous
          </Btn>
          <button onClick={toggleReview} style={{
            padding: "8px 16px", borderRadius: 10,
            border: `1.5px dashed ${review.has(current) ? T.amber : T.paper3}`,
            background: review.has(current) ? T.amberLight : "transparent",
            color: review.has(current) ? "#b07a10" : T.muted,
            fontSize: 12, fontWeight: 500, cursor: "pointer",
            fontFamily: "'Sora', system-ui, sans-serif", transition: "all 0.15s",
          }}>
            {review.has(current) ? "⚑ Marked for review" : "⚑ Mark for review"}
          </button>
          {current < totalQ - 1 ? (
            <Btn variant="light-primary" onClick={() => navTo(current + 1)}>Next →</Btn>
          ) : (
            <Btn variant="light-primary" onClick={() => setShowConfirm(true)}>Submit Exam</Btn>
          )}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div style={{ width: 260, background: "white", borderLeft: `1px solid ${T.paper3}`, display: "flex", flexDirection: "column", overflow: "auto", padding: "20px", flexShrink: 0 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: T.muted, marginBottom: 10 }}>Questions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
            {questions.map((_, i) => {
              const s = getQStatus(i); const c = Q_COLORS[s] || {};
              return (
                <div key={i} onClick={() => navTo(i)} title={`Q${i + 1} · ${s}`} style={{
                  aspectRatio: 1, borderRadius: 8,
                  border: `1.5px solid ${c.border || T.paper3}`,
                  background: c.bg || "white", color: c.color || T.ink,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: c.opacity || 1, transition: "all 0.12s",
                }}>{i + 1}</div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: T.muted, marginBottom: 8 }}>Legend</div>
          {[
            { label: "Current",     ...Q_COLORS.current   },
            { label: "Attempted",   ...Q_COLORS.attempted  },
            { label: "For review",  ...Q_COLORS.review     },
            { label: "Visited",     ...Q_COLORS.visited    },
            { label: "Not visited", ...Q_COLORS.unvisited  },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 11, color: T.ink3 }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: l.bg, border: `1.5px solid ${l.border || l.bg}`, flexShrink: 0, opacity: l.opacity || 1 }} />
              {l.label}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginBottom: 6 }}>
            <span>Answered</span>
            <span style={{ ...mono, fontWeight: 600, color: T.blue }}>{answeredCount} / {totalQ}</span>
          </div>
          <div style={{ height: 4, background: T.paper3, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, background: T.blue, width: (answeredCount / totalQ * 100) + "%", transition: "width 0.3s" }} />
          </div>
        </div>

        {/* Webcam + violations */}
        <div style={{ background: T.paper2, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: T.muted, marginBottom: 8 }}>Live Proctoring</div>
          <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 8, background: T.ink2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${T.ink3}, #5a5890)` }} />
            <div style={{ position: "absolute", bottom: 7, left: 7, background: T.mint + "40", border: `1px solid ${T.mint}60`, borderRadius: 6, padding: "3px 8px", fontSize: 9, color: T.mint, ...mono, display: "flex", alignItems: "center", gap: 5 }}>
              <LiveDot color={T.mint} /> Face detected
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginBottom: 4 }}>
              <span>Violations</span>
              <span style={{ ...mono, color: violations >= 4 ? T.pink : T.muted }}>{violations} / {test.strictness === "strict" ? 3 : 5}</span>
            </div>
            <div style={{ height: 5, background: T.paper3, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, background: violations >= 4 ? T.pink : violations >= 2 ? T.amber : T.mint, width: (violations / (test.strictness === "strict" ? 3 : 5) * 100) + "%", transition: "width 0.4s, background 0.4s" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Submit modal */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,14,23,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="fade-in" style={{ background: "white", borderRadius: 20, padding: "32px", width: 420, boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
            <h2 style={{ ...serif, fontSize: 22, color: T.ink, marginBottom: 8 }}>Submit Exam?</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Answered",   val: answeredCount,          color: T.blue    },
                { label: "Skipped",    val: totalQ - answeredCount, color: T.muted   },
                { label: "For review", val: review.size,            color: "#b07a10" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", padding: "10px 8px", background: T.paper, borderRadius: 10 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 24, lineHeight: 1.6 }}>
              This action cannot be undone. Your answers will be submitted for grading.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="light-secondary" onClick={() => setShowConfirm(false)} style={{ flex: 1, justifyContent: "center", color: T.ink2 }}>Go Back</Btn>
              <Btn variant="light-primary" onClick={handleSubmit} disabled={submitting} style={{ flex: 1, justifyContent: "center" }}>
                {submitting ? "Submitting…" : "Submit & Grade →"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
