"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Coffee,
  RotateCcw,
  Clock,
  Calendar,
  Hash,
  ArrowUpRight,
  Wifi,
  WifiOff,
  AlertCircle,
  ChevronLeft,
  LayoutDashboard,
  Settings,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DeviceStatsChart from "./DeviceStatsChart";
import Navbar from "./Navbar";
import StatCard from "./StatCard";
import Link from "next/link";
import HomeFooter from "./HomeFooter";

export default function Dashboard() {
  const router = useRouter();
  const [currentFilter, setCurrentFilter] = useState("today");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    chartData: [],
    recentLogs: [],
    currentCounter: { single: 0, double: 0 },
    connection: { isOnline: false, signal: "0" },
    morningShift: 0,
    eveningShift: 0,
    monthlyTotal: 0,
    dailyTotalSent: 0,
    machineTotal: 0,
  });
  const [isResetting, setIsResetting] = useState(false);
  const [userData, setUserData] = useState({ name: "Utilisateur", devices: [] });
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [error, setError] = useState(null);
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [resetFrom, setResetFrom] = useState("COUNTER");
  const [gramsSingle, setGramsSingle] = useState(7);
  const [gramsDouble, setGramsDouble] = useState(14);
  const [clientShifts, setClientShifts] = useState([]);
  const [shiftCount, setShiftCount] = useState(2);
  const [timezone, setTimezone] = useState("Africa/Tripoli");
  const [localTime, setLocalTime] = useState("");

  // تحويل التوقيت: ليبيا/مصر UTC+2، تونس/فرنسا UTC+1
  const DISPLAY_TZ = {
    "Africa/Tripoli": "Etc/GMT-2",
    "Africa/Tunis": "Etc/GMT-1",
    "Africa/Cairo": "Etc/GMT-2",
    "Europe/Paris": "Etc/GMT-1",
  };
  const displayTz = DISPLAY_TZ[timezone] || timezone;

  // ساعة التوقيت المحلي (تحديث كل ثانية)
  useEffect(() => {
    const update = () => {
      const str = new Date().toLocaleTimeString("en-GB", {
        timeZone: displayTz,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setLocalTime(str);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [displayTz]);

  // --- 1. إدارة تسجيل الخروج (Logout Logic) ---
  const handleLogout = useCallback(() => {
  // 1. مسح كافة البيانات المحلية
  localStorage.clear();
  sessionStorage.clear();

  // 2. مسح الكوكي يدوياً للتأكد
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  // 3. استخدام التوجيه الكامل (Hard Redirect) لكسر أي State معلقة في React
  window.location.href = "/";
}, []);

  // --- 2. إدارة الجلسة ---
  useEffect(() => {
    const savedUser = localStorage.getItem("client_user");
    const token = localStorage.getItem("client_token");

    if (!token || !savedUser) {
      handleLogout();
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      setUserData(parsedUser);
      if (parsedUser.devices?.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(parsedUser.devices[0].id);
      }

      // مزامنة أحدث أسماء الأجهزة من السيرفر (بعد أي rename)
      fetch("/api/devices", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((devices) => {
          if (!Array.isArray(devices) || devices.length === 0) return;
          setUserData((prev) => ({ ...prev, devices }));
          const latestUser = { ...parsedUser, devices };
          localStorage.setItem("client_user", JSON.stringify(latestUser));
          if (!selectedDeviceId) {
            setSelectedDeviceId(devices[0].id);
          }
        })
        .catch(() => {});
    } catch (err) {
      handleLogout();
    }
  }, [handleLogout, selectedDeviceId]);

  // جلب إعدادات العميل (خصوصاً resetFrom) مرة واحدة
  useEffect(() => {
    async function loadSettings() {
      try {
        const token = localStorage.getItem("client_token");
        if (!token) return;
        const res = await fetch("/api/user/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.settings?.resetFrom) {
          setResetFrom(data.settings.resetFrom.toUpperCase());
        }
        if (data?.settings?.gramsSingle) {
          setGramsSingle(Number(data.settings.gramsSingle) || 7);
        }
        if (data?.settings?.gramsDouble) {
          setGramsDouble(Number(data.settings.gramsDouble) || 14);
        }
        if (data?.settings?.shiftCount) {
          setShiftCount(Number(data.settings.shiftCount) || 2);
        }
        if (Array.isArray(data?.settings?.shifts)) {
          setClientShifts(
            [...data.settings.shifts].sort((a, b) => Number(a.index) - Number(b.index)),
          );
        }
        if (data?.settings?.timezone) {
          setTimezone(data.settings.timezone);
        }
      } catch {
        // نتجاهل الخطأ هنا، الديفولت هو COUNTER
      }
    }
    loadSettings();
  }, []);

  // --- 3. جلب البيانات من الـ API ---
  const fetchAllData = useCallback(
    async (isInitial = false, filter = currentFilter) => {
      if (!selectedDeviceId) return;
      if (isInitial) setLoading(true);

      const token = localStorage.getItem("client_token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      };

      try {
        const [chartRes, logsRes] = await Promise.all([
          fetch(`/api/stats/chart/${selectedDeviceId}?filter=${filter}`, {
            headers,
          }),
          fetch(`/api/stats/logs/${selectedDeviceId}`, { headers }),
        ]);

        if (chartRes.status === 401 || logsRes.status === 401) {
          handleLogout();
          return;
        }

        const chartData = await chartRes.json();
        const logsData = await logsRes.json();

        setStats((prev) => ({
          ...prev,
          ...chartData,
          ...logsData,
        }));

        setError(null);
      } catch (e) {
        console.error("Fetch Error:", e);
        setError("Mise a jour impossible");
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [selectedDeviceId, handleLogout, currentFilter],
  );

  useEffect(() => {
    fetchAllData(true, currentFilter);
    const interval = setInterval(
      () => fetchAllData(false, currentFilter),
      10000,
    );
    return () => clearInterval(interval);
  }, [fetchAllData, currentFilter]);

  const currentDevice = useMemo(
    () => userData.devices?.find((d) => d.id === selectedDeviceId),
    [userData.devices, selectedDeviceId],
  );

  const sc = shiftCount || stats?.shiftCount || 2;
  const curIdx = stats?.currentShiftIndex ?? (stats?.isMorningClosed ? 2 : 1);

  const shift1Total = stats?.morningShift ?? (curIdx === 1 ? (stats?.currentCounter?.single ?? 0) + (stats?.currentCounter?.double ?? 0) : 0);
  const shift2Total = stats?.eveningShift ?? (curIdx === 2 ? (stats?.currentCounter?.single ?? 0) + (stats?.currentCounter?.double ?? 0) : 0);
  const shift3Total = stats?.nightShift ?? (curIdx === 3 ? (stats?.currentCounter?.single ?? 0) + (stats?.currentCounter?.double ?? 0) : 0);

  const shift1Single = curIdx === 1 ? (stats?.currentCounter?.single ?? 0) : (stats?.morningSingle ?? 0);
  const shift1Double = curIdx === 1 ? (stats?.currentCounter?.double ?? 0) : (stats?.morningDouble ?? 0);
  const shift2Single = curIdx === 2 ? (stats?.currentCounter?.single ?? 0) : (stats?.eveningSingle ?? 0);
  const shift2Double = curIdx === 2 ? (stats?.currentCounter?.double ?? 0) : (stats?.eveningDouble ?? 0);
  const shift3Single = curIdx === 3 ? (stats?.currentCounter?.single ?? 0) : (stats?.nightSingle ?? 0);
  const shift3Double = curIdx === 3 ? (stats?.currentCounter?.double ?? 0) : (stats?.nightDouble ?? 0);

  const totalSingleForCalculation = shift1Single + shift2Single + shift3Single;
  const totalDoubleForCalculation = shift1Double + shift2Double + shift3Double;
  const totalCoffeeGrams =
    totalSingleForCalculation * gramsSingle + totalDoubleForCalculation * gramsDouble;

  const handleReset = async () => {
    if (resetFrom === "COUNTER") {
      alert("La remise a zero est autorisee uniquement depuis le compteur.");
      return;
    }
    if (!currentDevice?.serialNumber) return;
    const curIdx = stats?.currentShiftIndex ?? (stats?.isMorningClosed ? 2 : 1);
    const isLast = curIdx >= (sc || 2);
    const action = isLast ? "Cloturer la journee et remettre les compteurs a zero" : `Cloturer la periode ${curIdx === 1 ? "matin" : "soir"}`;
    if (!confirm(`Confirmer: ${action} ?`)) return;

    setIsResetting(true);
    try {
      const res = await fetch(`/api/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("client_token")}`,
        },
        body: JSON.stringify({ serialNumber: currentDevice.serialNumber }),
      });
      if (!res.ok) throw new Error("Echec d'envoi de la commande");
      await fetchAllData(false, currentFilter);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  if (loading && !stats.monthlyTotal) return <DashboardSkeleton />;

  return (
    <div
      className="app-shell font-tajawal pb-12"
      dir="ltr"
    >
      {/* تمرير دالة handleLogout للـ Navbar */}
      <Navbar
        userData={userData}
        currentDevice={currentDevice}
        isOnline={stats?.connection?.isOnline}
        setSelectedDeviceId={setSelectedDeviceId}
        isDeviceMenuOpen={isDeviceMenuOpen}
        setIsDeviceMenuOpen={setIsDeviceMenuOpen}
        handleLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Intelligence Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          <div className="md:col-span-8 luxe-card p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Tableau de bord intelligent
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-400 text-sm font-medium">
                  Machine:
                </span>
                <span className="bg-blue-50 text-blue-700 px-3 py-0.5 rounded-full text-xs font-bold border border-blue-200">
                  {currentDevice?.serialNumber || "---"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200">
                <Clock size={16} className="text-blue-600" />
                <span className="text-sm font-black tabular-nums text-slate-900">
                  {localTime || "00:00:00"}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {{
                  "Africa/Tripoli": "Libye UTC+2",
                  "Africa/Tunis": "Tunisie UTC+1",
                  "Africa/Cairo": "Egypte UTC+2",
                  "Europe/Paris": "France UTC+1",
                  "UTC": "UTC",
                }[timezone] || timezone.split("/").pop()}
                </span>
              </div>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 ${stats?.connection?.isOnline ? "bg-white text-emerald-600" : "bg-amber-100 text-amber-700"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${stats?.connection?.isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
                />
                {stats?.connection?.isOnline ? "En ligne" : "Hors ligne"}
              </div>
              {stats?.connection?.isOnline && (
                <div className="flex items-center gap-1 px-3 text-slate-500">
                  <Wifi size={14} />
                  <span className="text-[10px] font-bold">
                    {stats?.connection?.signal}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-4 luxe-card p-6 text-slate-900 flex flex-col justify-between">
            <div>
              <p className="text-slate-400 text-xs font-bold mb-1 opacity-90">
                Total tasses
              </p>
              <h2 className="text-3xl font-black tabular-nums text-slate-900">
                {(stats?.machineTotal ?? 0).toLocaleString()}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                Total Cups
              </p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
                <Zap className="text-blue-600" size={28} />
              </div>
              <button
                onClick={handleReset}
                disabled={isResetting || resetFrom === "COUNTER"}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <RotateCcw size={14} className={isResetting ? "animate-spin" : ""} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className={`grid grid-cols-1 gap-4 ${sc >= 2 ? "sm:grid-cols-2" : ""} ${sc >= 3 ? "lg:grid-cols-3" : ""}`}>
              {sc >= 1 && (
                <StatCard
                  variant="morning"
                  title="Periode matin"
                  value={shift1Total}
                  singleCount={shift1Single}
                  doubleCount={shift1Double}
                  subtext={curIdx === 1 ? "En cours ☀️" : "Terminee ✅"}
                />
              )}
              {sc >= 2 && (
                <StatCard
                  variant="evening"
                  title="Periode soir"
                  value={shift2Total}
                  singleCount={shift2Single}
                  doubleCount={shift2Double}
                  subtext={curIdx === 2 ? "En cours 🌙" : curIdx > 2 ? "Terminee ✅" : "En attente..."}
                />
              )}
              {sc >= 3 && (
                <StatCard
                  variant="night"
                  title="Periode nuit"
                  value={shift3Total}
                  singleCount={shift3Single}
                  doubleCount={shift3Double}
                  subtext={curIdx === 3 ? "En cours 🌙" : "En attente..."}
                />
              )}
            </div>

            <div className="luxe-card p-6 rounded-[2.5rem] min-h-[420px]">
              <DeviceStatsChart
                data={stats?.chartData || []}
                shifts={clientShifts}
                onFilterChange={(newFilter) => {
                  setCurrentFilter(newFilter);
                  fetchAllData(true, newFilter);
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="luxe-card text-slate-100 p-8 rounded-[2.5rem] relative overflow-hidden group min-h-[220px] flex flex-col justify-center">
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-[#d4af37] mb-4">
                  <Calendar size={20} className="drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    Monthly Report
                  </span>
                </div>
                <h3 className="text-slate-400 font-bold text-sm">
                  Production du mois{" "}
                  {new Date().toLocaleString("ar-EG", { month: "long" })}
                </h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-6xl font-black text-slate-100 tracking-tighter">
                    {stats?.monthlyTotal}
                  </span>
                  <span className="text-[#d4af37] font-bold text-lg">tasses</span>
                </div>
              </div>
              <div className="absolute -bottom-8 -right-8 text-[#d4af37]/10 group-hover:scale-110 transition-transform duration-700 drop-shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                <Coffee size={200} />
              </div>
            </div>

            <div className="luxe-card p-7 rounded-[2.5rem]">
              <div className="mb-6 rounded-2xl p-4 bg-[#0b1326] text-slate-100 border-2 border-[#d4af37]/35">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Consommation cafe estimee
                </p>
                <p className="text-3xl font-black mt-1 text-slate-100">
                  {Number.isFinite(totalCoffeeGrams)
                    ? totalCoffeeGrams.toLocaleString()
                    : "0"}{" "}
                  g
                </p>
              </div>

              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-100 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.6)]" />{" "}
                  Compteur temps reel
                </h3>
                <div className="bg-[#0b1326] px-3 py-1 rounded-full border-2 border-[#d4af37]/35">
                  <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                    Realtime
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#d4af37]/15 border-2 border-[#d4af37]/40 p-5 rounded-[2rem] text-center shadow-[0_0_8px_rgba(212,175,55,0.15)]">
                  <span className="text-[#d4af37] text-[10px] font-black block mb-1">
                    SINGLE
                  </span>
                  <p className="text-3xl font-black text-slate-100">
                    {stats?.currentCounter?.single}
                  </p>
                </div>
                <div className="bg-amber-900/30 border border-amber-700/30 p-5 rounded-[2rem] text-center">
                  <span className="text-amber-400 text-[10px] font-black block mb-1">
                    DOUBLE
                  </span>
                  <p className="text-3xl font-black text-amber-300">
                    {stats?.currentCounter?.double}
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                disabled={isResetting || resetFrom === "COUNTER"}
                className="w-full mt-8 bg-[#d4af37] hover:bg-[#c8a124] text-[#0f172a] py-5 rounded-[1.8rem] font-black text-sm transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-[0_0_15px_rgba(212,175,55,0.35)]"
              >
                <RotateCcw
                  size={20}
                  className={isResetting ? "animate-spin" : ""}
                />
                Changer de periode
              </button>
            </div>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="luxe-card rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b-2 border-[#d4af37]/35 flex justify-between items-center">
            <h3 className="font-black text-slate-100 flex items-center gap-3">
              <div className="bg-[#d4af37] p-2 rounded-xl text-[#0f172a] shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                <Clock size={18} className="drop-shadow-[0_0_4px_rgba(0,0,0,0.3)]" />
              </div>
              Dernieres operations
            </h3>
            <Link
              href="/dashboard/logs"
              className="text-xs font-bold text-slate-400 hover:text-[#f4d27a] flex items-center gap-1"
            >
              Journal complet <ChevronLeft size={16} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm luxe-table">
              <thead>
                <tr className="text-slate-400 border-b-2 border-[#d4af37]/35 uppercase tracking-widest text-[10px]">
                  <th className="p-8 font-black">Type</th>
                  <th className="p-8 font-black">Heure</th>
                  <th className="p-8 font-black">Valeur</th>
                  <th className="p-8 font-black text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentLogs?.length > 0 ? (
                  stats.recentLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-[#d4af37]/20 hover:bg-[#0b1326] transition-colors"
                    >
                      <td className="p-8">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full shadow-[0_0_4px_rgba(212,175,55,0.4)] ${log.idhafa === 2 ? "bg-indigo-500" : "bg-sky-500"}`}
                          />
                          <span className="font-black text-slate-200">
                            {log.title}
                          </span>
                        </div>
                      </td>
                      <td className="p-8 text-slate-400 font-medium">
                        {new Date(log.time).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-8 font-black text-slate-200">
                        <span className="bg-[#0b1326] border-2 border-[#d4af37]/35 px-3 py-1 rounded-full text-xs">
                          +{log.idhafa} tasses
                        </span>
                      </td>
                      <td className="p-8 text-left">
                        <span className="bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-700/30 inline-flex items-center gap-1">
                          <ShieldCheck size={12} /> Termine
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-20 text-center text-slate-400 font-bold"
                    >
                      Aucune operation aujourd'hui
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}

// Skeleton Components (نفس الكود الخاص بك)
function DashboardSkeleton() {
  return (
    <div
      className="min-h-screen bg-[#0f172a] p-8 animate-pulse max-w-7xl mx-auto space-y-8"
      dir="ltr"
    >
      <div className="h-24 bg-[#111a2d] rounded-[2rem] w-full shadow-sm border border-[#d4af37]/20" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-40 bg-[#111a2d] rounded-[2rem] border border-[#d4af37]/20" />
            <div className="h-40 bg-[#111a2d] rounded-[2rem] border border-[#d4af37]/20" />
          </div>
          <div className="h-96 bg-[#111a2d] rounded-[2.5rem] border border-[#d4af37]/20" />
        </div>
        <div className="space-y-6">
          <div className="h-60 bg-[#111a2d] rounded-[2.5rem] border border-[#d4af37]/20" />
          <div className="h-80 bg-[#111a2d] rounded-[2.5rem] border border-[#d4af37]/20" />
        </div>
      </div>
    </div>
  );
}
