"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../../../../components/(user)/Navbar";
import { ArrowRight, Loader2, Edit2, Cpu } from "lucide-react";

export default function ClientDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [localNames, setLocalNames] = useState({});

  const handleLogout = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
  }, []);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("client_token");
      const res = await fetch("/api/devices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Echec de chargement des machines");
      const list = Array.isArray(data) ? data : [];
      setDevices(list);
      setSelectedDeviceId(list[0]?.id || null);
      const savedUser = localStorage.getItem("client_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          parsed.devices = list;
          localStorage.setItem("client_user", JSON.stringify(parsed));
        } catch {}
      }
      const names = {};
      list.forEach((d) => {
        names[d.id] = d.name || "";
      });
      setLocalNames(names);
    } catch (e) {
      setDevices([]);
      setError(e?.message || "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("client_token");
    const savedUser = localStorage.getItem("client_user");
    if (!token || !savedUser) {
      handleLogout();
      return;
    }
    fetchDevices();
  }, [fetchDevices, handleLogout]);

  const currentDevice = useMemo(() => {
    if (!Array.isArray(devices)) return null;
    return devices.find((d) => d.id === selectedDeviceId) || null;
  }, [devices, selectedDeviceId]);

  const handleSaveName = async (deviceId) => {
    const name = (localNames[deviceId] || "").trim();
    if (!name) {
      setError("Le nom de la machine ne peut pas etre vide");
      return;
    }
    setSavingId(deviceId);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("client_token");
      const res = await fetch(`/api/user/devices/${deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Echec de sauvegarde du nom");

      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, name: data.name } : d)),
      );
      const savedUser = localStorage.getItem("client_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          parsed.devices = Array.isArray(parsed.devices)
            ? parsed.devices.map((d) =>
                d.id === deviceId ? { ...d, name: data.name } : d,
              )
            : parsed.devices;
          localStorage.setItem("client_user", JSON.stringify(parsed));
        } catch {}
      }
      setSuccess("Nom de machine mis a jour avec succes");
    } catch (e) {
      setError(e?.message || "Une erreur est survenue");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="app-shell font-tajawal pb-12" dir="ltr">
      <Navbar
        userData={{ devices: devices || [] }}
        currentDevice={currentDevice}
        isOnline={true}
        isDeviceMenuOpen={isDeviceMenuOpen}
        setIsDeviceMenuOpen={setIsDeviceMenuOpen}
        setSelectedDeviceId={setSelectedDeviceId}
        handleLogout={handleLogout}
      />

      <div className="max-w-4xl mx-auto px-6 pt-8 space-y-6">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2 text-slate-400 hover:text-[#f4d27a] transition-all"
        >
          <div className="p-2 bg-[#111a2d] rounded-xl border border-[#d4af37]/20 shadow-sm group-hover:bg-[#18233a] group-hover:border-[#d4af37]/40 transition-colors">
            <ArrowRight size={20} />
          </div>
          <span className="font-bold text-sm uppercase tracking-tight">
            Retour dashboard
          </span>
        </Link>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-[#f8e7b0] tracking-tight leading-tight">
              Machines associees
            </h1>
            <p className="text-slate-400 font-bold text-sm mt-2">
              Attribuez un nom personnalise a chaque machine
            </p>
          </div>
        </header>

        {(error || success) && (
          <div
            className={`p-4 rounded-[1.8rem] text-sm font-bold border shadow-sm ${
              error
                ? "bg-rose-50 border-rose-100 text-rose-600"
                : "bg-emerald-50 border-emerald-100 text-emerald-700"
            }`}
          >
            {error || success}
          </div>
        )}

        {loading ? (
          <div className="p-16 luxe-card rounded-[2rem] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-sky-600" size={32} />
            <p className="text-xs text-stone-400 font-black uppercase tracking-[0.2em]">
              Chargement des machines
            </p>
          </div>
        ) : devices.length === 0 ? (
          <div className="p-16 luxe-card rounded-[2rem] text-center text-slate-400 font-bold">
            Aucune machine enregistree
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((dev) => (
              <div
                key={dev.id}
                className="luxe-card rounded-[2rem] p-4 flex items-center gap-4"
              >
                <div className="p-3 rounded-2xl bg-[#0b1326] text-[#f4d27a] border border-[#d4af37]/20">
                  <Cpu size={20} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <span className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">
                      {dev.serialNumber}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      Statut:{" "}
                      <span
                        className={
                          dev.status === "active"
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }
                      >
                        {dev.status}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={localNames[dev.id] ?? ""}
                      onChange={(e) =>
                        setLocalNames((prev) => ({
                          ...prev,
                          [dev.id]: e.target.value,
                        }))
                      }
                      placeholder="Nom machine (ex: Machine 1 - Barista)"
                      className="flex-1 bg-[#0b1326] border border-[#d4af37]/20 rounded-[1.5rem] px-4 py-3 text-sm font-bold text-slate-100 outline-none focus:ring-4 focus:ring-[#d4af37]/10"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveName(dev.id)}
                      disabled={savingId === dev.id}
                      className="inline-flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#c8a124] text-[#0f172a] px-4 py-3 rounded-[1.5rem] text-xs font-black whitespace-nowrap disabled:opacity-50"
                    >
                      {savingId === dev.id ? (
                        <>
                          <Loader2 className="animate-spin" size={16} /> Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Edit2 size={14} /> Enregistrer le nom
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

