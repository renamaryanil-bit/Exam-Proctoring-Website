import { useState, useEffect } from "react";
import { T, serif, mono } from "../../data/tokens";
import { userAPI, classAPI } from "../../services/api";
import TopBar from "../ui/TopBar";
import Badge from "../ui/Badge";
import Btn from "../ui/Btn";

const NAV = [
  { key: "adminDash", label: "Overview"   },
  { key: "courses",   label: "Courses"    },
  { key: "grading",   label: "Grade"      },
  { key: "proctor",   label: "Live Exams" },
  { key: "analytics", label: "Analytics"  },
];

function StatCard({ val, label, chg, pos, color, loading }) {
  return (
    <div style={{ background: T.ink2, borderRadius: 14, padding: "18px 20px", border: `1px solid ${T.ink3}` }}>
      <div style={{ fontSize: 26, fontWeight: 600, color: color || T.ghost, marginBottom: 3 }}>
        {loading ? "—" : val}
      </div>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>{label}</div>
      {chg && <div style={{ fontSize: 11, color: pos === true ? T.mint : pos === false ? T.pink : T.muted }}>{chg}</div>}
    </div>
  );
}

export default function AdminDash({ user, setScreen, notify, onLogout }) {
  const [users,   setUsers]   = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create user form
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", name: "", role: "student" });
  const [creating, setCreating] = useState(false);

  // Create class form
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClass, setNewClass] = useState({ classId: "", name: "", teacher: "" });
  const [creatingClass, setCreatingClass] = useState(false);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [u, c, t] = await Promise.all([
          userAPI.getAll(),
          classAPI.getAll(),
          userAPI.getByRole("teacher"),
        ]);
        setUsers(u);
        setClasses(c);
        setTeachers(t);
      } catch (err) {
        notify("Failed to load dashboard data: " + err.message, "critical");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [notify]);

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.name) {
      notify("Please fill in all fields", "warn"); return;
    }
    setCreating(true);
    try {
      const res = await userAPI.create(newUser);
      setUsers(prev => [...prev, res.user]);
      if (newUser.role === "teacher") setTeachers(prev => [...prev, res.user]);
      notify("User created successfully!");
      setNewUser({ username: "", password: "", name: "", role: "student" });
      setShowCreateUser(false);
    } catch (err) {
      notify("Error: " + err.message, "critical");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await userAPI.delete(id);
      setUsers(prev => prev.filter(u => u._id !== id));
      setTeachers(prev => prev.filter(u => u._id !== id));
      notify("User deleted.");
    } catch (err) {
      notify("Error: " + err.message, "critical");
    }
  };

  const handleCreateClass = async () => {
    if (!newClass.classId || !newClass.name || !newClass.teacher) {
      notify("Please fill in all class fields", "warn"); return;
    }
    setCreatingClass(true);
    try {
      const cls = await classAPI.create(newClass);
      setClasses(prev => [...prev, cls]);
      notify("Class created successfully!");
      setNewClass({ classId: "", name: "", teacher: "" });
      setShowCreateClass(false);
    } catch (err) {
      notify("Error: " + err.message, "critical");
    } finally {
      setCreatingClass(false);
    }
  };

  const handleDeleteClass = async (id, name) => {
    if (!window.confirm(`Delete class "${name}"?`)) return;
    try {
      await classAPI.delete(id);
      setClasses(prev => prev.filter(c => c._id !== id));
      notify("Class deleted.");
    } catch (err) {
      notify("Error: " + err.message, "critical");
    }
  };

  const students  = users.filter(u => u.role === "student");
  const teacherList = users.filter(u => u.role === "teacher");
  const inputStyle = {
    flex: 1, minWidth: 140, padding: "9px 12px", borderRadius: 9,
    background: T.ink3, border: `1px solid ${T.ink4}`,
    color: T.ghost, fontSize: 13, fontFamily: "'Sora', system-ui, sans-serif",
    outline: "none",
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.ink }}>
      <TopBar user={user} setScreen={setScreen} currentScreen="adminDash" navItems={NAV} onLogout={onLogout} />

      <div style={{ flex: 1, overflow: "auto", padding: "28px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ ...serif, fontSize: 28, color: T.ghost, marginBottom: 4 }}>
            Good {new Date().getHours() < 12 ? "morning" : "day"}, {user?.name?.split(" ")[0] || "Admin"}
          </h1>
          <p style={{ fontSize: 13, color: T.muted }}>
            Platform overview · {classes.length} class{classes.length !== 1 ? "es" : ""} · {users.length} users
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          <StatCard val={students.length}    label="Total Students"  loading={loading} pos={true} />
          <StatCard val={teacherList.length} label="Teachers"        loading={loading} pos={null} color={T.blue} />
          <StatCard val={classes.length}     label="Active Classes"  loading={loading} pos={null} color={T.amber} />
          <StatCard val={users.length}       label="Total Users"     loading={loading} pos={true} />
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, marginBottom: 20 }}>

          {/* User management */}
          <div style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: T.muted }}>
                User Management
              </div>
              <Btn variant="primary" onClick={() => setShowCreateUser(!showCreateUser)} style={{ fontSize: 11, padding: "5px 12px" }}>
                + Add User
              </Btn>
            </div>

            {showCreateUser && (
              <div className="slide-in" style={{ background: T.ink3, borderRadius: 12, padding: "14px", marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: T.ghost, fontWeight: 600, marginBottom: 10 }}>New User</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <input value={newUser.name}     onChange={e => setNewUser(p => ({...p, name: e.target.value}))}     placeholder="Full name"  style={inputStyle} />
                  <input value={newUser.username}  onChange={e => setNewUser(p => ({...p, username: e.target.value}))}  placeholder="Username"   style={inputStyle} />
                  <input value={newUser.password}  onChange={e => setNewUser(p => ({...p, password: e.target.value}))}  placeholder="Password"   type="password" style={inputStyle} />
                  <select value={newUser.role}     onChange={e => setNewUser(p => ({...p, role: e.target.value}))}
                    style={{ ...inputStyle, flex: "none", width: 110 }}>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Btn variant="primary" onClick={handleCreateUser} disabled={creating} style={{ fontSize: 11, padding: "9px 14px" }}>
                    {creating ? "…" : "Create"}
                  </Btn>
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading users…</div>
            ) : users.length === 0 ? (
              <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                No users yet. Add your first user above.
              </div>
            ) : (
              <div style={{ maxHeight: 300, overflow: "auto" }}>
                {users.map(u => (
                  <div key={u._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${T.ink3}` }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      background: u.role === "admin" ? T.blue + "40" : u.role === "teacher" ? "#a855f740" : T.mint + "30",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: u.role === "admin" ? T.blue : u.role === "teacher" ? "#a855f7" : T.mint, fontWeight: 700,
                    }}>
                      {(u.name || u.username).slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: T.ghost, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                      <div style={{ ...mono, fontSize: 10, color: T.muted }}>{u.username} · {u.role}</div>
                    </div>
                    <Badge color={u.role === "admin" ? T.blue : u.role === "teacher" ? "#a855f7" : T.mint}
                           bg={u.role === "admin" ? T.blue + "18" : u.role === "teacher" ? "#a855f718" : T.mint + "18"}
                           style={{ fontSize: 9 }}>
                      {u.role}
                    </Badge>
                    <button onClick={() => handleDeleteUser(u._id, u.name)} title="Delete user"
                      style={{ background: "none", border: "none", color: T.pink, cursor: "pointer", fontSize: 14, padding: "2px 4px" }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Class management */}
          <div style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: T.muted }}>
                Classes
              </div>
              <Btn variant="ghost" onClick={() => setShowCreateClass(!showCreateClass)} style={{ fontSize: 11, padding: "5px 12px" }}>
                + Add Class
              </Btn>
            </div>

            {showCreateClass && (
              <div className="slide-in" style={{ background: T.ink3, borderRadius: 12, padding: "14px", marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: T.ghost, fontWeight: 600, marginBottom: 10 }}>New Class</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={newClass.classId} onChange={e => setNewClass(p => ({...p, classId: e.target.value}))} placeholder="Class code (e.g. CS301)" style={{...inputStyle, flex: 1}} />
                    <input value={newClass.name}    onChange={e => setNewClass(p => ({...p, name: e.target.value}))}    placeholder="Class name" style={{...inputStyle, flex: 2}} />
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select value={newClass.teacher} onChange={e => setNewClass(p => ({...p, teacher: e.target.value}))}
                      style={{...inputStyle, flex: 1}}>
                      <option value="">— Assign teacher —</option>
                      {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.username})</option>)}
                    </select>
                    <Btn variant="primary" onClick={handleCreateClass} disabled={creatingClass} style={{ fontSize: 11, padding: "9px 14px" }}>
                      {creatingClass ? "…" : "Create"}
                    </Btn>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading classes…</div>
            ) : classes.length === 0 ? (
              <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                No classes yet. Create one above.
              </div>
            ) : (
              <div style={{ maxHeight: 300, overflow: "auto" }}>
                {classes.map(c => (
                  <div key={c._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${T.ink3}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...mono, fontSize: 10, color: T.blue, marginBottom: 2 }}>{c.classId}</div>
                      <div style={{ fontSize: 13, color: T.ghost, fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{c.teacher?.name || "No teacher"} · {c.students?.length || 0} students</div>
                    </div>
                    <Btn variant="ghost" onClick={() => setScreen("courses")} style={{ fontSize: 10, padding: "4px 10px" }}>Manage</Btn>
                    <button onClick={() => handleDeleteClass(c._id, c.name)} title="Delete class"
                      style={{ background: "none", border: "none", color: T.pink, cursor: "pointer", fontSize: 14 }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
