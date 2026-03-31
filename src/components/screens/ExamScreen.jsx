import { useState, useEffect, useCallback } from "react";
import { T, serif, mono } from "../../data/tokens";
import { submissionAPI, violationAPI } from "../../services/api";
import LiveDot from "../ui/LiveDot";
import Btn from "../ui/Btn";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function formatTime(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

const Q_COLORS = {
  current:   { bg: T.blue,       color: "white",    border: T.blue         },
  attempted: { bg: T.blueLight,  color: T.blue,     border: T.blueMid      },
  review:    { bg: T.amberLight, color: "#b07a10",  border: T.amber + "60" },
  visited:   { bg: T.paper2,     color: T.ink3,     border: T.paper3       },
  unvisited: { bg: "white",      color: T.paper4,   border: T.paper3, opacity: 0.45 },
};

/* ─── Calculator ─────────────────────────────────────────────────────────── */
function Calculator({ onClose }) {
  const [display, setDisplay]   = useState("0");
  const [prev,    setPrev]      = useState(null);
  const [op,      setOp]        = useState(null);
  const [fresh,   setFresh]     = useState(false); // waiting for next operand

  const press = (btn) => {
    switch (btn) {
      case "C":
        setDisplay("0"); setPrev(null); setOp(null); setFresh(false);
        break;
      case "⌫":
        setDisplay(d => d.length > 1 ? d.slice(0, -1) : "0");
        break;
      case "%":
        setDisplay(d => String(parseFloat(d) / 100));
        break;
      case "+": case "−": case "×": case "÷":
        setPrev(parseFloat(display)); setOp(btn); setFresh(true);
        break;
      case "=": {
        if (prev === null || !op) break;
        const a = prev, b = parseFloat(display);
        const MAP = { "+": a + b, "−": a - b, "×": a * b, "÷": b !== 0 ? a / b : "Err" };
        const res = String(MAP[op]);
        setDisplay(res); setPrev(null); setOp(null); setFresh(false);
        break;
      }
      case ".":
        if (fresh) { setDisplay("0."); setFresh(false); break; }
        if (!display.includes(".")) setDisplay(d => d + ".");
        break;
      default: // digit
        if (fresh) { setDisplay(btn); setFresh(false); }
        else setDisplay(d => d === "0" ? btn : d + btn);
    }
  };

  const ROWS = [["C","⌫","%","÷"],["7","8","9","×"],["4","5","6","−"],["1","2","3","+"],[".", "0","00","="]];
  const isOp = b => ["÷","×","−","+","="].includes(b);

  return (
    <div style={{
      position: "fixed", bottom: 90, right: 24, zIndex: 2000, width: 220,
      background: "#1a1830", border: `1px solid ${T.ink3}`, borderRadius: 18,
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)", overflow: "hidden",
    }}>
      {/* Drag bar / header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: T.ink3 }}>
        <span style={{ ...mono, fontSize: 10, color: T.muted }}>CALCULATOR</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
      </div>
      {/* Display */}
      <div style={{ padding: "10px 14px 6px", textAlign: "right" }}>
        {op && <div style={{ ...mono, fontSize: 10, color: T.muted }}>{prev} {op}</div>}
        <div style={{ ...mono, fontSize: 28, color: T.ghost, letterSpacing: "-0.02em", overflowX: "auto", whiteSpace: "nowrap" }}>
          {display}
        </div>
      </div>
      {/* Buttons */}
      <div style={{ padding: "0 10px 10px", display: "grid", gap: 4 }}>
        {ROWS.map((row, ri) => (
          <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
            {row.map(btn => (
              <button key={btn} onClick={() => press(btn)} style={{
                padding: "12px 0", borderRadius: 10, border: "none", cursor: "pointer",
                fontFamily: "'Sora', system-ui, sans-serif", fontSize: 14, fontWeight: 600,
                background: isOp(btn) ? T.blue + (btn === "=" ? "ff" : "aa") : btn === "C" ? T.pink + "30" : T.ink3,
                color: isOp(btn) ? "white" : btn === "C" ? T.pink : T.ghost,
                transition: "opacity 0.1s",
              }}>{btn}</button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Section Confirm Modal ──────────────────────────────────────────────── */
function SectionConfirmModal({ fromSection, toSection, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,14,23,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500,
    }}>
      <div className="fade-in" style={{
        background: T.ink, border: `1px solid ${T.ink3}`, borderRadius: 20,
        padding: "32px 36px", maxWidth: 400, width: "90%", textAlign: "center",
      }}>
        <div style={{ fontSize: 36, marginBottom: 14 }}>📋</div>
        <div style={{ ...serif, fontSize: 20, color: T.ghost, marginBottom: 8 }}>
          Move to {toSection.name}?
        </div>
        <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, marginBottom: 24 }}>
          You are about to leave <strong style={{ color: T.ghost }}>{fromSection.name}</strong> and start <strong style={{ color: T.ghost }}>{toSection.name}</strong>.
          <br />
          <span style={{ color: T.pink, fontWeight: 600 }}>You cannot return to a previous section.</span>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Btn variant="ghost" onClick={onCancel} style={{ padding: "10px 22px" }}>Stay Here</Btn>
          <Btn variant="primary" onClick={onConfirm} style={{ padding: "10px 22px" }}>Continue →</Btn>
        </div>
      </div>
    </div>
  );
}

/* ─── Already Submitted Screen ───────────────────────────────────────────── */
function AlreadySubmitted({ test, submission, setScreen }) {
  const backScreen = "studentDash";
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: T.paper, gap: 16 }}>
      <div style={{ fontSize: 52 }}>✅</div>
      <div style={{ ...serif, fontSize: 26, color: T.ink }}>Already Submitted</div>
      <div style={{ fontSize: 14, color: T.ink3, textAlign: "center", maxWidth: 360, lineHeight: 1.7 }}>
        You have already submitted <strong>{test?.name}</strong>.<br />
        Each exam can only be submitted once.
      </div>
      {submission && (
        <div style={{ fontSize: 13, color: T.muted }}>
          Submitted: {new Date(submission.submittedAt).toLocaleString()} · Status: {submission.status}
        </div>
      )}
      <Btn variant="primary" onClick={() => setScreen(backScreen)} style={{ marginTop: 8 }}>
        ← Back to Dashboard
      </Btn>
    </div>
  );
}

/* ─── Main ExamScreen ────────────────────────────────────────────────────── */
export default function ExamScreen({ user, test, onSubmit, notify, setScreen }) {
  const questions = test?.questions || [];
  const totalQ    = questions.length;

  // Sections — fall back to a single unnamed section for old exams
  const sections = (test?.sections?.length > 0)
    ? test.sections
    : [{ name: "Questions", description: "" }];
  const totalSections = sections.length;

  // Group global question indices by section
  const questionsBySec = sections.map((_, si) =>
    questions.map((q, gi) => ({ ...q, globalIndex: gi }))
             .filter(q => (q.sectionIndex ?? 0) === si)
  );

  /* ── State ──────────────────────────────────────────────────────────────── */
  const [checkingDupe, setCheckingDupe] = useState(true);
  const [alreadySub,   setAlreadySub]   = useState(null); // existing submission if found

  const [currentSec,    setCurrentSec]    = useState(0);
  const [currentLocal,  setCurrentLocal]  = useState(0);  // index within current section
  const [answers,       setAnswers]       = useState({});
  const [review,        setReview]        = useState(new Set());
  const [visited,       setVisited]       = useState(new Set([0]));
  const [time,          setTime]          = useState((test?.duration || 90) * 60);
  const [violations,    setViolations]    = useState(0);
  const [showSubmit,    setShowSubmit]    = useState(false);
  const [showSectionDlg, setShowSectionDlg] = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [wordAlerts,    setWordAlerts]    = useState({});   // { globalIndex: bool }
  const [showCalc,      setShowCalc]      = useState(false);

  // Derive current global question index
  const secQs      = questionsBySec[currentSec] || [];
  const currentGi  = secQs[currentLocal]?.globalIndex ?? 0;
  const currentQ   = questions[currentGi] || {};

  /* ── Duplicate check ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!test?._id) { setCheckingDupe(false); return; }
    submissionAPI.checkSubmitted(test._id)
      .then(data => {
        if (data.submitted) setAlreadySub(data.submission);
      })
      .catch(() => {})
      .finally(() => setCheckingDupe(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test?._id]);

  /* ── Timer ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const t = setInterval(() => setTime(s => {
      if (s <= 1) { handleSubmit(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Tab-switch violation ───────────────────────────────────────────────── */
  useEffect(() => {
    const handler = async () => {
      if (document.visibilityState === "hidden") {
        const nv = violations + 1;
        setViolations(nv);
        const maxV = test?.strictness === "strict" ? 3 : test?.strictness === "lenient" ? 10 : 5;
        const severity = nv >= maxV ? "critical" : "warn";
        notify(`⚠️ Tab switch detected (${nv}/${maxV})`, severity);
        try { await violationAPI.log(test?._id, "tab_switch", severity); } catch {}
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [violations]);

  /* ── Answer helpers ─────────────────────────────────────────────────────── */
  const handleSingle = (gi, oi) => setAnswers(a => ({ ...a, [gi]: [oi] }));
  const handleMultiple = (gi, oi) => {
    setAnswers(a => {
      const sel = a[gi] || [];
      return { ...a, [gi]: sel.includes(oi) ? sel.filter(x => x !== oi) : [...sel, oi] };
    });
  };
  const handleText = (gi, text) => {
    const wl = questions[gi]?.wordLimit;
    if (wl && wl > 0) {
      const wc = countWords(text);
      if (wc > wl) {
        // Flash alert, reject the extra input
        setWordAlerts(a => ({ ...a, [gi]: true }));
        setTimeout(() => setWordAlerts(a => ({ ...a, [gi]: false })), 2000);
        return;
      } else {
        setWordAlerts(a => ({ ...a, [gi]: false }));
      }
    }
    setAnswers(a => ({ ...a, [gi]: text }));
  };

  /* ── Navigation within a section ───────────────────────────────────────── */
  const goToLocalQ = (localIdx) => {
    const gi = secQs[localIdx]?.globalIndex;
    if (gi !== undefined) {
      setVisited(v => new Set([...v, gi]));
      setCurrentLocal(localIdx);
    }
  };

  const goNext = () => {
    if (currentLocal < secQs.length - 1) {
      goToLocalQ(currentLocal + 1);
    } else if (currentSec < totalSections - 1) {
      // Last question in section — ask to move to next section
      setShowSectionDlg(true);
    } else {
      // Last question of last section
      setShowSubmit(true);
    }
  };

  const goPrev = () => {
    if (currentLocal > 0) goToLocalQ(currentLocal - 1);
  };

  const confirmNextSection = () => {
    setShowSectionDlg(false);
    const nextSec = currentSec + 1;
    const nextSecQs = questionsBySec[nextSec] || [];
    if (nextSecQs.length === 0) { setCurrentSec(nextSec); return; }
    const firstGi = nextSecQs[0].globalIndex;
    setVisited(v => new Set([...v, firstGi]));
    setCurrentSec(nextSec);
    setCurrentLocal(0);
  };

  /* ── Submit ─────────────────────────────────────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const payload = questions.map((q, gi) => ({
      questionIndex: gi,
      selectedOptions: Array.isArray(answers[gi]) ? answers[gi] : [],
      textAnswer: (typeof answers[gi] === "string" ? answers[gi] : "") || "",
    }));
    try {
      const sub = await submissionAPI.submit(test._id, payload);
      onSubmit?.({ submission: sub, questions, answers });
    } catch (err) {
      notify(err.message || "Submission failed.", "critical");
      setSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting, answers]);

  /* ─────────────────────────────────────────────────────────────────────────
     Early returns
  ──────────────────────────────────────────────────────────────────────────── */
  if (checkingDupe) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.paper }}>
        <div style={{ fontSize: 14, color: T.muted }}>Checking exam status…</div>
      </div>
    );
  }

  if (alreadySub) return <AlreadySubmitted test={test} submission={alreadySub} setScreen={setScreen} />;

  /* ─────────────────────────────────────────────────────────────────────────
     Main render
  ──────────────────────────────────────────────────────────────────────────── */
  const timeLow  = time < 300;  // < 5 min
  const timeWarn = time < 600;  // < 10 min
  const answered = Object.keys(answers).length;
  const sectionColor = ["#6C8EBF","#a855f7","#2ea87e","#d9961a","#e05b6a","#5ba4e0"][currentSec % 6];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.paper, overflow: "hidden" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        height: 52, background: "white", borderBottom: `2px solid ${T.paper3}`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: 16,
        flexShrink: 0, boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
      }}>
        <div style={{ ...serif, fontSize: 15, color: T.ink, fontWeight: 700 }}>{test?.name}</div>

        {/* Section breadcrumb */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {sections.map((sec, si) => (
            <div key={si} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {si > 0 && <span style={{ color: T.paper4, fontSize: 12 }}>›</span>}
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 8,
                background: si === currentSec ? sectionColor + "20" : si < currentSec ? T.mint + "20" : "transparent",
                color: si === currentSec ? sectionColor : si < currentSec ? T.mint : T.paper4,
                border: `1px solid ${si === currentSec ? sectionColor + "60" : si < currentSec ? T.mint + "40" : "transparent"}`,
              }}>
                {si < currentSec ? "✓ " : ""}{sec.name}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          {/* Violation badge */}
          {violations > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, background: T.pinkLight, fontSize: 11, color: T.pink, fontWeight: 600 }}>
              <LiveDot color={T.pink} /> {violations} violation{violations > 1 ? "s" : ""}
            </div>
          )}
          {/* Calculator toggle */}
          {test?.calculator && (
            <button onClick={() => setShowCalc(s => !s)} title="Open Calculator" style={{
              padding: "5px 11px", borderRadius: 8, fontSize: 18,
              background: showCalc ? T.blue + "20" : T.paper2,
              border: `1px solid ${showCalc ? T.blue + "60" : T.paper3}`,
              cursor: "pointer", lineHeight: 1,
            }}>🧮</button>
          )}
          {/* Timer */}
          <div style={{
            ...mono, fontSize: 15, fontWeight: 700, letterSpacing: "0.05em",
            color: timeLow ? T.pink : timeWarn ? T.amber : T.ink3,
            animation: timeLow ? "pulse 0.8s infinite" : "none",
          }}>
            {formatTime(time)}
          </div>
        </div>
      </div>

      {/* Section description banner */}
      {sections[currentSec]?.description && (
        <div style={{ padding: "8px 24px", background: sectionColor + "12", borderBottom: `1px solid ${sectionColor}30`, fontSize: 12, color: T.ink3 }}>
          {sections[currentSec].description}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div style={{ width: 240, background: "white", borderRight: `1px solid ${T.paper3}`, overflow: "auto", padding: "16px 12px", flexShrink: 0 }}>

          {/* Progress */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: T.muted }}>Answered</span>
              <span style={{ ...mono, fontSize: 11, color: T.ink3 }}>{answered}/{totalQ}</span>
            </div>
            <div style={{ height: 4, background: T.paper2, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, background: T.blue, width: (answered / totalQ * 100) + "%", transition: "width 0.3s" }} />
            </div>
          </div>

          {/* Grid by section */}
          {sections.map((sec, si) => {
            const secColor = ["#6C8EBF","#a855f7","#2ea87e","#d9961a","#e05b6a","#5ba4e0"][si % 6];
            const lockedSection = si > currentSec;
            return (
              <div key={si} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: lockedSection ? T.paper4 : secColor, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                  {si < currentSec ? "✓ " : lockedSection ? "🔒 " : ""}{sec.name}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4 }}>
                  {questionsBySec[si].map(({ globalIndex: gi }, li) => {
                    const status = lockedSection ? "locked"
                      : gi === currentGi ? "current"
                      : answers[gi] !== undefined && answers[gi] !== "" && !(Array.isArray(answers[gi]) && answers[gi].length === 0) ? "attempted"
                      : review.has(gi) ? "review"
                      : visited.has(gi) ? "visited"
                      : "unvisited";
                    const style = lockedSection
                      ? { bg: T.paper2, color: T.paper4, border: T.paper3, opacity: 0.5 }
                      : Q_COLORS[status];
                    return (
                      <div key={gi}
                        onClick={() => {
                          if (si === currentSec) { goToLocalQ(li); }
                          // Cannot click into future/past sections
                        }}
                        style={{
                          width: "100%", aspectRatio: "1", display: "flex", alignItems: "center",
                          justifyContent: "center",
                          ...mono, fontSize: 10, fontWeight: 600,
                          background: style.bg, color: style.color,
                          border: `2px solid ${style.border}`,
                          borderRadius: 7, opacity: style.opacity || 1,
                          cursor: si === currentSec ? "pointer" : "not-allowed",
                        }}>
                        {gi + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div style={{ marginTop: 8, paddingTop: 10, borderTop: `1px solid ${T.paper2}`, display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              ["attempted", "#d9edff", "Answered"],
              ["review",    T.amberLight, "For Review"],
              ["visited",   T.paper2, "Visited"],
            ].map(([, bg, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: bg }} />
                <span style={{ fontSize: 10, color: T.muted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Question area ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>

            {/* Q number + mark for review */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ ...mono, fontSize: 10, color: T.muted, marginBottom: 3 }}>
                  {sections[currentSec]?.name} · Question {currentLocal + 1} of {secQs.length}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: sectionColor + "15", color: sectionColor, fontWeight: 600 }}>
                    {currentQ.type === "single" ? "Single Choice"
                      : currentQ.type === "multiple" ? "Multiple Choice"
                      : "Subjective"}
                  </span>
                  <span style={{ ...mono, fontSize: 11, color: T.muted }}>{currentQ.marks} mark{currentQ.marks !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <button onClick={() => {
                setReview(r => {
                  const n = new Set(r);
                  n.has(currentGi) ? n.delete(currentGi) : n.add(currentGi);
                  return n;
                });
              }} style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: review.has(currentGi) ? T.amberLight : T.paper2,
                border: `1px solid ${review.has(currentGi) ? T.amber + "60" : T.paper3}`,
                color: review.has(currentGi) ? "#b07a10" : T.muted,
                cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif",
              }}>
                🚩 {review.has(currentGi) ? "Marked" : "Mark for Review"}
              </button>
            </div>

            {/* Question text */}
            <div style={{ fontSize: 17, fontWeight: 600, color: T.ink, marginBottom: 24, lineHeight: 1.65 }}>
              {currentQ.questionText}
            </div>

            {/* Single / Multiple choice */}
            {(currentQ.type === "single" || currentQ.type === "multiple") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(currentQ.options || []).map((opt, oi) => {
                  const sel = (answers[currentGi] || []).includes(oi);
                  return (
                    <div key={oi}
                      onClick={() => currentQ.type === "single" ? handleSingle(currentGi, oi) : handleMultiple(currentGi, oi)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 18px", borderRadius: 12, cursor: "pointer",
                        background: sel ? sectionColor + "10" : "white",
                        border: `2px solid ${sel ? sectionColor : T.paper3}`,
                        transition: "all 0.15s",
                      }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: currentQ.type === "single" ? "50%" : 5,
                        border: `2px solid ${sel ? sectionColor : T.paper4}`,
                        background: sel ? sectionColor : "transparent", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {sel && <div style={{ width: 8, height: 8, borderRadius: currentQ.type === "single" ? "50%" : 2, background: "white" }} />}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: T.ink3, marginRight: 8, opacity: 0.5, flexShrink: 0 }}>
                        {String.fromCharCode(65 + oi)}.
                      </span>
                      <span style={{ fontSize: 14, color: T.ink }}>{opt}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Subjective */}
            {currentQ.type === "subjective" && (
              <div>
                {/* Word count bar */}
                {currentQ.wordLimit > 0 && (() => {
                  const wc = countWords(answers[currentGi] || "");
                  const pct = Math.min(wc / currentQ.wordLimit * 100, 100);
                  const atLimit = wc >= currentQ.wordLimit;
                  return (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: atLimit ? T.pink : T.muted }}>
                          {atLimit ? "⚠️ Word limit reached" : "Word count"}
                        </span>
                        <span style={{ ...mono, fontSize: 12, color: atLimit ? T.pink : T.ink3, fontWeight: 600 }}>
                          {wc} / {currentQ.wordLimit}
                        </span>
                      </div>
                      <div style={{ height: 4, background: T.paper2, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 3, background: atLimit ? T.pink : pct > 80 ? T.amber : T.mint, width: pct + "%", transition: "width 0.2s" }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Word limit alert banner */}
                {wordAlerts[currentGi] && (
                  <div className="fade-in" style={{
                    marginBottom: 10, padding: "10px 14px", borderRadius: 10,
                    background: T.pinkLight, border: `1px solid ${T.pink}40`,
                    fontSize: 13, fontWeight: 600, color: T.pink,
                  }}>
                    🚫 Word limit reached ({currentQ.wordLimit} words). No more typing allowed.
                  </div>
                )}

                <textarea
                  value={answers[currentGi] || ""}
                  onChange={e => handleText(currentGi, e.target.value)}
                  rows={9}
                  placeholder="Type your answer here…"
                  style={{
                    width: "100%", padding: "16px", borderRadius: 12, resize: "vertical",
                    background: "white", border: `2px solid ${wordAlerts[currentGi] ? T.pink + "80" : T.paper3}`,
                    color: T.ink, fontSize: 14, lineHeight: 1.7,
                    fontFamily: "'Sora', system-ui, sans-serif", outline: "none",
                    boxSizing: "border-box", transition: "border-color 0.2s",
                  }}
                />
              </div>
            )}

            {/* Navigation buttons */}
            <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "space-between" }}>
              <Btn variant="light-secondary" onClick={goPrev} disabled={currentLocal === 0 && currentSec === 0}
                style={{ color: T.ink2, fontSize: 13 }}>← Previous</Btn>

              <div style={{ display: "flex", gap: 10 }}>
                {/* Finish / submit */}
                {currentLocal === secQs.length - 1 && currentSec === totalSections - 1 && (
                  <Btn variant="primary" onClick={() => setShowSubmit(true)} style={{ fontSize: 13 }}>
                    Finish Exam
                  </Btn>
                )}
                {/* Next or Next Section button */}
                {!(currentLocal === secQs.length - 1 && currentSec === totalSections - 1) && (
                  <Btn variant="primary" onClick={goNext} style={{ fontSize: 13 }}>
                    {currentLocal < secQs.length - 1 ? "Next →"
                      : `Next Section: ${sections[currentSec + 1]?.name || "→"}`}
                  </Btn>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Calculator widget ─────────────────────────────────────────────── */}
      {test?.calculator && !showCalc && (
        <button onClick={() => setShowCalc(true)} title="Open Calculator" style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: 48, height: 48, borderRadius: "50%", border: "none",
          background: T.blue, color: "white", fontSize: 22, cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>🧮</button>
      )}
      {showCalc && <Calculator onClose={() => setShowCalc(false)} />}

      {/* ── Section confirm modal ─────────────────────────────────────────── */}
      {showSectionDlg && (
        <SectionConfirmModal
          fromSection={sections[currentSec]}
          toSection={sections[currentSec + 1]}
          onConfirm={confirmNextSection}
          onCancel={() => setShowSectionDlg(false)}
        />
      )}

      {/* ── Submit confirm modal ──────────────────────────────────────────── */}
      {showSubmit && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,14,23,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500,
        }}>
          <div className="fade-in" style={{
            background: "white", borderRadius: 20, padding: "32px 36px",
            maxWidth: 400, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>📤</div>
            <div style={{ ...serif, fontSize: 22, color: T.ink, marginBottom: 8 }}>Submit Exam?</div>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, marginBottom: 10 }}>
              You've answered <strong>{answered}</strong> of <strong>{totalQ}</strong> questions.
            </div>
            <div style={{ fontSize: 12, color: T.pink, fontWeight: 600, marginBottom: 24 }}>
              ⚠️ You cannot change your answers after submitting.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Btn variant="light-secondary" onClick={() => setShowSubmit(false)} style={{ color: T.ink2 }}>Review</Btn>
              <Btn variant="primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Confirm Submit"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
