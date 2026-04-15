"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  User,
  Mail,
  Lock,
  Key,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
} from "lucide-react";

export default function AddAdmin() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [admins, setAdmins] = useState([]);

  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    adminId: null,
    adminName: "",
  });

 
  const fetchAdmins = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/system-admins");
      const data = await res.json();
      if (res.ok) setAdmins(data);
    } catch (err) {
      console.error("Fetch error");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ name: "", email: "", password: "" });
        await fetchAdmins();
        
      } else {
        const err = await res.json();
        alert(err.error || "فشل في إنشاء الحساب");
      }
    } finally {
      setLoading(false);
    }
  };

 
  const confirmDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/system-admins?id=${deleteModal.adminId}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        setDeleteModal({ show: false, adminId: null, adminName: "" });
        await fetchAdmins();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 font-tajawal animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-0">
      
      <div className="luxe-card rounded-[2.5rem] shadow-sm overflow-hidden border-b-2 border-b-[#d4af37]/35">
        <div className="p-8 border-b border-[#d4af37]/20 bg-[#0e1320] flex items-center gap-4">
          <div className="p-3 bg-[#d4af37] rounded-2xl text-[#0a0d14] shadow-lg shadow-[#d4af37]/20">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#f6e7b1] italic">
              S.P.A - System Privileged Access
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              تسجيل مسؤول نظام جديد - صلاحيات الوصول للمركز الرئيسي
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">
              Full Legal Name
            </label>
            <div className="relative">
              <User
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="text"
                placeholder="الاسم الثلاثي للمسؤول"
                className="admin-field"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">
              Enterprise Email
            </label>
            <div className="relative">
              <Mail
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="email"
                placeholder="admin@prosense.ly"
                className="admin-field text-left font-mono"
                dir="ltr"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">
              Access Credentials
            </label>
            <div className="relative">
              <Lock
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="password"
                placeholder="••••••••"
                className="admin-field text-left font-mono"
                dir="ltr"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="md:col-span-3 pt-6 border-t border-[#d4af37]/20 flex justify-between items-center">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle size={14} />
              <span className="text-[10px] font-bold uppercase">
                تنبيه: الحساب الجديد سيمتلك صلاحيات كاملة للتعديل والحذف
              </span>
            </div>
            <button
              disabled={loading}
              className="bg-[#d4af37] hover:bg-[#c8a124] text-[#0a0d14] font-black px-12 py-4 rounded-2xl transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : (
                <Key size={18} />
              )}
              إنشاء صلاحية الوصول
            </button>
          </div>
        </form>
      </div>

      
      <div className="luxe-card rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#d4af37]/20 bg-[#0e1320] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-400" size={20} />
            <h3 className="font-black text-[#f6e7b1] text-lg italic">
              Active Administrators Registry
            </h3>
          </div>
          <span className="bg-[#d4af37]/10 text-[#f6e7b1] border border-[#d4af37]/25 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter flex items-center">
            Security Level: Grade A
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right luxe-table">
            <thead className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-[#d4af37]/20">
              <tr>
                <th className="px-8 py-4">المسؤول</th>
                <th className="px-8 py-4 text-center">تاريخ التعيين</th>
                <th className="px-8 py-4 text-left">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4af37]/15">
              {fetching ? (
                <tr>
                  <td
                    colSpan="3"
                    className="text-center py-10 text-slate-400 font-bold"
                  >
                    جاري تحديث السجل 
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="hover:bg-[#1a1410] transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#d4af37]/10 rounded-full flex items-center justify-center text-[#f6e7b1] font-black text-xs border border-[#d4af37]/25">
                          {admin.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">
                            {admin.name}
                          </div>
                          <div
                            className="text-[11px] text-slate-400 font-mono tracking-tighter"
                            dir="ltr"
                          >
                            {admin.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center text-xs text-slate-400 font-bold">
                      {new Date(admin.createdAt).toLocaleDateString("ar-LY")}
                    </td>
                    <td className="px-8 py-6 text-left">
                      <button
                        onClick={() =>
                          setDeleteModal({
                            show: true,
                            adminId: admin.id,
                            adminName: admin.name,
                          })
                        }
                        className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      
      {deleteModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-coffee-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="luxe-card rounded-[3rem] max-w-sm w-full p-10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-red-50/50">
              <ShieldAlert size={40} />
            </div>
            <h3 className="text-xl font-black text-[#f6e7b1] mb-2">
              سحب صلاحيات المسؤول
            </h3>
            <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
              هل أنت متأكد من رغبتك في إزالة <b>{deleteModal.adminName}</b>؟ هذا
              الإجراء سيمنعه من دخول النظام فوراً.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteModal({ show: false, adminId: null, adminName: "" })
                }
                className="flex-1 py-4 font-bold text-slate-300 bg-[#0e1320] rounded-2xl hover:bg-[#1b2233] transition-all border border-[#d4af37]/20"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-field {
          width: 100%;
          background: #0e1320;
          border: 2px solid rgba(212, 175, 55, 0.2);
          border-radius: 1.25rem;
          padding: 1rem 3rem 1rem 1rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: #e5e7eb;
          outline: none;
          transition: all 0.3s ease;
        }
        .admin-field:focus {
          border-color: rgba(212, 175, 55, 0.45);
          background: #131a28;
          box-shadow: 0 10px 30px -15px rgba(212, 175, 55, 0.25);
        }
      `}</style>
    </div>
  );
}
