"use client";
import { useState, useRef } from "react";

/* ─── STYLES ─────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --ink:#1c1510;--ink2:#3a2e26;--mist:#f7f3ee;--parch:#f0e8d8;--warm:#e8dcc8;
    --sage:#6b8f71;--sage-lt:#c2d4c4;--rose:#c2796a;--rose-lt:#f0d4ce;
    --gold:#b8863c;--gold-lt:#f0e0c0;
    --fd:'Cormorant Garamond',Georgia,serif;--fb:'Outfit',system-ui,sans-serif;
  }
  body{font-family:var(--fb);background:var(--mist);color:var(--ink);-webkit-font-smoothing:antialiased}
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  .fu{animation:fadeUp .6s ease both}.fu1{animation:fadeUp .6s .1s ease both}
  .fu2{animation:fadeUp .6s .2s ease both}.fu3{animation:fadeUp .6s .35s ease both}
  .fi{animation:fadeIn .4s ease both}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 28px;border-radius:100px;border:none;cursor:pointer;font-family:var(--fb);font-size:14px;font-weight:500;letter-spacing:.02em;transition:all .2s;white-space:nowrap}
  .btn:disabled{opacity:.35;cursor:not-allowed;transform:none!important}
  .btn-d{background:var(--ink);color:var(--mist)}.btn-d:hover{background:var(--ink2);transform:translateY(-1px);box-shadow:0 8px 24px rgba(28,21,16,.2)}
  .btn-l{background:transparent;color:var(--ink);border:1.5px solid rgba(28,21,16,.2)}.btn-l:hover{border-color:var(--ink);background:rgba(28,21,16,.03)}
  .btn-s{background:var(--sage);color:#fff}.btn-s:hover{background:#5a7d60;transform:translateY(-1px)}
  .btn-g{background:var(--gold);color:#fff}.btn-g:hover{background:#9a6e28;transform:translateY(-1px)}
  .card{background:#fff;border:1px solid rgba(28,21,16,.08);border-radius:18px;transition:transform .22s,box-shadow .22s}
  .card-hover:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(28,21,16,.10)}
  .inp{width:100%;padding:12px 15px;border:1.5px solid rgba(28,21,16,.14);border-radius:11px;font-family:var(--fb);font-size:14px;color:var(--ink);background:#fff;transition:border-color .2s;outline:none;resize:vertical}
  .inp:focus{border-color:var(--sage)}
  .chip{padding:8px 17px;border-radius:100px;cursor:pointer;border:1.5px solid rgba(28,21,16,.14);font-family:var(--fb);font-size:13px;background:transparent;color:var(--ink);transition:all .18s}
  .chip:hover{border-color:var(--ink);background:rgba(28,21,16,.03)}
  .chip.on{background:var(--ink);color:#fff;border-color:var(--ink)}
  .dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--sage);animation:pulse 1.2s ease-in-out infinite}
  .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
  .prose{font-size:15px;line-height:1.8;color:var(--ink2)}
  .prose h3{font-family:var(--fd);font-size:21px;font-weight:500;color:var(--ink);margin:18px 0 7px}
  .prose strong{color:var(--ink);font-weight:600}
  .pill{display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
  /* Modal */
  .modal-bg{position:fixed;inset:0;background:rgba(28,21,16,.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);animation:fadeIn .2s ease}
  .modal{background:#fff;border-radius:24px;padding:40px;max-width:460px;width:100%;animation:scaleIn .25s ease;position:relative}
  /* Toast */
  .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--mist);padding:12px 24px;border-radius:100px;font-size:14px;font-weight:500;z-index:300;animation:fadeUp .3s ease}
