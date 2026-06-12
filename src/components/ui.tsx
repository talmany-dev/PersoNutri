"use client";

import React from "react";

/* ── Bottom Navigation ── */
export function BottomNav({ active }: { active: "dashboard" | "treino" | "nutricao" | "progresso" | "ia" }) {
  const tabs = [
    { id: "dashboard", label: "Início",    href: "/dashboard",       icon: IconHome },
    { id: "treino",    label: "Treino",    href: "/treino",           icon: IconDumbbell },
    { id: "nutricao",  label: "Nutrição",  href: "/nutricao/diario",  icon: IconUtensils },
    { id: "progresso", label: "Progresso", href: "/progresso",        icon: IconChart },
    { id: "ia",        label: "IA",        href: "/ia",               icon: IconBrain },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white flex items-end justify-around"
      style={{ maxWidth: 390, borderTop: "0.5px solid #E5E5E5", paddingBottom: "env(safe-area-inset-bottom, 8px)", zIndex: 100 }}>
      {tabs.map(({ id, label, href, icon: Icon }) => {
        const isActive = active === id;
        return (
          <a key={id} href={href}
            className="flex flex-col items-center pt-2 pb-1 px-1 gap-0.5 flex-1 no-underline transition-colors"
            style={{ color: isActive ? "#1A56A0" : "#999" }}>
            <Icon active={isActive} />
            <span className="text-[10px] font-medium leading-tight">{label}</span>
          </a>
        );
      })}
    </nav>
  );
}

/* ── Screen Header ── */
export function ScreenHeader({ title, subtitle, showBack, onBack }: {
  title: string; subtitle?: string; showBack?: boolean; onBack?: () => void;
}) {
  return (
    <header className="flex items-center justify-between px-5 pt-4 pb-2">
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#1A1A1A" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}
        <div>
          <h1 className="text-lg font-bold leading-tight" style={{ color: "#1A1A1A" }}>{title}</h1>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "#666" }}>{subtitle}</p>}
        </div>
      </div>
      <button className="w-8 h-8 flex items-center justify-center rounded-lg"
        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#999" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      </button>
    </header>
  );
}

/* ── Card ── */
export function Card({ children, className = "", alert, warning, onClick, style }: {
  children: React.ReactNode; className?: string; alert?: boolean;
  warning?: boolean; onClick?: () => void; style?: React.CSSProperties;
}) {
  const border = alert ? "0.5px solid #D85A30" : warning ? "0.5px solid #E8A817" : "0.5px solid #E5E5E5";
  const bg = alert ? "rgba(216,90,48,0.05)" : warning ? "rgba(232,168,23,0.05)" : "#fff";
  return (
    <div onClick={onClick} className={`rounded-xl p-4 ${onClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""} ${className}`}
      style={{ background: bg, border, ...style }}>
      {children}
    </div>
  );
}

/* ── Buttons ── */
export function PrimaryButton({ children, onClick, className = "", small, disabled }: {
  children: React.ReactNode; onClick?: () => void; className?: string; small?: boolean; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`text-white border-none rounded-lg font-semibold cursor-pointer transition-all active:scale-[0.97] disabled:opacity-60 ${small ? "text-xs px-4 py-2" : "text-sm px-6 py-3"} ${className}`}
      style={{ background: "#1A56A0" }}>
      {children}
    </button>
  );
}

export function OutlineButton({ children, onClick, className = "" }: {
  children: React.ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <button onClick={onClick}
      className={`bg-transparent rounded-lg font-medium cursor-pointer text-xs px-4 py-2 transition-all active:scale-[0.97] ${className}`}
      style={{ border: "0.5px solid #1A56A0", color: "#1A56A0" }}>
      {children}
    </button>
  );
}

/* ── Progress Bar ── */
export function ProgressBar({ value, max, color = "#1D9E75", height = 6, className = "" }: {
  value: number; max: number; color?: string; height?: number; className?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className={`rounded-full overflow-hidden ${className}`} style={{ height, background: "#E5E5E5" }}>
      <div className="rounded-full h-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/* ── Circular Progress ── */
export function CircularProgress({ value, max, size = 60, strokeW = 5, color = "#1D9E75" }: {
  value: number; max: number; size?: number; strokeW?: number; color?: string;
}) {
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / max) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E5E5" strokeWidth={strokeW} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.7s" }} />
    </svg>
  );
}

/* ── Badge ── */
export function Badge({ text, color = "#1D9E75" }: { text: string; color?: string }) {
  return (
    <span className="inline-flex items-center text-[11px] font-medium rounded-md px-2 py-0.5"
      style={{ background: color + "20", color }}>
      {text}
    </span>
  );
}

/* ── Alert Card ── */
export function AlertCard({ title, description, action, onAction, type = "alert" }: {
  title: string; description?: string; action?: string; onAction?: () => void; type?: "alert" | "warning";
}) {
  const isAlert = type === "alert";
  const color = isAlert ? "#D85A30" : "#E8A817";
  return (
    <Card alert={isAlert} warning={!isAlert}>
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">{isAlert ? "⚠️" : "💡"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color }}>{title}</p>
          {description && <p className="text-xs mt-1" style={{ color: "#666" }}>{description}</p>}
        </div>
        {action && (
          <button onClick={onAction}
            className="text-xs font-semibold bg-transparent border-none cursor-pointer whitespace-nowrap"
            style={{ color }}>
            {action}
          </button>
        )}
      </div>
    </Card>
  );
}

/* ── Metric Card ── */
export function MetricCard({ label, value, sub, children }: {
  label: string; value?: string; sub?: string; children?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <span className="text-xs font-medium" style={{ color: "#666" }}>{label}</span>
      {children || (
        <div>
          <span className="text-xl font-bold" style={{ color: "#1A1A1A" }}>{value}</span>
          {sub && <span className="text-xs ml-1" style={{ color: "#666" }}>{sub}</span>}
        </div>
      )}
    </Card>
  );
}

/* ── Icons ── */
function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V20a2 2 0 01-2 2H5a2 2 0 01-2-2V10.5z"/>
    </svg>
  );
}
function IconDumbbell({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5L17.5 17.5"/><path d="M3.5 11L6.5 8M13 20.5L16 17.5"/>
      <path d="M8 3.5L11 6.5M17.5 13L20.5 16"/><path d="M3 14.5l3-3M14.5 3l3 3"/>
      <path d="M7.5 20.5l3-3M21 10l-3 3"/>
    </svg>
  );
}
function IconUtensils({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/>
      <path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    </svg>
  );
}
function IconChart({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function IconBrain({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/>
    </svg>
  );
}
