"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Activity,
  Loader2,
  Power,
  PlayCircle,
  StopCircle,
  AlertTriangle,
  Clock3,
} from "lucide-react";

// ترتيب العرض:
// الصف الأول: S1 S2 S3 S4 B
// الصف الثاني: A1 A2 A3 A4
const SENSOR_KEYS = ["S1", "S2", "S3", "S4", "B", "A1", "A2", "A3", "A4"];
const DEFAULT_SENSORS = {
  S1: false,
  S2: false,
  S3: false,
  S4: false,
  A1: false,
  A2: false,
  A3: false,
  A4: false,
  B: false,
};

export default function AdminDiagnosticDevicePage() {
  const params = useParams();
  const deviceId = params?.deviceId;

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [device, setDevice] = useState(null);
  const [state, setState] = useState({
    isRunning: false,
    serviceStatus: "active",
    sensors: DEFAULT_SENSORS,
    lastError: null,
  });
  const [events, setEvents] = useState([]);
  const [nfcCards, setNfcCards] = useState({ idTech: "", master1: "", master2: "" });

  const fetchData = useCallback(async () => {
    if (!deviceId) return;
    const res = await fetch(`/api/admin/diagnostic/${deviceId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "فشل جلب بيانات التشخيص");

    setDevice(data.device || null);
    setState({
      isRunning: !!data?.state?.isRunning,
      serviceStatus: data?.state?.serviceStatus || "active",
      sensors: { ...DEFAULT_SENSORS, ...(data?.state?.sensors || {}) },
      lastError: data?.state?.lastError || null,
    });
    setEvents(Array.isArray(data?.events) ? data.events : []);
    setNfcCards({
      idTech: data?.nfcCards?.idTech ? String(data.nfcCards.idTech) : "",
      master1: data?.nfcCards?.master1 ? String(data.nfcCards.master1) : "",
      master2: data?.nfcCards?.master2 ? String(data.nfcCards.master2) : "",
    });
  }, [deviceId]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await fetchData();
      } catch (e) {
        setError(e?.message || "خطأ");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchData]);

  useEffect(() => {
    if (!deviceId) return;
    const interval = setInterval(() => {
      fetchData().catch(() => {});
    }, 2500);
    return () => clearInterval(interval);
  }, [deviceId, fetchData]);

  const sendAction = async (action, extraPayload = {}) => {
    if (!deviceId) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/diagnostic/${deviceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraPayload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "فشل إرسال الأمر");
      await fetchData();
    } catch (e) {
      setError(e?.message || "حدث خطأ");
    } finally {
      setSending(false);
    }
  };

  const submitNfcCards = async () => {
    const payload = {
      idTech: Number(nfcCards.idTech || 0),
      master1: Number(nfcCards.master1 || 0),
      master2: Number(nfcCards.master2 || 0),
    };
    await sendAction("set_nfc_cards", { nfcCards: payload });
  };

  const isServiceActive = state.serviceStatus === "active";

  return (
    <main className="min-h-screen app-shell p-6 md:p-10 font-tajawal" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href="/admin/dashboard?tab=add-user"
          className="group inline-flex items-center gap-2 text-slate-400 hover:text-[#f6e7b1] transition-all"
        >
          <div className="p-2 bg-[#0e1320] rounded-xl border border-[#d4af37]/20 shadow-sm group-hover:bg-[#1b2233] transition-colors">
            <ArrowRight size={20} />
          </div>
          <span className="font-bold text-sm">العودة إلى قائمة الأجهزة</span>
        </Link>

        <section className="luxe-card rounded-[2rem] p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#f6e7b1]">
                تشخيص الجهاز
              </h1>
              <p className="text-slate-400 font-bold text-sm mt-2">
                {device
                  ? `${device.name || "بدون اسم"} • ${device.serialNumber}`
                  : "جاري تحميل بيانات الجهاز..."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={sending}
                onClick={() => sendAction(state.isRunning ? "diagno_stop" : "diagno_start")}
                className={`px-5 py-3 rounded-xl font-black text-sm inline-flex items-center gap-2 ${
                  state.isRunning
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                }`}
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : state.isRunning ? (
                  <StopCircle size={16} />
                ) : (
                  <PlayCircle size={16} />
                )}
                {state.isRunning ? "إيقاف التشخيص" : "تشغيل التشخيص"}
              </button>

              <button
                type="button"
                disabled={sending}
                onClick={() => sendAction(isServiceActive ? "out_service" : "on_service")}
                className={`px-5 py-3 rounded-xl font-black text-sm inline-flex items-center gap-2 ${
                  isServiceActive
                    ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                    : "bg-stone-200 text-stone-700 border border-stone-300"
                }`}
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                {isServiceActive ? "الحالة: Active" : "الحالة: Offline"}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl px-4 py-3 font-bold text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="luxe-card rounded-[2rem] p-16 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-cyan-600" size={34} />
            <p className="text-slate-400 font-bold">جاري تحميل التشخيص...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 luxe-card rounded-[2rem] p-6">
              <h2 className="text-xl font-black text-[#f6e7b1] inline-flex items-center gap-2 mb-4">
                <Activity size={18} /> حالة الحساسات
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {SENSOR_KEYS.map((key) => {
                  const on = !!state.sensors?.[key];
                  return (
                    <div
                      key={key}
                      className={`rounded-xl border p-4 text-center transition-all ${
                        on
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-[0_0_18px_rgba(16,185,129,0.25)]"
                          : "bg-stone-50 border-stone-200 text-stone-500"
                      }`}
                    >
                      <div
                        className={`mx-auto mb-2 w-3 h-3 rounded-full ${
                          on ? "bg-emerald-500 animate-pulse" : "bg-stone-400"
                        }`}
                      />
                      <div className="font-black text-sm">{key}</div>
                      <div className="text-[10px] font-bold mt-1">{on ? "ON" : "OFF"}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="luxe-card rounded-[2rem] p-6">
              <h2 className="text-xl font-black text-[#f6e7b1] mb-4">آخر الأخطاء</h2>
              {state.lastError ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-600">
                  <p className="font-black text-sm inline-flex items-center gap-2">
                    <AlertTriangle size={14} /> رسالة خطأ
                  </p>
                  <p className="text-sm font-bold mt-2 break-words">{state.lastError}</p>
                </div>
              ) : (
                <p className="text-stone-400 text-sm font-bold">لا توجد أخطاء حالياً</p>
              )}
            </section>

            <section className="xl:col-span-3 bg-white border border-stone-100 rounded-[2rem] p-6">
              <h2 className="text-xl font-black text-stone-800 mb-4">بطاقات NFC (IDtech / Master)</h2>
              <p className="text-xs text-stone-500 font-bold mb-4">
                عند الحفظ يتم إرسال أمر للعداد. إذا كان Offline سيتنفّذ تلقائيًا عند رجوع الاتصال.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="number"
                  min="1"
                  placeholder="IDtech"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-bold text-stone-800 outline-none focus:ring-2 focus:ring-cyan-200"
                  value={nfcCards.idTech}
                  onChange={(e) =>
                    setNfcCards((prev) => ({ ...prev, idTech: e.target.value.replace(/\D/g, "") }))
                  }
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Master 1"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-bold text-stone-800 outline-none focus:ring-2 focus:ring-cyan-200"
                  value={nfcCards.master1}
                  onChange={(e) =>
                    setNfcCards((prev) => ({ ...prev, master1: e.target.value.replace(/\D/g, "") }))
                  }
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Master 2"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-bold text-stone-800 outline-none focus:ring-2 focus:ring-cyan-200"
                  value={nfcCards.master2}
                  onChange={(e) =>
                    setNfcCards((prev) => ({ ...prev, master2: e.target.value.replace(/\D/g, "") }))
                  }
                />
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  disabled={sending}
                  onClick={submitNfcCards}
                  className="px-5 py-3 rounded-xl font-black text-sm bg-amber-100 text-amber-700 border border-amber-300 disabled:opacity-60"
                >
                  {sending ? "جاري الإرسال..." : "حفظ وإرسال للعداد"}
                </button>
              </div>
            </section>

            <section className="xl:col-span-3 bg-white border border-stone-100 rounded-[2rem] p-6">
              <h2 className="text-xl font-black text-stone-800 mb-4">سجل العمليات</h2>
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {events.length === 0 ? (
                  <p className="text-stone-400 text-sm font-bold">لا توجد عمليات مسجلة بعد</p>
                ) : (
                  events.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-stone-50 border border-stone-100 rounded-xl p-3 flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="font-black text-sm text-stone-800">
                          {ev.type === "ERROR"
                            ? "ERROR"
                            : ev.type === "SENSOR"
                              ? `SENSOR ${ev.sensorKey || ""}`
                              : ev.type === "COMMAND"
                                ? "COMMAND"
                                : "INFO"}
                        </p>
                        <p className="text-xs text-stone-500 font-bold mt-1 break-words">
                          {ev.message || "-"}
                        </p>
                      </div>
                      <div className="text-[10px] text-stone-400 font-bold whitespace-nowrap inline-flex items-center gap-1">
                        <Clock3 size={11} />
                        {new Date(ev.createdAt).toLocaleString("ar-EG")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

