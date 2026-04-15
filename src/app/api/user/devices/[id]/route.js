import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

async function getClientIdFromAuth(req) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return payload?.id || null;
}

export async function PUT(req, { params }) {
  try {
    const clientId = await getClientIdFromAuth(req);
    if (!clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const name =
      typeof body.name === "string" ? body.name.trim().slice(0, 80) : null;

    if (!name || name.length === 0) {
      return NextResponse.json(
        { error: "اسم الجهاز لا يمكن أن يكون فارغاً" },
        { status: 400 },
      );
    }

    const device = await prisma.device.findFirst({
      where: { id, clientId },
      select: { id: true },
    });
    if (!device) {
      return NextResponse.json({ error: "الجهاز غير موجود" }, { status: 404 });
    }

    const updated = await prisma.device.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, serialNumber: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("RENAME_DEVICE_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

