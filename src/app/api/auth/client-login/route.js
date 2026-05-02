import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    // 1. البحث عن العميل وجلب كافة أجهزته (بدون تحديد take: 1)
    const client = await prisma.client.findUnique({
      where: { username },
      include: { devices: true },
    });

    // 2. التحقق من البيانات
    if (!client || client.password !== password) {
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
        { status: 401 },
      );
    }

    // 3. إنشاء التوكن (نستخدم معرف أول جهاز كمعرف افتراضي في التوكن)
    const token = await new SignJWT({
      id: client.id,
      role: "CLIENT",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    // 4. رد النجاح - إرسال مصفوفة الأجهزة كاملة
    return NextResponse.json({
      message: "Success",
      token: token,
      user: {
        id: client.id,
        name: client.name,
        uid: client.uid,
        devices: client.devices, // تأكد من الاسم هنا "devices" ليتوافق مع الداشبورد
      },
    });
  } catch (error) {
    console.error("CLIENT_LOGIN_ERROR:", error);
    return NextResponse.json({ error: "خطأ في خادم التحقق" }, { status: 500 });
  }
}
