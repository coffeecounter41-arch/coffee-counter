import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const { serialNumber } = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      const device = await tx.device.findFirst({
        where: { serialNumber, clientId: payload.id },
        include: { client: { include: { settings: true } } },
      });

      if (!device) throw new Error("الجهاز غير موجود");

      const now = new Date();
      const shiftCount = Math.min(3, Math.max(1, device?.client?.settings?.shiftCount || 2));
      const curIdx = device.currentShiftIndex || (device.isMorningClosed ? 2 : 1);
      const shiftTypes = ["MORNING", "EVENING", "NIGHT"];
      const currentShiftType = shiftTypes[Math.min(curIdx - 1, 2)];
      const currentShiftCount = curIdx === 1 ? device.morningCups : curIdx === 2 ? device.eveningCups : device.nightCups;

      let updateData = {
        needsReset: true,
        lastResetAt: now,
        updatedAt: now,
        currentSingle: 0,
        currentDouble: 0,
      };

      let logTitle = "";

      await tx.shift.create({
        data: {
          deviceId: device.id,
          type: currentShiftType,
          count: currentShiftCount,
          singleCount: device.currentSingle,
          doubleCount: device.currentDouble,
          createdAt: now,
        },
      });

      if (curIdx < shiftCount) {
        logTitle = curIdx === 1 ? "تم إغلاق الوردية الصباحية بنجاح ☀️" : "تم إغلاق الوردية المسائية بنجاح 🌙";
        updateData.currentShiftIndex = curIdx + 1;
        updateData.isMorningClosed = curIdx + 1 >= 2;
      } else {
        logTitle = "تم إغلاق اليوم وتصفير العدادات بنجاح 🌙";
        updateData.currentShiftIndex = 1;
        updateData.isMorningClosed = false;
        updateData.morningCups = 0;
        updateData.eveningCups = 0;
        updateData.nightCups = 0;
      }

      await tx.deviceLog.updateMany({
        where: { deviceId: device.id, type: "cup" },
        data: { type: "archived_cup" },
      });

      const updated = await tx.device.update({
        where: { id: device.id },
        data: updateData,
      });

      return { updated, logTitle };
    });

    return NextResponse.json({
      success: true,
      message: result.logTitle,
      isMorningClosed: result.updated.isMorningClosed,
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}