"use client";

import React from "react";
import {
  Users,
  Cpu,
  ShieldCheck,
  Activity,
  UserPlus,
  ShieldPlus,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
export default function AdminStats({ setActivePage }) {
  const [liveStats, setLiveStats] = useState({
    clients: 0,
    devices: 0,
    admins: 0,
    uptime: "99.9%",
  });
  useEffect(() => {
   
    fetch("/api/admin/overview-stats")
      .then((res) => res.json())
      .then((data) => setLiveStats(data));
  }, []);
  const stats = [
    {
      id: 1,
      label: "إجمالي العملاء",
      value: liveStats.clients.toString(),
      description: "عملاء نشطين بالمنظومة",
      icon: <Users size={24} />,
      color: "text-blue-300",
      bg: "bg-blue-500/10",
    },
    {
      id: 2,
      label: "الأجهزة المضافة",
      value: liveStats.devices.toString(),
      description: "أجهزة تم ربطها وتسجيلها",
      icon: <Cpu size={24} />,
      color: "text-[#f6e7b1]",
      bg: "bg-[#d4af37]/15",
    },
    {
      id: 3,
      label: "مسؤولي النظام",
      value: liveStats.admins.toString(),
      description: "أدمن بصلاحيات كاملة",
      icon: <ShieldCheck size={24} />,
      color: "text-emerald-300",
      bg: "bg-emerald-500/10",
    },
    {
      id: 4,
      label: "حالة النظام",
      value: "99.9%",
      description: "استقرار الاتصال والسيرفر",
      icon: <Activity size={24} />,
      color: "text-amber-300",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-8 font-tajawal">
     
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="luxe-card rounded-[2rem] p-6 transition-shadow duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {stat.label}
              </p>
              <h3 className="text-3xl font-black text-slate-100">
                {stat.value}
              </h3>
              <p className="text-[11px] font-medium text-slate-400">
                {stat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

     
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="relative group overflow-hidden luxe-card rounded-[2.5rem] p-8 text-white transition-all hover:-translate-y-1">
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-[#d4af37]/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-[#d4af37]/25 text-[#f6e7b1]">
                <UserPlus size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black">تسجيل عميل جديد</h3>
                <p className="text-slate-400 text-sm font-medium mt-1 max-w-[280px]">
                  إضافة بيانات العميل وربط الرقم التسلسلي للجهاز بالمنظومة
                  المركزية.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActivePage("add-user")}
              className="flex items-center justify-center gap-2 bg-[#d4af37] text-[#0a0d14] font-black py-4 px-8 rounded-2xl w-fit transition-transform active:scale-95 text-sm"
            >
              البدء في التسجيل
              <ArrowLeft size={18} />
            </button>
          </div>
          <UserPlus
            size={180}
            className="absolute -left-10 -bottom-10 text-white/[0.03] rotate-12"
          />
        </div>


        <div className="relative group overflow-hidden luxe-card rounded-[2.5rem] p-8 transition-all hover:-translate-y-1">
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-[#d4af37]/10 rounded-2xl flex items-center justify-center text-[#f6e7b1]">
                <ShieldPlus size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-100">
                  تعيين مسؤول نظام
                </h3>
                <p className="text-slate-400 text-sm font-medium mt-1 max-w-[280px]">
                  منح صلاحيات إدارية لمستخدم جديد للتحكم في المنظومة ومراقبة
                  البيانات.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActivePage("add-admin")}
              className="flex items-center justify-center gap-2 bg-[#0e1320] border border-[#d4af37]/25 text-[#f6e7b1] font-black py-4 px-8 rounded-2xl w-fit transition-transform active:scale-95 text-sm"
            >
              إضافة مسؤول
              <ArrowLeft size={18} />
            </button>
          </div>
          <ShieldPlus
            size={180}
            className="absolute -left-10 -bottom-10 text-vanilla-100 rotate-12"
          />
        </div>
      </div>
    </div>
  );
}
