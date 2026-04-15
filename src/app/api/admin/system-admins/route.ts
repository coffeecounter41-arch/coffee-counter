import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. [GET] جلب قائمة مسؤولي النظام
export async function GET() {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        password: true, // أضفنا الباسورد هنا لتتمكن من رؤيته في الاختبار
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(admins);
  } catch (error) {
    return NextResponse.json({ error: "failed_to_fetch_admins" }, { status: 500 });
  }
}

// 2. [POST] إنشاء مسؤول نظام جديد (بدون تشفير)
export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // التحقق من الحقول المطلوبة
    if (!name || !email || !password) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    // التحقق من عدم تكرار البريد الإلكتروني
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً" }, { status: 400 });
    }

    // حفظ كلمة المرور مباشرة كما هي
    const newAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        password: password, 
      },
    });

    return NextResponse.json(newAdmin, { status: 201 });

  } catch (error: any) {
    console.error("ADMIN_CREATE_ERROR:", error);
    return NextResponse.json({ error: "خطأ في إنشاء حساب المسؤول" }, { status: 500 });
  }
}

// 3. [DELETE] حذف الحساب
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف المسؤول مطلوب" }, { status: 400 });
    }

    await prisma.admin.delete({
      where: { id },
    });

    return NextResponse.json({ message: "تم الحذف بنجاح" });
  } catch (error) {
    return NextResponse.json({ error: "فشل في حذف الحساب" }, { status: 500 });
  }
}