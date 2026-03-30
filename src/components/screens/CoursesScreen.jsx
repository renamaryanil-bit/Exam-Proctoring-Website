import { useState, useEffect } from "react";
import { T, serif, mono } from "../../data/tokens";
import { classAPI, userAPI } from "../../services/api";
import TopBar from "../ui/TopBar";
import Btn from "../ui/Btn";
// Badge removed (unused)

const NAV = [
  { key: "adminDash", label: "Overview"   },
  { key: "courses",   label: "Courses"    },
  { key: "proctor",   label: "Live Exams" },
  { key: "analytics", label: "Analytics"  },
];

export default function CoursesScreen({ user, setScreen, notify, onLogout }) {
  const [classes,   setClasses]   = useState([]);
  const [teachers,  setTeachers]  = useState([]);
  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [newClass,  setNewClass]  = useState({ classId: "", name: "", teacher: "" });
  const [creating,  setCreating]  = useState(false);

  // Manage-students modal
  const [enrollModal, setEnrollModal] = useState(null); // class object
  const [enrollId,    setEnrollId]    = useState("");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    async function load() {
      try {
        const promises = [classAPI.getAll()];
        if (isAdmin) {
          promises.push(userAPI.getByRole("teacher"), userAPI.getByRole("student"));
        }
        const [cls, t, s] = await Promise.all(promises);
        setClasses(cls);
        if (t) setTeachers(t);
        if (s) setStudents(s);
      } catch (err) {
        notify("Could not load courses: " + err.message, "critical");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAdmin, notify]);

  const handleCreate = async () => {
    if (!newClass.classId || !newClass.name || !newClass.teacher) {
      notify("Please fill all fields.", "warn"); return;
    }
    setCreating(true);
    try {
      const cls = await classAPI.create(newClass);
      setClasses(prev => [...prev, cls]);
      notify("Class created!");
      setNewClass({ classId: "", name: "", teacher: "" });
      setShowAdd(false);
    } catch (err) {
      notify("Error: " + err.message, "critical");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove class "${name}"?`)) return;
    try {
      await classAPI.delete(id);
      setClasses(prev => prev.filter(c => c._id !== id));
      notify("Class removed.");
    } catch (err) {
      notify("Error: " + err.message, "critical");
    }
  };

  const handleEnrollStudent = async () => {
    if (!enrollId) return;
    try {
      const updated = await classAPI.manageStudents(enrollModal._id, "add", [enrollId]);
      setClasses(prev => prev.map(c => c._id === updated._id ? updated : c));
      setEnrollModal(updated);
      setEnrollId("");
      notify("Student enrolled!");
    } catch (err) {
      notify("Error: " + err.message, "critical");
    }
  };

  const handleRemoveStudent = async (classId, studentId) => {
    try {
      const updated = await classAPI.manageStudents(classId, "remove", [studentId]);
      setClasses(prev => prev.map(c => c._id === updated._id ? updated : c));
      setEnrollModal(updated);
      notify("Student removed.");
    } catch (err) {
      notify("Error: " + err.message, "critical");
    }
  };

  const inputStyle = {
    flex: 1, minWidth: 140, padding: "10px 14px", borderRadius: 10,
    background: T.ink3, border: `1px solid ${T.ink4}`,
    color: T.ghost, fontSize: 13, fontFamily: "'Sora', system-ui, sans-serif", outline: "none",
  };

  const totalStudents = classes.reduce((s, c) => s + (c.students?.length || 0), 0);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.ink }}>
      <TopBar user={user} setScreen={setScreen} currentScreen="courses" navItems={NAV} onLogout={onLogout} />

      <div style={{ flex: 1, overflow: "auto", padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ ...serif, fontSize: 28, color: T.ghost }}>Courses</h1>
            <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
              {loading ? "Loading…" : `${classes.length} active class${classes.length !== 1 ? "es" : ""} · ${totalStudents} total students`}
            </p>
          </div>
          {isAdmin && <Btn variant="primary" onClick={() => setShowAdd(!showAdd)}>+ Add Course</Btn>}
        </div>

        {showAdd && isAdmin && (
          <div className="slide-in" style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "22px", marginBottom: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.ghost, marginBottom: 14 }}>New Course</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input value={newClass.name}    onChange={e => setNewClass(p => ({...p, name: e.target.value}))}    placeholder="Course name"           style={inputStyle} />
              <input value={newClass.classId} onChange={e => setNewClass(p => ({...p, classId: e.target.value}))} placeholder="Code (e.g. CS301)"     style={{...inputStyle, width: 160, flex: "none"}} />
              <select value={newClass.teacher} onChange={e => setNewClass(p => ({...p, teacher: e.target.value}))} style={{...inputStyle, width: 200, flex: "none"}}>
                <option value="">— Assign teacher —</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.username})</option>)}
              </select>
              <Btn variant="primary" onClick={handleCreate} disabled={creating}>{creating ? "…" : "Create"}</Btn>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "60px 0" }}>Loading courses…</div>
        ) : classes.length === 0 ? (
          <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "60px 0" }}>
            {isAdmin ? "No classes yet. Create the first one above." : "You are not assigned to any classes."}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {classes.map((c, i) => (
              <div key={c._id} style={{
                background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "22px",
                animation: "fadeIn 0.4s ease forwards", animationDelay: i * 60 + "ms", opacity: 0,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ ...mono, fontSize: 11, color: T.blue, marginBottom: 4 }}>{c.classId}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: T.ghost }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{c.teacher?.name || "Unassigned"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 600, color: T.ghost }}>{c.students?.length || 0}</div>
                    <div style={{ ...mono, fontSize: 10, color: T.muted }}>students</div>
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${T.ink3}`, paddingTop: 12 }}>
                    <Btn variant="ghost"  onClick={() => setEnrollModal(c)} style={{ fontSize: 11, padding: "6px 12px" }}>Manage Students</Btn>
                    <Btn variant="danger" onClick={() => handleDelete(c._id, c.name)} style={{ fontSize: 11, padding: "6px 12px" }}>Remove</Btn>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enroll students modal */}
      {enrollModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,14,23,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="fade-in" style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 20, padding: "28px", width: 460, maxHeight: "80vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ ...mono, fontSize: 11, color: T.blue }}>{enrollModal.classId}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: T.ghost }}>{enrollModal.name}</div>
              </div>
              <button onClick={() => setEnrollModal(null)} style={{ background: "none", border: "none", color: T.muted, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <select value={enrollId} onChange={e => setEnrollId(e.target.value)} style={{ flex: 1, ...inputStyle }}>
                <option value="">— Select student —</option>
                {students
                  .filter(s => !(enrollModal.students || []).some(es => es._id === s._id))
                  .map(s => <option key={s._id} value={s._id}>{s.name} ({s.username})</option>)}
              </select>
              <Btn variant="primary" onClick={handleEnrollStudent} style={{ fontSize: 12 }}>+ Enroll</Btn>
            </div>

            <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: T.muted, marginBottom: 10 }}>
              Enrolled Students ({enrollModal.students?.length || 0})
            </div>
            {(enrollModal.students || []).length === 0 ? (
              <div style={{ color: T.muted, fontSize: 13 }}>No students enrolled yet.</div>
            ) : (
              enrollModal.students.map(s => (
                <div key={s._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.ink3}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: T.ghost }}>{s.name}</div>
                    <div style={{ ...mono, fontSize: 10, color: T.muted }}>{s.username}</div>
                  </div>
                  <button onClick={() => handleRemoveStudent(enrollModal._id, s._id)}
                    style={{ background: "none", border: "none", color: T.pink, cursor: "pointer", fontSize: 13 }}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
