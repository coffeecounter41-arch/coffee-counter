import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { addHours, jwtVerify } from "jose"; // أو استوردها من الكود السابق

export async function GET(req, { params }) {
  try {
    const { deviceId } = await params;
    
    // التحقق من التوكن (JWT)
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const [device, recentLogs] = await Promise.all([
      prisma.device.findFirst({ where: { id: deviceId, clientId: payload.id } }),
      prisma.deviceLog.findMany({
        where: { deviceId, type: "cup" },
        orderBy: { createdAt: "desc" },
        take: 10
      })
    ]);

    return NextResponse.json({
      currentCounter: {
        single: device?.currentSingle || 0,
        double: device?.currentDouble || 0,
      },
      isMorningClosed: device?.isMorningClosed,
      recentLogs: recentLogs.map(l => ({
        id: l.id,
        title: l.coffeeType === "double" ? "دبل شوت" : "سنجل شوت",
        time: l.createdAt, // الفرونت إند سيتولى تحويل الوقت محلياً
        idhafa: l.idhafa
      }))
    });
  } catch (e) { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}