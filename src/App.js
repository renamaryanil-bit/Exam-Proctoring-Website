import { useState, useCallback } from "react";
import { T } from "./data/tokens";
import { useAuth } from "./context/AuthContext";

import LoginScreen      from "./components/screens/LoginScreen";
import AdminDash        from "./components/screens/AdminDash";
import TeacherDash      from "./components/screens/TeacherDash";
import StudentDash      from "./components/screens/StudentDash";
import PreCheck         from "./components/screens/PreCheck";
import ExamScreen       from "./components/screens/ExamScreen";
import AnalyticsScreen  from "./components/screens/AnalyticsScreen";
import ProctorScreen    from "./components/screens/ProctorScreen";
import CoursesScreen    from "./components/screens/CoursesScreen";
import ExamConfigScreen from "./components/screens/ExamConfigScreen";
import GradingScreen    from "./components/screens/GradingScreen";
import ProfileScreen    from "./components/screens/ProfileScreen";
import SettingsScreen   from "./components/screens/SettingsScreen";

export default function App() {
  const { user, logout } = useAuth();

  const [screen, setScreen]           = useState("login");
  const [notification, setNotification] = useState(null);
  const [examResults, setExamResults]   = useState(null);
  const [activeTest, setActiveTest]     = useState(null); // real Test object from API

  const notify = useCallback((msg, type = "warn") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  const handleLogin = useCallback((loggedInUser) => {
    const role = loggedInUser.role;
    setScreen(
      role === "student" ? "studentDash" :
      role === "teacher" ? "teacherDash" :
      "adminDash"
    );
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setScreen("login");
    setNotification(null);
    setActiveTest(null);
    setExamResults(null);
  }, [logout]);

  // Called when student picks an exam and passes pre-check
  const startExam = useCallback((test) => {
    setActiveTest(test);
    setScreen("precheck");
  }, []);

  const screens = {
    login:       <LoginScreen      onLogin={handleLogin} />,
    adminDash:   <AdminDash        user={user} setScreen={setScreen} notify={notify} onLogout={handleLogout} />,
    teacherDash: <TeacherDash      user={user} setScreen={setScreen} notify={notify} onLogout={handleLogout} />,
    studentDash: <StudentDash      user={user} onStart={startExam}   setScreen={setScreen} onLogout={handleLogout} />,
    precheck:    <PreCheck         onEnter={() => setScreen("exam")}  onBack={() => setScreen("studentDash")} />,
    exam:        <ExamScreen       user={user} test={activeTest}
                                   onSubmit={(results) => { setExamResults(results); setScreen("analytics"); }}
                                   notify={notify} setScreen={setScreen} />,
    analytics:   <AnalyticsScreen  user={user} setScreen={setScreen} examResults={examResults} />,
    proctor:     <ProctorScreen    user={user} setScreen={setScreen} />,
    courses:     <CoursesScreen    user={user} setScreen={setScreen} notify={notify} onLogout={handleLogout} />,
    examConfig:  <ExamConfigScreen user={user} setScreen={setScreen} notify={notify} />,
    grading:     <GradingScreen    user={user} setScreen={setScreen} notify={notify} />,
    profile:     <ProfileScreen    user={user} setScreen={setScreen} />,
    settings:    <SettingsScreen   user={user} setScreen={setScreen} />,
  };

  // Redirect to login if no user and not on login screen
  const activeScreen = (!user && screen !== "login") ? "login" : screen;

  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden", position: "relative" }}>
      {screens[activeScreen] ?? screens.login}

      {notification && (
        <div className="fade-in" style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          padding: "12px 18px", borderRadius: 12, maxWidth: 340,
          background: notification.type === "critical" ? T.pinkLight : T.amberLight,
          border: `1px solid ${notification.type === "critical" ? T.pink + "50" : T.amber + "50"}`,
          color: notification.type === "critical" ? T.pink : "#b07a10",
          fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}>
          <span>{notification.type === "critical" ? "🚨" : "⚠️"}</span>
          {notification.msg}
        </div>
      )}
    </div>
  );
}
