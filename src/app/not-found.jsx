"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    
    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 font-tajawal text-center p-4">
      <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-stone-100 space-y-6">
        <h1 className="text-9xl font-black text-stone-200">404</h1>
        <div>
          <h2 className="text-2xl font-black text-stone-800">Page introuvable</h2>
          <p className="text-gray-400 font-medium mt-2">
            Le lien que vous cherchez n'est pas disponible.
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-cyan-600 font-bold bg-cyan-50 px-6 py-2 rounded-full text-sm">
            <Loader2 className="animate-spin" size={18} />
            Redirection vers la page d'accueil...
          </div>
          
          <button 
            onClick={() => router.push("/")}
            className="text-stone-400 hover:text-stone-900 transition-colors text-sm font-bold underline underline-offset-4"
          >
            Cliquer ici pour y aller maintenant
          </button>
        </div>
      </div>
    </div>
  );
}