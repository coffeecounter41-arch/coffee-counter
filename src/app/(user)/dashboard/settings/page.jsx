"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../../../../components/(user)/Navbar";
import { ArrowRight, Loader2, Save, Shield, Coffee, RotateCcw, Clock } from "lucide-react";

const TIMEZONE_OPTIONS = [
  { value: "Africa/Tripoli", label: "Libye — UTC+2" },
  { value: "Africa/Tunis", label: "Tunisie — UTC+1" },
  { value: "Africa/Cairo", label: "Egypte — UTC+2" },
  { value: "Europe/Paris", label: "France — UTC+1" },
  { value: "UTC", label: "UTC — 0" },
];

const SHIFT_LABELS = { 1: "Matin", 2: "Soir", 3: "Nuit" };
const DEFAULT_SHIFTS = [
  { index: 1, startTime: "06:00", endTime: "14:00", label: "Matin" },
  { index: 2, startTime: "14:00", endTime: "22:00", label: "Soir" },
  { index: 3, startTime: "22:00", endTime: "06:00", label: "Nuit" },
];

export default function ClientSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);

  const [accountUsername, setAccountUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [shiftCount, setShiftCount] = useState(2);
  const [shifts, setShifts] = useState(DEFAULT_SHIFTS);

  const [gramsSingle, setGramsSingle] = useState(7);
  const [gramsDouble, setGramsDouble] = useState(14);

  const [resetFrom, setResetFrom] = useState("COUNTER");
  const [timezone, setTimezone] = useState("Africa/Tripoli");

  const handleLogout = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("client_user");
    const token = localStorage.getItem("client_token");
    if (!token || !savedUser) {
      handleLogout();
      return;
    }

    try {
      const parsed = JSON.parse(savedUser);
      const devicesList = Array.isArray(parsed?.devices) ? parsed.devices : [];
      setDevices(devicesList);
      if (devicesList.length > 0) setSelectedDeviceId(devicesList[0].id);
    } catch {
      setDevices([]);
    }
  }, [handleLogout]);

  const currentDevice = useMemo(() => {
    if (!Array.isArray(devices)) return null;
    return devices.find((d) => d.id === selectedDeviceId) || null;
  }, [devices, selectedDeviceId]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("client_token");
      const res = await fetch("/api/user/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Echec de chargement des parametres");

      setAccountUsername(data?.client?.username || "");
      setShiftCount(data?.settings?.shiftCount || 2);
      setGramsSingle(Number(data?.settings?.gramsSingle || 7));
      setGramsDouble(Number(data?.settings?.gramsDouble || 14));
      setResetFrom((data?.settings?.resetFrom || "COUNTER").toUpperCase());
      setTimezone(data?.settings?.timezone || "Africa/Tripoli");

      const apiShifts = Array.isArray(data?.settings?.shifts)
        ? data.settings.shifts
        : DEFAULT_SHIFTS;
      setShifts(apiShifts.length ? apiShifts : DEFAULT_SHIFTS);
    } catch (e) {
      setError(e?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    // تأكد أن قائمة الورديات فيها عناصر كافية حسب shiftCount
    setShifts((prev) => {
      const next = [...prev].sort((a, b) => a.index - b.index);
      for (let i = 1; i <= shiftCount; i++) {
        if (!next.find((s) => s.index === i)) {
          const fallback = DEFAULT_SHIFTS.find((s) => s.index === i) || {
            index: i,
            startTime: "00:00",
            endTime: "00:00",
          };
          next.push({ ...fallback });
        }
      }
      return next
        .filter((s) => s.index >= 1 && s.index <= shiftCount)
        .sort((a, b) => a.index - b.index);
    });
  }, [shiftCount]);

  const onSave = async () => {
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("Le mot de passe et sa confirmation ne correspondent pas");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("client_token");
      const payload = {
        username: accountUsername,
        password: newPassword || undefined,
        shiftCount,
        shifts,
        gramsSingle: Number(gramsSingle),
        gramsDouble: Number(gramsDouble),
        resetFrom,
        timezone,
      };

      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Echec de sauvegarde");

      setSuccess("Parametres enregistres avec succes");
      setNewPassword("");
      setConfirmPassword("");

      // حدّث localStorage للـ username (اختياري)
      const savedUser = localStorage.getItem("client_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          parsed.username = accountUsername;
          localStorage.setItem("client_user", JSON.stringify(parsed));
        } catch {}
      }
    } catch (e) {
      setError(e?.message || "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-transparent font-tajawal text-slate-100 pb-12" dir="ltr">
      <Navbar
        userData={{ devices: devices || [] }}
        currentDevice={currentDevice}
        isOnline={true}
        isDeviceMenuOpen={isDeviceMenuOpen}
        setIsDeviceMenuOpen={setIsDeviceMenuOpen}
        setSelectedDeviceId={setSelectedDeviceId}
        handleLogout={handleLogout}
      />

      <div className="max-w-4xl mx-auto px-6 pt-8 space-y-8">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2 text-slate-400 hover:text-[#f4d27a] transition-all"
        >
          <div className="p-2 bg-[#111a2d] rounded-xl border-2 border-[#d4af37]/40 shadow-sm group-hover:bg-[#18233a] group-hover:border-[#d4af37]/40 transition-colors">
            <ArrowRight size={20} />
          </div>
          <span className="font-bold text-sm uppercase tracking-tight">
            Retour au tableau de bord
          </span>
        </Link>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-100 tracking-tight leading-tight">
              Parametres
            </h1>
            <p className="text-slate-400 font-bold text-sm mt-2">
              Modifier le compte, les periodes et la consommation cafe
            </p>
          </div>

          <button
            onClick={onSave}
            disabled={saving || loading}
            className="inline-flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#a67c3d] text-[#0b1326] px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Sauvegarde...
              </>
            ) : (
              <>
                <Save size={18} /> Enregistrer
              </>
            )}
          </button>
        </header>

        {(error || success) && (
          <div
            className={`p-5 rounded-[2rem] border shadow-sm font-bold text-sm ${
              error
                ? "bg-rose-50 border-rose-100 text-rose-600"
                : "bg-emerald-50 border-emerald-100 text-emerald-700"
            }`}
          >
            {error || success}
          </div>
        )}

        {loading ? (
            <div className="p-24 flex flex-col items-center justify-center gap-4 bg-[#111a2d] rounded-[2.5rem] border-2 border-[#d4af37]/40 shadow-sm">
            <Loader2 className="animate-spin text-[#d4af37]" size={40} />
            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">
              Chargement des parametres
            </p>
          </div>
        ) : (
          <>
            {/* Account */}
            <section className="bg-[#111a2d] rounded-[2.5rem] border-2 border-[#d4af37]/40 shadow-sm p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-[#0b1326] text-[#d4af37] border-2 border-[#d4af37]/40">
                  <Shield size={18} />
                </div>
                <div>
                  <h2 className="font-black text-slate-100 text-lg">Compte</h2>
                  <p className="text-slate-400 font-bold text-xs">
                    Vous pouvez modifier le nom d'utilisateur et le mot de passe
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 font-black uppercase tracking-wider mb-2">
                    Nom d'utilisateur
                  </label>
                  <input
                    value={accountUsername}
                    onChange={(e) => setAccountUsername(e.target.value)}
                    className="w-full bg-[#0b1326] border-2 border-[#d4af37]/40 rounded-[1.6rem] px-5 py-4 outline-none focus:ring-4 focus:ring-[#d4af37]/20 transition-all shadow-sm font-bold text-slate-100"
                    placeholder="Username"
                    autoComplete="username"
                  />
                </div>
                <div />

                <div>
                  <label className="block text-[11px] text-slate-400 font-black uppercase tracking-wider mb-2">
                    Nouveau mot de passe (optionnel)
                  </label>
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type="password"
                    className="w-full bg-[#0b1326] border-2 border-[#d4af37]/40 rounded-[1.6rem] px-5 py-4 outline-none focus:ring-4 focus:ring-[#d4af37]/20 transition-all shadow-sm font-bold text-slate-100"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-black uppercase tracking-wider mb-2">
                    Confirmation du mot de passe
                  </label>
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    className="w-full bg-[#0b1326] border-2 border-[#d4af37]/40 rounded-[1.6rem] px-5 py-4 outline-none focus:ring-4 focus:ring-[#d4af37]/20 transition-all shadow-sm font-bold text-slate-100"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </section>

            {/* Timezone */}
            <section className="bg-[#111a2d] rounded-[2.5rem] border-2 border-[#d4af37]/40 shadow-sm p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-[#0b1326] text-[#d4af37] border-2 border-[#d4af37]/40">
                  <Clock size={18} />
                </div>
                <div>
                  <h2 className="font-black text-slate-100 text-lg">Fuseau horaire</h2>
                  <p className="text-slate-400 font-bold text-xs">
                    Definit les horaires des periodes et de l'interface
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 font-black uppercase tracking-wider mb-2">
                  Fuseau
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[#0b1326] border-2 border-[#d4af37]/40 rounded-[1.6rem] px-5 py-4 outline-none focus:ring-4 focus:ring-[#d4af37]/20 transition-all shadow-sm font-bold text-slate-100"
                >
                  {TIMEZONE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Reset behavior */}
            <section className="bg-[#111a2d] rounded-[2.5rem] border-2 border-[#d4af37]/40 shadow-sm p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-[#0b1326] text-[#d4af37] border-2 border-[#d4af37]/40">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h2 className="font-black text-slate-100 text-lg">
                    Comportement de reset
                  </h2>
                  <p className="text-slate-400 font-bold text-xs">
                    Choisissez la source autorisee pour reset et changement de periode
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setResetFrom("COUNTER")}
                  className={`p-4 rounded-2xl border text-right text-sm font-bold transition-all ${
                    resetFrom === "COUNTER"
                      ? "border-emerald-400 bg-emerald-500/15 text-emerald-300 shadow-sm"
                      : "border-2 border-[#d4af37]/40 bg-[#0b1326] text-slate-400 hover:border-[#d4af37]/40"
                  }`}
                >
                  Depuis le compteur
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Securite maximale - reset impossible depuis le site
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setResetFrom("DASHBOARD")}
                  className={`p-4 rounded-2xl border text-right text-sm font-bold transition-all ${
                    resetFrom === "DASHBOARD"
                      ? "border-[#d4af37] bg-[#d4af37]/15 text-slate-100 shadow-sm"
                      : "border-2 border-[#d4af37]/40 bg-[#0b1326] text-slate-400 hover:border-[#d4af37]/40"
                  }`}
                >
                  Depuis le dashboard
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Reset uniquement depuis le site
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setResetFrom("BOTH")}
                  className={`p-4 rounded-2xl border text-right text-sm font-bold transition-all ${
                    resetFrom === "BOTH"
                      ? "border-[#d4af37] bg-[#d4af37]/20 text-slate-100 shadow-sm"
                      : "border-2 border-[#d4af37]/40 bg-[#0b1326] text-slate-400 hover:border-[#d4af37]/40"
                  }`}
                >
                  Depuis les deux
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Plus de flexibilite - actions autorisees des deux cotes
                  </p>
                </button>
              </div>
            </section>

            {/* Shifts */}
            <section className="bg-[#111a2d] rounded-[2.5rem] border-2 border-[#d4af37]/40 shadow-sm p-7">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-black text-slate-100 text-lg">Periodes</h2>
                  <p className="text-slate-400 font-bold text-xs">
                    Definissez le nombre de periodes et leurs horaires
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-black uppercase tracking-wider">
                    Nombre de periodes
                  </span>
                  <select
                    value={shiftCount}
                    onChange={(e) => setShiftCount(Number(e.target.value))}
                    className="bg-[#0b1326] border-2 border-[#d4af37]/40 rounded-2xl px-4 py-3 font-black text-sm shadow-sm outline-none focus:ring-4 focus:ring-[#d4af37]/20"
                  >
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n} - {SHIFT_LABELS[n]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shifts
                  .filter((s) => s.index <= shiftCount)
                  .sort((a, b) => a.index - b.index)
                  .map((shift) => (
                    <div
                      key={shift.index}
                      className="border-2 border-[#d4af37]/40 rounded-[2rem] p-5 bg-[#0b1326]"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-black text-slate-100">
                          {SHIFT_LABELS[shift.index] || `Periode ${shift.index}`}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Shift
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 font-black uppercase tracking-wider mb-2">
                            Debut
                          </label>
                          <input
                            type="time"
                            value={shift.startTime}
                            onChange={(e) => {
                              const v = e.target.value;
                              setShifts((prev) =>
                                prev.map((s) =>
                                  s.index === shift.index ? { ...s, startTime: v } : s,
                                ),
                              );
                            }}
                            className="w-full bg-[#111a2d] border-2 border-[#d4af37]/40 rounded-2xl px-4 py-3 font-black text-sm shadow-sm outline-none focus:ring-4 focus:ring-[#d4af37]/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 font-black uppercase tracking-wider mb-2">
                            Fin
                          </label>
                          <input
                            type="time"
                            value={shift.endTime}
                            onChange={(e) => {
                              const v = e.target.value;
                              setShifts((prev) =>
                                prev.map((s) =>
                                  s.index === shift.index ? { ...s, endTime: v } : s,
                                ),
                              );
                            }}
                            className="w-full bg-[#111a2d] border-2 border-[#d4af37]/40 rounded-2xl px-4 py-3 font-black text-sm shadow-sm outline-none focus:ring-4 focus:ring-[#d4af37]/20"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {/* Coffee consumption */}
            <section className="bg-[#111a2d] rounded-[2.5rem] border-2 border-[#d4af37]/40 shadow-sm p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-[#d4af37] text-[#0b1326]">
                  <Coffee size={18} />
                </div>
                <div>
                  <h2 className="font-black text-slate-100 text-lg">Consommation cafe</h2>
                  <p className="text-slate-400 font-bold text-xs">
                    Reglez les grammes par shot, le calcul apparait automatiquement
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 font-black uppercase tracking-wider mb-2">
                    Grammes par single (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={gramsSingle}
                    onChange={(e) => setGramsSingle(e.target.value)}
                    className="w-full bg-[#0b1326] border-2 border-[#d4af37]/40 rounded-[1.6rem] px-5 py-4 outline-none focus:ring-4 focus:ring-[#d4af37]/20 transition-all shadow-sm font-bold text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-black uppercase tracking-wider mb-2">
                    Grammes par double (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={gramsDouble}
                    onChange={(e) => setGramsDouble(e.target.value)}
                    className="w-full bg-[#0b1326] border-2 border-[#d4af37]/40 rounded-[1.6rem] px-5 py-4 outline-none focus:ring-4 focus:ring-[#d4af37]/20 transition-all shadow-sm font-bold text-slate-100"
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

