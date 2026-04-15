import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // اختياري: يمكنك إضافة فحص بسيط هنا للتأكد من وجود صلاحية
    // const auth = req.headers.get("authorization");
    // if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [clientsCount, devicesCount, adminsCount] = await Promise.all([
      prisma.client.count(),
      prisma.device.count(),
      prisma.admin.count(),
    ]);

    // ترتيب البيانات في الرد ليطابق ما يتوقعه الفرونت إند
    return NextResponse.json({
      clients: clientsCount || 1,
      devices: devicesCount || 1,
      admins: adminsCount || 1,
      uptime: "98.0%" 
    });

  } catch (error) {
    console.error("STATS_FETCH_ERROR:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الإحصائيات المركزية" }, 
      { status: 500 }
    );
  }
}