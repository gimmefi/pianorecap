<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
<title>PianoRecap</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<style>
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { margin: 0; padding: 0; background: #FAF7F1; }
  body { font-family: 'Inter', sans-serif; }
  button { font-family: inherit; }
  textarea, input, select { font-family: inherit; }
  ::selection { background: #2E4034; color: #FAF7F1; }
</style>
</head>
<body>
<div id="root"></div>
<script type="text/babel">
const { useState, useEffect, useRef } = React;

// ====== НАСТРОЙКИ — впиши сюда свои данные из Supabase после создания проекта ======
const SUPABASE_URL = "https://pfcrppwaibenjykbusyx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_I3XrsWedCINne8N4Juvrjw_eF4C5Qtm";
// URL функции генерации AI (Netlify функция, настраивается отдельно)
const GENERATE_ENDPOINT = "/.netlify/functions/generate-summary";
// ===================================================================================

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const C = {
  bg: "#FAF7F1",
  card: "#FFFFFF",
  ink: "#2B2B2E",
  muted: "#8B8680",
  accent: "#2E4034",
  accentLight: "#3F5A4B",
  border: "#E6E0D4",
  warn: "#8B4A3A",
};

function Serif({ children, size = 22, weight = 600, style = {} }) {
  return <div style={{ fontFamily: "'Newsreader', serif", fontWeight: weight, fontSize: size, color: C.ink, ...style }}>{children}</div>;
}

function Button({ children, onClick, variant = "primary", disabled, style = {} }) {
  const base = {
    padding: "13px 20px",
    borderRadius: 10,
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    transition: "opacity 0.15s",
  };
  const variants = {
    primary: { background: disabled ? C.border : C.accent, color: "#FAF7F1" },
    secondary: { background: "transparent", color: C.accent, border: `1.5px solid ${C.border}` },
    ghost: { background: "transparent", color: C.muted },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>{label}</div>}
      <input {...props} style={{
        width: "100%", padding: "12px 14px", borderRadius: 8,
        border: `1.5px solid ${C.border}`, fontSize: 15, color: C.ink, background: "#fff",
        ...(props.style || {}),
      }} />
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: "20px 0" }} />;
}

function Header({ title, onBack, onSignOut }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {onBack && (
          <div onClick={onBack} style={{ cursor: "pointer", fontSize: 20, color: C.muted }}>←</div>
        )}
        <Serif size={20}>{title}</Serif>
      </div>
      {onSignOut && (
        <div onClick={onSignOut} style={{ fontSize: 13, color: C.muted, cursor: "pointer" }}>Sign out</div>
      )}
    </div>
  );
}

// ---------- Auth ----------

function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { teacher_name: name } } });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onAuthed();
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Serif size={28} weight={700}>Piano<span style={{ color: C.accent }}>Recap</span></Serif>
          <div style={{ color: C.muted, fontSize: 14, marginTop: 8 }}>
            Finish your lesson notes in under a minute.
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
          {mode === "signup" && (
            <Input label="Your name" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
          )}
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

          {error && <div style={{ color: C.warn, fontSize: 13, marginBottom: 12 }}>{error}</div>}

          <Button onClick={submit} disabled={loading || !email || !password} style={{ width: "100%" }}>
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </Button>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.muted, cursor: "pointer" }}
               onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
            {mode === "signup" ? "Already have an account? Log in" : "New here? Create an account"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Students list ----------

function StudentsList({ teacherId, onOpenStudent, onSignOut }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("students").select("*").order("created_at", { ascending: false });
    setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 60 }}>
      <Header title="Students" onSignOut={onSignOut} />
      <div style={{ padding: "8px 24px" }}>
        <Button onClick={() => setShowAdd(true)} style={{ width: "100%", marginBottom: 20 }}>+ Add student</Button>

        {loading && <div style={{ color: C.muted, fontSize: 14 }}>Loading…</div>}
        {!loading && students.length === 0 && (
          <div style={{ color: C.muted, fontSize: 14, textAlign: "center", padding: "40px 0" }}>
            No students yet. Add your first one above.
          </div>
        )}

        {students.map(s => (
          <div key={s.id} onClick={() => onOpenStudent(s.id)} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: "16px 18px", marginBottom: 10, cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: C.ink }}>{s.name}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                {s.age_level || "—"} {s.current_piece ? `· ${s.current_piece}` : ""}
              </div>
            </div>
            <div style={{ color: C.muted }}>›</div>
          </div>
        ))}
      </div>

      {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} teacherId={teacherId} />}
    </div>
  );
}

