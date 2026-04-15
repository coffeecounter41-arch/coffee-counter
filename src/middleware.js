import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  // 1. جلب التوكن من الهيدرز أو الكوكيز
  const token =
    request.headers.get("authorization")?.split(" ")[1] ||
    request.cookies.get("token")?.value;

  let payload = null;
  if (token) {
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch (err) {
      // إذا التوكن تالف أو منتهي، لا نفعل شيئاً هنا، الحماية بالأسفل ستتصرف
      console.error("Middleware: Invalid Token");
    }
  }

  // --- 🛡️ حماية مسارات العميل (Dashboard & Client APIs) ---
  const isClientPath = pathname.startsWith("/dashboard") || pathname.startsWith("/api/user");
  
  if (isClientPath) {
    if (!payload || (payload.role !== "CLIENT" && payload.role !== "client")) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "جلسة منتهية" }, { status: 401 });
      }
      // إذا كان يحاول دخول صفحة الداشبورد بدون توكن، أرجعه للرئيسية (Login)
      const response = NextResponse.redirect(new URL("/", request.url));
      // مسح الكوكيز التالفة لضمان عدم حدوث تعليق (Infinity Loading)
      response.cookies.delete("token");
      return response;
    }
  }

  // --- 🛡️ حماية مسارات الأدمن ---
  const isAdminPath = pathname.startsWith("/admin/dashboard") || pathname.startsWith("/api/admin");

  if (isAdminPath) {
    if (!payload || payload.role !== "SYSTEM_ADMIN") {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized Admin" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // تمرير البيانات للهيدرز
  const requestHeaders = new Headers(request.headers);
  if (payload) {
    requestHeaders.set("x-user-id", payload.id);
    requestHeaders.set("x-user-role", payload.role);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/admin/dashboard/:path*",
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/user/:path*", // أضفنا هذا لضمان حماية بيانات العملاء
    "/api/devices/:path*", // أضف هذا
    "/api/logs/:path*",    // أضف هذا
  ],
};