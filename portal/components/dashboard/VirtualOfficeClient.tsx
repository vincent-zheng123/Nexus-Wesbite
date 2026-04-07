"use client";

import { useState, useEffect, useRef } from "react";

type AgentState = "idle" | "call" | "processing" | "email";

interface RecentCall {
  callerPhone: string;
  outcome: string;
  timestamp: Date | string;
}

interface Props {
  agentName: string;
  vapiPhoneNumber: string | null;
  callsTotal: number;
  appointmentsTotal: number;
  followupsTotal: number;
  recentCalls: RecentCall[];
}

const SKIN_TONES = [
  { top: "#fde8d0", bot: "#f0c5a0" },
  { top: "#f5c5a0", bot: "#e8a87c" },
  { top: "#e8a87c", bot: "#c98b6a" },
  { top: "#c98b6a", bot: "#8b5e3c" },
  { top: "#7a4a28", bot: "#4e2c10" },
];
const HAIR_COLORS = [
  { top: "#1a0a2e", bot: "#3d1a6e" },
  { top: "#1a0804", bot: "#3d2008" },
  { top: "#c9a84c", bot: "#e2c36a" },
  { top: "#8b1010", bot: "#c94040" },
  { top: "#6a6a7e", bot: "#b8b8cc" },
];
const OUTFIT_COLORS = [
  { top: "#4c1d95", bot: "#2d1060" },
  { top: "#1e3a8a", bot: "#0f2157" },
  { top: "#1a1a2e", bot: "#0d0d1a" },
  { top: "#134e4a", bot: "#0d3330" },
  { top: "#6b1d1d", bot: "#3d0f0f" },
];
const OUTFIT_NAMES = ["Purple", "Navy", "Black", "Teal", "Burgundy"];
const SKIN_NAMES = ["Light", "Medium", "Tan", "Brown", "Dark"];
const HAIR_NAMES = ["Dark Purple", "Dark Brown", "Blonde", "Red", "Silver"];

const STATE_COLORS: Record<AgentState, string> = {
  idle: "#a78bfa",
  call: "#2dd4bf",
  processing: "#fbbf24",
  email: "#60a5fa",
};
const STATE_LABELS: Record<AgentState, string> = {
  idle: "Idle",
  call: "On a Call",
  processing: "Processing Data",
  email: "Sending Email",
};

