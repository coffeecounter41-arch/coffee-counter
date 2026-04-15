"use client";
import React from "react";
import Link from "next/link";
import { MapPin, Phone, Cpu, Edit3, Trash2, Coffee, Activity } from "lucide-react";

export default function UserTable({ users, onEdit, onDelete }) {
  return (
    <div className="luxe-card rounded-[2.5rem] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse luxe-table">
          <thead className="text-slate-300 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">المقهى والمنطقة</th>
              <th className="px-8 py-5 text-center">الأجهزة والإحصائيات</th>
              <th className="px-8 py-5 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d4af37]/15">
            {users.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-8 py-20 text-center text-slate-400 font-bold">
                  لا يوجد عملاء مسجلين حالياً
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#1a1410] transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="font-black text-slate-100 text-lg leading-tight">
                      {user.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-bold mt-2">
                      <span className="flex items-center gap-1 bg-[#0e1320] px-2 py-0.5 rounded text-[#f6e7b1] font-mono border border-[#d4af37]/20">
                        {user.username}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-cyan-500" />{" "}
                        {user.city || "غير محدد"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {user.phone}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-8 py-6 text-center">
                    {user.devices?.length > 0 ? (
                      <div className="flex flex-col gap-2 items-center">
                        {user.devices.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center gap-3 bg-[#0e1320] px-3 py-1.5 rounded-xl border border-[#d4af37]/20"
                          >
                            <div className="flex items-center gap-1 text-cyan-700 font-mono font-black text-[10px]">
                              <Cpu size={12} /> {d.serialNumber}
                            </div>
                            <div className="h-4 w-[1px] bg-[#d4af37]/30"></div>
                            <div className="flex items-center gap-1 text-emerald-600 font-black text-[10px]">
                              <Coffee size={12} /> {d.totalCups.toLocaleString()} كوب
                            </div>
                          <Link
                            href={`/admin/dashboard/diagnostic/${d.id}`}
                            className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100 hover:bg-cyan-100"
                            title="تشخيص الجهاز"
                          >
                            <Activity size={11} />
                            تشخيص
                          </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs italic">
                        لا توجد أجهزة مرتبطة
                      </span>
                    )}
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => onEdit(user)}
                        className="p-3 bg-[#0e1320] text-[#f6e7b1] rounded-xl hover:bg-[#d4af37] hover:text-[#0a0d14] transition-all shadow-sm border border-[#d4af37]/20"
                        title="تعديل"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(user)}
                        className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}