import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const SHIFT_LABELS = { MORNING: "صباح", EVENING: "مساء", NIGHT: "ليل" };

export async function GET(req, { params }) {
  try {
    const { deviceId } = await params;

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id;

    const logWhere = {
      deviceId,
      device: { clientId: userId },
    };
    const shiftWhere = {
      deviceId,
      device: { clientId: userId },
    };

    if (from || to) {
      const dateFilter = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      logWhere.createdAt = dateFilter;
      shiftWhere.createdAt = dateFilter;
    }

    const [logs, shifts] = await Promise.all([
      prisma.deviceLog.findMany({
        where: logWhere,
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.shift.findMany({
        where: shiftWhere,
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    const formattedLogs = logs.map((log) => ({
      ...log,
      idhafa: log.idhafa || 0,
    }));

    const formattedShifts = shifts.map((s) => ({
      id: s.id,
      type: s.type,
      label: SHIFT_LABELS[s.type] || s.type,
      count: s.count || 0,
      singleCount: s.singleCount || 0,
      doubleCount: s.doubleCount || 0,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({
      logs: formattedLogs,
      shifts: formattedShifts,
    });
  } catch (error) {
    console.error("Logs API Error:", error);
    
 
    if (error.code === 'ERR_JWT_EXPIRED') {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}