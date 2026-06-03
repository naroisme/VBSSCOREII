import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ============================================================
//  🟢 PASTE YOUR SUPABASE CREDENTIALS HERE
//  1. Go to https://supabase.com → your project
//  2. Settings → API
//  3. Copy "Project URL" and "anon public" key below
// ============================================================
const SUPABASE_URL = "https://rflmjoozkehxangswwze.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbG1qb296a2VoeGFuZ3N3d3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDUxMDAsImV4cCI6MjA5NjAyMTEwMH0.4Vfe4cE4v9H4XkcFAe5mBJGzP_0sagXGsc-pDTOltPE";
// ============================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const NEON_BLUE = "#00d4ff";
const NEON_PURPLE = "#b44dff";
const NEON_GREEN = "#39ff14";
const NEON_GOLD = "#ffd700";
const NEON_SILVER = "#c0c0c0";
const NEON_BRONZE = "#cd7f32";

const INITIAL_TEAMS = [
  { id: 1, name: "Dragon Squad", logo: null, color: "#00d4ff", wins: 8, losses: 2, points: 124, matchHistory: [] },
  { id: 2, name: "Phoenix Rise", logo: null, color: "#b44dff", wins: 7, losses: 3, points: 108, matchHistory: [] },
  { id: 3, name: "Storm Wolves", logo: null, color: "#ff4d6d", wins: 6, losses: 4, points: 94, matchHistory: [] },
  { id: 4, name: "Cyber Knights", logo: null, color: "#39ff14", wins: 5, losses: 5, points: 76, matchHistory: [] },
  { id: 5, name: "Shadow Foxes", logo: null, color: "#ffd700", wins: 3, losses: 7, points: 52, matchHistory: [] },
];

const CONFETTI_COLORS = ["#00d4ff", "#b44dff", "#ffd700", "#39ff14", "#ff4d6d", "#fff"];

function genId() { return Date.now() + Math.random(); }

function Confetti({ active }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    if (!active) { if (animRef.current) cancelAnimationFrame(animRef.current); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles.current = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      speed: Math.random() * 4 + 2,
      angle: Math.random() * 360,
      spin: Math.random() * 6 - 3,
      opacity: 1,
    }));
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        p.y += p.speed;
        p.angle += p.spin;
        p.opacity -= 0.004;
      });
      particles.current = particles.current.filter(p => p.opacity > 0);
      if (particles.current.length > 0) animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 9999 }} />;
}

