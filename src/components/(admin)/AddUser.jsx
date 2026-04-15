"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Settings2,
  X,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Lock,
  Cpu,
  Trash2,
  Key,
  UserCircle
} from "lucide-react";
import Link from "next/link";
import UserForm from "./UserForm";
import UserTable from "./UserTable";

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    phone: "",
    city: "",
    address: "",
    serial: "",
  });
  
  const [modalMode, setModalMode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/clients");
      const data = await res.json();
   
      const cleanData = Array.isArray(data) ? data.map(u => ({
        ...u,
        city: u.city || "",
        address: u.address || "",
        phone: u.phone || "",
        username: u.username || "",
        password: "", 
        devices: u.devices || []
      })) : [];
      setUsers(cleanData);
    } catch (err) { console.error("Fetch error"); }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setFormData({ name: "", username: "", password: "", phone: "", city: "", address: "", serial: "" });
      fetchClients();
    } else {
      const err = await res.json();
      setErrorMessage(err.error || "فشل إنشاء الحساب");
    }
    setLoading(false);
  };

  // ✅ التعديل هنا لضمان إرسال الـ username المحدث
  const handleUpdate = async () => {
    setLoading(true);
    setErrorMessage("");
    
    const payload = {
      id: selectedUser.id,
      name: selectedUser.name,
      username: selectedUser.username, // تم التأكيد على إرسال القيمة من selectedUser
      password: selectedUser.password?.trim() || null, 
      city: selectedUser.city,
      address: selectedUser.address,
      phone: selectedUser.phone,
      newSerial: selectedUser.serial?.trim() || null
    };

    const res = await fetch("/api/admin/clients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setModalMode(null);
      fetchClients();
    } else {
      const err = await res.json();
      setErrorMessage(err.error || "فشل التحديث");
    }
    setLoading(false);
  };

  const removeDevice = async (deviceId) => {
    if(!confirm("هل أنت متأكد من حذف هذا الجهاز نهائياً؟")) return;
    try {
      const res = await fetch(`/api/admin/devices?id=${deviceId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedUser({
          ...selectedUser,
          devices: selectedUser.devices.filter(d => d.id !== deviceId)
        });
        fetchClients();
      }
    } catch (err) { console.error("Delete device error"); }
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/clients?id=${selectedUser.id}`, { method: "DELETE" });
    if (res.ok) {
      setModalMode(null);
      fetchClients();
    }
    setLoading(false);
  };

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.devices?.some((d) => d.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 font-tajawal" dir="rtl">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 luxe-card p-8 rounded-[2rem]">
        <div>
          <h1 className="text-3xl font-black text-[#f6e7b1] flex items-center gap-3">
            <Lock className="text-[#d4af37]" /> إدارة النظام
          </h1>
          <p className="text-slate-400 font-medium mt-1">إدارة حسابات المقاهي والأجهزة</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="بحث بالاسم، المدينة، أو السيريال..."
            className="w-full pr-12 pl-4 py-4 bg-[#0e1320] border border-[#d4af37]/20 text-slate-100 rounded-2xl outline-none focus:ring-2 ring-[#d4af37]/20 font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 text-red-300 p-4 rounded-2xl border border-red-500/20 flex items-center gap-2 font-bold animate-pulse">
          <AlertCircle size={20} /> {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <UserForm
            formData={formData}
            setFormData={setFormData}
            loading={loading}
            onSubmit={handleCreate}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        </div>
        <div className="lg:col-span-8">
          <UserTable
            users={filteredUsers}
            onEdit={(u) => {
              setSelectedUser({
                ...u,
                password: "", 
                serial: "", 
              });
              setModalMode("edit");
            }}
            onDelete={(u) => {
              setSelectedUser(u);
              setModalMode("delete");
            }}
          />
        </div>
      </div>

      {/* Modal Edit */}
      {modalMode === "edit" && selectedUser && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxe-card w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-[#d4af37]/20 flex justify-between items-center bg-[#0e1320]">
              <div>
                <h3 className="text-xl font-black text-[#f6e7b1] flex items-center gap-3">
                  <Settings2 className="text-[#d4af37]" /> إدارة حساب: {selectedUser.name}
                </h3>
                <p className="text-slate-400 text-xs font-bold mt-1">تعديل البيانات أو تغيير كلمة السر</p>
              </div>
              <button onClick={() => { setModalMode(null); setErrorMessage(""); }} className="p-2 hover:bg-[#1b2233] rounded-full transition-colors text-slate-300"><X /></button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-400 flex items-center gap-2 mb-4">
                  <CheckCircle2 size={16} /> البيانات الأساسية
                </h4>
                <div className="space-y-3">
                  <input className="admin-input" value={selectedUser.name || ""} onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})} placeholder="الاسم الكامل" />
                  
                  {/* ✅ حقل تعديل اسم المستخدم */}
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={16} />
                    <input 
                      className="admin-input border-cyan-50 focus:border-cyan-400 font-mono" 
                      value={selectedUser.username || ""} 
                      onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})} 
                      placeholder="اسم المستخدم" 
                    />
                  </div>

                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={16} />
                    <input 
                      className="admin-input border-orange-100 focus:border-orange-400" 
                      value={selectedUser.password || ""} 
                      onChange={(e) => setSelectedUser({...selectedUser, password: e.target.value})} 
                      placeholder="كلمة مرور جديدة (اختياري)" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input className="admin-input" value={selectedUser.city || ""} onChange={(e) => setSelectedUser({...selectedUser, city: e.target.value})} placeholder="المدينة" />
                    <input className="admin-input" value={selectedUser.phone || ""} onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})} placeholder="الهاتف" />
                  </div>
                  <input className="admin-input" value={selectedUser.address || ""} onChange={(e) => setSelectedUser({...selectedUser, address: e.target.value})} placeholder="العنوان" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black text-[#f6e7b1] flex items-center gap-2 mb-4">
                  <Cpu size={16} /> الأجهزة المرتبطة
                </h4>
                <div className="flex flex-col gap-2 mb-4 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                  {selectedUser.devices?.map(dev => (
                    <div key={dev.id} className="bg-[#0e1320] text-slate-300 px-3 py-2 rounded-xl text-[11px] font-mono font-bold border border-[#d4af37]/20 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                         {dev.serialNumber}
                      </div>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/dashboard/diagnostic/${dev.id}`}
                          className="text-[#d4af37] hover:text-[#f6e7b1] px-2 py-1 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/20"
                          title="تشخيص الجهاز"
                        >
                          <Cpu size={13} />
                        </Link>
                        <button onClick={() => removeDevice(dev.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#d4af37]/10 p-4 rounded-[1.5rem] border border-[#d4af37]/20 space-y-3">
                  <p className="text-[10px] font-black text-[#f6e7b1] uppercase italic">+ ربط جهاز جديد</p>
                  <input 
                    className="admin-input border-cyan-200 bg-white font-mono" 
                    value={selectedUser.serial || ""} 
                    onChange={(e) => setSelectedUser({...selectedUser, serial: e.target.value})} 
                    placeholder="SN-XXXX" 
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-[#0e1320] border-t border-[#d4af37]/20">
              <button onClick={handleUpdate} disabled={loading} className="w-full py-4 bg-[#d4af37] text-[#0a0d14] rounded-2xl font-black flex justify-center gap-2 hover:bg-[#c8a124] transition-all shadow-xl shadow-[#d4af37]/20">
                {loading ? <RefreshCw className="animate-spin" /> : <CheckCircle2 />} 
                تحديث البيانات بالكامل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {modalMode === "delete" && (
        <div className="fixed inset-0 z-[100] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="luxe-card w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50/50"><AlertCircle size={40} /></div>
            <h3 className="text-2xl font-black text-[#f6e7b1]">حذف الحساب؟</h3>
            <p className="text-slate-400 text-sm font-bold">سيتم حذف العميل، الأجهزة، وكافة التقارير المرتبطة نهائياً.</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setModalMode(null)} className="flex-1 py-4 font-bold text-slate-300 bg-[#0e1320] rounded-2xl hover:bg-[#1b2233] transition-all border border-[#d4af37]/20">تراجع</button>
              <button onClick={handleDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 transition-all">إزالة</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-input {
          background: #0e1320;
          border: 2px solid rgba(212, 175, 55, 0.2);
          border-radius: 1.25rem;
          padding: 0.85rem 1.25rem;
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.35); border-radius: 10px; }
      `}</style>
    </div>
  );
}