`;

/* ─── CLAUDE API ─────────────────────────────────────────────── */
async function callClaude({ system, prompt, imgB64, imgMime }) {
  const content = [];
  if (imgB64) content.push({ type: "image", source: { type: "base64", media_type: imgMime, data: imgB64 } });
  content.push({ type: "text", text: prompt });
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1800, system, messages: [{ role: "user", content }] }),
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error.message);
  return d.content.map(b => b.text || "").join("");
}

/* ─── FILE HOOK ──────────────────────────────────────────────── */
function useFile() {
  const [img, setImg] = useState(null);
  const ref = useRef(null);
  const load = (file) => {
    if (!file?.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = e => {
      const [h, b64] = e.target.result.split(",");
      setImg({ url: e.target.result, b64, mime: h.split(":")[1].split(";")[0], name: file.name });
    };
    r.readAsDataURL(file);
  };
  return { img, setImg, ref, load };
}

/* ─── TOAST ──────────────────────────────────────────────────── */
function Toast({ msg, onDone }) {
  useState(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); });
  return <div className="toast">{msg}</div>;
}

/* ─── WAITLIST MODAL ─────────────────────────────────────────── */
function WaitlistModal({ plan = "Pro", onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const submit = () => {
    if (!email.includes("@")) return;
    setDone(true);
    setTimeout(() => { onSuccess(`You're on the ${plan} waitlist! We'll email ${email} when we launch.`); onClose(); }, 1200);
  };
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#bba98a" }}>✕</button>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 26, fontWeight: 500, color: "var(--ink)" }}>You're in!</div>
            <div style={{ fontSize: 14, color: "var(--ink2)", marginTop: 8 }}>We'll be in touch soon.</div>
          </div>
        ) : (
          <>
            <div className="pill" style={{ background: "var(--sage-lt)", color: "var(--sage)", marginBottom: 16 }}>🗓 {plan} Plan</div>
            <h3 style={{ fontFamily: "var(--fd)", fontSize: 28, fontWeight: 500, marginBottom: 8 }}>Join the waitlist</h3>
            <p style={{ fontSize: 14, color: "var(--ink2)", lineHeight: 1.7, marginBottom: 24 }}>
              JournalForge is launching soon. Get early access, a launch discount, and be among the first 100 journalers to forge their perfect spread.
            </p>
            <input className="inp" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()} style={{ marginBottom: 12 }} />
            <button className="btn btn-d" style={{ width: "100%", padding: "14px" }} onClick={submit}>
              Join waitlist — free →
            </button>
            <p style={{ fontSize: 11, color: "#bba98a", textAlign: "center", marginTop: 12 }}>No spam. Just a launch email and an early-bird discount.</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── SIGN IN MODAL ──────────────────────────────────────────── */
function SignInModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const submit = () => {
    if (!email.includes("@")) return;
    setSent(true);
    setTimeout(() => { onSuccess("Magic link sent! Check your inbox."); onClose(); }, 1200);
  };
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#bba98a" }}>✕</button>
        {sent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 26 }}>Check your inbox</div>
          </div>
        ) : (
          <>
            <h3 style={{ fontFamily: "var(--fd)", fontSize: 28, fontWeight: 500, marginBottom: 8 }}>Sign in</h3>
            <p style={{ fontSize: 14, color: "var(--ink2)", marginBottom: 24, lineHeight: 1.7 }}>
              We'll send you a magic link — no password needed.
            </p>
            <input className="inp" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()} style={{ marginBottom: 12 }} />
            <button className="btn btn-d" style={{ width: "100%", padding: "14px" }} onClick={submit}>Send magic link →</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── HOW IT WORKS MODAL ─────────────────────────────────────── */
function HowItWorksModal({ onClose, onStart }) {
  const steps = [
    { icon: "🔍", title: "Diagnose", color: "var(--rose-lt)", accent: "var(--rose)", desc: "Upload a photo of your current or abandoned spread. Get an honest, specific breakdown — root causes, habit tracker verdict, and a 3-step rescue plan. Not generic. Specific to YOUR spread." },
    { icon: "🗓", title: "Forge", color: "var(--sage-lt)", accent: "var(--sage)", desc: "Answer 5 quick questions about your month, aesthetic, goals and available time. Get a complete setup plan with a capped habit list (3-5 max), layout recommendations, and a beautiful ready-to-trace page." },
    { icon: "🛍", title: "Audit", color: "var(--gold-lt)", accent: "var(--gold)", desc: "Photo your supply haul or desk. Get a 'use this, put that away' breakdown — your core kit (5 items max), what to shelve and why, and a step-by-step first page walkthrough." },
    { icon: "☀️", title: "Lightbox Mode", color: "var(--parch)", accent: "var(--ink)", desc: "Once your layout is generated, enable Lightbox Mode. Your screen goes full white with your layout overlay. Hold your notebook up to the screen and trace the design directly onto your paper." },
  ];
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: "88vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#bba98a" }}>✕</button>
        <h3 style={{ fontFamily: "var(--fd)", fontSize: 30, fontWeight: 500, marginBottom: 6 }}>How JournalForge works</h3>
        <p style={{ fontSize: 14, color: "var(--ink2)", marginBottom: 28, lineHeight: 1.7 }}>Three AI tools. One purpose: stop you from quitting.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 16, padding: "16px", background: s.color, borderRadius: 14, border: `1px solid ${s.accent}22` }}>
              <div style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-d" style={{ width: "100%", padding: "14px", fontSize: 15 }} onClick={() => { onClose(); onStart(); }}>
          Try it free →
        </button>
      </div>
    </div>
  );
}

/* ─── SHARED COMPONENTS ──────────────────────────────────────── */
function UploadZone({ img, fileHook, accent = "var(--sage)", icon = "📷", hint = "Drop a photo or click to upload" }) {
  return (
    <div onClick={() => fileHook.ref.current?.click()}
      onDrop={e => { e.preventDefault(); fileHook.load(e.dataTransfer.files[0]); }}
      onDragOver={e => e.preventDefault()}
      style={{ border: `2px dashed ${img ? accent : "rgba(28,21,16,.16)"}`, borderRadius: 14, padding: img ? 14 : "32px 20px", textAlign: "center", cursor: "pointer", background: img ? "rgba(0,0,0,.02)" : "transparent", transition: "all .2s", marginBottom: 14 }}>
      <input ref={fileHook.ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => fileHook.load(e.target.files[0])} />
      {img ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={img.url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: accent }}>✓ {img.name}</div>
            <div style={{ fontSize: 11, color: "#bba98a", marginTop: 2 }}>Click to replace</div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 32, marginBottom: 8, animation: "float 3s ease-in-out infinite" }}>{icon}</div>
          <div style={{ fontFamily: "var(--fd)", fontSize: 18, color: "var(--ink)", marginBottom: 4 }}>{hint}</div>
          <div style={{ fontSize: 12, color: "#bba98a" }}>or describe your situation below</div>
        </>
      )}
    </div>
  );
}

function ResultCard({ icon, title, text, onNext, nextLabel }) {
  const html = text.replace(/### (.+)/g, '<h3>$1</h3>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
  return (
    <div className="fi card" style={{ marginTop: 28, overflow: "hidden" }}>
      <div style={{ padding: "14px 22px", background: "var(--parch)", borderBottom: "1px solid rgba(28,21,16,.07)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontFamily: "var(--fd)", fontSize: 16, fontWeight: 500 }}>{title}</span>
      </div>
      <div style={{ padding: "22px" }}>
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      {onNext && (
        <div style={{ padding: "16px 22px", background: "var(--mist)", borderTop: "1px solid rgba(28,21,16,.06)" }}>
          <button className="btn btn-s" style={{ width: "100%" }} onClick={onNext}>{nextLabel}</button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 10 }}>{label}</label>
      {children}
    </div>
  );
}

function ErrBox({ msg }) {
  return msg ? <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "11px 15px", fontSize: 13, color: "#dc2626", margin: "14px 0" }}>{msg}</div> : null;
}

/* ─── DIAGNOSE TAB ───────────────────────────────────────────── */
function Diagnose({ goTo }) {
  const file = useFile();
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  const run = async () => {
    setLoading(true); setErr(null); setResult(null);
    try {
      const r = await callClaude({
        system: "You are a warm, expert bullet journal coach. Give SPECIFIC, actionable feedback — never generic. Use ### headers for each section.",
        prompt: `Diagnose this bullet journal situation.\n${desc ? `User said: "${desc}"` : ""}${file.img ? "\nPhoto attached." : ""}\n\nRespond with these sections:\n### What's Working\n### Why You're Struggling\n### Your 3-Step Rescue Plan\n### Habit Tracker Verdict\n(Give exact number of habits to keep, and name which ones to keep vs cut)\n### This Month's One Change\n\nBe specific. 3-5 sentences per section. Warm but direct.`,
        imgB64: file.img?.b64, imgMime: file.img?.mime,
      });
      setResult(r);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 660, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div className="pill" style={{ background: "var(--rose-lt)", color: "var(--rose)", marginBottom: 12 }}>🔍 Diagnose</div>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 34, fontWeight: 400, marginBottom: 10 }}>Why is your spread failing?</h2>
        <p style={{ fontSize: 15, color: "var(--ink2)", lineHeight: 1.7, opacity: .8 }}>Upload a spread photo or describe your situation. Get an honest diagnosis and a concrete rescue plan.</p>
      </div>
      <UploadZone img={file.img} fileHook={file} accent="var(--rose)" icon="📷" hint="Upload your spread photo" />
      <textarea className="inp" rows={3} placeholder="e.g. Set up 12 habits in January, missed 4 days in week 2, felt ashamed and stopped. The notebook sits on my shelf..." value={desc} onChange={e => setDesc(e.target.value)} style={{ marginBottom: 14, minHeight: 80 }} />
      <ErrBox msg={err} />
      <button className="btn btn-d" onClick={run} disabled={loading || (!file.img && !desc.trim())} style={{ width: "100%", padding: "14px", fontSize: 15 }}>
        {loading ? <><span className="dot" /><span className="dot" /><span className="dot" /></> : "Diagnose my journal →"}
      </button>
      {result && <ResultCard icon="🔍" title="Your Spread Diagnosis" text={result} onNext={() => goTo("forge")} nextLabel="Now set up this month with Forge →" />}
    </div>
  );
}