function StarBurst({ active, pointsAdded, teamName }) {
  const audioCtxRef = useRef(null);
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState(0); 

  useEffect(() => {
    if (active) {
      setPhase(1);
      setShow(true);
      // Play crowd clap sound via Web Audio
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;
        function playClap(time, gain = 0.4) {
          const bufSize = ctx.sampleRate * 0.15;
          const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < bufSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2.5);
          }
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.value = 1200;
          filter.Q.value = 0.8;
          const gainNode = ctx.createGain();
          gainNode.gain.value = gain;
          src.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(ctx.destination);
          src.start(time);
        }
        // Crowd clap pattern: quick burst then steady rhythm
        const t = ctx.currentTime;
        [0, 0.12, 0.22, 0.30, 0.55, 0.80, 1.05, 1.30, 1.55, 1.75, 1.92, 2.10, 2.28, 2.46, 2.62].forEach((offset, i) => {
          playClap(t + offset, i < 3 ? 0.6 : 0.35);
        });

        // Fanfare beeps
        function beep(freq, startTime, duration, vol = 0.3) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.frequency.value = freq;
          osc.type = "sine";
          g.gain.setValueAtTime(vol, startTime);
          g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(startTime); osc.stop(startTime + duration);
        }
        beep(523, t + 0.05, 0.15, 0.25);
        beep(659, t + 0.20, 0.15, 0.25);
        beep(784, t + 0.35, 0.25, 0.3);
        beep(1047, t + 0.6, 0.4, 0.35);
      } catch(e) {}

      setTimeout(() => setPhase(2), 200);
      setTimeout(() => setPhase(3), 3200);
      setTimeout(() => { setShow(false); setPhase(0); }, 3800);
    }
  }, [active]);

  if (!show) return null;

  const fadeOut = phase === 3;
  const visible = phase >= 2;

  return (
    <div style={{
      position: "fixed", inset: 0,
      zIndex: 9997,
      overflow: "hidden",
      background: "#000",
      transition: "opacity 0.6s ease",
      opacity: fadeOut ? 0 : 1,
      pointerEvents: fadeOut ? "none" : "all",
    }} onClick={() => { setPhase(3); setTimeout(() => { setShow(false); setPhase(0); }, 600); }}>

      {/* Layer 1 — dark radial bg */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, #1a0e00 0%, #0a0510 50%, #000 100%)" }} />

      {/* Layer 2 — spinning rays (behind everything) */}
      {visible && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          {Array.from({length: 14}).map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              width: 3, height: "58vh",
              background: `linear-gradient(180deg, ${["#ffd700","#b44dff","#00d4ff","#39ff14","#ff9500"][i%5]}77, transparent 90%)`,
              transformOrigin: "50% 0%",
              transform: `translateX(-50%) rotate(${i * (360/14)}deg)`,
              animation: "spinRays 10s linear infinite",
              opacity: 0.4,
              borderRadius: 2,
            }} />
          ))}
        </div>
      )}

      {/* Layer 3 — soft radial glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(255,215,0,0.12) 0%, rgba(180,77,255,0.07) 35%, transparent 65%)", pointerEvents: "none", animation: visible ? "pulseGlow 1.4s ease-in-out infinite alternate" : "none" }} />

      {/* Layer 4 — floating edge emojis (corners only, never center) */}
      {visible && ["🎉","⭐","🔥","💥","✨","🎊","⚡","💫","🎯","🌟"].map((emoji, i) => {
        const positions = [
          {top:"4%",left:"3%"},{top:"6%",right:"5%"},{bottom:"6%",left:"4%"},{bottom:"5%",right:"3%"},
          {top:"18%",left:"1%"},{top:"20%",right:"2%"},{bottom:"20%",left:"2%"},{bottom:"18%",right:"1%"},
          {top:"42%",left:"1%"},{top:"42%",right:"1%"},
        ];
        return (
          <div key={i} style={{
            position: "absolute", ...positions[i],
            fontSize: `${1.6 + (i % 3) * 0.7}rem`,
            animation: `floatEmoji${i % 4} ${2 + (i % 3) * 0.6}s ease-in-out infinite`,
            animationDelay: `${i * 0.18}s`,
            filter: "drop-shadow(0 0 8px rgba(255,215,0,0.7))",
            pointerEvents: "none",
          }}>{emoji}</div>
        );
      })}

      {/* Layer 5 — all text content, fully isolated, always on top */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        zIndex: 20,
        textAlign: "center",
        padding: "0 24px",
        pointerEvents: "none",
        animation: visible ? "megaPopIn 0.5s cubic-bezier(.17,.67,.35,1.4) forwards" : "none",
        opacity: visible ? 1 : 0,
      }}>
        {/* Trophy — above rays, sized so it doesn't crush text below */}
        <div style={{
          fontSize: "clamp(60px, 13vw, 120px)", lineHeight: 1,
          filter: "drop-shadow(0 0 36px #ffd700) drop-shadow(0 0 70px #ff950088)",
          animation: visible ? "trophyBounce 0.6s cubic-bezier(.17,.67,.35,1.5) forwards" : "none",
          marginBottom: "clamp(4px, 1.5vh, 14px)",
        }}>🏆</div>

        {/* POINTS ADDED */}
        <div style={{
          fontSize: "clamp(20px, 5.5vw, 58px)", fontWeight: 900,
          background: "linear-gradient(90deg, #ffd700, #ff9500, #ffd700)",
          backgroundSize: "200%",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: "clamp(2px, 1vw, 7px)", textTransform: "uppercase",
          fontFamily: "'Orbitron', monospace",
          animation: "shimmerText 1.5s linear infinite",
          filter: "drop-shadow(0 2px 18px #ffd70066)",
          whiteSpace: "nowrap",
        }}>⚡ Points Added! ⚡</div>

        {/* Divider */}
        <div style={{ width: "clamp(100px,28vw,320px)", height: 2, background: "linear-gradient(90deg,transparent,#ffd700,#b44dff,#ffd700,transparent)", margin: "clamp(8px,1.8vh,18px) auto", opacity: 0.7 }} />

        {/* Team name */}
        {teamName && (
          <div style={{
            fontSize: "clamp(18px, 4.5vw, 50px)", fontWeight: 900,
            color: "#fff",
            textTransform: "uppercase", letterSpacing: "clamp(2px, 0.8vw, 6px)",
            textShadow: "0 0 28px #b44dff, 0 0 56px #b44dff66",
            fontFamily: "'Orbitron', monospace",
            animation: "teamNamePulse 1s ease-in-out infinite alternate",
            whiteSpace: "nowrap",
            marginBottom: "clamp(4px, 1.2vh, 12px)",
          }}>{teamName}</div>
        )}

        {/* +Points */}
        {pointsAdded !== null && pointsAdded !== undefined && (
          <div style={{
            fontSize: "clamp(56px, 18vw, 160px)", fontWeight: 900,
            color: "#39ff14",
            textShadow: "0 0 30px #39ff14, 0 0 70px #39ff1477, 0 0 140px #39ff1433",
            fontFamily: "monospace",
            lineHeight: 1,
            animation: "pointsBoom 0.4s cubic-bezier(.17,.67,.35,1.6) forwards, pointsGlow 0.9s ease-in-out infinite alternate",
            animationDelay: "0.15s, 0s",
          }}>+{pointsAdded}</div>
        )}

        <div style={{ fontSize: "clamp(11px, 2vw, 20px)", color: "#ffffff55", marginTop: "clamp(4px,1vh,10px)", letterSpacing: 5, textTransform: "uppercase", fontFamily: "monospace" }}>PTS</div>

        <div style={{ marginTop: "clamp(18px, 4vh, 36px)", fontSize: "clamp(10px, 1.5vw, 13px)", color: "#ffffff28", letterSpacing: 4, fontFamily: "monospace", textTransform: "uppercase" }}>TAP ANYWHERE TO CLOSE</div>
      </div>

      <style>{`
        @keyframes megaPopIn { from { transform: scale(0.3) rotate(-5deg); opacity: 0; } to { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes trophyBounce { 0%{transform:scale(0) rotate(-20deg)} 60%{transform:scale(1.25) rotate(5deg)} 80%{transform:scale(0.92) rotate(-2deg)} 100%{transform:scale(1) rotate(0deg)} }
        @keyframes pointsBoom { from{transform:scale(0.2);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes pointsGlow { from{text-shadow:0 0 30px #39ff14,0 0 60px #39ff1488} to{text-shadow:0 0 60px #39ff14,0 0 120px #39ff14aa,0 0 200px #39ff1444} }
        @keyframes shimmerText { 0%{background-position:0%} 100%{background-position:200%} }
        @keyframes teamNamePulse { from{text-shadow:0 0 20px #b44dff,0 0 40px #b44dff66} to{text-shadow:0 0 40px #b44dff,0 0 80px #b44dffaa,0 0 120px #b44dff44} }
        @keyframes spinRays { from{transform:translateX(-50%) rotate(0deg)} to{transform:translateX(-50%) rotate(360deg)} }
        @keyframes pulseGlow { from{transform:translate(-50%,-50%) scale(0.9);opacity:0.6} to{transform:translate(-50%,-50%) scale(1.1);opacity:1} }
        @keyframes floatEmoji0 { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-18px) rotate(5deg)} }
        @keyframes floatEmoji1 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-22px) scale(1.15)} }
        @keyframes floatEmoji2 { 0%,100%{transform:translateY(0) rotate(8deg)} 50%{transform:translateY(-14px) rotate(-8deg)} }
        @keyframes floatEmoji3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-26px) rotate(10deg)} }
      `}</style>
    </div>
  );
}

function TeamLogo({ logo, name, color, size = 44 }) {
  if (logo) return <img src={logo} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: `2px solid ${color}`, boxShadow: `0 0 10px ${color}88` }} />;
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 900, color: color, boxShadow: `0 0 12px ${color}66`, fontFamily: "monospace" }}>
      {initials}
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank === null || rank === undefined) return <span style={{ fontSize: 14, fontWeight: 700, color: "#444", fontFamily: "monospace" }}>—</span>;
  const medals = { 1: { icon: "🥇", color: NEON_GOLD, shadow: "#ffd70088" }, 2: { icon: "🥈", color: NEON_SILVER, shadow: "#c0c0c088" }, 3: { icon: "🥉", color: NEON_BRONZE, shadow: "#cd7f3288" } };
  if (medals[rank]) {
    const m = medals[rank];
    return <span style={{ fontSize: 26, filter: `drop-shadow(0 0 8px ${m.shadow})` }}>{m.icon}</span>;
  }
  return <span style={{ fontSize: 14, fontWeight: 700, color: "#888", fontFamily: "monospace" }}>#{rank}</span>;
}

