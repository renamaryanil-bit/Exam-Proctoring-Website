import { useState, useEffect, useCallback, useRef } from "react";
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

const SECTION_PALETTE = ["#2b44ff","#a855f7","#00c896","#f5a623","#ff6b35","#e05b6a"];

/* ─── Calculator ────────────────────────────────────────────────────────────── */
function Calculator({ onClose }) {
  const [display, setDisplay] = useState("0");
  const [prev,    setPrev]    = useState(null);
  const [op,      setOp]      = useState(null);
  const [fresh,   setFresh]   = useState(false);

  const press = (btn) => {
    switch (btn) {
      case "C":  setDisplay("0"); setPrev(null); setOp(null); setFresh(false); break;
      case "⌫":  setDisplay(d => d.length > 1 ? d.slice(0, -1) : "0"); break;
      case "%":  setDisplay(d => String(parseFloat(d) / 100)); break;
      case "+": case "−": case "×": case "÷":
        setPrev(parseFloat(display)); setOp(btn); setFresh(true); break;
      case "=": {
        if (prev === null || !op) break;
        const MAP = { "+": prev + parseFloat(display), "−": prev - parseFloat(display), "×": prev * parseFloat(display), "÷": parseFloat(display) !== 0 ? prev / parseFloat(display) : "Err" };
        setDisplay(String(MAP[op])); setPrev(null); setOp(null); setFresh(false); break;
      }
      case ".":
        if (fresh) { setDisplay("0."); setFresh(false); break; }
        if (!display.includes(".")) setDisplay(d => d + "."); break;
      default:
        if (fresh) { setDisplay(btn); setFresh(false); }
        else setDisplay(d => d === "0" ? btn : d + btn);
    }
  };

  const ROWS = [["C","⌫","%","÷"],["7","8","9","×"],["4","5","6","−"],["1","2","3","+"],[".","0","00","="]];
  const isOp = b => ["÷","×","−","+","="].includes(b);

  return (
    <div style={{
      position: "fixed", bottom: 90, right: 24, zIndex: 2000, width: 220,
      background: "#1a1830", border: `1px solid ${T.ink3}`, borderRadius: 18,
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)", overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: T.ink3 }}>
        <span style={{ ...mono, fontSize: 10, color: T.muted }}>CALCULATOR</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16 }}>×</button>
      </div>
      <div style={{ padding: "10px 14px 6px", textAlign: "right" }}>
        {op && <div style={{ ...mono, fontSize: 10, color: T.muted }}>{prev} {op}</div>}
        <div style={{ ...mono, fontSize: 28, color: T.ghost, overflowX: "auto", whiteSpace: "nowrap" }}>{display}</div>
      </div>
      <div style={{ padding: "0 10px 10px", display: "grid", gap: 4 }}>
        {ROWS.map((row, ri) => (
          <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
            {row.map(btn => (
              <button key={btn} onClick={() => press(btn)} style={{
                padding: "12px 0", borderRadius: 10, border: "none", cursor: "pointer",
                fontFamily: "'Sora', system-ui, sans-serif", fontSize: 14, fontWeight: 600,
                background: isOp(btn) ? T.blue + (btn === "=" ? "ff" : "aa") : btn === "C" ? T.pink + "30" : T.ink3,
                color: isOp(btn) ? "white" : btn === "C" ? T.pink : T.ghost,
              }}>{btn}</button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Section Submit Confirm ────────────────────────────────────────────────── */
function SectionSubmitModal({ fromSection, toSection, isLast, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,14,23,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500,
    }}>
      <div className="fade-in" style={{
        background: T.ink, border: `1px solid ${T.ink3}`, borderRadius: 20,
        padding: "32px 36px", maxWidth: 420, width: "90%", textAlign: "center",
      }}>
        <div style={{ fontSize: 36, marginBottom: 14 }}>{isLast ? "📤" : "✅"}</div>
        <div style={{ ...serif, fontSize: 20, color: T.ghost, marginBottom: 10 }}>
          {isLast ? "Submit Exam?" : `Submit ${fromSection?.name}?`}
        </div>
        <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.8, marginBottom: 8 }}>
          {isLast
            ? "You are about to submit the entire exam. This cannot be undone."
            : <>You are submitting <strong style={{ color: T.ghost }}>{fromSection?.name}</strong> and moving to <strong style={{ color: T.ghost }}>{toSection?.name}</strong>.</>
          }
        </div>
        <div style={{
          margin: "12px 0 24px", padding: "10px 14px", borderRadius: 10,
          background: T.pink + "12", border: `1px solid ${T.pink}30`,
          fontSize: 12, color: T.pink, fontWeight: 600,
        }}>
          ⚠️ You <strong>cannot return</strong> to {isLast ? "any section" : `${fromSection?.name}`} once you continue.
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Btn variant="ghost" onClick={onCancel} style={{ padding: "10px 22px" }}>Stay & Review</Btn>
          <Btn variant="primary" onClick={onConfirm} style={{ padding: "10px 22px" }}>
            {isLast ? "Submit Exam" : `Submit Section →`}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ─── Pause Overlay ─────────────────────────────────────────────────────────── */
function PauseOverlay({ pausedAt, onResume }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,14,23,0.93)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", zIndex: 1800,
    }}>
      <div className="fade-in" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 18 }}>⏸</div>
        <div style={{ ...serif, fontSize: 32, color: T.ghost, marginBottom: 8 }}>Exam Paused</div>
        <div style={{ fontSize: 14, color: T.muted, marginBottom: 6 }}>
          Paused at {formatTime(pausedAt)}
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 32, maxWidth: 320 }}>
          Your progress is saved. Click Resume to continue — the timer will restart from where you left off.
        </div>
        <Btn variant="primary" onClick={onResume} style={{ padding: "13px 36px", fontSize: 15 }}>
          ▶ Resume Exam
        </Btn>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 16 }}>
          Excessive use of pause may be flagged as a violation.
        </div>
      </div>
    </div>
  );
}