/* ─── FORGE TAB ──────────────────────────────────────────────── */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const VIBES  = ["Minimalist","Cottagecore","Dark Academia","Soft Pastel","Zen/Botanical"];
const TIMES  = ["5–10 min/day","15–20 min/day","30+ min/day","Weekends only"];
const GOALS  = ["Build habits","Reduce stress","Stay organized","Creative expression","Track health","Plan projects"];

function Forge() {
  const now = new Date();
  const [month, setMonth]   = useState(MONTHS[now.getMonth()]);
  const [vibe,  setVibe]    = useState("Minimalist");
  const [time,  setTime]    = useState("15–20 min/day");
  const [goals, setGoals]   = useState([]);
  const [habits, setHabits] = useState("");
  const [issues, setIssues] = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [err, setErr]         = useState(null);
  const [lightbox, setLightbox]   = useState(false);
  const [opacity, setOpacity]     = useState(75);
  const toggleGoal = g => setGoals(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]);

  const run = async () => {
    setLoading(true); setErr(null); setResult(null);
    try {
      const raw = await callClaude({
        system: "You are JournalForge AI — a bullet journal designer and habit coach. Create PERSONALIZED, achievable plans. Always cap habit lists at 3-5. Use ### headers and **bold** for key terms.",
        prompt: `Create a personalized bullet journal setup for ${month}.
Vibe: ${vibe} | Time: ${time} | Goals: ${goals.join(", ")}
Habits: ${habits || "suggest 3-5 appropriate ones"}
Past issues: ${issues || "starting fresh"}

EXACTLY this format:
### Your ${month} Setup Plan
**Theme:** 