function PodiumCard({ team, rank }) {
  const heights = { 1: 140, 2: 110, 3: 90 };
  const labels = { 1: "1ST PLACE", 2: "2ND PLACE", 3: "3RD PLACE" };
  const glowColors = { 1: NEON_GOLD, 2: NEON_SILVER, 3: NEON_BRONZE };
  const glow = glowColors[rank];
  const h = heights[rank];

  if (!team) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
      <div style={{ width: rank === 1 ? 72 : 56, height: rank === 1 ? 72 : 56, borderRadius: "50%", border: `2px dashed ${glow}44`, background: "#ffffff08", marginBottom: 8 }} />
      <div style={{ fontSize: 12, color: "#333", marginBottom: 4, fontStyle: "italic" }}>Empty</div>
      <div style={{ fontSize: 11, color: "#222", marginBottom: 8 }}>— PTS</div>
      <div style={{ width: "100%", height: h, background: `${glow}08`, border: `2px dashed ${glow}33`, borderBottom: "none", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: `${glow}55`, letterSpacing: 2 }}>{labels[rank]}</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, animation: `slideUp${rank} 0.6s ease forwards` }}>
      <div style={{ marginBottom: 8, position: "relative" }}>
        <TeamLogo logo={team.logo} name={team.name} color={team.color} size={rank === 1 ? 72 : 56} />
        {rank === 1 && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 20 }}>👑</div>}
      </div>
      <div style={{ fontWeight: 900, fontSize: rank === 1 ? 16 : 14, color: "#fff", textAlign: "center", marginBottom: 4, textShadow: `0 0 8px ${team.color}` }}>{team.name}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: glow, marginBottom: 8, letterSpacing: 1 }}>{team.points} PTS</div>
      <div style={{ width: "100%", height: h, background: `linear-gradient(180deg, ${glow}33 0%, ${glow}11 100%)`, border: `2px solid ${glow}`, borderBottom: "none", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 10, boxShadow: `0 0 20px ${glow}66, inset 0 0 20px ${glow}22` }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: glow, letterSpacing: 2 }}>{labels[rank]}</span>
      </div>
    </div>
  );
}