/* ─── Already Submitted ─────────────────────────────────────────────────────── */
function AlreadySubmitted({ test, submission, setScreen }) {
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
      <Btn variant="primary" onClick={() => setScreen("studentDash")} style={{ marginTop: 8 }}>
        ← Back to Dashboard
      </Btn>
    </div>
  );
}

/* ─── Main ExamScreen ────────────────────────────────────────────────────────── */
export default function ExamScreen({ user, test, onSubmit, notify, setScreen }) {
  const questions    = test?.questions || [];
  const totalQ       = questions.length;
  const sections     = (test?.sections?.length > 0) ? test.sections : [{ name: "Questions", description: "" }];
  const totalSections = sections.length;

  // Group question global indices by section
  const questionsBySec = sections.map((_, si) =>
    questions.map((q, gi) => ({ ...q, globalIndex: gi })).filter(q => (q.sectionIndex ?? 0) === si)
  );

  /* ── Core state ─────────────────────────────────────────────────────────── */
  const [checkingDupe, setCheckingDupe] = useState(true);
  const [alreadySub,   setAlreadySub]   = useState(null);

  const [currentSec,   setCurrentSec]   = useState(0);
  const [currentLocal, setCurrentLocal] = useState(0); // index within section
  const [answers,      setAnswers]      = useState({});
  const [review,       setReview]       = useState(new Set());
  const [visited,      setVisited]      = useState(new Set([0]));
  const [completedSecs, setCompletedSecs] = useState(new Set()); // sections submitted

  const [time,         setTime]         = useState((test?.duration || 90) * 60);
  const [violations,   setViolations]   = useState(0);

  const [showSectionDlg, setShowSectionDlg] = useState(false);
  const [showFinalDlg,   setShowFinalDlg]   = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [wordAlerts,     setWordAlerts]     = useState({});
  const [showCalc,       setShowCalc]       = useState(false);

  // Pause
  const [paused,      setPaused]      = useState(false);
  const [pausedAt,    setPausedAt]    = useState(0);
  const pausedRef                     = useRef(false);

  // Sidebar locked-section warning
  const [lockedWarn, setLockedWarn] = useState("");

  /* ── Derived ────────────────────────────────────────────────────────────── */
  const secQs     = questionsBySec[currentSec] || [];
  const currentGi = secQs[currentLocal]?.globalIndex ?? 0;
  const currentQ  = questions[currentGi] || {};
  const secColor  = SECTION_PALETTE[currentSec % SECTION_PALETTE.length];
  const isLastSec = currentSec === totalSections - 1;
  const isLastQ   = currentLocal === secQs.length - 1;
  const answered  = Object.keys(answers).filter(gi => {
    const v = answers[Number(gi)];
    return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
  }).length;

  /* ── Duplicate check ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!test?._id) { setCheckingDupe(false); return; }
    submissionAPI.checkSubmitted(test._id)
      .then(d => { if (d.submitted) setAlreadySub(d.submission); })
      .catch(() => {})
      .finally(() => setCheckingDupe(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test?._id]);

  /* ── Timer (uses ref to avoid restarting on paused state change) ─────────── */
  useEffect(() => {
    const t = setInterval(() => {
      if (pausedRef.current) return;
      setTime(s => {
        if (s <= 1) { handleSubmit(); return 0; }
        return s - 1;
      });
    }, 1000);
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

  /* ── Pause / resume ─────────────────────────────────────────────────────── */
  const handlePause = () => {
    pausedRef.current = true;
    setPausedAt(time);
    setPaused(true);
  };
  const handleResume = () => {
    pausedRef.current = false;
    setPaused(false);
  };

  /* ── Answer helpers ─────────────────────────────────────────────────────── */
  const handleSingle   = (gi, oi) => setAnswers(a => ({ ...a, [gi]: [oi] }));
  const handleMultiple = (gi, oi) => setAnswers(a => {
    const sel = a[gi] || [];
    return { ...a, [gi]: sel.includes(oi) ? sel.filter(x => x !== oi) : [...sel, oi] };
  });
  const handleText = (gi, text) => {
    const wl = questions[gi]?.wordLimit;
    if (wl && wl > 0 && countWords(text) > wl) {
      setWordAlerts(a => ({ ...a, [gi]: true }));
      setTimeout(() => setWordAlerts(a => ({ ...a, [gi]: false })), 2500);
      return;
    }
    setWordAlerts(a => ({ ...a, [gi]: false }));
    setAnswers(a => ({ ...a, [gi]: text }));
  };

  /* ── Navigation ─────────────────────────────────────────────────────────── */
  const goToLocalQ = (li) => {
    const gi = secQs[li]?.globalIndex;
    if (gi !== undefined) { setVisited(v => new Set([...v, gi])); setCurrentLocal(li); }
  };
  const goPrev = () => { if (currentLocal > 0) goToLocalQ(currentLocal - 1); };
  const goNext = () => { if (currentLocal < secQs.length - 1) goToLocalQ(currentLocal + 1); };

  const handleSidebarClick = (si, li, gi) => {
    if (si < currentSec) {
      // Completed section — show warning
      setLockedWarn(`"${sections[si]?.name}" is complete. You cannot return to a submitted section.`);
      setTimeout(() => setLockedWarn(""), 3000);
    } else if (si === currentSec) {
      goToLocalQ(li);
    }
    // si > currentSec — future section, do nothing (greyed out)
  };

  // "Submit Section" (non-last) or "Finish Exam" (last section)
  const handleSectionSubmit = () => {
    if (isLastSec) setShowFinalDlg(true);
    else setShowSectionDlg(true);
  };

  const confirmSectionSubmit = () => {
    setShowSectionDlg(false);
    setCompletedSecs(c => new Set([...c, currentSec]));
    const nextSec    = currentSec + 1;
    const nextSecQs  = questionsBySec[nextSec] || [];
    const firstGi    = nextSecQs[0]?.globalIndex;
    if (firstGi !== undefined) setVisited(v => new Set([...v, firstGi]));
    setCurrentSec(nextSec);
    setCurrentLocal(0);
  };

  /* ── Final submit ───────────────────────────────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowFinalDlg(false);
    const payload = questions.map((q, gi) => ({
      questionIndex:   gi,
      selectedOptions: Array.isArray(answers[gi]) ? answers[gi] : [],
      textAnswer:      typeof answers[gi] === "string" ? answers[gi] : "",
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

  /* ─── Early returns ─────────────────────────────────────────────────────── */
  if (checkingDupe) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.paper }}>
      <div style={{ fontSize: 14, color: T.muted }}>Checking exam status…</div>
    </div>
  );

  if (alreadySub) return <AlreadySubmitted test={test} submission={alreadySub} setScreen={setScreen} />;

  /* ─── Render ────────────────────────────────────────────────────────────── */
  const timeLow  = time < 300;
  const timeWarn = time < 600;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.paper, overflow: "hidden" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        height: 52, background: "white", borderBottom: `2px solid ${T.paper3}`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: 14,
        flexShrink: 0, boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
      }}>
        <div style={{ ...serif, fontSize: 15, color: T.ink, fontWeight: 700, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {test?.name}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {violations > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: T.pinkLight, fontSize: 11, color: T.pink, fontWeight: 600 }}>
              <LiveDot color={T.pink} /> {violations} violation{violations > 1 ? "s" : ""}
            </div>
          )}
          {test?.calculator && (
            <button onClick={() => setShowCalc(s => !s)} title="Calculator" style={{
              padding: "5px 10px", borderRadius: 8, fontSize: 18,
              background: showCalc ? T.blue + "20" : T.paper2,
              border: `1px solid ${showCalc ? T.blue + "60" : T.paper3}`, cursor: "pointer", lineHeight: 1,
            }}>🧮</button>
          )}
          {test?.allowPause && (
            <button onClick={handlePause} title="Pause exam" style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: T.amberLight, border: `1px solid ${T.amber}40`,
              color: "#b07a10", cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif",
            }}>⏸ Pause</button>
          )}
          <div style={{
            ...mono, fontSize: 15, fontWeight: 700, letterSpacing: "0.06em",
            color: timeLow ? T.pink : timeWarn ? T.amber : T.ink3,
            animation: timeLow ? "pulse 0.8s infinite" : "none",
          }}>{formatTime(time)}</div>
        </div>
      </div>

      {/* ── Section indicator box (prominent, fixed below top bar) ─────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${secColor}18, ${secColor}08)`,
        borderBottom: `2px solid ${secColor}30`,
        padding: "12px 20px",
        display: "flex", alignItems: "center", gap: 14, flexShrink: 0,
      }}>
        {/* Section number orb */}
        <div style={{
          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
          background: secColor, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 17, color: "white", fontWeight: 800,
          boxShadow: `0 0 0 4px ${secColor}25`,
        }}>
          {currentSec + 1}
        </div>

        {/* Section info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.ink }}>{sections[currentSec]?.name}</div>
            <div style={{ ...mono, fontSize: 10, color: secColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Section {currentSec + 1} of {totalSections}
            </div>
          </div>
          {sections[currentSec]?.description && (
            <div style={{ fontSize: 12, color: T.ink3, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {sections[currentSec].description}
            </div>
          )}
        </div>

        {/* Section mini progress + section pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {/* Section step pills */}
          {totalSections > 1 && sections.map((sec, si) => (
            <div key={si} style={{
              width: si === currentSec ? 28 : 10, height: 10, borderRadius: 5,
              background: completedSecs.has(si) ? T.mint : si === currentSec ? secColor : T.paper3,
              transition: "width 0.3s, background 0.3s",
              title: sec.name,
            }} />
          ))}
          {/* Q counter */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: secColor, lineHeight: 1 }}>
              {currentLocal + 1}<span style={{ fontSize: 13, fontWeight: 400, color: T.muted }}>/{secQs.length}</span>
            </div>
            <div style={{ fontSize: 10, color: T.muted }}>questions</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div style={{ width: 240, background: "white", borderRight: `1px solid ${T.paper3}`, overflow: "auto", padding: "16px 12px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: T.muted }}>Answered</span>
            <span style={{ ...mono, fontSize: 11, color: T.ink3 }}>{answered}/{totalQ}</span>
          </div>
          <div style={{ height: 4, background: T.paper2, borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ height: "100%", borderRadius: 3, background: T.blue, width: (answered / totalQ * 100) + "%", transition: "width 0.3s" }} />
          </div>

          {sections.map((sec, si) => {
            const sColor    = SECTION_PALETTE[si % SECTION_PALETTE.length];
            const isCurrent = si === currentSec;
            const isDone    = completedSecs.has(si);
            const isFuture  = si > currentSec;

            return (
              <div key={si} style={{ marginBottom: 14 }}>
                {/* Section label */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                  color: isFuture ? T.paper4 : isDone ? T.mint : sColor,
                  marginBottom: 6,
                }}>
                  {isDone ? "✓" : isFuture ? "🔒" : "●"} {sec.name}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4 }}>
                  {questionsBySec[si].map(({ globalIndex: gi }, li) => {
                    const status =
                      gi === currentGi && isCurrent ? "current"
                      : answers[gi] !== undefined && answers[gi] !== "" && !(Array.isArray(answers[gi]) && answers[gi].length === 0) ? "attempted"
                      : review.has(gi) ? "review"
                      : visited.has(gi) ? "visited"
                      : "unvisited";

                    const lockedStyle = (isDone || isFuture)
                      ? { bg: isDone ? T.mint + "18" : T.paper2, color: isDone ? T.mint : T.paper4, border: isDone ? T.mint + "40" : T.paper3, opacity: 0.7 }
                      : Q_COLORS[status];

                    return (
                      <div key={gi}
                        onClick={() => handleSidebarClick(si, li, gi)}
                        style={{
                          width: "100%", aspectRatio: "1",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          ...mono, fontSize: 10, fontWeight: 600,
                          background: lockedStyle.bg, color: lockedStyle.color,
                          border: `2px solid ${lockedStyle.border}`,
                          borderRadius: 7, opacity: lockedStyle.opacity || 1,
                          cursor: isCurrent ? "pointer" : "not-allowed",
                          transition: "all 0.15s",
                        }}>
                        {isDone ? "✓" : gi + 1}
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
              [T.blueLight, "Answered"],
              [T.amberLight, "For Review"],
              [T.paper2, "Visited"],
              [T.mint + "18", "Submitted ✓"],
            ].map(([bg, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: bg }} />
                <span style={{ fontSize: 10, color: T.muted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Question area ─────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>

            {/* Q meta */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ ...mono, fontSize: 10, color: T.muted, marginBottom: 3 }}>
                  Question {currentLocal + 1} of {secQs.length}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: secColor + "15", color: secColor, fontWeight: 600 }}>
                    {currentQ.type === "single" ? "Single Choice" : currentQ.type === "multiple" ? "Multiple Choice" : "Subjective"}
                  </span>
                  <span style={{ ...mono, fontSize: 11, color: T.muted }}>
                    {currentQ.marks} mark{currentQ.marks !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <button onClick={() => setReview(r => { const n = new Set(r); n.has(currentGi) ? n.delete(currentGi) : n.add(currentGi); return n; })} style={{
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
                    <div key={oi} onClick={() => currentQ.type === "single" ? handleSingle(currentGi, oi) : handleMultiple(currentGi, oi)} style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                      borderRadius: 12, cursor: "pointer",
                      background: sel ? secColor + "10" : "white",
                      border: `2px solid ${sel ? secColor : T.paper3}`,
                      transition: "all 0.15s",
                    }}>
                      <div style={{
                        width: 20, height: 20, flexShrink: 0,
                        borderRadius: currentQ.type === "single" ? "50%" : 5,
                        border: `2px solid ${sel ? secColor : T.paper4}`,
                        background: sel ? secColor : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {sel && <div style={{ width: 8, height: 8, borderRadius: currentQ.type === "single" ? "50%" : 2, background: "white" }} />}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: T.ink3, opacity: 0.5, flexShrink: 0 }}>
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
                {currentQ.wordLimit > 0 && (() => {
                  const wc  = countWords(answers[currentGi] || "");
                  const pct = Math.min(wc / currentQ.wordLimit * 100, 100);
                  const at  = wc >= currentQ.wordLimit;
                  return (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: at ? T.pink : T.muted }}>
                          {at ? "⚠️ Word limit reached" : "Word count"}
                        </span>
                        <span style={{ ...mono, fontSize: 12, fontWeight: 600, color: at ? T.pink : T.ink3 }}>
                          {wc} / {currentQ.wordLimit}
                        </span>
                      </div>
                      <div style={{ height: 4, background: T.paper2, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 3, width: pct + "%", transition: "width 0.2s", background: at ? T.pink : pct > 80 ? T.amber : T.mint }} />
                      </div>
                    </div>
                  );
                })()}
                {wordAlerts[currentGi] && (
                  <div className="fade-in" style={{ marginBottom: 10, padding: "10px 14px", borderRadius: 10, background: T.pinkLight, border: `1px solid ${T.pink}40`, fontSize: 13, fontWeight: 600, color: T.pink }}>
                    🚫 Word limit reached ({currentQ.wordLimit} words). No more typing allowed.
                  </div>
                )}
                <textarea
                  value={answers[currentGi] || ""}
                  onChange={e => handleText(currentGi, e.target.value)}
                  rows={9} placeholder="Type your answer here…"
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

            {/* ── Navigation row ─────────────────────────────────────────────── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
              <Btn variant="light-secondary" onClick={goPrev} disabled={currentLocal === 0} style={{ color: T.ink2, fontSize: 13 }}>
                ← Previous
              </Btn>

              <div style={{ display: "flex", gap: 10 }}>
                {/* Within-section Next */}
                {!isLastQ && (
                  <Btn variant="primary" onClick={goNext} style={{ fontSize: 13 }}>Next →</Btn>
                )}

                {/* End of section: "Submit Section" OR "Finish Exam" (last section only) */}
                {isLastQ && (
                  <button onClick={handleSectionSubmit} style={{
                    padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: isLastSec
                      ? `linear-gradient(135deg, ${T.mint}, #00a07a)`
                      : `linear-gradient(135deg, ${secColor}, ${secColor}cc)`,
                    color: "white", border: "none", cursor: submitting ? "not-allowed" : "pointer",
                    fontFamily: "'Sora', system-ui, sans-serif",
                    boxShadow: `0 4px 16px ${isLastSec ? T.mint : secColor}40`,
                    opacity: submitting ? 0.7 : 1, transition: "opacity 0.2s",
                  }}>
                    {submitting ? "Submitting…" : isLastSec ? "🎯 Finish Exam" : `Submit ${sections[currentSec]?.name} →`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating calculator (when open) ──────────────────────────────────── */}
      {test?.calculator && !showCalc && (
        <button onClick={() => setShowCalc(true)} style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: 48, height: 48, borderRadius: "50%", border: "none",
          background: T.blue, color: "white", fontSize: 22, cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}>🧮</button>
      )}
      {showCalc && <Calculator onClose={() => setShowCalc(false)} />}

      {/* ── Pause overlay ─────────────────────────────────────────────────────── */}
      {paused && <PauseOverlay pausedAt={pausedAt} onResume={handleResume} />}

      {/* ── Section submit confirm ────────────────────────────────────────────── */}
      {showSectionDlg && (
        <SectionSubmitModal
          fromSection={sections[currentSec]}
          toSection={sections[currentSec + 1]}
          isLast={false}
          onConfirm={confirmSectionSubmit}
          onCancel={() => setShowSectionDlg(false)}
        />
      )}

      {/* ── Final submit confirm ──────────────────────────────────────────────── */}
      {showFinalDlg && (
        <SectionSubmitModal
          fromSection={sections[currentSec]}
          toSection={null}
          isLast={true}
          onConfirm={handleSubmit}
          onCancel={() => setShowFinalDlg(false)}
        />
      )}

      {/* ── Locked section warning toast ──────────────────────────────────────── */}
      {lockedWarn && (
        <div className="fade-in" style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 1900, padding: "12px 20px", borderRadius: 12,
          background: T.pinkLight, border: `1px solid ${T.pink}40`,
          color: T.pink, fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          whiteSpace: "nowrap",
        }}>
          🔒 {lockedWarn}
        </div>
      )}
    </div>
  );
}
