import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 1. جلب قائمة العملاء (بدون تغيير)
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: { 
        devices: { 
          select: { 
            id: true, 
            serialNumber: true, 
            status: true, 
            updatedAt: true, 
            totalCups: true 
          } 
        } 
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: "failed_to_fetch" }, { status: 500 });
  }
}

// 2. إنشاء عميل جديد (تحديث الـ UID ليدعم الكبير والصغير)
export async function POST(req) {
  try {
    const { name, username, password, phone, city, address, serial } = await req.json();

    const newClient = await prisma.$transaction(async (tx) => {
      if (username) {
        const existingUser = await tx.client.findUnique({ where: { username } });
        if (existingUser) throw new Error("username_exists");
      }

      if (serial) {
        const existingDevice = await tx.device.findUnique({ where: { serialNumber: serial } });
        if (existingDevice) throw new Error("serial_exists");
      }

      const client = await tx.client.create({
        data: {
          name,
          username,
          password, 
          phone,
          city,
          address,
          // تم إزالة .toUpperCase() لجعل الـ UID متنوع الحالات
          uid: `UID-${Math.random().toString(36).substring(2, 11)}`,
        },
      });

      if (serial) {
        await tx.device.create({
          data: { 
            serialNumber: serial, 
            clientId: client.id, 
            status: "offline" 
          },
        });
      }

      return client;
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    const msg = error.message === "username_exists" ? "اسم المستخدم محجوز" : 
                error.message === "serial_exists" ? "هذا السيريال مسجل لجهاز آخر" : "فشل في إنشاء العميل";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// 3. التحديث (إصلاح مشكلة الـ username)
export async function PUT(req) {
  try {
    const { id, name, username, password, phone, city, address, newSerial } = await req.json();

    const updatedClient = await prisma.$transaction(async (tx) => {
      
      // أولاً: التأكد من أن اليوزرنايم الجديد لا يخص مستخدم آخر
      if (username) {
        const existingUser = await tx.client.findFirst({
          where: {
            username: username,
            NOT: { id: id } // ابحث عن أي شخص عنده نفس الاسم بشرط ألا يكون هو نفسه العميل الحالي
          }
        });
        if (existingUser) throw new Error("username_taken");
      }

      // تجهيز البيانات المراد تحديثها
      const updateData = { 
        name, 
        username, // سيتم التحديث هنا
        phone, 
        city, 
        address 
      };
      
      if (password && password.trim() !== "") {
        updateData.password = password;
      }

      const client = await tx.client.update({
        where: { id },
        data: updateData,
      });

      if (newSerial) {
        const existingDevice = await tx.device.findUnique({ where: { serialNumber: newSerial } });
        if (existingDevice) throw new Error("serial_exists");

        await tx.device.create({
          data: {
            serialNumber: newSerial,
            clientId: id,
            status: "offline",
          },
        });
      }

      return client;
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    const msg = error.message === "username_taken" ? "اسم المستخدم الجديد محجوز لمساب آخر" :
                error.message === "serial_exists" ? "السيريال الجديد مسجل مسبقاً" : "فشل التحديث";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// 4. الحذف (بدون تغيير)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

    await prisma.client.delete({
      where: { id }
    });

    return NextResponse.json({ message: "تم حذف العميل بنجاح" });
  } catch (error) {
    return NextResponse.json({ error: "failed_to_delete" }, { status: 500 });
  }
}