import { useState, useEffect } from "react";
import { T, serif, mono } from "../../data/tokens";
import { testAPI, violationAPI } from "../../services/api";
import Badge from "../ui/Badge";
import LiveDot from "../ui/LiveDot";

const STATUS_COLOR  = { clear: T.mint,  warn: T.coral,  critical: T.pink };
const STATUS_BORDER = { clear: T.mint + "50", warn: T.coral + "80", critical: T.pink + "90" };

function getTestStatus(test) {
  const now = new Date();
  if (new Date(test.startTime) > now) return "upcoming";
  if (new Date(test.endTime)   < now) return "closed";
  return "live";
}

export default function ProctorScreen({ user, setScreen }) {
  const [tests,      setTests]      = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [students,   setStudents]   = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [filter,     setFilter]     = useState("all");
  const [loading,    setLoading]    = useState(true);

  const isAdmin = user?.role === "admin";
  const backScreen = isAdmin ? "adminDash" : "teacherDash";

  // Load live/upcoming tests
  useEffect(() => {
    async function load() {
      try {
        const all = isAdmin
          ? await testAPI.getAll()
          : await testAPI.getMyTests();

        const live = all.filter(t => getTestStatus(t) === "live");
        setTests(all);

        if (live.length > 0) {
          const first = live[0];
          setActiveTest(first);
          // Load violation data for this exam
          const vData = await violationAPI.getStudentSummary(first._id);
          setStudents(vData);
        }
      } catch (err) {
        // silently degrade
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAdmin]);

  const handleSelectTest = async (test) => {
    setActiveTest(test);
    setStudents([]);
    try {
      const vData = await violationAPI.getStudentSummary(test._id);
      setStudents(vData);
    } catch {}
  };

  const filtered = filter === "all" ? students : students.filter(s => s.status === filter);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.ink }}>
      {/* Header */}
      <div style={{
        height: 56, background: "#0c0b18", borderBottom: `1px solid ${T.ink3}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setScreen(backScreen)} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif" }}>←</button>
          <div style={{ ...serif, fontSize: 18, color: T.ghost }}>
            Live Proctor
            {activeTest && (
              <span style={{ ...mono, fontSize: 13, color: T.blue, marginLeft: 10 }}>
                — {activeTest.name}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {activeTest && (
            <>
              <Badge color={T.mint} bg={T.mint + "15"}><LiveDot /> {students.length} flagged students</Badge>
              <Badge color={T.pink} bg={T.pink + "15"}>{students.filter(s => s.violations > 0).length} with violations</Badge>
            </>
          )}
          {["all", "clear", "warn", "critical"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 500,
              background: filter === f ? T.ink3 : "transparent",
              color: filter === f ? T.ghost : T.muted,
              border: "none", cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif",
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Exam selector sidebar */}
        {tests.length > 1 && (
          <div style={{ width: 220, borderRight: `1px solid ${T.ink3}`, overflow: "auto", padding: "16px" }}>
            <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: T.muted, marginBottom: 12 }}>Exams</div>
            {tests.map(t => {
              const status = getTestStatus(t);
              return (
                <div key={t._id}
                  onClick={() => handleSelectTest(t)}
                  style={{
                    padding: "10px 12px", borderRadius: 10, marginBottom: 6, cursor: "pointer",
                    background: activeTest?._id === t._id ? T.ink3 : "transparent",
                    border: `1px solid ${activeTest?._id === t._id ? T.ink4 : "transparent"}`,
                  }}
                >
                  <div style={{ fontSize: 12, color: T.ghost, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ ...mono, fontSize: 10, color: status === "live" ? T.mint : T.muted, marginTop: 3 }}>
                    {status === "live" ? "● LIVE" : status === "upcoming" ? "○ Upcoming" : "✓ Closed"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Main grid */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {loading ? (
            <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "80px 0" }}>Loading exams…</div>
          ) : !activeTest ? (
            <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📡</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.ghost, marginBottom: 8 }}>No live exams</div>
              <div style={{ fontSize: 13 }}>Exams will appear here when they are running.</div>
            </div>
          ) : students.length === 0 ? (
            <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 15 }}>No violations recorded yet for this exam.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {filtered.map((s, i) => (
                <div key={s.studentId?.toString() || i}
                  onClick={() => setSelected(selected?.studentId === s.studentId ? null : s)}
                  style={{
                    background: T.ink2, borderRadius: 16, overflow: "hidden",
                    border: `1.5px solid ${selected?.studentId === s.studentId ? "#a8a5d8" : STATUS_BORDER[s.status] || T.ink3}`,
                    cursor: "pointer", transition: "all 0.18s",
                    animation: "fadeIn 0.3s ease forwards", animationDelay: i * 50 + "ms", opacity: 0,
                  }}
                >
                  <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(180deg, ${T.ink2}, ${T.ink3})`, position: "relative" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${T.ink3}, #5a5890)` }} />
                    <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 5, ...mono, fontSize: 9, color: STATUS_COLOR[s.status] || T.muted }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLOR[s.status] || T.muted, animation: "pulse 1.2s infinite" }} />
                      {s.status === "clear" ? "Clear" : (s.flags || []).join(", ")}
                    </div>
                  </div>
                  <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.ink3}` }}>
                    <div style={{ fontSize: 13, color: T.ghost, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ ...mono, fontSize: 10, color: T.muted, marginTop: 2 }}>{s.username}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                      <Badge color={s.violations === 0 ? T.mint : s.status === "critical" ? T.pink : T.coral}
                             bg={(s.violations === 0 ? T.mint : s.status === "critical" ? T.pink : T.coral) + "15"}
                             style={{ fontSize: 9 }}>
                        {s.violations === 0 ? "0 violations" : `${s.violations} violation${s.violations > 1 ? "s" : ""}`}
                      </Badge>
                    </div>
                  </div>
                  {selected?.studentId === s.studentId && (
                    <div className="fade-in" style={{ padding: "10px 14px", borderTop: `1px solid ${T.ink3}`, background: T.ink3 }}>
                      <div style={{ fontSize: 11, color: T.dim, marginBottom: 6 }}>Flags detected:</div>
                      <div style={{ fontSize: 11, color: s.violations > 0 ? T.coral : T.mint, ...mono }}>
                        {s.violations > 0 ? (s.flags || []).join(", ") || "violations recorded" : "No anomalies"}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button style={{ flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 11, fontWeight: 500, background: T.pink + "20", border: `1px solid ${T.pink}40`, color: T.pink, cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif" }}>
                          Terminate
                        </button>
                        <button style={{ flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 11, fontWeight: 500, background: T.amber + "20", border: `1px solid ${T.amber}40`, color: T.amber, cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif" }}>
                          Send Warning
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
