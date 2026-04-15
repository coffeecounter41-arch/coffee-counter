"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminSidebar from "../../../components/(admin)/SideBar";
import AdminWelcome from "../../../components/(admin)/AdminWelcome";
import AdminStats from "../../../components/(admin)/AdminStats";
import AddUser from "../../../components/(admin)//AddUser";
import AddAdmin from "../../../components/(admin)/AddAdmin";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // قراءة الحالة من الرابط مباشرة لضمان التزامن
  const activePage = searchParams.get("tab") || "overview";

  // دالة تغيير التبويب التي سنمررها للسايدبار والـ CTA
  const handlePageChange = (tabName) => {
    router.push(`?tab=${tabName}`, { scroll: false });
  };

  return (
    <div className="flex min-h-screen app-shell" dir="rtl">
      {/* السايدبار (جانبي في الديسكتوب وسفلي في الموبايل) */}
      <AdminSidebar activePage={activePage} setActivePage={handlePageChange} />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto pb-32 md:pb-10">
        <AdminWelcome />

        <div className="mt-8">
          {/* عرض الإحصائيات والإجراءات السريعة في الواجهة الرئيسية */}
          {activePage === "overview" && (
            <AdminStats setActivePage={handlePageChange} />
          )}

          {/* مكون إضافة عميل وجدول العملاء */}
          {activePage === "add-user" && (
            <div className="w-full">
              <AddUser />
            </div>
          )}

          {/* مكون إضافة مسؤول وجدول الإدارة */}
          {activePage === "add-admin" && (
            <div className="w-full">
              <AddAdmin />
            </div>
          )}

          {/* قسم الإعدادات (فارغ حالياً) */}
          {activePage === "settings" && (
            <div className="luxe-card rounded-[2.5rem] p-12 text-center">
              <p className="text-slate-400 font-bold">
                إعدادات النظام ستكون متاحة قريباً
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center app-shell font-tajawal">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#f6e7b1] font-black">
              جاري مزامنة البيانات...
            </p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
