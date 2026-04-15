"use client";
import React from "react";
import { UserPlus, Save, RefreshCw, Eye, EyeOff } from "lucide-react";

export default function UserForm({
  formData,
  setFormData,
  loading,
  onSubmit,
  showPassword,
  setShowPassword,
}) {
  return (
    <div className="luxe-card rounded-[2.5rem] shadow-xl overflow-hidden font-tajawal">
      {/* Header */}
      <div className="p-6 bg-[#0e1320] text-white font-black flex items-center gap-2 border-b border-[#d4af37]/20">
        <UserPlus size={20} className="text-[#d4af37]" /> إضافة مقهى جديد
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-4">
        {/* الاسم التجاري */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">
            Brand Name
          </label>
          <input
            required
            placeholder="اسم المقهى"
            className="admin-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        {/* المدينة والعنوان */}
        <div className="grid grid-cols-2 gap-2">
          <input
            required
            placeholder="المدينة"
            className="admin-input"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <input
            required
            placeholder="العنوان"
            className="admin-input"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
        </div>

        {/* اسم المستخدم - مرن (كبير/صغير) */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">
            Username
          </label>
          <input
            required
            placeholder="اسم المستخدم (مثل: CoffeeUser)"
            className="admin-input font-mono"
            value={formData.username}
            onChange={
              (e) => setFormData({ ...formData, username: e.target.value }) // إزالة أي تحويل للحروف
            }
          />
        </div>

        {/* كلمة المرور - مرنة (كبير/صغير) */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">
            Security Password
          </label>
          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              placeholder="كلمة المرور"
              className="admin-input w-full font-mono"
              value={formData.password}
              onChange={
                (e) => setFormData({ ...formData, password: e.target.value }) // إزالة أي تحويل للحروف
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#d4af37] transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* رقم الهاتف */}
        <input
          required
          placeholder="رقم الهاتف"
          className="admin-input"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        {/* سيريال الماكينة - يبقى موحداً (Capital) */}
        <div className="space-y-1 p-4 bg-[#d4af37]/10 rounded-2xl border border-[#d4af37]/20">
          <label className="text-[10px] font-black text-[#f6e7b1] mr-2 uppercase tracking-widest">
            Machine Serial
          </label>
          <input
            required
            placeholder="السيريال ps-1234 أو PS-1234"
            className="admin-input font-mono border-dashed border-[#d4af37]/40" // أزلت كلاس uppercase من هنا
            value={formData.serial}
            onChange={(e) =>
              setFormData({ ...formData, serial: e.target.value })
            } // أزلت .toUpperCase() من هنا
          />
        </div>

        {/* زر الإرسال */}
        <button
          disabled={loading}
          className="w-full py-4 bg-[#d4af37] text-[#0a0d14] rounded-2xl font-black shadow-lg shadow-[#d4af37]/20 hover:bg-[#c8a124] transition-all flex justify-center gap-2 items-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <RefreshCw className="animate-spin" />
          ) : (
            <Save size={18} />
          )}{" "}
          حفظ وتفعيل الحساب
        </button>
      </form>

      <style jsx>{`
        .admin-input {
          background: #0e1320;
          border: 2px solid rgba(212, 175, 55, 0.2);
          border-radius: 1.25rem;
          padding: 1rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 700;
          color: #e5e7eb;
          outline: none;
          transition: all 0.3s ease;
          text-align: right;
          width: 100%;
        }
        .admin-input:focus {
          border-color: rgba(212, 175, 55, 0.45);
          background: #131a28;
          box-shadow: 0 4px 20px -10px rgba(212, 175, 55, 0.25);
        }
      `}</style>
    </div>
  );
}