function AddEditTeamModal({ team, onSave, onClose }) {
  const [name, setName] = useState(team?.name || "");
  const [color, setColor] = useState(team?.color || "#00d4ff");
  const [logo, setLogo] = useState(team?.logo || null);

  function handleLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#0d0d1a", border: "1px solid #b44dff88", borderRadius: 16, padding: 32, width: 360, boxShadow: "0 0 40px #b44dff44" }}>
        <h2 style={{ color: NEON_PURPLE, fontWeight: 900, marginBottom: 24, fontSize: 20, letterSpacing: 2, textTransform: "uppercase" }}>{team ? "✏️ Edit Team" : "➕ New Team"}</h2>
        <label style={{ color: "#aaa", fontSize: 12, display: "block", marginBottom: 6 }}>TEAM NAME</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter team name..." style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #333", color: "#fff", fontSize: 15, marginBottom: 16, boxSizing: "border-box" }} />
        <label style={{ color: "#aaa", fontSize: 12, display: "block", marginBottom: 6 }}>TEAM COLOR</label>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 48, height: 36, borderRadius: 8, border: "none", cursor: "pointer", background: "none" }} />
          <span style={{ color: "#888", fontSize: 13 }}>{color}</span>
        </div>
        <label style={{ color: "#aaa", fontSize: 12, display: "block", marginBottom: 6 }}>TEAM LOGO / PHOTO</label>
        {logo && <img src={logo} alt="preview" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", marginBottom: 8, border: `2px solid ${color}` }} />}
        <input type="file" accept="image/*" onChange={handleLogo} style={{ color: "#aaa", fontSize: 13, marginBottom: 20 }} />
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "transparent", border: "1px solid #555", color: "#aaa", cursor: "pointer", fontWeight: 700 }}>Cancel</button>
          <button onClick={() => onSave({ name, color, logo })} disabled={!name.trim()} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "linear-gradient(135deg,#b44dff,#00d4ff)", border: "none", color: "#fff", cursor: "pointer", fontWeight: 900, fontSize: 15, opacity: name.trim() ? 1 : 0.5 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function BattleModal({ teams, onClose, onBattleComplete }) {
  const [teamA, setTeamA] = useState(teams[0]?.id || "");
  const [teamB, setTeamB] = useState(teams[1]?.id || "");
  const [winner, setWinner] = useState("");
  const [pointsA, setPointsA] = useState(10);
  const [pointsB, setPointsB] = useState(10);

  const ta = teams.find(t => t.id == teamA);
  const tb = teams.find(t => t.id == teamB);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#0d0d1a", border: "1px solid #ff4d6d88", borderRadius: 16, padding: 32, width: 420, boxShadow: "0 0 60px #ff4d6d33" }}>
        <h2 style={{ color: "#ff4d6d", fontWeight: 900, marginBottom: 24, fontSize: 22, letterSpacing: 3, textAlign: "center", textTransform: "uppercase" }}>⚔️ BATTLE MODE</h2>
        <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#aaa", fontSize: 11, display: "block", marginBottom: 4 }}>TEAM A</label>
            <select value={teamA} onChange={e => setTeamA(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #444", color: "#fff", fontSize: 14 }}>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={{ color: "#ff4d6d", fontWeight: 900, fontSize: 20, paddingTop: 16 }}>VS</div>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#aaa", fontSize: 11, display: "block", marginBottom: 4 }}>TEAM B</label>
            <select value={teamB} onChange={e => setTeamB(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #444", color: "#fff", fontSize: 14 }}>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#aaa", fontSize: 11, display: "block", marginBottom: 4 }}>POINTS (A)</label>
            <input type="number" value={pointsA} onChange={e => setPointsA(Number(e.target.value))} min={0} style={{ width: "100%", padding: "8px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #444", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#aaa", fontSize: 11, display: "block", marginBottom: 4 }}>POINTS (B)</label>
            <input type="number" value={pointsB} onChange={e => setPointsB(Number(e.target.value))} min={0} style={{ width: "100%", padding: "8px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #444", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
          </div>
        </div>
        <label style={{ color: "#aaa", fontSize: 11, display: "block", marginBottom: 6 }}>DECLARE WINNER</label>
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {[teamA, teamB].map(tid => {
            const t = teams.find(x => x.id == tid);
            if (!t) return null;
            return (
              <button key={tid} onClick={() => setWinner(tid)} style={{ flex: 1, padding: "10px", borderRadius: 8, background: winner == tid ? `${t.color}33` : "transparent", border: `2px solid ${winner == tid ? t.color : "#444"}`, color: winner == tid ? t.color : "#888", cursor: "pointer", fontWeight: 700, transition: "all 0.2s", boxShadow: winner == tid ? `0 0 12px ${t.color}66` : "none" }}>
                {t.name}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "transparent", border: "1px solid #555", color: "#aaa", cursor: "pointer", fontWeight: 700 }}>Cancel</button>
          <button onClick={() => onBattleComplete({ teamA: Number(teamA), teamB: Number(teamB), winner: Number(winner), pointsA, pointsB })} disabled={!winner || teamA == teamB} style={{ flex: 2, padding: "10px", borderRadius: 8, background: "linear-gradient(135deg,#ff4d6d,#b44dff)", border: "none", color: "#fff", cursor: "pointer", fontWeight: 900, opacity: (!winner || teamA == teamB) ? 0.4 : 1 }}>⚔️ Record Battle</button>
        </div>
      </div>
    </div>
  );
}

export default function EsportsLeaderboard() {
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [showBattle, setShowBattle] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [starBurst, setStarBurst] = useState(false);
  const [pointsAdded, setPointsAdded] = useState(null);
  const [celebratedTeam, setCelebratedTeam] = useState(null);
  const [customPoints, setCustomPoints] = useState({});
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("leaderboard");
  const [matchLog, setMatchLog] = useState([]);
  const [highlightId, setHighlightId] = useState(null);
  const [showTimerSetup, setShowTimerSetup] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerInput, setTimerInput] = useState({ m: "5", s: "00" });
  const [timerExpired, setTimerExpired] = useState(false);
  const timerRef = useRef(null);

  const loadedRef = useRef(false);

  // 🟢 Load data from Supabase on mount
  useEffect(() => {
    async function loadData() {
      const { data: teamsRow } = await supabase
        .from("leaderboard").select("value").eq("key", "teams").single();
      if (teamsRow?.value?.length) setTeams(teamsRow.value);

      const { data: matchRow } = await supabase
        .from("leaderboard").select("value").eq("key", "matches").single();
      if (matchRow?.value?.length) setMatchLog(matchRow.value);

      loadedRef.current = true;
    }
    loadData();

    // 🟢 Live sync — any change from any device updates everyone
    const channel = supabase.channel("leaderboard-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leaderboard" },
        (payload) => {
          if (payload.new.key === "teams") setTeams(payload.new.value);
          if (payload.new.key === "matches") setMatchLog(payload.new.value);
        }
      ).subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // 🟢 Save teams to Supabase — only AFTER initial load
  useEffect(() => {
    if (!loadedRef.current) return;
    supabase.from("leaderboard")
      .update({ value: teams }).eq("key", "teams").then(() => {});
  }, [teams]);

  useEffect(() => {
    if (!loadedRef.current) return;
    supabase.from("leaderboard")
      .update({ value: matchLog }).eq("key", "matches").then(() => {});
  }, [matchLog]);

  const sorted = (() => {
    const filtered = [...teams].filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    const hasPoints = filtered.filter(t => t.points > 0 || t.wins > 0).sort((a, b) => b.points - a.points || b.wins - a.wins);
    const noPoints = filtered.filter(t => t.points === 0 && t.wins === 0);
    return [...hasPoints, ...noPoints];
  })();
  const top3 = [...teams].filter(t => t.points > 0 || t.wins > 0).sort((a, b) => b.points - a.points || b.wins - a.wins).slice(0, 3);

  function playScoreSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6 — triumphant chord arpeggio
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.4);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.4);
      });
    } catch {}
  }

  function celebrate(delta, teamName) {
    setPointsAdded(delta);
    setCelebratedTeam(teamName || null);
    setConfetti(true);
    setStarBurst(true);
    playScoreSound();
    setTimeout(() => setStarBurst(false), 3900);
    setTimeout(() => setConfetti(false), 5000);
  }

  function adjustPoints(id, delta) {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, points: Math.max(0, t.points + delta) } : t));
    if (delta > 0) {
      const team = teams.find(t => t.id === id);
      setHighlightId(id);
      celebrate(delta, team?.name);
      setTimeout(() => setHighlightId(null), 2000);
    }
  }

  function startTimer() {
    const total = (parseInt(timerInput.m) || 0) * 60 + (parseInt(timerInput.s) || 0);
    if (total <= 0) return;
    setTimerSeconds(total);
    setTimerExpired(false);
    setShowTimerSetup(false);
    setTimerRunning(true);
    clearInterval(timerRef.current);
    let remaining = total;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimerSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setTimerRunning(false);
        setTimerExpired(true);
        playTimeoutSound();
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerRef.current);
    setTimerRunning(false);
  }

  function resetTimer() {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerExpired(false);
    setTimerSeconds(0);
  }

  function playTimeoutSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      function beep(freq, start, dur, vol = 0.4, type = "square") {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(vol, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(start); o.stop(start + dur);
      }
      const t = ctx.currentTime;
      // Three loud alarm buzzes
      beep(220, t, 0.3, 0.5, "sawtooth");
      beep(220, t + 0.35, 0.3, 0.5, "sawtooth");
      beep(220, t + 0.70, 0.5, 0.5, "sawtooth");
      // Rising siren tone
      const siren = ctx.createOscillator();
      const sirenGain = ctx.createGain();
      siren.type = "sine";
      siren.frequency.setValueAtTime(300, t + 1.3);
      siren.frequency.linearRampToValueAtTime(900, t + 1.9);
      siren.frequency.linearRampToValueAtTime(300, t + 2.5);
      siren.frequency.linearRampToValueAtTime(900, t + 3.1);
      sirenGain.gain.setValueAtTime(0.4, t + 1.3);
      sirenGain.gain.exponentialRampToValueAtTime(0.001, t + 3.2);
      siren.connect(sirenGain); sirenGain.connect(ctx.destination);
      siren.start(t + 1.3); siren.stop(t + 3.3);
    } catch(e) {}
  }

  function handleAddTeam(data) {
    const newTeam = { id: genId(), name: data.name, logo: data.logo, color: data.color, wins: 0, losses: 0, points: 0, matchHistory: [] };
    setTeams(prev => [...prev, newTeam]);
    setShowAddModal(false);
  }

  function handleEditTeam(data) {
    setTeams(prev => prev.map(t => t.id === editTeam.id ? { ...t, ...data } : t));
    setEditTeam(null);
  }

  function handleDeleteTeam(id) {
    setTeams(prev => prev.filter(t => t.id !== id));
  }

  function handleBattle({ teamA, teamB, winner, pointsA, pointsB }) {
    setTeams(prev => prev.map(t => {
      if (t.id === teamA) return { ...t, points: t.points + pointsA, wins: winner === teamA ? t.wins + 1 : t.wins, losses: winner !== teamA ? t.losses + 1 : t.losses };
      if (t.id === teamB) return { ...t, points: t.points + pointsB, wins: winner === teamB ? t.wins + 1 : t.wins, losses: winner !== teamB ? t.losses + 1 : t.losses };
      return t;
    }));
    const ta = teams.find(t => t.id === teamA);
    const tb = teams.find(t => t.id === teamB);
    const winTeam = teams.find(t => t.id === winner);
    setMatchLog(prev => [{ id: genId(), date: new Date().toLocaleString(), teamA: ta?.name, teamB: tb?.name, winner: winTeam?.name, pointsA, pointsB }, ...prev]);
    setShowBattle(false);
    celebrate(Math.max(pointsA, pointsB), winTeam?.name);
  }

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #050510; }
    @keyframes popIn { from { transform: scale(0) rotate(-10deg); opacity: 0; } to { transform: scale(1) rotate(0deg); opacity: 1; } }
    @keyframes slideUp1 { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes slideUp2 { from { transform: translateY(80px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes slideUp3 { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
    @keyframes glow { 0%,100% { box-shadow: 0 0 20px #00d4ff44; } 50% { box-shadow: 0 0 40px #00d4ff88; } }
    @keyframes highlight { 0% { background: #ffd70033; } 100% { background: transparent; } }
    @keyframes scanline { 0% { background-position: 0 0; } 100% { background-position: 0 4px; } }
    @keyframes neonPulse { 0%,100% { text-shadow: 0 0 8px currentColor; } 50% { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor; } }
  `;

  return (
    <div style={{ fontFamily: "'Exo 2', sans-serif", background: "#050510", minHeight: "100vh", color: "#fff", position: "relative", overflow: "hidden" }}>
      <style>{styles}</style>
      <Confetti active={confetti} />
      <StarBurst active={starBurst} pointsAdded={pointsAdded} teamName={celebratedTeam} />

      {/* Background grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }} />

      {/* Header */}
      <header style={{ position: "relative", zIndex: 10, background: "linear-gradient(180deg,rgba(13,13,26,0.98) 0%,rgba(13,13,26,0.9) 100%)", borderBottom: "1px solid #00d4ff33", padding: "0 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 28 }}></div>
            <div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: 20, background: `linear-gradient(90deg,${NEON_BLUE},${NEON_PURPLE})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>JESUS IS THE LIFE OF THE WORLD</div>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 3, textTransform: "uppercase" }}>Team Leaderboard</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: NEON_GREEN, boxShadow: `0 0 8px ${NEON_GREEN}`, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: NEON_GREEN, letterSpacing: 1 }}>LIVE</span>
            <button onClick={() => setShowAdmin(!showAdmin)} style={{ marginLeft: 12, padding: "8px 18px", borderRadius: 8, background: showAdmin ? "linear-gradient(135deg,#b44dff,#00d4ff)" : "transparent", border: "1px solid #b44dff", color: showAdmin ? "#fff" : NEON_PURPLE, cursor: "pointer", fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
              {showAdmin ? "🔒 ADMIN" : "🔑 ADMIN"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 4, paddingBottom: 0 }}>
          {[["leaderboard","🏆 LEADERBOARD"],["history","📋 MATCH HISTORY"]].map(([k,label]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: "10px 20px", background: "transparent", border: "none", borderBottom: tab===k ? `2px solid ${NEON_BLUE}` : "2px solid transparent", color: tab===k ? NEON_BLUE : "#666", cursor: "pointer", fontWeight: 700, fontSize: 12, letterSpacing: 2, transition: "all 0.2s", fontFamily: "'Exo 2',sans-serif" }}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px", position: "relative", zIndex: 5 }}>

        {tab === "leaderboard" && <>

          {/* Podium */}
          {top3.length >= 1 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, letterSpacing: 4, color: "#555", textTransform: "uppercase" }}>CURRENT CHAMPIONS</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 0, maxWidth: 560, margin: "0 auto" }}>
                <PodiumCard team={top3[1] || null} rank={2} />
                <PodiumCard team={top3[0] || null} rank={1} />
                <PodiumCard team={top3[2] || null} rank={3} />
              </div>
            </div>
          )}

          {/* Search + Admin controls */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555", fontSize: 16 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams..." style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: 10, background: "#0d0d1a", border: "1px solid #1a1a3a", color: "#fff", fontSize: 14, outline: "none" }} />
            </div>
            {showAdmin && (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowAddModal(true)} style={{ padding: "10px 18px", borderRadius: 10, background: "linear-gradient(135deg,#00d4ff,#0088aa)", border: "none", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>+ ADD TEAM</button>
                <button onClick={() => setShowBattle(true)} style={{ padding: "10px 18px", borderRadius: 10, background: "linear-gradient(135deg,#ff4d6d,#b44dff)", border: "none", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>⚔️ BATTLE</button>
                <button onClick={() => timerRunning ? stopTimer() : setShowTimerSetup(true)} style={{ padding: "10px 18px", borderRadius: 10, background: timerRunning ? "linear-gradient(135deg,#ff9500,#ff4d00)" : "linear-gradient(135deg,#39ff14,#00aa44)", border: "none", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 13, letterSpacing: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  {timerRunning ? "⏸ STOP" : "⏱ TIMER"}
                </button>
                {timerSeconds > 0 && !timerRunning && !timerExpired && (
                  <button onClick={resetTimer} style={{ padding: "10px 14px", borderRadius: 10, background: "#1a1a3a", border: "1px solid #333", color: "#888", cursor: "pointer", fontWeight: 800, fontSize: 13 }}>✕</button>
                )}
              </div>
            )}
          </div>

          {/* Leaderboard Table */}
          <div style={{ background: "rgba(13,13,26,0.95)", border: "1px solid #1a1a3a", borderRadius: 16, overflow: "hidden", boxShadow: "0 0 40px rgba(0,212,255,0.05)" }}>
            {/* Table Header */}
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 80px 80px 100px", padding: "12px 20px", borderBottom: "1px solid #1a1a3a", background: "rgba(0,212,255,0.04)" }}>
              {["RANK","TEAM","PLAYED","WINS","LOSSES","POINTS"].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 800, color: "#555", letterSpacing: 2, textAlign: h === "TEAM" ? "left" : "center" }}>{h}</div>
              ))}
            </div>

            {sorted.map((team, i) => {
              const rankedTeams = [...teams].filter(t => t.points > 0 || t.wins > 0).sort((a,b) => b.points-a.points||b.wins-a.wins);
              const globalRank = (team.points > 0 || team.wins > 0) ? rankedTeams.findIndex(t => t.id===team.id)+1 : null;
              const isHighlit = highlightId === team.id;
              return (
                <div key={team.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 80px 80px 100px", padding: "14px 20px", borderBottom: "1px solid #0d0d1a", alignItems: "center", background: isHighlit ? "#ffd70011" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", transition: "background 0.3s", animation: isHighlit ? "highlight 2s ease" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "center" }}><RankBadge rank={globalRank} /></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <TeamLogo logo={team.logo} name={team.name} color={team.color} size={40} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{team.name}</div>
                      <div style={{ fontSize: 11, color: "#555", letterSpacing: 1 }}>TEAM</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "center", fontWeight: 700, color: "#888" }}>{team.wins + team.losses}</div>
                  <div style={{ textAlign: "center", fontWeight: 700, color: NEON_GREEN }}>{team.wins}</div>
                  <div style={{ textAlign: "center", fontWeight: 700, color: "#ff4d6d" }}>{team.losses}</div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: 18, color: team.color, textShadow: `0 0 10px ${team.color}88` }}>{team.points}</div>
                    {showAdmin && (
                      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                        <button key="minus100" onClick={() => adjustPoints(team.id, -100)} style={{ padding: "2px 6px", borderRadius: 4, background: "#ff4d6d22", border: "1px solid #ff4d6d44", color: "#ff4d6d", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>-100</button>
                        <button key="plus100" onClick={() => adjustPoints(team.id, 100)} style={{ padding: "2px 6px", borderRadius: 4, background: "#00d4ff22", border: "1px solid #00d4ff44", color: NEON_BLUE, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>+100</button>
                        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                          <input
                            type="number"
                            min={1}
                            placeholder="pts"
                            value={customPoints[team.id] || ""}
                            onChange={e => setCustomPoints(prev => ({ ...prev, [team.id]: e.target.value }))}
                            style={{ width: 46, padding: "2px 4px", borderRadius: 4, background: "#1a1a2e", border: "1px solid #b44dff44", color: "#fff", fontSize: 11, textAlign: "center", outline: "none" }}
                          />
                          <button
                            onClick={() => {
                              const val = parseInt(customPoints[team.id]);
                              if (!isNaN(val) && val !== 0) {
                                adjustPoints(team.id, val);
                                setCustomPoints(prev => ({ ...prev, [team.id]: "" }));
                              }
                            }}
                            style={{ padding: "2px 7px", borderRadius: 4, background: "#b44dff22", border: "1px solid #b44dff66", color: "#b44dff", cursor: "pointer", fontSize: 13, fontWeight: 900, lineHeight: 1 }}
                            title="Add custom points"
                          >+</button>
                        </div>
                      </div>
                    )}
                  </div>
                  {showAdmin && (
                    <div style={{ gridColumn: "span 0", position: "absolute", right: 20 }}>
                    </div>
                  )}
                </div>
              );
            })}

            {sorted.length === 0 && (
              <div style={{ padding: "48px 20px", textAlign: "center", color: "#555" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div>No teams found</div>
              </div>
            )}
          </div>

          {/* Admin Team Management */}
          {showAdmin && (
            <div style={{ marginTop: 32 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, letterSpacing: 3, color: NEON_PURPLE, marginBottom: 16, textTransform: "uppercase" }}>⚙️ Team Management</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                {teams.map(team => (
                  <div key={team.id} style={{ background: "#0d0d1a", border: `1px solid ${team.color}44`, borderRadius: 12, padding: "16px", display: "flex", alignItems: "center", gap: 12, boxShadow: `0 0 10px ${team.color}11` }}>
                    <TeamLogo logo={team.logo} name={team.name} color={team.color} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{team.name}</div>
                      <div style={{ fontSize: 12, color: team.color }}>{team.points} pts</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setEditTeam(team)} style={{ padding: "6px 10px", borderRadius: 6, background: "transparent", border: "1px solid #555", color: "#aaa", cursor: "pointer", fontSize: 12 }}>✏️</button>
                      <button onClick={() => handleDeleteTeam(team.id)} style={{ padding: "6px 10px", borderRadius: 6, background: "transparent", border: "1px solid #ff4d6d44", color: "#ff4d6d", cursor: "pointer", fontSize: 12 }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>}

        {tab === "history" && (
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, letterSpacing: 3, color: NEON_BLUE, marginBottom: 20, textTransform: "uppercase" }}>📋 Match History</div>
            {matchLog.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚔️</div>
                <div style={{ fontSize: 16 }}>No battles recorded yet</div>
                <div style={{ fontSize: 13, marginTop: 8, color: "#444" }}>Use Battle Mode to record matches</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {matchLog.map(m => (
                  <div key={m.id} style={{ background: "#0d0d1a", border: "1px solid #1a1a3a", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, minWidth: 120 }}>{m.date}</div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: m.winner === m.teamA ? NEON_GREEN : "#aaa" }}>{m.teamA}</span>
                      <span style={{ color: "#555", fontWeight: 900, fontSize: 18 }}>VS</span>
                      <span style={{ fontWeight: 700, color: m.winner === m.teamB ? NEON_GREEN : "#aaa" }}>{m.teamB}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#888" }}>+{m.pointsA} / +{m.pointsB}</span>
                      <span style={{ padding: "4px 12px", borderRadius: 20, background: "#39ff1422", border: "1px solid #39ff1444", color: NEON_GREEN, fontSize: 12, fontWeight: 700 }}>🏆 {m.winner}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddModal && <AddEditTeamModal onSave={handleAddTeam} onClose={() => setShowAddModal(false)} />}
      {editTeam && <AddEditTeamModal team={editTeam} onSave={handleEditTeam} onClose={() => setEditTeam(null)} />}
      {showBattle && <BattleModal teams={teams} onClose={() => setShowBattle(false)} onBattleComplete={handleBattle} />}

      {/* Timer Setup Modal */}
      {showTimerSetup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "linear-gradient(135deg,#0d0d1a,#1a1a2e)", border: "2px solid #39ff1444", borderRadius: 20, padding: 40, minWidth: 320, textAlign: "center", boxShadow: "0 0 60px #39ff1422" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>⏱</div>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 18, fontWeight: 900, color: NEON_GREEN, letterSpacing: 4, marginBottom: 28, textTransform: "uppercase" }}>Set Timer</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 32 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <label style={{ fontSize: 11, color: "#555", letterSpacing: 2 }}>MIN</label>
                <input
                  type="number" min="0" max="99"
                  value={timerInput.m}
                  onChange={e => setTimerInput(p => ({ ...p, m: e.target.value }))}
                  style={{ width: 80, padding: "12px 8px", textAlign: "center", fontSize: 36, fontWeight: 900, fontFamily: "monospace", background: "#0d0d1a", border: "2px solid #39ff1444", borderRadius: 12, color: NEON_GREEN, outline: "none" }}
                />
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, color: NEON_GREEN, marginTop: 18 }}>:</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <label style={{ fontSize: 11, color: "#555", letterSpacing: 2 }}>SEC</label>
                <input
                  type="number" min="0" max="59"
                  value={timerInput.s}
                  onChange={e => setTimerInput(p => ({ ...p, s: e.target.value }))}
                  style={{ width: 80, padding: "12px 8px", textAlign: "center", fontSize: 36, fontWeight: 900, fontFamily: "monospace", background: "#0d0d1a", border: "2px solid #39ff1444", borderRadius: 12, color: NEON_GREEN, outline: "none" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {[["1:00",60],["3:00",180],["5:00",300],["10:00",600]].map(([label, sec]) => (
                <button key={label} onClick={() => setTimerInput({ m: String(Math.floor(sec/60)), s: String(sec%60).padStart(2,"0") })}
                  style={{ padding: "6px 12px", borderRadius: 8, background: "#39ff1411", border: "1px solid #39ff1433", color: NEON_GREEN, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{label}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowTimerSetup(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#1a1a3a", border: "1px solid #333", color: "#888", cursor: "pointer", fontWeight: 700 }}>Cancel</button>
              <button onClick={startTimer} style={{ flex: 2, padding: "12px", borderRadius: 10, background: "linear-gradient(135deg,#39ff14,#00aa44)", border: "none", color: "#000", cursor: "pointer", fontWeight: 900, fontSize: 15, letterSpacing: 1 }}>▶ START</button>
            </div>
          </div>
        </div>
      )}

      {/* Countdown Full Screen Overlay */}
      {(timerRunning || (timerSeconds > 0 && !timerExpired)) && (
        <div style={{ position: "fixed", inset: 0, zIndex: 8000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}>

          {/* Spinning rays behind */}
          {Array.from({length: 14}).map((_,i) => (
            <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: 3, height: `${28 + (i%3)*10}vh`, background: `linear-gradient(180deg, ${timerSeconds <= 10 ? ["#ff4d6d","#ffd700","#ff9500"][i%3] : ["#39ff14","#00d4ff","#b44dff"][i%3]}88, transparent)`, transformOrigin: "50% 0%", transform: `translateX(-50%) rotate(${i*(360/14)}deg)`, animation: "spinRays 6s linear infinite", opacity: 0.35 }} />
          ))}

          {/* Radial glow */}
          <div style={{ position: "absolute", width: "80vw", height: "80vw", maxWidth: 700, maxHeight: 700, borderRadius: "50%", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: `radial-gradient(circle, ${timerSeconds <= 10 ? "rgba(255,77,109,0.15)" : "rgba(57,255,20,0.10)"} 0%, transparent 70%)`, animation: "pulseGlow 1.5s ease-in-out infinite alternate", pointerEvents: "none" }} />

          {/* Content */}
          <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>

            {/* Icon */}
            <div style={{ fontSize: "clamp(50px,10vw,90px)", lineHeight: 1, marginBottom: 8, filter: `drop-shadow(0 0 24px ${timerSeconds <= 10 ? "#ff4d6d" : "#39ff14"})`, animation: timerSeconds <= 10 ? "trophyBounce 0.4s ease-in-out infinite alternate" : "none" }}>
              {timerRunning ? (timerSeconds <= 10 ? "🚨" : "⏱") : "⏸"}
            </div>

            {/* Label */}
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(11px,2.5vw,18px)", fontWeight: 800, color: timerSeconds <= 10 ? "#ff4d6d88" : "#39ff1488", letterSpacing: 6, textTransform: "uppercase", marginBottom: 16 }}>
              {timerRunning ? (timerSeconds <= 10 ? "⚠ FINAL COUNTDOWN" : "TIME REMAINING") : "— PAUSED —"}
            </div>

            {/* Big clock */}
            <div style={{
              fontFamily: "monospace",
              fontSize: "clamp(72px, 22vw, 220px)",
              fontWeight: 900,
              lineHeight: 1,
              color: timerSeconds <= 10 ? "#ff4d6d" : NEON_GREEN,
              textShadow: timerSeconds <= 10
                ? "0 0 40px #ff4d6d, 0 0 80px #ff4d6d88, 0 0 160px #ff4d6d44"
                : "0 0 40px #39ff14, 0 0 80px #39ff1488, 0 0 160px #39ff1444",
              letterSpacing: "0.05em",
              animation: timerSeconds <= 10 && timerRunning ? "timerPulse 0.5s ease-in-out infinite alternate" : "none",
            }}>
              {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:{String(timerSeconds % 60).padStart(2, "0")}
            </div>

            {/* Control buttons */}
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 40 }}>
              {timerRunning ? (
                <button onClick={stopTimer} style={{ padding: "14px 36px", borderRadius: 12, background: "#ff4d6d22", border: "2px solid #ff4d6d66", color: "#ff4d6d", cursor: "pointer", fontWeight: 900, fontSize: 16, letterSpacing: 2, fontFamily: "'Orbitron',monospace" }}>⏸ PAUSE</button>
              ) : (
                <button onClick={() => { const total = (parseInt(timerInput.m)||0)*60+(parseInt(timerInput.s)||0); if(timerSeconds>0){ clearInterval(timerRef.current); let r=timerSeconds; timerRef.current=setInterval(()=>{ r-=1; setTimerSeconds(r); if(r<=0){clearInterval(timerRef.current);setTimerRunning(false);setTimerExpired(true);playTimeoutSound();}},1000); setTimerRunning(true); }}} style={{ padding: "14px 36px", borderRadius: 12, background: "#39ff1422", border: "2px solid #39ff1466", color: NEON_GREEN, cursor: "pointer", fontWeight: 900, fontSize: 16, letterSpacing: 2, fontFamily: "'Orbitron',monospace" }}>▶ RESUME</button>
              )}
              <button onClick={resetTimer} style={{ padding: "14px 36px", borderRadius: 12, background: "#1a1a3a", border: "2px solid #333", color: "#888", cursor: "pointer", fontWeight: 900, fontSize: 16, letterSpacing: 2, fontFamily: "'Orbitron',monospace" }}>✕ RESET</button>
              <button onClick={() => setShowTimerSetup(true)} style={{ padding: "14px 36px", borderRadius: 12, background: "#0d0d1a", border: "2px solid #39ff1433", color: "#39ff1499", cursor: "pointer", fontWeight: 900, fontSize: 16, letterSpacing: 2, fontFamily: "'Orbitron',monospace" }}>⚙ SET</button>
            </div>
          </div>

          <style>{`@keyframes timerPulse { from{opacity:1;transform:scale(1)} to{opacity:0.55;transform:scale(1.04)} }`}</style>
        </div>
      )}

      {/* TIME'S UP Full Screen */}
      {timerExpired && (
        <div onClick={() => setTimerExpired(false)} style={{ position: "fixed", inset: 0, zIndex: 9500, cursor: "pointer", overflow: "hidden", background: "#000" }}>

          {/* Dark vignette base */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, #1a0500 0%, #0a0000 50%, #000 100%)" }} />

          {/* Rays — behind everything, anchored to center, NOT overlapping text */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            {Array.from({length: 18}).map((_,i) => {
              const colors = ["#ff4d6d","#ffd700","#ff9500","#ff6b35","#ffcc00"];
              return (
                <div key={i} style={{
                  position: "absolute",
                  width: 3,
                  height: "62vh",
                  background: `linear-gradient(180deg, ${colors[i%colors.length]}99 0%, ${colors[i%colors.length]}22 60%, transparent 100%)`,
                  transformOrigin: "50% 0%",
                  transform: `translateX(-50%) rotate(${i*(360/18)}deg)`,
                  animation: "spinRays 8s linear infinite",
                  opacity: 0.55,
                  borderRadius: 2,
                }} />
              );
            })}
          </div>

          {/* Outer glow ring */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(255,77,109,0.18) 0%, rgba(255,149,0,0.08) 35%, transparent 65%)", pointerEvents: "none" }} />

          {/* Flashing red screen-edge pulse */}
          <div style={{ position: "absolute", inset: 0, border: "6px solid #ff4d6d", borderRadius: 0, animation: "edgeFlash 0.6s ease-in-out infinite alternate", pointerEvents: "none", opacity: 0.7 }} />

          {/* === CONTENT — fully above rays === */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>

            {/* 🚨 icon */}
            <div style={{
              fontSize: "clamp(64px, 14vw, 130px)",
              lineHeight: 1,
              marginBottom: "clamp(12px, 3vh, 28px)",
              filter: "drop-shadow(0 0 30px #ff4d6d) drop-shadow(0 0 70px #ff450088)",
              animation: "sirenSpin 0.8s ease-in-out infinite alternate",
            }}>🚨</div>

            {/* TIME'S UP text */}
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: "clamp(38px, 10vw, 108px)",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "clamp(3px, 1.5vw, 14px)",
              textTransform: "uppercase",
              background: "linear-gradient(90deg, #ff4d6d 0%, #ffd700 50%, #ff4d6d 100%)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmerText 1.2s linear infinite",
              filter: "drop-shadow(0 4px 24px rgba(255,77,109,0.6))",
              whiteSpace: "nowrap",
              textAlign: "center",
            }}>TIME'S UP!</div>

            {/* Divider line */}
            <div style={{ width: "clamp(120px, 30vw, 360px)", height: 2, background: "linear-gradient(90deg, transparent, #ff4d6d, #ffd700, #ff4d6d, transparent)", margin: "clamp(12px,2.5vh,24px) auto", opacity: 0.8 }} />

            {/* 00:00 */}
            <div style={{
              fontFamily: "monospace",
              fontSize: "clamp(22px, 5vw, 52px)",
              fontWeight: 900,
              color: "#ff4d6d",
              letterSpacing: "clamp(3px, 1vw, 10px)",
              opacity: 0.75,
              textShadow: "0 0 20px #ff4d6d88",
              animation: "timerPulse 0.7s ease-in-out infinite alternate",
            }}>⏱ 00:00</div>

            {/* Dismiss hint */}
            <div style={{
              marginTop: "clamp(24px, 5vh, 52px)",
              fontSize: "clamp(10px, 1.6vw, 15px)",
              color: "rgba(255,255,255,0.22)",
              letterSpacing: "clamp(3px, 0.8vw, 7px)",
              fontFamily: "monospace",
              textTransform: "uppercase",
            }}>TAP ANYWHERE TO DISMISS</div>
          </div>

          <style>{`
            @keyframes edgeFlash { from{opacity:0.3} to{opacity:0.85} }
            @keyframes sirenSpin { from{transform:rotate(-8deg) scale(1)} to{transform:rotate(8deg) scale(1.08)} }
            @keyframes timerPulse { from{opacity:0.5;transform:scale(1)} to{opacity:0.9;transform:scale(1.04)} }
          `}</style>
        </div>
      )}
    </div>
  );
}