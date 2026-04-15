"use client";
import React from "react";
import { ChevronDown, Wifi, LogOut, Cpu, Settings } from "lucide-react";
import Link from "next/link";

export default function Navbar({
  userData, 
  currentDevice, 
  isOnline, 
  isDeviceMenuOpen, 
  setIsDeviceMenuOpen, 
  setSelectedDeviceId, 
  handleLogout
}) {

  return (
    <nav className="sticky top-0 z-50 bg-white/75 backdrop-blur-xl border-b border-slate-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Section */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col -space-y-1">
            <Link href={"/dashboard"}>
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-blue-700 via-blue-500 to-amber-500 bg-clip-text text-transparent">
                coffee-counter
              </span>
            </Link>

            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full shadow-sm transition-colors duration-500 ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isOnline ? "En ligne" : "Hors ligne"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-2">
          {/* Device Selector */}
          <div className="relative">
            <button
              onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 text-sm font-bold transition-all duration-300
                ${isDeviceMenuOpen 
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg translate-y-[-1px]" 
                  : "bg-white text-slate-700 border-slate-200 shadow-sm hover:border-blue-300"}
              `}
            >
              <div className={`p-1 rounded-md ${isOnline ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                <Wifi size={14} strokeWidth={3} />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] opacity-50 font-medium text-right">
                  Machine active
                </span>
                <span className="text-xs font-bold">
                  {currentDevice?.name || currentDevice?.serialNumber || "Selectionner une machine"}
                </span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isDeviceMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isDeviceMenuOpen && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setIsDeviceMenuOpen(false)} />
                <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-slate-200 shadow-2xl rounded-[1.5rem] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Machines enregistrees
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    {userData.devices?.length > 0 ? userData.devices.map((dev) => (
                      <button
                        key={dev.id}
                        onClick={() => { 
                          setSelectedDeviceId(dev.id); 
                          setIsDeviceMenuOpen(false); 
                        }}
                        className={`
                          w-full text-right px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between transition-colors
                          ${currentDevice?.id === dev.id 
                            ? "bg-blue-50 text-blue-700" 
                            : "text-slate-700 hover:bg-slate-50"}
                        `}
                      >
                        <div className="flex items-center gap-3">
                           <Cpu size={16} className={`${currentDevice?.id === dev.id ? "text-blue-600" : "text-slate-500"}`} />
                           <span>{dev.name || dev.serialNumber}</span>
                        </div>
                        {currentDevice?.id === dev.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </button>
                    )) : (
                      <div className="p-4 text-center text-xs text-slate-500 font-bold italic">Aucune machine associee</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-[1px] h-6 bg-slate-200 mx-1" />

          {/* Settings / Devices */}
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard/devices"
              className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95"
              title="Machines"
            >
              <Cpu size={18} />
            </Link>
            <Link
              href="/dashboard/settings"
              className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95"
              title="Parametres"
            >
              <Settings size={18} />
            </Link>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout} 
            className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all active:scale-95"
            title="Deconnexion"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}