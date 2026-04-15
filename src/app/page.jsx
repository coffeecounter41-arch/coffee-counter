"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Lock, User, AlertCircle } from "lucide-react";
import HomeFooter from "../components/(user)/HomeFooter";

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ username: "", password: "" });

 
  const getCookie = (name) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };
const checkSession = useCallback(() => {
  try {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const token = getCookie("token");

    // Redirect only with a valid token
    if (isLoggedIn === "true" && token) {
      router.replace("/dashboard");
    } else {
      // Clean stale session fragments
      if (isLoggedIn || token) {
        localStorage.clear();
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
      setIsCheckingSession(false);
    }
  } catch (e) {
    setIsCheckingSession(false);
  }
}, [router]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  async function onSubmit(ev) {
    ev.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/client-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
      
        localStorage.setItem("client_token", data.token);
        localStorage.setItem("client_user", JSON.stringify(data.user));
        localStorage.setItem("user_role", "client");
        localStorage.setItem("isLoggedIn", "true");

        
        const maxAge = 30 * 24 * 60 * 60;
        document.cookie = `token=${data.token}; path=/; max-age=${maxAge}; SameSite=Lax; Priority=High`;

        router.push("/dashboard");
      } else {
        setError(data.error || "Identifiants invalides");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b1326] gap-4">
        <Loader2 className="animate-spin text-[#d4af37]" size={40} />
        <p className="text-slate-300 font-bold animate-pulse text-sm">Verification de session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1326] p-6 font-tajawal">
      <div className="w-full max-w-[380px] space-y-10">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <h1 className="text-3xl font-black text-[#f8e7b0] tracking-tight">
              coffee-counter
            </h1>
            <p className="text-gray-400 font-medium text-sm mt-1">
              Tableau de bord machine cafe
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-bounce">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="relative">
            <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              className="admin-input-style" 
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              autoComplete="username"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Mot de passe"
              className="admin-input-style"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#d4af37] hover:bg-[#c8a124] text-[#0f172a] font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] disabled:bg-gray-500 mt-6"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><span>Connexion</span> <ArrowLeft size={20} /></>}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-400 font-bold uppercase tracking-widest italic">
          Acces securise • coffee-counter 2026
        </p>
        <HomeFooter />
      </div>

      <style jsx>{`
        .admin-input-style {
          width: 100%;
          background: #111a2d;
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 1rem;
          padding: 1rem 3rem 1rem 1.25rem;
          color: #e5e7eb;
          outline: none;
          transition: all 0.2s ease;
          text-align: right;
        }
        .admin-input-style::placeholder {
          color: #6b7280;
        }
        .admin-input-style:focus {
          border-color: #d4af37;
          box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.12);
        }
      `}</style>
    </div>
  );
}