import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    // جلب المعرف من الهيدرز التي حقنها الميدل وير
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
    }

    const devices = await prisma.device.findMany({
      where: { clientId: userId },
      select: {
        id: true,
        serialNumber: true,
      name: true,
        status: true,
        isMorningClosed: true, // ضروري لمعرفة حالة الوردية الحالية
        lastResetAt: true,
        // يمكنك إضافة أي حقول أخرى تحتاجها القائمة الجانبية أو الـ Navbar
      },
      orderBy: {
        createdAt: 'desc' // لترتيب الأجهزة من الأحدث للأقدم
      }
    });

    // تأكد من إرجاع مصفوفة فارغة إذا لم يوجد أجهزة بدلاً من null
    return NextResponse.json(devices || []);

  } catch (error) {
    console.error("API Error (Devices):", error.message);
    return NextResponse.json(
      { error: "فشل في جلب الأجهزة", details: error.message }, 
      { status: 500 }
    );
  }
}