function outcomeLabel(o: string) {
  return o.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default function VirtualOfficeClient({
  agentName,
  vapiPhoneNumber,
  callsTotal,
  appointmentsTotal,
  followupsTotal,
  recentCalls,
}: Props) {
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [skin, setSkin] = useState(1);
  const [hair, setHair] = useState(0);
  const [outfit, setOutfit] = useState(0);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [timer, setTimer] = useState<string>("—");
  const [lastChecked, setLastChecked] = useState<string>("—");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number | null>(null);
  const prevStateRef = useRef<AgentState>("idle");

  // Timer for active states
  useEffect(() => {
    if (agentState === "idle") {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimer("—");
      startRef.current = null;
    } else {
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000);
        const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const s = String(elapsed % 60).padStart(2, "0");
        setTimer(`${m}:${s}`);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [agentState]);

  // Real-time status polling
  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      try {
        const res = await fetch("/api/office/status", { cache: "no-store" });
        if (!res.ok || !mounted) return;
        const { state } = await res.json() as { state: AgentState };
        if (!mounted) return;

        setLastChecked(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }));

        // Only override to idle if we're not in a real active state from the API
        if (state !== prevStateRef.current) {
          prevStateRef.current = state;
          setAgentState(state);
        }
      } catch {
        // Network error — keep current state
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const skinTop = SKIN_TONES[skin].top;
  const skinBot = SKIN_TONES[skin].bot;
  const hairTop = HAIR_COLORS[hair].top;
  const hairBot = HAIR_COLORS[hair].bot;
  const outfitTop = OUTFIT_COLORS[outfit].top;
  const outfitBot = OUTFIT_COLORS[outfit].bot;

  const stateColor = STATE_COLORS[agentState];
  const stateLabel = STATE_LABELS[agentState];

  return (
    <div className="p-4 md:p-8">
      {/* Header bar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 px-4 md:px-5 py-4 rounded-2xl border"
        style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.2)" }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", boxShadow: "0 0 20px rgba(168,85,247,0.4)" }}
          >
            {agentName[0]?.toUpperCase() ?? "N"}
          </div>
          <div>
            <div className="font-bold text-base" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>
              Agent: {agentName}
            </div>
            <div className="text-xs" style={{ color: "#a78bfa" }}>Voice Assistant · {vapiPhoneNumber ?? "No phone configured"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
            style={{ color: "#4ade80", borderColor: "rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.07)" }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />
            Online
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ color: "#a78bfa", borderColor: "rgba(168,85,247,0.2)", background: "rgba(124,58,237,0.08)" }}>
            ⚡ 99.8% Uptime
          </span>
          <button
            onClick={() => setCustomizerOpen(!customizerOpen)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all"
            style={{
              background: customizerOpen ? "rgba(168,85,247,0.13)" : "rgba(168,85,247,0.07)",
              borderColor: customizerOpen ? "rgba(168,85,247,0.5)" : "rgba(168,85,247,0.22)",
              color: customizerOpen ? "#f3f0ff" : "#a78bfa",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Customize
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid gap-5 mb-5 grid-cols-1 md:grid-cols-[minmax(0,1fr)_280px]">
        {/* Room */}
        <div
          className="rounded-2xl overflow-hidden relative border"
          style={{ aspectRatio: "16/10", background: "#050115", borderColor: "rgba(168,85,247,0.18)", boxShadow: "inset 0 0 80px rgba(168,85,247,0.07)" }}
        >
          {/* SVG perspective room background */}
          <svg className="absolute inset-0 w-full h-full block" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="rwBW" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0b0328"/><stop offset="100%" stopColor="#08021e"/></linearGradient>
              <linearGradient id="rwLW" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stopColor="#080224"/><stop offset="100%" stopColor="#050117"/></linearGradient>
              <linearGradient id="rwRW" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#080224"/><stop offset="100%" stopColor="#050117"/></linearGradient>
              <linearGradient id="rwFL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0c0535"/><stop offset="100%" stopColor="#06021a"/></linearGradient>
              <linearGradient id="rwCL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#050117"/><stop offset="100%" stopColor="#08021e"/></linearGradient>
              <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#110440" stopOpacity="0.96"/><stop offset="100%" stopColor="#05021a" stopOpacity="0.96"/></linearGradient>
              <radialGradient id="winGR" cx="50%" cy="30%" r="60%"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.22"/><stop offset="70%" stopColor="#4c1d95" stopOpacity="0.06"/><stop offset="100%" stopColor="#4c1d95" stopOpacity="0"/></radialGradient>
              <radialGradient id="ambGR" cx="50%" cy="40%" r="55%"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.07"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/></radialGradient>
              <radialGradient id="flrGl" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#a855f7" stopOpacity="0.2"/><stop offset="100%" stopColor="#a855f7" stopOpacity="0"/></radialGradient>
              <filter id="winBlur"><feGaussianBlur stdDeviation="8"/></filter>
            </defs>
            {/* Ceiling */}
            <polygon points="0,0 800,0 645,68 155,68" fill="url(#rwCL)"/>
            <polygon points="310,68 490,68 472,70 328,70" fill="rgba(200,150,255,0.14)"/>
            <polygon points="330,68 470,68 456,69.5 344,69.5" fill="rgba(220,180,255,0.22)"/>
            {/* Back wall */}
            <rect x="155" y="68" width="490" height="224" fill="url(#rwBW)"/>
            <rect x="155" y="68" width="490" height="224" fill="url(#ambGR)"/>
            <line x1="155" y1="68" x2="155" y2="292" stroke="rgba(168,85,247,0.07)" strokeWidth="1.5"/>
            <line x1="645" y1="68" x2="645" y2="292" stroke="rgba(168,85,247,0.07)" strokeWidth="1.5"/>
            <line x1="155" y1="220" x2="645" y2="220" stroke="rgba(168,85,247,0.035)" strokeWidth="1"/>
            <rect x="155" y="282" width="490" height="10" fill="rgba(168,85,247,0.05)"/>
            {/* Window */}
            <rect x="265" y="82" width="270" height="186" rx="6" fill="url(#winGR)" filter="url(#winBlur)"/>
            <rect x="272" y="86" width="256" height="182" rx="3" stroke="rgba(168,85,247,0.28)" strokeWidth="1.5" fill="#06021a"/>
            <rect x="274" y="88" width="252" height="178" rx="2" fill="url(#skyG)"/>
            {/* Buildings */}
            <rect x="282" y="202" width="22" height="65" fill="#0c0432" opacity="0.97"/><rect x="308" y="190" width="16" height="77" fill="#09031e" opacity="0.97"/>
            <rect x="328" y="207" width="26" height="60" fill="#0d0535" opacity="0.97"/><rect x="358" y="196" width="18" height="71" fill="#0b0430" opacity="0.97"/>
            <rect x="380" y="183" width="30" height="84" fill="#0c0432" opacity="0.97"/><rect x="414" y="199" width="20" height="68" fill="#09031e" opacity="0.97"/>
            <rect x="438" y="191" width="24" height="76" fill="#0d0535" opacity="0.97"/><rect x="466" y="204" width="17" height="63" fill="#0b0430" opacity="0.97"/>
            <rect x="487" y="187" width="28" height="80" fill="#0c0432" opacity="0.97"/><rect x="519" y="200" width="13" height="67" fill="#09031e" opacity="0.97"/>
            {/* City lights */}
            <circle cx="289" cy="220" r="1.3" fill="#fbbf24" opacity="0.9"/><circle cx="315" cy="207" r="1.1" fill="#60a5fa" opacity="0.8"/>
            <circle cx="336" cy="224" r="1.3" fill="#fbbf24" opacity="0.7"/><circle cx="363" cy="212" r="1.1" fill="#60a5fa" opacity="0.8"/>
            <circle cx="387" cy="200" r="1" fill="#fbbf24" opacity="0.8"/><circle cx="417" cy="215" r="1.1" fill="#a855f7" opacity="0.85"/>
            <circle cx="444" cy="208" r="1.2" fill="#fbbf24" opacity="0.7"/><circle cx="470" cy="222" r="1.1" fill="#fbbf24" opacity="0.8"/>
            <circle cx="492" cy="204" r="1.3" fill="#a855f7" opacity="0.7"/><circle cx="522" cy="215" r="1.1" fill="#fbbf24" opacity="0.8"/>
            {/* Stars */}
            <circle cx="292" cy="105" r="0.8" fill="white" opacity="0.5"/><circle cx="362" cy="98" r="0.7" fill="white" opacity="0.55"/>
            <circle cx="400" cy="109" r="0.5" fill="white" opacity="0.5"/><circle cx="440" cy="101" r="0.8" fill="white" opacity="0.4"/>
            <circle cx="472" cy="113" r="0.6" fill="white" opacity="0.55"/>
            {/* Window crossbars */}
            <line x1="400" y1="88" x2="400" y2="266" stroke="rgba(168,85,247,0.25)" strokeWidth="1.8"/>
            <line x1="274" y1="177" x2="526" y2="177" stroke="rgba(168,85,247,0.25)" strokeWidth="1.8"/>
            {/* Bookshelf */}
            <rect x="562" y="96" width="72" height="188" rx="2" fill="rgba(8,3,26,0.75)"/>
            <rect x="562" y="96" width="72" height="188" rx="2" stroke="rgba(168,85,247,0.1)" strokeWidth="1" fill="none"/>
            <line x1="562" y1="138" x2="634" y2="138" stroke="rgba(168,85,247,0.09)" strokeWidth="1"/>
            <line x1="562" y1="178" x2="634" y2="178" stroke="rgba(168,85,247,0.09)" strokeWidth="1"/>
            <line x1="562" y1="218" x2="634" y2="218" stroke="rgba(168,85,247,0.09)" strokeWidth="1"/>
            <rect x="565" y="119" width="7" height="18" rx="1" fill="#4c1d95" opacity="0.85"/><rect x="574" y="122" width="6" height="15" rx="1" fill="#1e3a8a" opacity="0.85"/>
            <rect x="582" y="118" width="8" height="19" rx="1" fill="#134e4a" opacity="0.85"/><rect x="592" y="121" width="6" height="16" rx="1" fill="#6b1d1d" opacity="0.85"/>
            <rect x="600" y="117" width="9" height="20" rx="1" fill="#4c1d95" opacity="0.65"/>
            <rect x="565" y="159" width="6" height="18" rx="1" fill="#6b1d1d" opacity="0.75"/><rect x="573" y="162" width="8" height="15" rx="1" fill="#134e4a" opacity="0.85"/>
            <circle cx="575" cy="207" r="6" fill="rgba(168,85,247,0.18)"/><circle cx="575" cy="207" r="3.5" fill="#c084fc" opacity="0.45"/>
            {/* Plant */}
            <path d="M178 276 Q176 265 181 261 L204 261 Q209 264 207 276Z" fill="#180a38" opacity="0.9"/>
            <ellipse cx="192" cy="233" rx="8" ry="26" fill="#134e4a" opacity="0.88" transform="rotate(-10 192 233)"/>
            <ellipse cx="192" cy="233" rx="8" ry="26" fill="#134e4a" opacity="0.88" transform="rotate(16 192 233)"/>
            {/* Left wall */}
            <polygon points="0,0 155,68 155,292 0,500" fill="url(#rwLW)"/>
            <line x1="155" y1="68" x2="155" y2="292" stroke="rgba(168,85,247,0.1)" strokeWidth="1.5"/>
            {/* Right wall */}
            <polygon points="800,0 645,68 645,292 800,500" fill="url(#rwRW)"/>
            <line x1="645" y1="68" x2="645" y2="292" stroke="rgba(168,85,247,0.1)" strokeWidth="1.5"/>
            {/* Floor */}
            <polygon points="0,500 800,500 645,292 155,292" fill="url(#rwFL)"/>
            <line x1="0" y1="500" x2="155" y2="292" stroke="rgba(168,85,247,0.07)" strokeWidth="1"/>
            <line x1="110" y1="500" x2="200" y2="292" stroke="rgba(168,85,247,0.065)" strokeWidth="1"/>
            <line x1="220" y1="500" x2="243" y2="292" stroke="rgba(168,85,247,0.06)" strokeWidth="1"/>
            <line x1="400" y1="500" x2="400" y2="292" stroke="rgba(168,85,247,0.055)" strokeWidth="1"/>
            <line x1="580" y1="500" x2="557" y2="292" stroke="rgba(168,85,247,0.06)" strokeWidth="1"/>
            <line x1="690" y1="500" x2="600" y2="292" stroke="rgba(168,85,247,0.065)" strokeWidth="1"/>
            <line x1="800" y1="500" x2="645" y2="292" stroke="rgba(168,85,247,0.07)" strokeWidth="1"/>
            <line x1="120" y1="322" x2="680" y2="322" stroke="rgba(168,85,247,0.058)" strokeWidth="1"/>
            <line x1="76" y1="362" x2="724" y2="362" stroke="rgba(168,85,247,0.052)" strokeWidth="1"/>
            <line x1="32" y1="415" x2="768" y2="415" stroke="rgba(168,85,247,0.044)" strokeWidth="1"/>
            <ellipse cx="400" cy="405" rx="130" ry="24" fill="url(#flrGl)"/>
          </svg>

          {/* Monitor */}
          <div
            className="absolute z-10"
            style={{
              bottom: "calc(13% + 20px)", left: "50%", transform: "translateX(-50%)",
              width: 72, height: 48, borderRadius: 5,
              background: "#060218", border: "1px solid rgba(168,85,247,0.28)",
              boxShadow: "0 0 14px rgba(168,85,247,0.18)", overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 5px,rgba(168,85,247,0.04) 5px,rgba(168,85,247,0.04) 6px)" }}/>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(168,85,247,0.1),rgba(45,212,191,0.06))", animation: "monitorPulse 3s ease-in-out infinite" }}/>
          </div>
          {/* Desk */}
          <div
            className="absolute z-10"
            style={{
              bottom: "13%", left: "50%", transform: "translateX(-50%)",
              width: "68%", height: 22, borderRadius: "6px 6px 3px 3px",
              background: "linear-gradient(180deg,#1c0c40 0%,#0e0526 100%)",
              border: "1px solid rgba(168,85,247,0.2)",
              boxShadow: "0 0 24px rgba(168,85,247,0.12),0 4px 16px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ position: "absolute", top: -1, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg,transparent,rgba(168,85,247,0.55),transparent)" }}/>
          </div>

          {/* Avatar container */}
          <div className="absolute z-20 flex flex-col items-center" style={{ bottom: "18%", left: "50%", transform: "translateX(-50%)" }}>
            <div
              style={{
                filter: agentState === "call" ? "drop-shadow(0 0 32px rgba(45,212,191,0.7))"
                  : agentState === "processing" ? "drop-shadow(0 0 32px rgba(251,191,36,0.6))"
                  : agentState === "email" ? "drop-shadow(0 0 32px rgba(96,165,250,0.6))"
                  : "drop-shadow(0 0 24px rgba(168,85,247,0.6))",
                transition: "filter 0.4s ease",
              }}
            >
              <svg viewBox="0 0 160 280" fill="none" xmlns="http://www.w3.org/2000/svg"
                className="w-20 md:w-40"
                style={{ height: "auto", animation: "avatarFloat 3.2s ease-in-out infinite" }}>
                <defs>
                  <linearGradient id={`skinG-${skin}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={skinTop}/><stop offset="100%" stopColor={skinBot}/>
                  </linearGradient>
                  <linearGradient id={`outfitG-${outfit}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={outfitTop}/><stop offset="100%" stopColor={outfitBot}/>
                  </linearGradient>
                  <linearGradient id={`hairG-${hair}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={hairTop}/><stop offset="80%" stopColor={hairBot}/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0.6"/>
                  </linearGradient>
                  <filter id="softGlow2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  <radialGradient id="faceGl" cx="50%" cy="40%" r="50%"><stop offset="0%" stopColor="#fde8d0" stopOpacity="0.4"/><stop offset="100%" stopColor={skinTop} stopOpacity="0"/></radialGradient>
                </defs>
                {/* Hair back */}
                <g style={{ animation: "hairSway 5s ease-in-out infinite", transformOrigin: "50% 0%" }}>
                  <ellipse cx="80" cy="56" rx="34" ry="38" fill={`url(#hairG-${hair})`}/>
                  <path d="M47 72 Q38 110 42 160 Q46 180 50 175 Q48 140 52 105 Q56 88 60 80Z" fill={`url(#hairG-${hair})`} opacity="0.95"/>
                  <path d="M113 72 Q122 110 118 160 Q114 180 110 175 Q112 140 108 105 Q104 88 100 80Z" fill={`url(#hairG-${hair})`} opacity="0.95"/>
                  <path d="M42 150 Q40 180 44 200 Q46 210 50 205 Q48 185 50 165Z" fill="#7c3aed" opacity="0.5"/>
                  <path d="M118 150 Q120 180 116 200 Q114 210 110 205 Q112 185 110 165Z" fill="#7c3aed" opacity="0.5"/>
                </g>
                {/* Neck */}
                <rect x="72" y="86" width="16" height="18" rx="5" fill={`url(#skinG-${skin})`}/>
                {/* Head */}
                <ellipse cx="80" cy="58" rx="30" ry="32" fill={`url(#skinG-${skin})`}/>
                <ellipse cx="80" cy="52" rx="28" ry="22" fill="url(#faceGl)"/>
                {/* Ears */}
                <ellipse cx="50" cy="58" rx="5" ry="7" fill={skinBot}/>
                <ellipse cx="110" cy="58" rx="5" ry="7" fill={skinBot}/>
                {/* Bangs */}
                <path d="M50 40 Q52 28 66 26 Q74 24 80 26 Q88 24 94 26 Q108 28 110 40 Q100 35 80 34 Q60 35 50 40Z" fill={`url(#hairG-${hair})`}/>
                <path d="M50 40 Q46 50 48 62 Q50 55 53 48Z" fill={`url(#hairG-${hair})`} opacity="0.9"/>
                <path d="M110 40 Q114 50 112 62 Q110 55 107 48Z" fill={`url(#hairG-${hair})`} opacity="0.9"/>
                {/* Eyes */}
                <g style={{ animation: "avatarBlink 4s ease-in-out infinite", transformOrigin: "center" }}>
                  <ellipse cx="66" cy="57" rx="7" ry="6" fill="#1a0a2e"/>
                  <ellipse cx="66" cy="56" rx="5.5" ry="4.5" fill="#2d1a5e"/>
                  <circle cx="66" cy="55" r="3.5" fill="#0a0520"/>
                  <circle cx="68" cy="53" r="1.2" fill="white" opacity="0.9"/>
                  <ellipse cx="94" cy="57" rx="7" ry="6" fill="#1a0a2e"/>
                  <ellipse cx="94" cy="56" rx="5.5" ry="4.5" fill="#2d1a5e"/>
                  <circle cx="94" cy="55" r="3.5" fill="#0a0520"/>
                  <circle cx="96" cy="53" r="1.2" fill="white" opacity="0.9"/>
                </g>
                {/* Eyebrows */}
                <path d="M59 49 Q63 46 72 47" stroke="#1a0a2e" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <path d="M88 47 Q97 46 101 49" stroke="#1a0a2e" strokeWidth="2" strokeLinecap="round" fill="none"/>
                {/* Nose + mouth */}
                <path d="M78 64 Q80 68 82 64" stroke="#c9845c" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6"/>
                <path d="M72 73 Q80 78 88 73" stroke="#c9845c" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                {/* Blush */}
                <ellipse cx="57" cy="65" rx="8" ry="5" fill="#e879f9" opacity="0.12"/>
                <ellipse cx="103" cy="65" rx="8" ry="5" fill="#e879f9" opacity="0.12"/>
                {/* Body */}
                <path d="M54 100 Q44 108 42 130 L42 210 Q42 218 50 220 L110 220 Q118 218 118 210 L118 130 Q116 108 106 100 Q96 96 80 96 Q64 96 54 100Z" fill={`url(#outfitG-${outfit})`}/>
                <path d="M66 96 Q72 108 80 110 Q88 108 94 96" stroke="#a855f7" strokeWidth="1.5" fill="none" opacity="0.7"/>
                <line x1="80" y1="112" x2="80" y2="200" stroke="#a855f7" strokeWidth="0.8" opacity="0.3"/>
                <circle cx="80" cy="148" r="9" fill="#a855f7" opacity="0.15"/>
                <circle cx="80" cy="148" r="6" fill="#c084fc" opacity="0.2" filter="url(#softGlow2)"/>
                <circle cx="80" cy="148" r="3" fill="#e879f9" opacity="0.5"/>
                {/* Left arm */}
                <path d="M42 105 Q32 118 34 140 Q36 155 40 158 Q44 160 46 155 Q44 140 44 122 Q46 110 54 106Z" fill={`url(#outfitG-${outfit})`}/>
                <ellipse cx="39" cy="160" rx="7" ry="9" fill={`url(#skinG-${skin})`}/>
                {/* Right arm */}
                <g style={agentState === "call" ? { transform: "rotate(-55deg) translateY(-4px)", transformOrigin: "118px 109px", transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)" } : { transform: "rotate(0deg)", transformOrigin: "118px 109px", transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>
                  <path d="M118 105 Q128 118 126 140 Q124 155 120 158 Q116 160 114 155 Q116 140 116 122 Q114 110 106 106Z" fill={`url(#outfitG-${outfit})`}/>
                  <ellipse cx="121" cy="160" rx="7" ry="9" fill={`url(#skinG-${skin})`}/>
                </g>
                {/* Legs */}
                <rect x="58" y="218" width="18" height="50" rx="6" fill="#1a0a2e"/>
                <rect x="84" y="218" width="18" height="50" rx="6" fill="#1a0a2e"/>
                <ellipse cx="67" cy="268" rx="11" ry="6" fill="#0d0a1a"/>
                <ellipse cx="93" cy="268" rx="11" ry="6" fill="#0d0a1a"/>
                <ellipse cx="67" cy="268" rx="9" ry="3" fill="#7c3aed" opacity="0.3"/>
                <ellipse cx="93" cy="268" rx="9" ry="3" fill="#7c3aed" opacity="0.3"/>
                {/* Waveform (call state) */}
                {agentState === "call" && (
                  <g transform="translate(30,242)">
                    {[0,8,16,24,32,40,48,56,64,72].map((x, i) => (
                      <rect key={x} x={x} y="0" width="5" height="12" rx="2" fill="#2dd4bf" opacity="0.8"
                        style={{ transformOrigin: "center bottom", animation: `waveformBar 0.5s ease-in-out ${i * 0.05}s infinite` }}/>
                    ))}
                  </g>
                )}
                {/* Orbit particles (processing) */}
                {agentState === "processing" && (
                  <g>
                    <circle r="4" fill="#fbbf24" opacity="0.9" style={{ animation: "particleOrbit 1.8s linear infinite", transformOrigin: "80px 148px" }}/>
                    <circle r="3" fill="#f59e0b" opacity="0.7" style={{ animation: "particleOrbit 2.4s linear infinite reverse", transformOrigin: "80px 148px" }}/>
                  </g>
                )}
                {/* Envelope (email) */}
                {agentState === "email" && (
                  <g transform="translate(86,120)" style={{ animation: "envelopeFly 1.4s ease-in-out infinite" }}>
                    <rect width="28" height="20" rx="3" fill="#3b82f6" opacity="0.9"/>
                    <path d="M0 3 L14 12 L28 3" stroke="white" strokeWidth="1.2" fill="none" opacity="0.8"/>
                  </g>
                )}
              </svg>
            </div>
            {/* Platform glow */}
            <div style={{ width: 100, height: 10, borderRadius: "50%", marginTop: 4, background: "radial-gradient(ellipse,rgba(168,85,247,0.6) 0%,transparent 70%)", animation: "platformPulse 2s ease-in-out infinite" }}/>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-3.5">
          {/* Customizer */}
          {customizerOpen && (
            <div className="rounded-2xl border p-4" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.2)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3.5" style={{ color: "#a78bfa", fontFamily: "var(--font-space-grotesk)" }}>Avatar Appearance</p>
              {[
                { label: "Skin Tone", items: SKIN_TONES, names: SKIN_NAMES, current: skin, set: setSkin },
                { label: "Hair Color", items: HAIR_COLORS, names: HAIR_NAMES, current: hair, set: setHair },
                { label: "Outfit Color", items: OUTFIT_COLORS, names: OUTFIT_NAMES, current: outfit, set: setOutfit },
              ].map(({ label, items, names, current, set }) => (
                <div key={label} className="mb-3 last:mb-0">
                  <p className="text-xs mb-1.5" style={{ color: "#a78bfa" }}>{label}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {items.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => set(i)}
                        title={names[i]}
                        className="w-6 h-6 rounded-full flex-shrink-0 transition-all"
                        style={{
                          background: `linear-gradient(135deg,${c.top},${c.bot})`,
                          border: current === i ? "2px solid #fff" : "2px solid transparent",
                          boxShadow: current === i ? "0 0 0 1px rgba(255,255,255,0.25)" : "none",
                          transform: current === i ? "scale(1.15)" : "scale(1)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status panel */}
          <div className="rounded-2xl border p-5" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.2)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#a78bfa", fontFamily: "var(--font-space-grotesk)" }}>Agent Status</p>
            <p className="font-bold text-base mb-0.5" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>{agentName}</p>
            <p className="text-xs mb-4" style={{ color: "#a78bfa" }}>Voice Assistant</p>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm" style={{ color: "#a78bfa" }}>State</span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border" style={{ color: stateColor, borderColor: `${stateColor}4d`, background: `${stateColor}10` }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: stateColor }}/>
                {stateLabel}
              </span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm" style={{ color: "#a78bfa" }}>Duration</span>
              <span className="font-bold text-xl" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff", letterSpacing: "0.05em" }}>{timer}</span>
            </div>
            <div style={{ height: 1, background: "rgba(168,85,247,0.2)", margin: "16px 0" }}/>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: "#a78bfa", letterSpacing: "0.03em" }}>Live Monitoring</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border" style={{ color: "#4ade80", borderColor: "rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.07)" }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "currentColor" }}/>
                Active
              </span>
            </div>
            <p className="text-xs mt-2" style={{ color: "#6b6b80" }}>Updated: {lastChecked}</p>
            <p className="text-xs mt-1" style={{ color: "#6b6b80" }}>Polls every 5 seconds · auto-updates on call activity, SMS sends, and post-call processing</p>
          </div>

          {/* Live feed */}
          <div className="rounded-2xl border p-4" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.2)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#a78bfa" }}>Live Feed</p>
            {recentCalls.length === 0 ? (
              <p className="text-xs" style={{ color: "#6b6b80" }}>No recent activity.</p>
            ) : (
              <div className="flex flex-col">
                {recentCalls.map((call, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-2 border-b last:border-0 last:pb-0" style={{ borderColor: "rgba(168,85,247,0.06)" }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: "#a855f7" }}/>
                    <div>
                      <p className="text-xs" style={{ color: "#f3f0ff", lineHeight: 1.4 }}>
                        {outcomeLabel(call.outcome)} · {call.callerPhone}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>
                        {new Date(call.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          { val: callsTotal, label: "Total Calls" },
          { val: appointmentsTotal, label: "Appointments" },
          { val: followupsTotal, label: "SMS Sent" },
          { val: "99.8%", label: "Uptime" },
        ].map(({ val, label }) => (
          <div
            key={label}
            className="rounded-2xl border p-4 text-center transition-all"
            style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}
          >
            <div className="font-bold text-3xl mb-1" style={{ fontFamily: "var(--font-orbitron)", background: "linear-gradient(135deg,#7c3aed,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {val}
            </div>
            <div className="text-xs font-semibold" style={{ color: "#a78bfa", letterSpacing: "0.02em" }}>{label}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
