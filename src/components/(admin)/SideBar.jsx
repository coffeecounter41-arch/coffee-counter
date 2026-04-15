"use client";

import React from "react";
import {
  LayoutDashboard,
  UserPlus,
  ShieldAlert,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
export default function AdminSidebar({ activePage, setActivePage }) {
  const menuItems = [
    { id: "overview", label: "الرئيسية", icon: LayoutDashboard },
    { id: "add-user", label: "العملاء", icon: UserPlus },
    { id: "add-admin", label: "المسؤولين", icon: ShieldAlert },
  ];
  const router = useRouter();

  const handleLogout = () => {
    
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");

    
    localStorage.removeItem("user_role");
    localStorage.removeItem("isLoggedIn");

    
    document.cookie =
      "admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

   
    router.replace("/admin/login");

   
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <>
      <aside className="hidden md:flex w-72 h-screen bg-[#0f131d] text-white flex-col sticky top-0 font-tajawal border-l border-[#d4af37]/20">
        <div className="p-8 border-b border-[#d4af37]/20">
          <h2 className="text-2xl font-black tracking-tighter luxe-title">
            PROSENSE
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
            Admin Control Panel
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-200 group ${
                activePage === item.id
                  ? "bg-[#d4af37] text-[#0a0d14] shadow-lg"
                  : "hover:bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                <span className="font-bold text-sm">{item.label}</span>
              </div>
              {activePage === item.id && <ChevronLeft size={16} />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#d4af37]/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-bold text-sm"
          >
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f131d] border-t border-[#d4af37]/20 flex items-center justify-around p-2 z-50 font-tajawal">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all min-w-[64px] ${
              activePage === item.id
                ? "text-[#f6e7b1] scale-110"
                : "text-slate-400"
            }`}
          >
            <item.icon
              size={22}
              strokeWidth={activePage === item.id ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold mt-1">{item.label}</span>
            {activePage === item.id && (
              <div className="w-1 h-1 bg-[#d4af37] rounded-full mt-1" />
            )}
          </button>
        ))}

        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center text-red-400 py-2 px-1"
        >
          <LogOut size={22} />
          <span className="text-[10px] font-bold mt-1">خروج</span>
        </button>
      </nav>
    </>
  );
}
