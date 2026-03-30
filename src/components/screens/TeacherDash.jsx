import { useState, useEffect } from "react";
import { T, serif, mono } from "../../data/tokens";
import { classAPI, testAPI } from "../../services/api";
import TopBar from "../ui/TopBar";
import LiveDot from "../ui/LiveDot";
import Btn from "../ui/Btn";
import Badge from "../ui/Badge";

function CourseCard({ course, index, onProctor }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? T.ink3 : T.ink2,
        border: `1px solid ${hov ? T.ink4 : T.ink3}`,
        borderRadius: 16, padding: "22px", transition: "all 0.18s",
        animation: "fadeIn 0.4s ease forwards", animationDelay: index * 80 + "ms", opacity: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ ...mono, fontSize: 11, color: T.blue, marginBottom: 4 }}>{course.classId}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.ghost }}>{course.name}</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{course.teacher?.name || "Unassigned"}</div>
        </div>
        <div style={{ ...mono, fontSize: 10, color: T.muted, textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: T.ghost }}>{course.students?.length || 0}</div>
          <div>students</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <Btn variant="primary" onClick={onProctor} style={{ fontSize: 11, padding: "6px 12px" }}>Live Monitor</Btn>
      </div>
    </div>
  );
}

const NAV = [
  { key: "teacherDash", label: "My Courses"  },
  { key: "examConfig",  label: "Create Exam" },
  { key: "proctor",     label: "Proctor"      },
  { key: "analytics",  label: "Results"      },
];

function getTestStatus(test) {
  const now = new Date();
  if (new Date(test.startTime) > now) return "upcoming";
  if (new Date(test.endTime)   < now) return "closed";
  return "live";
}

export default function TeacherDash({ user, setScreen, notify, onLogout }) {
  const [classes, setClasses] = useState([]);
  const [tests,   setTests]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cls, tst] = await Promise.all([classAPI.getAll(), testAPI.getMyTests()]);
        setClasses(cls);
        setTests(tst);
      } catch (err) {
        notify("Could not load dashboard: " + err.message, "critical");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [notify]);

  const liveTests   = tests.filter(t => getTestStatus(t) === "live");
  const totalStudents = classes.reduce((s, c) => s + (c.students?.length || 0), 0);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.ink }}>
      <TopBar user={user} setScreen={setScreen} currentScreen="teacherDash" navItems={NAV} onLogout={onLogout} />

      <div style={{ flex: 1, overflow: "auto", padding: "28px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ ...serif, fontSize: 28, color: T.ghost }}>Welcome, {user?.name?.split(" ")[0] || "Teacher"}</h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
            {loading ? "Loading…" : `${classes.length} course${classes.length !== 1 ? "s" : ""} · ${liveTests.length} exam${liveTests.length !== 1 ? "s" : ""} live now · ${totalStudents} total students`}
          </p>
        </div>

        {loading ? (
          <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "60px 0" }}>Loading your courses…</div>
        ) : classes.length === 0 ? (
          <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "60px 0" }}>
            You have no classes assigned yet. Ask your admin to create a class and assign you as teacher.
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 18, marginBottom: 24 }}>
              {classes.map((c, i) => (
                <CourseCard key={c._id} course={c} index={i} onProctor={() => setScreen("proctor")} />
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
              {/* Exam list */}
              <div style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "22px" }}>
                <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: T.muted, marginBottom: 18 }}>
                  My Exams
                </div>
                {tests.length === 0 ? (
                  <div style={{ color: T.muted, fontSize: 13, padding: "16px 0" }}>No exams created yet.</div>
                ) : (
                  tests.map(ex => {
                    const status = getTestStatus(ex);
                    return (
                      <div key={ex._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${T.ink3}` }}>
                        <LiveDot color={status === "live" ? T.mint : status === "upcoming" ? T.amber : T.ink4} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: T.ghost }}>{ex.name}</div>
                          <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>
                            {ex.classId?.classId || "—"} · {ex.questions?.length || 0} Qs · {ex.duration}min
                          </div>
                        </div>
                        <Badge
                          color={status === "live" ? T.mint : status === "upcoming" ? T.amber : T.muted}
                          bg={T.ink3}
                          style={{ fontSize: 9 }}>
                          {status.toUpperCase()}
                        </Badge>
                        <Btn variant="ghost" onClick={() => setScreen(status === "live" ? "proctor" : "examConfig")} style={{ padding: "5px 12px", fontSize: 11 }}>
                          {status === "live" ? "Monitor" : "View"}
                        </Btn>
                      </div>
                    );
                  })
                )}
                <Btn variant="primary" onClick={() => setScreen("examConfig")} style={{ marginTop: 16, width: "100%", justifyContent: "center" }}>
                  + Create New Exam
                </Btn>
              </div>

              {/* Quick stats */}
              <div style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "22px" }}>
                <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: T.muted, marginBottom: 16 }}>
                  Quick Stats
                </div>
                {[
                  ["Total Courses",  classes.length],
                  ["Total Students", totalStudents],
                  ["Exams Created",  tests.length],
                  ["Live Now",       liveTests.length],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.ink3}` }}>
                    <span style={{ fontSize: 12, color: T.muted }}>{l}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: T.ghost }}>{v}</span>
                  </div>
                ))}
                <Btn variant="mint" onClick={() => setScreen("analytics")} style={{ marginTop: 16, width: "100%", justifyContent: "center" }}>
                  View Results
                </Btn>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
