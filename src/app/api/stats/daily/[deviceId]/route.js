import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  startOfDay,
  startOfMonth,
  startOfWeek,
  format,
  eachDayOfInterval,
} from "date-fns";
import { arSA } from "date-fns/locale";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

const DEFAULT_TZ = "Africa/Tripoli";

// تحويل التوقيت: ليبيا/مصر UTC+2، تونس/فرنسا UTC+1
const DISPLAY_TZ = {
  "Africa/Tripoli": "Etc/GMT-2",
  "Africa/Tunis": "Etc/GMT-1",
  "Africa/Cairo": "Etc/GMT-2",
  "Europe/Paris": "Etc/GMT-1",
};

function getPartsInTz(date, tz) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(date));
}
function toTzDate(date, tz) {
  const p = getPartsInTz(date, tz);
  const get = (k) => p.find((x) => x.type === k)?.value || "0";
  return new Date(
    parseInt(get("year"), 10),
    parseInt(get("month"), 10) - 1,
    parseInt(get("day"), 10),
    parseInt(get("hour"), 10),
    parseInt(get("minute"), 10)
  );
}
function getTzOffsetHours(tz, date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, timeZoneName: "longOffset" });
  const part = fmt.formatToParts(date).find((p) => p.type === "timeZoneName")?.value || "GMT+0";
  const m = part.match(/GMT([+-])(\d{1,2})?:?(\d{2})?/);
  if (!m) return 0;
  const sign = m[1] === "+" ? 1 : -1;
  const h = parseInt(m[2] || "0", 10);
  const min = parseInt(m[3] || "0", 10);
  return sign * (h + min / 60);
}

export async function GET(req, { params }) {
  try {
    const { deviceId } = await params;
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "today";

    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const settings = await prisma.clientSettings.findFirst({
      where: { clientId: payload.id },
    });
    const rawTz = settings?.timezone || DEFAULT_TZ;
    const tz = DISPLAY_TZ[rawTz] || rawTz;
    const serverNow = new Date();
    const tzNow = toTzDate(serverNow, tz);

    let tzStartDate;
    if (filter === "week") {
      tzStartDate = startOfWeek(tzNow, { weekStartsOn: 6 });
    } else if (filter === "month") {
      tzStartDate = startOfMonth(tzNow);
    } else {
      tzStartDate = startOfDay(tzNow);
    }

    const offsetH = getTzOffsetHours(tz, serverNow);
    const y = tzStartDate.getFullYear(),
      m = tzStartDate.getMonth(),
      d = tzStartDate.getDate();
    const utcSearchStart = new Date(Date.UTC(y, m, d, 0, 0, 0) - offsetH * 3600000);

    const [device, allFilterLogs] = await Promise.all([
      prisma.device.findFirst({
        where: { id: deviceId, clientId: payload.id },
      }),
      prisma.deviceLog.findMany({
        where: {
          deviceId: deviceId,
          type: { in: ["cup", "archived_cup"] },
          createdAt: { gte: utcSearchStart },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!device)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    let chartData = [];

    if (filter === "today") {
      chartData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${String(i).padStart(2, "0")}:00`,
        cups: 0,
      }));

      allFilterLogs.forEach((log) => {
        const logTzTime = toTzDate(log.createdAt, tz);
        const hourIndex = logTzTime.getHours();
        if (chartData[hourIndex]) chartData[hourIndex].cups += log.idhafa || 0;
      });
    } else {
      const daysInterval = eachDayOfInterval({
        start: tzStartDate,
        end: tzNow,
      });

      const dailyMap = {};
      daysInterval.forEach((day) => {
        const dayKey = format(day, "yyyy-MM-dd");
        dailyMap[dayKey] = {
          label: format(day, "EEEE", { locale: arSA }),
          count: 0,
        };
      });

      allFilterLogs.forEach((log) => {
        const logLibyaDate = format(toTzDate(log.createdAt, tz), "yyyy-MM-dd");
        if (dailyMap[logLibyaDate])
          dailyMap[logLibyaDate].count += log.idhafa || 0;
      });

      chartData = Object.entries(dailyMap).map(([_, data]) => ({
        hour: data.label,
        cups: data.count,
      }));
    }

    const recentLogs = allFilterLogs
      .filter((l) => l.type === "cup")
      .slice(-10)
      .reverse()
      .map((l) => ({
        id: l.id,
        title: l.coffeeType === "double" ? "دبل شوت" : "سنجل شوت",
        time: toTzDate(l.createdAt, tz),
        idhafa: l.idhafa,
      }));

    const monthStartUtc = new Date(
      Date.UTC(tzNow.getFullYear(), tzNow.getMonth(), 1, 0, 0, 0) - offsetH * 3600000
    );
    const monthlyTotal = allFilterLogs
      .filter((l) => l.createdAt >= monthStartUtc)
      .reduce((acc, log) => acc + (log.idhafa || 0), 0);

    return NextResponse.json({
      morningShift: device.morningCups || 0,
      eveningShift: device.eveningCups || 0,
      isMorningClosed: device.isMorningClosed,
      monthlyTotal: monthlyTotal,
      machineTotal: device.totalCups || 0,

      // التعديل هنا ليتوافق مع StatCard مباشرة
      currentSingle: device.currentSingle || 0,
      currentDouble: device.currentDouble || 0,

      connection: {
        isOnline:
          serverNow.getTime() - new Date(device.updatedAt).getTime() < 65000,
        signal: device.wifiSignal || "-100",
      },
      chartData,
      recentLogs,
    });
  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
