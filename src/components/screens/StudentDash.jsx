import { useState, useEffect } from "react";
import { T, serif, mono } from "../../data/tokens";
import { classAPI, testAPI, submissionAPI } from "../../services/api";
import Badge from "../ui/Badge";
import LiveDot from "../ui/LiveDot";
import Btn from "../ui/Btn";
import UserMenu from "../ui/UserMenu";

function formatCountdown(endTime) {
  const ms = new Date(endTime) - new Date();
  if (ms <= 0) return "Closed";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `Closes in ${h}h ${m}m` : `Closes in ${m}m`;
}

export default function StudentDash({ user, onStart, setScreen, onLogout }) {
  const [classes,   setClasses]   = useState([]);
  const [tests,     setTests]     = useState([]);
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cls, tst, res] = await Promise.all([
          classAPI.getAll(),
          testAPI.getAvailable(),
          submissionAPI.getMyResults(),
        ]);
        setClasses(cls);
        setTests(tst);
        setResults(res);
      } catch {
        // silently degrade — user can still see the page
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ height: "100vh", background: T.paper, color: T.ink, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Light top bar */}
      <div style={{
        height: 56, background: "white", borderBottom: `1px solid ${T.paper3}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", flexShrink: 0,
      }}>
        <div style={{ ...serif, fontSize: 18, color: T.ink, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.blue, display: "inline-block" }} />
          ProctorOS
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 13, color: T.ink3 }}>{user?.name}</div>
          <UserMenu user={user} onLogout={onLogout} setScreen={setScreen} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "32px 28px" }}>
        <div style={{ animation: "fadeIn 0.35s ease forwards" }}>
          <p style={{ ...mono, fontSize: 11, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Student Portal
          </p>
          <h1 style={{ ...serif, fontSize: 32, color: T.ink, marginBottom: 4 }}>
            Hello, <em style={{ color: T.blue, fontStyle: "italic" }}>{user?.name?.split(" ")[0] || "Student"}</em>
          </h1>
          <p style={{ fontSize: 14, color: T.ink3, marginBottom: 32 }}>
            {loading ? "Loading your exams…"
              : tests.length === 0 ? "No exams available right now."
              : `You have ${tests.length} exam${tests.length > 1 ? "s" : ""} available now.`}
          </p>
        </div>

        {/* Enrolled courses */}
        {classes.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: T.ink3, marginBottom: 14 }}>
              Enrolled Courses
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
              {classes.map((c, i) => (
                <div key={c._id} style={{
                  background: "white", border: `1px solid ${T.paper3}`, borderRadius: 14,
                  padding: "18px 20px", animation: "fadeIn 0.4s ease forwards",
                  animationDelay: i * 60 + "ms", opacity: 0,
                }}>
                  <div style={{ ...mono, fontSize: 11, color: T.blue, marginBottom: 4 }}>{c.classId}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: T.ink3, marginTop: 2 }}>{c.teacher?.name || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available exams */}
        {!loading && tests.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: T.ink3, marginBottom: 14 }}>
              Available Exams
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {tests.map((test, i) => (
                <div key={test._id} style={{
                  background: "white", border: `1.5px solid ${T.blue}40`,
                  borderRadius: 16, padding: "24px", position: "relative", overflow: "hidden",
                  animation: "fadeIn 0.4s ease forwards", animationDelay: i * 80 + "ms", opacity: 0,
                }}>
                  <div style={{ position: "absolute", top: 0, right: 0, width: 140, height: 140,
                    background: `radial-gradient(circle, ${T.blue}10, transparent)`, borderRadius: "0 16px 0 0" }} />
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <Badge color={T.mint} bg={T.mintLight}><LiveDot color={T.mint} /> Live Now</Badge>
                      <h2 style={{ fontSize: 20, fontWeight: 600, color: T.ink, margin: "10px 0 6px" }}>
                        {test.name}
                      </h2>
                      <p style={{ fontSize: 13, color: T.ink3, marginBottom: 16 }}>
                        {test.classId?.name || "—"} · {test.questions?.length || "?"} questions · {test.duration} minutes
                      </p>
                      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                        {[
                          ["⏱", `${test.duration} min`],
                          ["📝", `${test.questions?.length || "?"} Qs`],
                          ["⚖️", test.strictness || "moderate"],
                          ["📅", formatCountdown(test.endTime)],
                        ].map(([ic, lb]) => (
                          <div key={lb} style={{ fontSize: 12, color: T.ink3 }}>{ic} {lb}</div>
                        ))}
                      </div>
                      <Btn variant="light-primary" onClick={() => onStart(test)} style={{ fontSize: 14, padding: "11px 28px" }}>
                        Begin Exam →
                      </Btn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past results */}
        {results.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: T.ink3, marginBottom: 14 }}>
              Past Results
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {results.map(r => (
                <div key={r._id} style={{ background: "white", border: `1px solid ${T.paper3}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", border: `2px solid ${T.blue}`, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.blue, lineHeight: 1 }}>{r.totalScore ?? r.autoScore ?? "—"}</div>
                    <div style={{ fontSize: 9, color: T.muted }}>pts</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{r.testId?.name || "Exam"}</div>
                    <div style={{ fontSize: 12, color: T.ink3, marginTop: 2 }}>
                      {r.status === "reviewed" ? "Reviewed" : "Pending review"} ·{" "}
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <Badge color={r.status === "reviewed" ? T.mint : T.amber}
                         bg={r.status === "reviewed" ? T.mintLight : T.amberLight}>
                    {r.status === "reviewed" ? "✓ Done" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && classes.length === 0 && tests.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: T.ink3 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>You're not enrolled in any classes yet</div>
            <div style={{ fontSize: 13 }}>Ask your admin to add you to a class to see exams here.</div>
          </div>
        )}
      </div>
    </div>
  );
}
