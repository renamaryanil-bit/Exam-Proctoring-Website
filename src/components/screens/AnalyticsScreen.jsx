import { useState, useEffect } from "react";
import { T, serif, mono } from "../../data/tokens";
import { submissionAPI } from "../../services/api";
import Badge from "../ui/Badge";
import Btn from "../ui/Btn";

const RANGES = ["0–10","11–20","21–30","31–40","41–50","51–60","61–70","71–80","81–90","91–100"];

function TeacherAnalytics({ submissions }) {
  if (!submissions || submissions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: T.muted }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 15 }}>No submissions yet. Results will appear here after students submit.</div>
      </div>
    );
  }

  const scores = submissions.map(s => s.totalScore ?? s.autoScore ?? 0);
  const classAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const stdDev = Math.sqrt(scores.reduce((a, b) => a + (b - classAvg) ** 2, 0) / scores.length);
  const highest = Math.max(...scores);
  const lowest  = Math.min(...scores);

  // Build distribution
  const dist = Array(10).fill(0);
  scores.forEach(s => {
    const bucket = Math.min(Math.floor(s / 10), 9);
    dist[bucket]++;
  });
  const maxDist = Math.max(...dist, 1);

  return (
    <div style={{ animation: "fadeIn 0.35s ease" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { l: "Class Average", v: classAvg.toFixed(1), color: T.ghost },
          { l: "Std Deviation", v: stdDev.toFixed(1),  color: T.dim   },
          { l: "Highest Score", v: highest,             color: T.mint  },
          { l: "Lowest Score",  v: lowest,              color: T.pink  },
        ].map((s, i) => (
          <div key={i} style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: s.color, marginBottom: 4 }}>{s.v}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        {/* Distribution */}
        <div style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "22px" }}>
          <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: T.muted, marginBottom: 18 }}>Score Distribution</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 100, marginBottom: 6 }}>
            {dist.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: `hsl(${220 + i * 8}, 70%, ${40 + i * 4}%)`, height: (v / maxDist * 100) + "%", minHeight: v > 0 ? 4 : 0, transition: "height 0.4s ease" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {RANGES.map(r => <div key={r} style={{ flex: 1, textAlign: "center", ...mono, fontSize: 8, color: T.ink4 }}>{r}</div>)}
          </div>
        </div>

        {/* Submissions list */}
        <div style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "22px", overflow: "auto", maxHeight: 280 }}>
          <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: T.muted, marginBottom: 12 }}>Submissions ({submissions.length})</div>
          {submissions.map((s, i) => (
            <div key={s._id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.ink3}` }}>
              <div style={{ flex: 1, fontSize: 12, color: T.ghost }}>{s.studentId?.name || "—"}</div>
              <div style={{ ...mono, fontSize: 12, color: T.ghost, fontWeight: 600 }}>{s.totalScore ?? s.autoScore ?? "—"}</div>
              <Badge color={s.status === "reviewed" ? T.mint : T.amber} bg={T.ink3} style={{ fontSize: 9 }}>
                {s.status === "reviewed" ? "Done" : "Pending"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentAnalytics({ submission, questions, answers }) {
  const score  = submission?.totalScore ?? submission?.autoScore ?? 0;
  const status = submission?.status;

  return (
    <div style={{ animation: "fadeIn 0.35s ease" }}>
      <div style={{
        background: "white", border: `1px solid ${T.paper3}`, borderRadius: 20, padding: "28px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 28,
      }}>
        <div style={{ width: 88, height: 88, borderRadius: "50%", border: `3px solid ${T.blue}`, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ ...serif, fontSize: 28, color: T.blue, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 11, color: T.muted }}>pts</div>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.ink, marginBottom: 4 }}>
            {status === "reviewed" ? "Results reviewed" : "Awaiting review"}
          </div>
          <div style={{ fontSize: 13, color: T.ink3, marginBottom: 10 }}>
            {status === "reviewed"
              ? `Total score: ${score} · Auto: ${submission?.autoScore} · Manual: ${submission?.manualScore || 0}`
              : "Your teacher will review subjective answers shortly."}
          </div>
          <Badge color={T.blue} bg={T.blueLight}>
            {status === "reviewed" ? "✓ Graded" : "⏳ Pending review"}
          </Badge>
        </div>
      </div>

      {questions && questions.length > 0 && (
        <div style={{ background: "white", border: `1px solid ${T.paper3}`, borderRadius: 16, padding: "22px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: T.ink3, marginBottom: 16 }}>
            Your Answers
          </div>
          {questions.map((q, i) => {
            const ans = answers?.[i];
            const unanswered = ans === undefined || ans === "" || (Array.isArray(ans) && ans.length === 0);
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.paper2}` }}>
                <div style={{ ...mono, fontSize: 11, color: T.muted, width: 28, flexShrink: 0 }}>Q{i + 1}</div>
                <div style={{ flex: 1, fontSize: 12, color: T.ink3 }}>
                  <div style={{ fontSize: 12, color: T.ink, marginBottom: 4 }}>{q.questionText?.slice(0, 60)}…</div>
                  <div style={{ fontSize: 11, color: T.muted }}>
                    {q.type === "subjective" ? "Subjective" : q.type === "multiple" ? "Multiple choice" : "Single choice"}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: unanswered ? T.muted : T.blue }}>
                  {unanswered ? "—" : q.type === "subjective" ? "✎" : "✓"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsScreen({ user, setScreen, examResults }) {
  const isStudent = user?.role === "student";
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(!examResults && !isStudent);

  useEffect(() => {
    if (!isStudent && !examResults) {
      submissionAPI.search("").then(setSubmissions).catch(() => {}).finally(() => setLoading(false));
    }
  }, [isStudent, examResults]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: isStudent ? T.paper : T.ink }}>
      <div style={{
        height: 56, background: isStudent ? "white" : "#0c0b18",
        borderBottom: `1px solid ${isStudent ? T.paper3 : T.ink3}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setScreen(isStudent ? "studentDash" : "adminDash")}
            style={{ background: "none", border: "none", color: isStudent ? T.ink3 : T.muted, fontSize: 13, cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif" }}>←</button>
          <div style={{ ...serif, fontSize: 18, color: isStudent ? T.ink : T.ghost }}>
            {isStudent ? "Your Results" : "Analytics"}
          </div>
        </div>
        {!isStudent && (
          <Badge color={T.blue} bg={T.blueLight}>{submissions.length} submissions</Badge>
        )}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "28px" }}>
        {isStudent ? (
          <StudentAnalytics
            submission={examResults?.submission}
            questions={examResults?.questions}
            answers={examResults?.answers}
          />
        ) : loading ? (
          <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "60px 0" }}>Loading…</div>
        ) : (
          <TeacherAnalytics submissions={submissions} />
        )}

        {isStudent && (
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <Btn variant="light-secondary" onClick={() => setScreen("studentDash")} style={{ color: T.ink2 }}>
              ← Back to Dashboard
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