function AddStudentModal({ onClose, onSaved, teacherId }) {
  const [name, setName] = useState("");
  const [ageLevel, setAgeLevel] = useState("");
  const [parentContact, setParentContact] = useState("");
  const [currentPiece, setCurrentPiece] = useState("");
  const [assignmentLanguage, setAssignmentLanguage] = useState("english");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase.from("students").insert({
      teacher_id: teacherId, name, age_level: ageLevel,
      parent_contact: parentContact, current_piece: currentPiece,
      assignment_language: assignmentLanguage,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(43,43,46,0.4)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 10,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.card, borderRadius: "16px 16px 0 0", padding: 24, width: "100%", maxWidth: 480,
      }}>
        <Serif size={19} style={{ marginBottom: 16 }}>Add student</Serif>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Emma Carter" />
        <Input label="Age / level" value={ageLevel} onChange={e => setAgeLevel(e.target.value)} placeholder="Age 10, intermediate" />
        <Input label="Parent contact (email)" value={parentContact} onChange={e => setParentContact(e.target.value)} placeholder="parent@example.com" />
        <Input label="Current piece" value={currentPiece} onChange={e => setCurrentPiece(e.target.value)} placeholder="Minuet in G" />
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>Assignment language (for this student)</div>
          <select value={assignmentLanguage} onChange={e => setAssignmentLanguage(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              border: `1px solid ${C.border}`, fontSize: 15, background: C.card, color: C.ink,
            }}>
            <option value="english">English</option>
            <option value="russian">Russian</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name} style={{ flex: 1 }}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Student profile ----------

function StudentProfile({ studentId, onBack, onNewLesson }) {
  const [student, setStudent] = useState(null);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("students").select("*").eq("id", studentId).single();
      setStudent(s);
      const { data: n } = await supabase.from("lesson_notes").select("*").eq("student_id", studentId).order("lesson_date", { ascending: false });
      setNotes(n || []);
    })();
  }, [studentId]);

  if (!student) return null;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 60 }}>
      <Header title={student.name} onBack={onBack} />
      <div style={{ padding: "8px 24px" }}>
        <div style={{ display: "flex", gap: 16, fontSize: 13, color: C.muted, marginBottom: 4 }}>
          <span>{student.age_level || "—"}</span>
          {student.parent_contact && <span>{student.parent_contact}</span>}
        </div>
        {student.current_piece && (
          <div style={{ fontSize: 14, color: C.ink, marginTop: 6 }}>Currently working on: <b>{student.current_piece}</b></div>
        )}

        <Button onClick={() => onNewLesson(studentId)} style={{ width: "100%", marginTop: 20 }}>+ New lesson note</Button>

        <Divider />
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: C.muted, textTransform: "uppercase", marginBottom: 12 }}>
          Lesson history
        </div>

        {notes.length === 0 && <div style={{ color: C.muted, fontSize: 14 }}>No lessons recorded yet.</div>}

        {notes.map(n => (
          <div key={n.id} style={{ borderBottom: `1px solid ${C.border}`, padding: "14px 0" }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, fontFamily: "'IBM Plex Mono', monospace" }}>{n.lesson_date}</div>
            <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.5 }}>{n.raw_notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- New lesson note ----------

function NewLessonNote({ studentId, onBack, onGenerated }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input isn't supported in this browser. You can still type your notes.");
      return;
    }
    if (listening) {
      recognitionRef.current && recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let chunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) chunk += e.results[i][0].transcript + " ";
      setText(prev => (prev ? prev + " " : "") + chunk.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const generate = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data: student } = await supabase.from("students").select("*").eq("id", studentId).single();
      const resp = await fetch(GENERATE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawNotes: text,
          studentName: student.name,
          ageLevel: student.age_level,
          currentPiece: student.current_piece,
          assignmentLanguage: student.assignment_language || "english",
        }),
      });
      if (!resp.ok) throw new Error("Generation failed. Please try again.");
      const result = await resp.json();
      onGenerated({ studentId, rawNotes: text, ...result });
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 60 }}>
      <Header title="New lesson note" onBack={onBack} />
      <div style={{ padding: "8px 24px" }}>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
          Type or dictate what happened in the lesson. A sentence or two is enough.
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder='"Worked on measures 12–24 of Minuet in G. Left hand rhythm was uneven. Practice hands separately at 60 BPM."'
          style={{
            width: "100%", minHeight: 160, padding: 14, borderRadius: 10,
            border: `1.5px solid ${C.border}`, fontSize: 15, color: C.ink, lineHeight: 1.5, resize: "vertical",
          }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <Button variant="secondary" onClick={toggleMic} style={{ flex: 1 }}>
            {listening ? "● Stop recording" : "🎙 Dictate"}
          </Button>
        </div>

        {error && <div style={{ color: C.warn, fontSize: 13, marginTop: 12 }}>{error}</div>}

        <Button onClick={generate} disabled={loading || !text.trim()} style={{ width: "100%", marginTop: 20 }}>
          {loading ? "Generating…" : "Generate lesson summary"}
        </Button>
      </div>
    </div>
  );
}

