import { useState, useEffect } from "react";
import { T, serif, mono } from "../../data/tokens";
import { classAPI, testAPI } from "../../services/api";
import Btn from "../ui/Btn";

const STRICTNESS_OPTS = [
  { key: "lenient",  icon: "🌿", label: "Lenient",  color: T.mint,
    desc: "Low-stakes. Violations logged only." },
  { key: "moderate", icon: "⚖️", label: "Moderate", color: T.amber,
    desc: "Standard. Balanced security." },
  { key: "strict",   icon: "🔒", label: "Strict",   color: T.pink,
    desc: "Finals. Maximum integrity." },
];

const SECTION_COLORS = [T.blue, "#a855f7", T.mint, T.amber, T.coral, T.pink];

const blankQuestion = (sectionIndex = 0) => ({
  type: "single", questionText: "", options: ["", "", "", ""],
  correctOptions: [], marks: 1, wordLimit: 0, sectionIndex,
});

const blankSection = (n) => ({ name: `Section ${n}`, description: "" });

export default function ExamConfigScreen({ user, setScreen, notify }) {
  const [step,       setStep]       = useState(1);
  const [classes,    setClasses]    = useState([]);
  const [publishing, setPublishing] = useState(false);

  // ── Step 1: Basic settings ──────────────────────────────────────────────────
  const [title,      setTitle]      = useState("");
  const [classId,    setClassId]    = useState("");
  const [startTime,  setStartTime]  = useState("");
  const [endTime,    setEndTime]    = useState("");
  const [duration,   setDuration]   = useState(90);
  const [strictness, setStrictness] = useState("moderate");
  const [calc,       setCalc]       = useState(false);
  const [allowPause, setAllowPause] = useState(false);
  const [randomize,  setRandomize]  = useState(false);

  // ── Step 2: Sections & Questions ───────────────────────────────────────────
  const [sections,   setSections]   = useState([{ name: "Section 1", description: "" }]);
  const [questions,  setQuestions]  = useState([blankQuestion(0)]);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    classAPI.getAll().then(setClasses).catch(() => notify("Could not load classes.", "warn"));
  }, [notify]);

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    background: T.ink2, border: `1px solid ${T.ink4}`,
    color: T.ghost, fontSize: 13, fontFamily: "'Sora', system-ui, sans-serif",
    outline: "none", boxSizing: "border-box",
  };

  // ── Section helpers ─────────────────────────────────────────────────────────
  const addSection = () => {
    const n = sections.length + 1;
    setSections(s => [...s, blankSection(n)]);
  };

  const updateSection = (i, patch) =>
    setSections(s => s.map((sec, idx) => idx === i ? { ...sec, ...patch } : sec));

  const deleteSection = (i) => {
    if (sections.length <= 1) { notify("An exam must have at least one section.", "warn"); return; }
    // Reassign questions from this section to section 0
    setQuestions(qs => qs.map(q => q.sectionIndex === i ? { ...q, sectionIndex: 0 }
      : q.sectionIndex > i ? { ...q, sectionIndex: q.sectionIndex - 1 } : q));
    setSections(s => s.filter((_, idx) => idx !== i));
    if (activeSection >= i) setActiveSection(Math.max(0, activeSection - 1));
  };

  // ── Question helpers (filtered by active section) ───────────────────────────
  const sectionQuestions = questions.map((q, gi) => ({ ...q, globalIndex: gi }))
    .filter(q => q.sectionIndex === activeSection);

  const updateQ = (gi, patch) =>
    setQuestions(qs => qs.map((q, idx) => idx === gi ? { ...q, ...patch } : q));

  const addQuestion = () => setQuestions(qs => [...qs, blankQuestion(activeSection)]);

  const removeQ = (gi) => {
    if (questions.length <= 1) { notify("An exam must have at least one question.", "warn"); return; }
    setQuestions(qs => qs.filter((_, idx) => idx !== gi));
  };

  const updateOption = (gi, oi, val) =>
    updateQ(gi, { options: questions[gi].options.map((o, idx) => idx === oi ? val : o) });

  const toggleCorrect = (gi, oi) => {
    const q = questions[gi];
    const already = q.correctOptions.includes(oi);
    updateQ(gi, { correctOptions: already ? q.correctOptions.filter(x => x !== oi) : [...q.correctOptions, oi] });
  };

  // ── Publish ─────────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!title.trim())        { notify("Please enter a title.", "warn"); return; }
    if (!classId)             { notify("Please select a class.", "warn"); return; }
    if (!startTime || !endTime) { notify("Please set start and end times.", "warn"); return; }
    if (questions.some(q => !q.questionText.trim())) { notify("All questions need text.", "warn"); return; }

    setPublishing(true);
    try {
      await testAPI.create({
        name: title, classId, startTime, endTime, duration,
        strictness, calculator: calc, allowPause, randomize,
        sections,
        questions: questions.map(q => ({
          ...q,
          wordLimit: q.type === "subjective" ? (q.wordLimit || 0) : 0,
        })),
      });
      notify("Exam published!");
      setScreen("teacherDash");
    } catch (err) {
      notify("Publish error: " + err.message, "critical");
    } finally {
      setPublishing(false);
    }
  };

  const totalQ = questions.length;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.ink }}>
      {/* Header */}
      <div style={{
        height: 56, background: "#0c0b18", borderBottom: `1px solid ${T.ink3}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", flexShrink: 0,
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
              cursor: step > s ? "pointer" : "default",
            }} onClick={() => step > s && setStep(s)}>{s}</div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "32px 36px" }}>

        {/* ── STEP 1: Settings + Strictness ── */}
        {step === 1 && (
          <div className="fade-in">
            <h2 style={{ ...serif, fontSize: 24, color: T.ghost, marginBottom: 4 }}>Exam Settings</h2>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 28 }}>Configure timing, class, and proctoring level.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 740 }}>
              {/* Left col */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ ...mono, fontSize: 11, color: T.dim, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Exam Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Midterm Examination" style={inputStyle} />
                </div>
                <div>
                  <label style={{ ...mono, fontSize: 11, color: T.dim, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Class</label>
                  <select value={classId} onChange={e => setClassId(e.target.value)} style={inputStyle}>
                    <option value="">— Select a class —</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.classId} — {c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ ...mono, fontSize: 11, color: T.dim, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Start</label>
                    <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ ...mono, fontSize: 11, color: T.dim, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>End</label>
                    <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ ...mono, fontSize: 11, color: T.dim, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Duration (minutes)</label>
                  <input type="number" value={duration} onChange={e => setDuration(+e.target.value)} min={15} max={360} style={inputStyle} />
                </div>
                {/* Toggles */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { l: "Allow Calculator",         v: calc,       set: setCalc       },
                    { l: "Allow Exam Pause",          v: allowPause, set: setAllowPause },
                    { l: "Randomise Question Order",  v: randomize,  set: setRandomize  },
                  ].map(t => (
                    <div key={t.l} onClick={() => t.set(p => !p)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <div style={{ width: 40, height: 22, borderRadius: 11, background: t.v ? T.blue : T.ink3, border: `2px solid ${t.v ? T.blue : T.ink4}`, position: "relative", transition: "all 0.2s", flexShrink: 0 }}>
                        <div style={{ position: "absolute", top: 2, left: t.v ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
                      </div>
                      <span style={{ fontSize: 13, color: T.dim }}>{t.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right col — Strictness */}
              <div>
                <label style={{ ...mono, fontSize: 11, color: T.dim, display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Proctoring Strictness</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {STRICTNESS_OPTS.map(lv => (
                    <div key={lv.key} onClick={() => setStrictness(lv.key)} style={{
                      borderRadius: 14, padding: "16px",
                      border: `2px solid ${strictness === lv.key ? lv.color : T.ink3}`,
                      background: strictness === lv.key ? lv.color + "10" : T.ink2,
                      cursor: "pointer", transition: "all 0.15s",
                      display: "flex", alignItems: "center", gap: 14,
                    }}>
                      <span style={{ fontSize: 22 }}>{lv.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: strictness === lv.key ? lv.color : T.ghost }}>{lv.label}</div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{lv.desc}</div>
                      </div>
                      {strictness === lv.key && (
                        <div style={{ marginLeft: "auto", background: lv.color, color: "white", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>✓</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Sections & Questions ── */}
        {step === 2 && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div>
                <h2 style={{ ...serif, fontSize: 24, color: T.ghost, marginBottom: 4 }}>Sections & Questions</h2>
                <p style={{ fontSize: 13, color: T.muted }}>Organise questions into sections. Students complete one section at a time.</p>
              </div>
              <div style={{ ...mono, fontSize: 11, color: T.muted, textAlign: "right", paddingTop: 4 }}>
                {totalQ} question{totalQ !== 1 ? "s" : ""} total
              </div>
            </div>

            {/* Section tabs */}
            <div style={{ display: "flex", gap: 8, marginTop: 20, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              {sections.map((sec, si) => (
                <div key={si} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 10,
                  background: activeSection === si ? SECTION_COLORS[si % SECTION_COLORS.length] + "20" : T.ink2,
                  border: `1.5px solid ${activeSection === si ? SECTION_COLORS[si % SECTION_COLORS.length] : T.ink3}`,
                  cursor: "pointer", transition: "all 0.15s",
                }} onClick={() => setActiveSection(si)}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: SECTION_COLORS[si % SECTION_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: activeSection === si ? SECTION_COLORS[si % SECTION_COLORS.length] : T.ghost }}>
                    {sec.name}
                  </span>
                  <span style={{ ...mono, fontSize: 10, color: T.muted }}>
                    ({questions.filter(q => q.sectionIndex === si).length}q)
                  </span>
                  {sections.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); deleteSection(si); }} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 2px" }}>×</button>
                  )}
                </div>
              ))}
              {sections.length < 6 && (
                <button onClick={addSection} style={{
                  padding: "7px 14px", borderRadius: 10, border: `1.5px dashed ${T.ink4}`,
                  background: "transparent", color: T.muted, cursor: "pointer",
                  fontSize: 12, fontFamily: "'Sora', system-ui, sans-serif",
                }}>
                  + Add Section
                </button>
              )}
            </div>

            {/* Active section editor */}
            <div style={{ marginBottom: 16, background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                <div>
                  <label style={{ ...mono, fontSize: 10, color: T.dim, display: "block", marginBottom: 5 }}>SECTION NAME</label>
                  <input
                    value={sections[activeSection]?.name || ""}
                    onChange={e => updateSection(activeSection, { name: e.target.value })}
                    placeholder="e.g. Section A — MCQ"
                    style={{ ...inputStyle, borderColor: SECTION_COLORS[activeSection % SECTION_COLORS.length] + "60" }}
                  />
                </div>
                <div>
                  <label style={{ ...mono, fontSize: 10, color: T.dim, display: "block", marginBottom: 5 }}>DESCRIPTION (optional — shown to student)</label>
                  <input
                    value={sections[activeSection]?.description || ""}
                    onChange={e => updateSection(activeSection, { description: e.target.value })}
                    placeholder="e.g. Answer all 10 questions. No calculators."
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Questions in this section */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
              {sectionQuestions.length === 0 && (
                <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: "24px 0", background: T.ink2, borderRadius: 14, border: `1px dashed ${T.ink4}` }}>
                  No questions in this section yet. Add one below.
                </div>
              )}

              {sectionQuestions.map(({ globalIndex: gi, ...q }) => (
                <div key={gi} style={{ background: T.ink2, border: `1.5px solid ${SECTION_COLORS[activeSection % SECTION_COLORS.length]}30`, borderRadius: 14, padding: "18px" }}>
                  {/* Q header */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ ...mono, fontSize: 10, color: T.muted }}>Q{gi + 1}</span>
                      <select value={q.type} onChange={e => updateQ(gi, { type: e.target.value, correctOptions: [] })}
                        style={{ background: T.ink3, border: `1px solid ${T.ink4}`, borderRadius: 8, color: T.ghost, fontSize: 11, padding: "4px 8px", fontFamily: "'Sora', system-ui, sans-serif" }}>
                        <option value="single">Single Choice</option>
                        <option value="multiple">Multiple Choice</option>
                        <option value="subjective">Subjective</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: T.muted }}>Marks</span>
                        <input type="number" value={q.marks} onChange={e => updateQ(gi, { marks: +e.target.value })} min={1}
                          style={{ width: 52, ...inputStyle, padding: "4px 8px", fontSize: 12 }} />
                      </div>
                      {/* Word limit — only for subjective */}
                      {q.type === "subjective" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, color: T.muted }}>Word limit</span>
                          <input type="number" value={q.wordLimit || ""} min={1}
                            onChange={e => updateQ(gi, { wordLimit: e.target.value ? +e.target.value : 0 })}
                            placeholder="none"
                            style={{ width: 70, ...inputStyle, padding: "4px 8px", fontSize: 12 }} />
                        </div>
                      )}
                      {questions.length > 1 && (
                        <button onClick={() => removeQ(gi)} style={{ background: "none", border: "none", color: T.pink, cursor: "pointer", fontSize: 16 }}>×</button>
                      )}
                    </div>
                  </div>

                  {/* Question text */}
                  <textarea value={q.questionText} onChange={e => updateQ(gi, { questionText: e.target.value })}
                    placeholder="Question text…" rows={2}
                    style={{ ...inputStyle, resize: "vertical", marginBottom: 10, lineHeight: 1.5 }} />

                  {/* MCQ options */}
                  {(q.type === "single" || q.type === "multiple") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {q.options.map((opt, oi) => (
                        <div key={oi} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input type={q.type === "single" ? "radio" : "checkbox"}
                            checked={q.correctOptions.includes(oi)}
                            onChange={() => toggleCorrect(gi, oi)}
                            title="Mark as correct answer"
                            style={{ accentColor: T.mint, cursor: "pointer" }} />
                          <input value={opt} onChange={e => updateOption(gi, oi, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            style={{
                              flex: 1, padding: "8px 12px", borderRadius: 8, background: T.ink3,
                              border: `1px solid ${q.correctOptions.includes(oi) ? T.mint + "60" : T.ink4}`,
                              color: T.ghost, fontSize: 13, fontFamily: "'Sora', system-ui, sans-serif", outline: "none",
                            }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Subjective info */}
                  {q.type === "subjective" && (
                    <div style={{ fontSize: 11, color: T.muted, padding: "8px 12px", background: T.ink3, borderRadius: 8 }}>
                      ✏️ Free-text answer · reviewed manually ·{" "}
                      {q.wordLimit ? `word limit: ${q.wordLimit}` : "no word limit"}
                    </div>
                  )}
                </div>
              ))}

              <button onClick={addQuestion} style={{
                padding: "11px", borderRadius: 12, border: `1.5px dashed ${T.ink4}`,
                background: "transparent", color: T.muted, cursor: "pointer",
                fontSize: 13, fontFamily: "'Sora', system-ui, sans-serif",
              }}>
                + Add Question to "{sections[activeSection]?.name}"
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Review & Publish ── */}
        {step === 3 && (
          <div className="fade-in">
            <h2 style={{ ...serif, fontSize: 24, color: T.ghost, marginBottom: 4 }}>Review & Publish</h2>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 28 }}>Confirm your exam configuration before publishing.</p>

            <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "22px" }}>
                {[
                  ["Title",         title || "—"],
                  ["Class",         classes.find(c => c._id === classId)?.name || "—"],
                  ["Start",         startTime ? new Date(startTime).toLocaleString() : "—"],
                  ["End",           endTime ? new Date(endTime).toLocaleString() : "—"],
                  ["Duration",      duration + " minutes"],
                  ["Strictness",    STRICTNESS_OPTS.find(l => l.key === strictness)?.label],
                  ["Calculator",    calc ? "Allowed" : "Not allowed"],
                  ["Randomisation", randomize ? "Enabled" : "Disabled"],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.ink3}` }}>
                    <span style={{ fontSize: 13, color: T.muted }}>{l}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: T.ghost }}>{v}</span>
                  </div>
                ))}
              </div>

              {sections.map((sec, si) => {
                const qs = questions.filter(q => q.sectionIndex === si);
                return (
                  <div key={si} style={{ background: T.ink2, border: `1.5px solid ${SECTION_COLORS[si % SECTION_COLORS.length]}30`, borderRadius: 14, padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: SECTION_COLORS[si % SECTION_COLORS.length] }} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.ghost }}>{sec.name}</div>
                      <div style={{ ...mono, fontSize: 10, color: T.muted, marginLeft: "auto" }}>{qs.length} question{qs.length !== 1 ? "s" : ""} · {qs.reduce((s, q) => s + (q.marks || 0), 0)} marks</div>
                    </div>
                    {sec.description && <div style={{ fontSize: 12, color: T.muted }}>{sec.description}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer nav */}
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
