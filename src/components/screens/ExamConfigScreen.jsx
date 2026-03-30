import { useState, useEffect } from "react";
import { T, serif, mono } from "../../data/tokens";
import { classAPI, testAPI } from "../../services/api";
import Btn from "../ui/Btn";

const LEVELS = [
  { key: "lenient",  icon: "🌿", name: "Lenient",  color: T.mint,
    desc: "Low-stakes quizzes. Violations logged only.",
    rules: ["5 tab switches allowed", "No face detection", "10+ triggers warning"] },
  { key: "moderate", icon: "⚖️", name: "Moderate", color: T.amber,
    desc: "Standard exams. Balanced security.",
    rules: ["2 switches → warning", "Face must be visible", "5 violations → submit"] },
  { key: "strict",   icon: "🔒", name: "Strict",   color: T.pink,
    desc: "Finals. Maximum integrity.",
    rules: ["1 switch → warning", "Multi-face → terminate", "3 violations → submit"] },
];

// Default blank question
const blankQuestion = () => ({
  type: "single",
  questionText: "",
  options: ["", "", "", ""],
  correctOptions: [],
  marks: 1,
});

export default function ExamConfigScreen({ user, setScreen, notify }) {
  const [step, setStep]           = useState(1);
  const [title, setTitle]         = useState("");
  const [classId, setClassId]     = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime]     = useState("");
  const [duration, setDuration]   = useState(90);
  const [strictness, setStrictness] = useState("moderate");
  const [calc, setCalc]           = useState(false);
  const [randomize, setRandomize] = useState(true);
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [classes, setClasses]     = useState([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    classAPI.getAll()
      .then(setClasses)
      .catch(() => notify("Could not load your classes.", "warn"));
  }, [notify]);

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    background: T.ink2, border: `1px solid ${T.ink4}`,
    color: T.ghost, fontSize: 14, fontFamily: "'Sora', system-ui, sans-serif", outline: "none",
  };

  // Question helpers
  const updateQ = (i, patch) => setQuestions(qs => qs.map((q, idx) => idx === i ? {...q, ...patch} : q));
  const addQ    = ()         => setQuestions(qs => [...qs, blankQuestion()]);
  const removeQ = (i)        => setQuestions(qs => qs.filter((_, idx) => idx !== i));
  const updateOption = (qi, oi, val) => updateQ(qi, { options: questions[qi].options.map((o, idx) => idx === oi ? val : o) });
  const toggleCorrect = (qi, oi) => {
    const q = questions[qi];
    const already = q.correctOptions.includes(oi);
    updateQ(qi, { correctOptions: already ? q.correctOptions.filter(x => x !== oi) : [...q.correctOptions, oi] });
  };

  const handlePublish = async () => {
    if (!title.trim())   { notify("Please enter a title.", "warn"); return; }
    if (!classId)        { notify("Please select a class.", "warn"); return; }
    if (!startTime || !endTime) { notify("Please set start and end times.", "warn"); return; }
    if (questions.some(q => !q.questionText.trim())) { notify("All questions must have text.", "warn"); return; }

    setPublishing(true);
    try {
      await testAPI.create({
        name: title, classId, startTime, endTime, duration,
        strictness, calculator: calc, randomize, questions,
      });
      notify("Exam published successfully!");
      setScreen("teacherDash");
    } catch (err) {
      notify("Error publishing: " + err.message, "critical");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.ink }}>
      {/* Header */}
      <div style={{
        height: 56, background: "#0c0b18", borderBottom: `1px solid ${T.ink3}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setScreen("teacherDash")} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif" }}>←</button>
          <div style={{ ...serif, fontSize: 18, color: T.ghost }}>Create Exam</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: 28, height: 28, borderRadius: "50%",
              background: step === s ? T.blue : step > s ? T.mint + "40" : T.ink3,
              border: `2px solid ${step === s ? T.blue : step > s ? T.mint : T.ink4}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              ...mono, fontSize: 11, color: step === s ? "white" : step > s ? T.mint : T.muted,
            }}>{s}</div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "32px 36px" }}>

        {/* Step 1: Basic settings */}
        {step === 1 && (
          <div className="fade-in">
            <h2 style={{ ...serif, fontSize: 24, color: T.ghost, marginBottom: 4 }}>Basic Settings</h2>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 28 }}>Configure the exam details and schedule.</p>
            <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.dim, display: "block", marginBottom: 6 }}>Exam Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Midterm Examination" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.dim, display: "block", marginBottom: 6 }}>Class</label>
                <select value={classId} onChange={e => setClassId(e.target.value)} style={inputStyle}>
                  <option value="">— Select a class —</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.classId} — {c.name}</option>)}
                </select>
                {classes.length === 0 && <div style={{ fontSize: 11, color: T.coral, marginTop: 4 }}>No classes found. Ask your admin to assign you a class first.</div>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.dim, display: "block", marginBottom: 6 }}>Start Time</label>
                  <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.dim, display: "block", marginBottom: 6 }}>End Time</label>
                  <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.dim, display: "block", marginBottom: 6 }}>Duration (minutes)</label>
                <input type="number" value={duration} onChange={e => setDuration(+e.target.value)} min={15} max={360} style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                {[{ l: "Allow Calculator", v: calc, set: setCalc }, { l: "Randomise Questions", v: randomize, set: setRandomize }].map(t => (
                  <div key={t.l} onClick={() => t.set(!t.v)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <div style={{ width: 40, height: 22, borderRadius: 11, background: t.v ? T.blue : T.ink3, border: `2px solid ${t.v ? T.blue : T.ink4}`, position: "relative", transition: "all 0.2s" }}>
                      <div style={{ position: "absolute", top: 2, left: t.v ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
                    </div>
                    <span style={{ fontSize: 13, color: T.dim }}>{t.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Strictness */}
        {step === 2 && (
          <div className="fade-in">
            <h2 style={{ ...serif, fontSize: 24, color: T.ghost, marginBottom: 4 }}>Proctoring Strictness</h2>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 28 }}>Choose the level of monitoring for this exam.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 700, marginBottom: 32 }}>
              {LEVELS.map(lv => (
                <div key={lv.key} onClick={() => setStrictness(lv.key)} style={{
                  borderRadius: 16, padding: "22px",
                  border: `2px solid ${strictness === lv.key ? lv.color : T.ink3}`,
                  background: strictness === lv.key ? lv.color + "10" : T.ink2,
                  cursor: "pointer", transition: "all 0.18s", position: "relative",
                }}>
                  {strictness === lv.key && (
                    <div style={{ position: "absolute", top: 10, right: 10, background: lv.color, color: "white", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>Selected</div>
                  )}
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{lv.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.ghost, marginBottom: 6 }}>{lv.name}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 12, lineHeight: 1.6 }}>{lv.desc}</div>
                  {lv.rules.map(r => (
                    <div key={r} style={{ fontSize: 11, color: T.dim, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: lv.color, flexShrink: 0 }} />{r}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Questions builder */}
            <h2 style={{ ...serif, fontSize: 22, color: T.ghost, marginBottom: 4 }}>Questions</h2>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Add questions to your exam. Mark correct answers.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 700 }}>
              {questions.map((q, qi) => (
                <div key={qi} style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 14, padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ ...mono, fontSize: 10, color: T.muted }}>Question {qi + 1}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <select value={q.type} onChange={e => updateQ(qi, { type: e.target.value, correctOptions: [] })}
                        style={{ background: T.ink3, border: `1px solid ${T.ink4}`, borderRadius: 8, color: T.ghost, fontSize: 11, padding: "4px 8px", fontFamily: "'Sora', system-ui, sans-serif" }}>
                        <option value="single">Single Choice</option>
                        <option value="multiple">Multiple Choice</option>
                        <option value="subjective">Subjective</option>
                      </select>
                      <input type="number" value={q.marks} onChange={e => updateQ(qi, { marks: +e.target.value })} min={1}
                        placeholder="Marks" style={{ width: 70, background: T.ink3, border: `1px solid ${T.ink4}`, borderRadius: 8, color: T.ghost, fontSize: 11, padding: "4px 8px", fontFamily: "'Sora', system-ui, sans-serif" }} />
                      {questions.length > 1 && (
                        <button onClick={() => removeQ(qi)} style={{ background: "none", border: "none", color: T.pink, cursor: "pointer", fontSize: 16 }}>×</button>
                      )}
                    </div>
                  </div>
                  <textarea value={q.questionText} onChange={e => updateQ(qi, { questionText: e.target.value })} placeholder="Question text…"
                    rows={2} style={{ ...inputStyle, resize: "vertical", marginBottom: 10, lineHeight: 1.5 }} />
                  {(q.type === "single" || q.type === "multiple") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {q.options.map((opt, oi) => (
                        <div key={oi} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input type={q.type === "single" ? "radio" : "checkbox"}
                            checked={q.correctOptions.includes(oi)}
                            onChange={() => toggleCorrect(qi, oi)}
                            title="Mark as correct" style={{ accentColor: T.mint, cursor: "pointer" }} />
                          <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: T.ink3, border: `1px solid ${q.correctOptions.includes(oi) ? T.mint + "60" : T.ink4}`, color: T.ghost, fontSize: 13, fontFamily: "'Sora', system-ui, sans-serif", outline: "none" }} />
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type === "subjective" && (
                    <div style={{ fontSize: 11, color: T.muted, padding: "8px 12px", background: T.ink3, borderRadius: 8 }}>
                      ✏️ Subjective — students type free-text; teacher reviews manually.
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addQ} style={{ padding: "10px", borderRadius: 12, border: `1.5px dashed ${T.ink4}`, background: "transparent", color: T.muted, cursor: "pointer", fontSize: 13, fontFamily: "'Sora', system-ui, sans-serif" }}>
                + Add Question
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Publish */}
        {step === 3 && (
          <div className="fade-in">
            <h2 style={{ ...serif, fontSize: 24, color: T.ghost, marginBottom: 4 }}>Review & Publish</h2>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 28 }}>Confirm your exam configuration.</p>
            <div style={{ maxWidth: 480, background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "24px" }}>
              {[
                ["Title",         title || "—"],
                ["Class",         classes.find(c => c._id === classId)?.name || "—"],
                ["Start",         startTime ? new Date(startTime).toLocaleString() : "—"],
                ["End",           endTime   ? new Date(endTime).toLocaleString()   : "—"],
                ["Duration",      duration + " minutes"],
                ["Questions",     questions.length + " total"],
                ["Calculator",    calc ? "Allowed" : "Not allowed"],
                ["Randomisation", randomize ? "Enabled" : "Disabled"],
                ["Strictness",    LEVELS.find(l => l.key === strictness)?.name],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.ink3}` }}>
                  <span style={{ fontSize: 13, color: T.muted }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: T.ghost }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          {step > 1 && <Btn variant="ghost" onClick={() => setStep(s => s - 1)}>← Back</Btn>}
          {step < 3
            ? <Btn variant="primary" onClick={() => setStep(s => s + 1)}>Continue →</Btn>
            : <Btn variant="primary" onClick={handlePublish} disabled={publishing}>
                {publishing ? "Publishing…" : "🚀 Publish Exam"}
              </Btn>
          }
        </div>
      </div>
    </div>
  );
}
