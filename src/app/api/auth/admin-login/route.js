import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    // ملاحظة: يفضل مستقبلاً استخدام bcrypt لمقارنة كلمات المرور المشفرة
    if (!admin || admin.password !== password) {
      return NextResponse.json(
        { error: "بيانات دخول المسؤول غير صحيحة" },
        { status: 401 },
      );
    }

    // توليد التوكن باستخدام jose المتوافقة مع الـ Edge
    const token = await new SignJWT({
      id: admin.id,
      role: "SYSTEM_ADMIN",
      email: admin.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("12h")
      .sign(JWT_SECRET);

    return NextResponse.json({
      message: "Authorized",
      token: token,
      admin: {
        // غيرتها لـ admin لتطابق ما وضعناه في صفحة الـ Login
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: "SYSTEM_ADMIN",
      },
    });
  } catch (error) {
    console.error("ADMIN_LOGIN_ERROR:", error);
    return NextResponse.json(
      { error: "فشل في نظام التحقق المركزي" },
      { status: 500 },
    );
  }
}
