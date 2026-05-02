import React from "react";
import { Facebook, MessageCircle } from "lucide-react";

export default function HomeFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0f172a] border-t mt-8 border-[#d4af37]/20 py-6 font-tajawal">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
         
          <div className="flex items-center gap-4">
            <div className="flex flex-col border-r border-[#d4af37]/20 pr-4">
              <span className="text-sm font-black text-[#f8e7b0] leading-none tracking-tight">
                coffee-counter.tn
              </span>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                © {currentYear} tous droits reserves
              </p>
            </div>
          </div>

          
          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              <a 
                href="https://www.facebook.com/med.majdoub33" 
                className="text-slate-400 hover:text-[#1877F2] transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a 
                href="https://wa.me/+21652686430" 
                className="text-slate-400 hover:text-[#25D366] transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
            </div>
            
          
            <div className="h-4 w-[px] bg-slate-700 hidden md:block"></div>
            
            <p className="hidden md:block text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Systeme intelligent cafe
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
