"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Coffee,
  RotateCcw,
  AlertCircle,
  Loader2,
  ArrowRight,
  Filter,
} from "lucide-react";
import Navbar from "../../../../components/(user)/Navbar";
import Link from "next/link";

export default function LogsPage() {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [settings, setSettings] = useState(null);

  // 1. جلب البيانات الأولية (الأجهزة)
  const fetchDevices = useCallback(async () => {
    try {
      const token = localStorage.getItem("client_token");
      const res = await fetch("/api/devices", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      // ضمان أننا نتعامل مع مصفوفة
      const devicesList = Array.isArray(data) ? data : (data.devices || []);
      setDevices(devicesList);
      
      if (devicesList.length > 0) {
        setSelectedDeviceId(devicesList[0].id);
      }
    } catch (e) {
      console.error("Echec chargement machines", e);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // جلب إعدادات العميل (غرام السنجل والدبل)
  useEffect(() => {
    async function loadSettings() {
      try {
        const token = localStorage.getItem("client_token");
        const res = await fetch("/api/user/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setSettings(data.settings || null);
        }
      } catch {
        setSettings(null);
      }
    }
    loadSettings();
  }, []);

  // 2. جلب السجلات والورديات المغلقة عند تغيير الجهاز أو الفترة
  useEffect(() => {
    if (!selectedDeviceId) return;

    async function fetchData() {
      setLoading(true);
      try {
        const token = localStorage.getItem("client_token");
        const query = new URLSearchParams();
        if (fromDate) query.set("from", fromDate);
        if (toDate) query.set("to", toDate);

        const res = await fetch(
          `/api/logs/${selectedDeviceId}${query.toString() ? `?${query.toString()}` : ""}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        // دعم الصيغة القديمة (مصفوفة فقط) والجديدة { logs, shifts }
        if (Array.isArray(data)) {
          setLogs(data);
          setShifts([]);
        } else {
          setLogs(Array.isArray(data?.logs) ? data.logs : []);
          setShifts(Array.isArray(data?.shifts) ? data.shifts : []);
        }
      } catch (e) {
        console.error("Erreur chargement journaux", e);
        setLogs([]);
        setShifts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedDeviceId, fromDate, toDate]);

  // البحث عن الجهاز الحالي بطريقة آمنة باستخدام useMemo
  const currentDevice = useMemo(() => {
    if (!Array.isArray(devices)) return null;
    return devices.find((d) => d.id === selectedDeviceId) || null;
  }, [devices, selectedDeviceId]);

  // 3. منطق البحث المتقدم (فلاتر محسنة)
  const filteredLogs = useMemo(() => {
    if (!Array.isArray(logs)) return [];

    return logs.filter((log) => {
      const typeLabel = log.type === "reset" ? "reset periode" : "cafe";
      const coffeeSize = log.coffeeType === "double" ? "double" : "single";
      // دمج كل النصوص المتاحة للبحث عنها
      const searchableContent = `${typeLabel} ${coffeeSize} ${log.idhafa || ""}`.toLowerCase();
      return searchableContent.includes(searchTerm.toLowerCase());
    });
  }, [logs, searchTerm]);

  // إجماليات الفترة المحددة (من الورديات المغلقة + السجلات)
  const totals = useMemo(() => {
    let totalCups = 0;
    let single = 0;
    let dbl = 0;

    // من الورديات المغلقة
    if (Array.isArray(shifts) && shifts.length > 0) {
      shifts.forEach((s) => {
        totalCups += Number(s.count || 0);
        single += Number(s.singleCount || 0);
        dbl += Number(s.doubleCount || 0);
      });
    } else if (Array.isArray(filteredLogs)) {
      // من السجلات عند عدم وجود ورديات
      filteredLogs.forEach((log) => {
        if (log.type === "cup") {
          totalCups += Number(log.idhafa || 0);
          if (log.coffeeType === "double") dbl += 1;
          else single += 1;
        }
      });
    }

    const gs = Number(settings?.gramsSingle || 7);
    const gd = Number(settings?.gramsDouble || 14);
    const totalGrams = single * gs + dbl * gd;

    return {
      totalCups,
      single,
      dbl,
      totalGrams,
    };
  }, [filteredLogs, shifts, settings]);

  return (
    <main className="app-shell font-tajawal pb-12" dir="ltr">
      <Navbar
        userData={{ devices: devices || [] }}
        currentDevice={currentDevice}
        isOnline={true}
        isDeviceMenuOpen={isDeviceMenuOpen}
        setIsDeviceMenuOpen={setIsDeviceMenuOpen}
        setSelectedDeviceId={setSelectedDeviceId}
        handleLogout={() => {
          localStorage.clear();
          window.location.href = "/";
        }}
      />

      <div className="max-w-4xl mx-auto px-6 pt-8">
        {/* زر العودة */}
        <Link href="/dashboard" className="group inline-flex items-center gap-2 text-slate-400 hover:text-[#d4af37] transition-all mb-8">
          <div className="p-2 bg-[#111a2d] rounded-xl border-2 border-[#d4af37]/40 shadow-sm group-hover:bg-[#18233a] group-hover:border-[#d4af37]/40 transition-colors">
            <ArrowRight size={20} />
          </div>
          <span className="font-bold text-sm uppercase tracking-tight">Retour dashboard</span>
        </Link>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-black text-slate-100 tracking-tight leading-tight">Journal d'activite</h1>
            <p className="text-slate-400 font-bold text-sm mt-2">
              Historique detaille de la machine <span className="text-[#d4af37]">[{currentDevice?.serialNumber || "..."}]</span>
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 md:items-end">
            <div className="luxe-card-soft px-4 py-2 flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Filtrage par periode
              </span>
            </div>
          </div>
        </header>

        {/* فلاتر التاريخ والبحث */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider">
              Date debut
            </label>
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-[#111a2d] border border-[#d4af37]/40 rounded-[2rem] px-4 py-3 outline-none focus:ring-4 focus:ring-[#d4af37]/20 transition-all shadow-sm font-bold text-slate-100"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider">
              Date fin
            </label>
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-[#111a2d] border border-2 border-[#d4af37]/40 rounded-[2rem] px-4 py-3 outline-none focus:ring-4 focus:ring-[#d4af37]/20 transition-all shadow-sm font-bold text-slate-100"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider">
              Recherche
            </label>
            <div className="relative group">
              <Search
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#d4af37] transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Exemple: double, reset..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#111a2d] border border-2 border-[#d4af37]/40 rounded-[2rem] pr-11 pl-4 py-3 outline-none focus:ring-4 focus:ring-[#d4af37]/20 transition-all shadow-sm font-bold text-slate-100 placeholder:text-slate-400/60"
              />
            </div>
          </div>
        </div>

        {/* بطاقة الإجماليات للفترة المحددة */}
        {totals && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-[#111a2d] border border-2 border-[#d4af37]/40 text-slate-100 rounded-[1.8rem] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Total tasses
              </p>
              <p className="text-3xl font-black mt-1">{totals.totalCups}</p>
            </div>
            <div className="bg-[#d4af37]/20 rounded-[1.8rem] p-4 border border-[#d4af37]/30">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37]">
                Single
              </p>
              <p className="text-2xl font-black mt-1 text-slate-100">
                {totals.single}
              </p>
            </div>
            <div className="bg-[#a67c3d]/20 rounded-[1.8rem] p-4 border border-[#a67c3d]/30">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Double
              </p>
              <p className="text-2xl font-black mt-1 text-slate-100">
                {totals.dbl}
              </p>
            </div>
            <div className="bg-[#111a2d] rounded-[1.8rem] p-4 border border-2 border-[#d4af37]/40">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Consommation cafe (g)
              </p>
              <p className="text-2xl font-black mt-1 text-slate-100">
                {Number.isFinite(totals.totalGrams)
                  ? totals.totalGrams.toLocaleString()
                  : 0}
              </p>
            </div>
          </div>
        )}

        {/* الورديات المغلقة */}
        {shifts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-100 mb-4 flex items-center gap-2">
              <RotateCcw size={20} className="text-[#d4af37]" />
              Periodes cloturees
            </h3>
            <div className="luxe-card rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm luxe-table">
                  <thead>
                    <tr className="text-slate-400 border-b border-2 border-[#d4af37]/40 uppercase tracking-widest text-[10px]">
                      <th className="p-4 font-black">Date</th>
                      <th className="p-4 font-black">Heure</th>
                      <th className="p-4 font-black">Periode</th>
                      <th className="p-4 font-black">Total</th>
                      <th className="p-4 font-black">Single</th>
                      <th className="p-4 font-black">Double</th>
                      <th className="p-4 font-black">Cafe (g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((s) => {
                      const grams = (s.singleCount || 0) * (settings?.gramsSingle || 7) + (s.doubleCount || 0) * (settings?.gramsDouble || 14);
                      return (
                        <tr key={s.id} className="border-b border-[#d4af37]/35 hover:bg-[#1a1410]">
                          <td className="p-4 font-bold text-slate-100">
                            {new Date(s.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="p-4 font-bold text-slate-100 tabular-nums">
                            {new Date(s.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
                          </td>
                          <td className="p-4">
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#d4af37]/20 text-slate-100 border border-[#d4af37]/30">
                              {s.label}
                            </span>
                          </td>
                          <td className="p-4 font-black text-slate-100">{s.count}</td>
                          <td className="p-4 font-bold text-[#d4af37]">{s.singleCount}</td>
                          <td className="p-4 font-bold text-slate-400">{s.doubleCount}</td>
                          <td className="p-4 font-bold text-slate-400">{grams.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* سجلات الأكواب */}
        <div className="luxe-card rounded-[2.5rem] shadow-sm overflow-hidden">
          <h3 className="text-lg font-black text-slate-100 p-6 pb-0 flex items-center gap-2">
            <Coffee size={20} className="text-[#d4af37]" />
            Journaux tasses
          </h3>
          {loading ? (
            <div className="p-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#d4af37]" size={40} />
              <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">Synchronisation...</p>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="divide-y divide-[#d4af37]/15">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-6 flex items-center justify-between hover:bg-[#1a1410] transition-all group">
                  <div className="flex items-center gap-5">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      log.type === "reset" ? "bg-amber-500/20 text-amber-400" : "bg-[#d4af37]/20 text-slate-400"
                    }`}>
                      {log.type === "reset" ? <RotateCcw size={24} /> : <Coffee size={24} />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-100 text-lg">
                        {log.type === "reset" ? "Reset de periode" :
                         log.coffeeType === "double" ? "Cafe double" : "Cafe simple"}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                          log.idhafa > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-[#111a2d] text-slate-400"
                        }`}>
                          {log.idhafa > 0 ? `+${log.idhafa} tasses` : "Mise a jour"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">•</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Machine connectee</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left border-r border-2 border-[#d4af37]/40 pr-6">
                    <p className="font-black text-slate-100 text-sm">
                        {new Date(log.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                      {new Date(log.createdAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center">
              <div className="inline-flex p-6 bg-[#111a2d] rounded-full mb-4 text-[#d4af37]">
                <AlertCircle size={40} />
              </div>
              <p className="text-slate-400 font-bold">Aucun resultat pour ce filtre</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}