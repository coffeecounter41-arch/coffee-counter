"use client";

import React from "react";
import { Loader2, Sun, Moon, Coffee, CloudMoon } from "lucide-react"; 

export default function StatCard({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  variant = "white", 
  onClick, 
  isLoading, 
  unit = "tasse",
  singleCount = 0,
  doubleCount = 0
}) {
  
  const themes = {
    white: "bg-white border border-slate-200 shadow-md text-slate-900",
    black: "bg-gradient-to-br from-[#1e3a8a] to-[#334155] border border-blue-300/40 shadow-xl text-white",
    danger: "bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer group",
    success: "bg-emerald-50 border border-emerald-200 shadow-sm text-slate-900",
    morning: "bg-gradient-to-br from-[#fff7ed] via-[#ffedd5] to-[#fde68a] border border-amber-200 text-slate-900 shadow-md",
    evening: "bg-gradient-to-br from-[#eff6ff] via-[#dbeafe] to-[#bfdbfe] border border-blue-200 text-slate-900 shadow-md",
    night: "bg-gradient-to-br from-[#eef2ff] via-[#e0e7ff] to-[#c7d2fe] border border-indigo-200 text-slate-900 shadow-md"
  };

  if (variant === "danger") {
    return (
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`${themes.danger} p-6 rounded-[2.5rem] flex items-center gap-4 w-full active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className={`p-4 rounded-2xl bg-white shadow-[0_0_10px_rgba(212,175,55,0.2)] text-red-500 ${isLoading ? "animate-spin" : "group-hover:rotate-12 transition-transform"}`}>
          {isLoading ? <Loader2 size={20} /> : <Icon size={20} />}
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-red-600 uppercase tracking-wide">{title}</p>
          <p className="text-[10px] font-bold text-red-400 mt-0.5">{subtext}</p>
        </div>
      </button>
    );
  }

  return (
    <div className={`${themes[variant]} p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between min-h-[160px] transition-all hover:translate-y-[-2px]`}>
      
     
      {variant === "morning" && <Sun size={90} className="absolute -left-3 -bottom-3 opacity-[0.25] text-sky-500 drop-shadow-[0_0_12px_rgba(212,175,55,0.3)]" />}
      {variant === "evening" && <Moon size={80} className="absolute -left-2 -bottom-2 opacity-[0.15] text-blue-500" />}
      {variant === "night" && <CloudMoon size={80} className="absolute -left-2 -bottom-2 opacity-[0.16] text-indigo-500" />}

      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${
            variant === 'black' ? 'text-slate-300' : 'text-slate-500'
          }`}>
            {title}
          </p>
        </div>
        
        <div className={`p-2 rounded-xl border border-slate-200 ${
          variant === 'black' ? 'bg-blue-800 text-white' : 
          variant === 'evening' ? 'bg-blue-100 text-blue-700' :
          variant === 'night' ? 'bg-indigo-100 text-indigo-700' :
          variant === 'morning' ? 'bg-amber-100 text-amber-700' :
          'bg-slate-50 text-slate-500'
        }`}>
          {variant === "morning" ? <Sun size={16} /> : 
           variant === "evening" ? <Moon size={16} /> : 
           variant === "night" ? <CloudMoon size={16} /> :
           Icon ? <Icon size={16} /> : <Coffee size={16} />}
        </div>
      </div>

      <div className="mt-4 relative z-10">
        <div className="flex items-baseline gap-1">
          <h3 className={`text-4xl font-black tracking-tighter ${
            variant === 'black' ? 'text-white' : 'text-slate-900'
          }`}>
            {isLoading ? "---" : (value?.toLocaleString() || 0)}
          </h3>
          <span className={`text-[10px] font-bold uppercase ${
            variant === 'black' ? 'text-slate-300' : 'text-slate-400'
          }`}>
            {unit}
          </span>
        </div>

        
        {(variant === "morning" || variant === "evening" || variant === "night") && (
          <div className={`mt-3 pt-3 border-t-2 flex gap-4 ${
            variant === 'evening' ? 'border-blue-300' : 
            variant === 'night' ? 'border-indigo-300' : 'border-amber-300'
          }`}>
            <div className="flex flex-col">
              <span className={`text-[9px] font-black uppercase tracking-wider ${variant === 'black' ? 'text-slate-300' : 'text-slate-500'}`}>Single</span>
              <span className="text-sm font-black">{singleCount}</span>
            </div>
            <div className={`w-px h-6 my-auto ${variant === 'evening' ? 'bg-blue-300' : variant === 'night' ? 'bg-indigo-300' : 'bg-amber-300'}`} />
            <div className="flex flex-col">
              <span className={`text-[9px] font-black uppercase tracking-wider ${variant === 'black' ? 'text-slate-300' : 'text-slate-500'}`}>Double</span>
              <span className="text-sm font-black">{doubleCount}</span>
            </div>
          </div>
        )}
        
        {subtext && !isLoading && (
          <p className={`text-[11px] font-bold mt-2 ${
            variant === 'morning' ? 'text-amber-700' :
            variant === 'evening' ? 'text-blue-700' :
            variant === 'night' ? 'text-indigo-700' :
            'text-slate-500'
          }`}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}