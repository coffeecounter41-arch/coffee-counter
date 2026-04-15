import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. إضافة جهاز جديد (يُستدعى عند الحاجة لإضافة جهاز منفصل)
export async function POST(req) {
  try {
    const { clientId, serialNumber } = await req.json();

    if (!clientId || !serialNumber) {
      return NextResponse.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    // التحقق من السيريال
    const existing = await prisma.device.findUnique({ where: { serialNumber } });
    if (existing) return NextResponse.json({ error: "السيريال مسجل مسبقاً" }, { status: 400 });

    const newDevice = await prisma.device.create({
      data: {
        serialNumber: serialNumber.toUpperCase(),
        clientId,
        status: "active"
      }
    });

    return NextResponse.json(newDevice);
  } catch (error) {
    return NextResponse.json({ error: "خطأ في إضافة الجهاز" }, { status: 500 });
  }
}

// 2. حذف جهاز (هذا ما سيجعله زر السلة في الواجهة يعمل)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف الجهاز مطلوب" }, { status: 400 });
    }

    // حذف الجهاز من قاعدة البيانات
    await prisma.device.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "تم حذف الجهاز بنجاح" });
  } catch (error) {
    console.error("Delete Device Error:", error);
    return NextResponse.json({ error: "فشل حذف الجهاز" }, { status: 500 });
  }
}