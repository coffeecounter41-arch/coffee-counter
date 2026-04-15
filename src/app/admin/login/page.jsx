"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, ArrowLeft, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  async function onSubmit(ev) {
    ev.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // Store token for frontend API calls
        localStorage.setItem("admin_token", data.token);

        // Store admin profile
        localStorage.setItem("admin_user", JSON.stringify(data.admin));

        // Store auth state
        localStorage.setItem("user_role", "admin");
        localStorage.setItem("isLoggedIn", "true");

        // Add token to cookie for middleware
        const maxAge = 12 * 60 * 60; 
        document.cookie = `token=${data.token}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;

        // Redirect admin
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Acces refuse");
      }
    } catch (err) {
      setError("Connexion au serveur d'administration impossible");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center app-shell p-6 font-tajawal"
      dir="ltr"
    >
      <div className="w-full max-w-[400px]">
        <div className="luxe-card rounded-[2.5rem] shadow-2xl overflow-hidden border-t-4 border-t-[#d4af37]">
          <div className="bg-[#0e1320] p-8 text-center space-y-3">
            <div className="inline-flex p-3 bg-[#d4af37]/10 rounded-2xl backdrop-blur-md border border-[#d4af37]/25 text-[#f6e7b1]">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-xl font-black text-white">
              Portail administrateur
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Authorized Personnel Only
            </p>
          </div>

          <form onSubmit={onSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-50 border-r-4 border-red-500 text-red-600 p-4 rounded-xl flex items-center gap-3 text-xs font-bold animate-in fade-in zoom-in duration-300">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-wider">
                Identification / Email
              </label>
              <input
                type="email"
                placeholder="admin@coffee-counter.tn"
                className="admin-input text-left"
                dir="ltr"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-wider">
                Cle de securite / Mot de passe
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="admin-input text-left"
                dir="ltr"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#d4af37] hover:bg-[#c8a124] text-[#0a0d14] font-black py-4.5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] disabled:bg-gray-600 mt-4 group"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span>Ouvrir la session admin</span>
                  <ArrowLeft
                    size={18}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .admin-input {
          width: 100%;
          background: #0e1320;
          border: 2px solid rgba(212, 175, 55, 0.2);
          border-radius: 1.25rem;
          padding: 1rem 1.25rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: #e5e7eb;
          outline: none;
          transition: all 0.3s ease;
        }
        .admin-input:focus {
          border-color: rgba(212, 175, 55, 0.45);
          background: #131a28;
        }
      `}</style>
    </div>
  );
}
