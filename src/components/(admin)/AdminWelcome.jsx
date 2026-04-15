import React from "react";
import { Shield } from "lucide-react";

export default function AdminWelcome() {
  return (
    <div className="py-8 mb-6 border-b border-[#d4af37]/20 font-tajawal">
      <div className="flex flex-col gap-2">
      
        <div className="flex items-center gap-2 text-[#d4af37]">
          <Shield size={16} strokeWidth={2.5} />
          <span className="text-xs font-bold tracking-widest uppercase">
            نظام الإدارة المركزية
          </span>
        </div>

        
        <h1 className="text-4xl font-black text-[#f6e7b1] tracking-tight">
          مرحباً بك في لوحة التحكم الإدارية
        </h1>

        
        <p className="text-slate-400 font-medium leading-relaxed max-w-2xl">
          تستعرض هذه اللوحة البيانات الشاملة للمنظومة، بما في ذلك إدارة حسابات
          المستخدمين، مراقبة الأجهزة النشطة، وصلاحيات الوصول الإداري.
        </p>
      </div>
    </div>
  );
}