// ---------- Result ----------

function ResultBlock({ label, text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: C.accent, textTransform: "uppercase" }}>{label}</div>
        <div onClick={copy} style={{ fontSize: 12, color: C.muted, cursor: "pointer" }}>{copied ? "Copied ✓" : "Copy"}</div>
      </div>
      <div style={{ fontSize: 14.5, color: C.ink, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{text}</div>
    </div>
  );
}

function ResultScreen({ result, onSaved, onDiscard }) {
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("lesson_notes").insert({
      student_id: result.studentId,
      teacher_id: user.id,
      raw_notes: result.rawNotes,
      assignment_text: result.assignment,
      parent_update_text: result.parentUpdate,
      teacher_note_text: result.teacherNote,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 60 }}>
      <Header title="Lesson summary" onBack={onDiscard} />
      <div style={{ padding: "8px 24px" }}>
        <ResultBlock label="Student assignment" text={result.assignment} />
        <ResultBlock label="Parent update" text={result.parentUpdate} />
        <ResultBlock label="Note for next lesson (private)" text={result.teacherNote} />

        <Button onClick={save} disabled={saving} style={{ width: "100%", marginTop: 8 }}>
          {saving ? "Saving…" : "Save to student record"}
        </Button>
      </div>
    </div>
  );
}

// ---------- App ----------

function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [view, setView] = useState("students");
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [pendingResult, setPendingResult] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  if (!session) return <AuthScreen onAuthed={() => {}} />;

  const teacherId = session.user.id;

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <div style={{ minHeight: "100vh" }}>
      {view === "students" && (
        <StudentsList
          teacherId={teacherId}
          onOpenStudent={(id) => { setActiveStudentId(id); setView("profile"); }}
          onSignOut={signOut}
        />
      )}
      {view === "profile" && (
        <StudentProfile
          studentId={activeStudentId}
          onBack={() => setView("students")}
          onNewLesson={(id) => { setActiveStudentId(id); setView("newLesson"); }}
        />
      )}
      {view === "newLesson" && (
        <NewLessonNote
          studentId={activeStudentId}
          onBack={() => setView("profile")}
          onGenerated={(result) => { setPendingResult(result); setView("result"); }}
        />
      )}
      {view === "result" && pendingResult && (
        <ResultScreen
          result={pendingResult}
          onSaved={() => { setPendingResult(null); setView("profile"); }}
          onDiscard={() => { setPendingResult(null); setView("profile"); }}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
</script>
</body>
</html>
