import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, startOfMonth, startOfWeek, format, eachDayOfInterval } from "date-fns";
import { arSA } from "date-fns/locale";
import { jwtVerify } from "jose";

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
    const token = authHeader.split(" ")[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const settings = await prisma.clientSettings.findFirst({
      where: { clientId: payload.id },
    });
    const rawTz = settings?.timezone || DEFAULT_TZ;
    const tz = DISPLAY_TZ[rawTz] || rawTz;
    const now = new Date();
    const tzNow = toTzDate(now, tz);
    let tzStart;

    if (filter === "week") tzStart = startOfWeek(tzNow, { weekStartsOn: 6 });
    else if (filter === "month") tzStart = startOfMonth(tzNow);
    else tzStart = startOfDay(tzNow);

    const offsetH = getTzOffsetHours(tz, now);
    const y = tzStart.getFullYear(),
      m = tzStart.getMonth(),
      d = tzStart.getDate();
    const utcStart = new Date(Date.UTC(y, m, d, 0, 0, 0) - offsetH * 3600000);

    const [device, logs, latestMorningShift, latestEveningShift, latestNightShift] = await Promise.all([
      prisma.device.findFirst({
        where: { id: deviceId, clientId: payload.id },
      }),
      prisma.deviceLog.findMany({
        where: { deviceId, type: { in: ["cup", "archived_cup"] }, createdAt: { gte: utcStart } },
        orderBy: { createdAt: "asc" }
      }),
      prisma.shift.findFirst({
        where: { deviceId, type: "MORNING" },
        orderBy: { createdAt: "desc" },
        select: { singleCount: true, doubleCount: true, count: true },
      }),
      prisma.shift.findFirst({
        where: { deviceId, type: "EVENING" },
        orderBy: { createdAt: "desc" },
        select: { singleCount: true, doubleCount: true, count: true },
      }),
      prisma.shift.findFirst({
        where: { deviceId, type: "NIGHT" },
        orderBy: { createdAt: "desc" },
        select: { singleCount: true, doubleCount: true, count: true },
      }),
    ]);

    let chartData = [];
    if (filter === "today") {
      chartData = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, "0")}:00`, cups: 0 }));
      logs.forEach(l => {
        const d = toTzDate(l.createdAt, tz);
        const h = d.getHours();
        if (chartData[h]) chartData[h].cups += l.idhafa || 0;
      });
    } else {
      const days = eachDayOfInterval({ start: tzStart, end: tzNow });
      const map = {};
      days.forEach(d => {
        const k = format(d, "yyyy-MM-dd");
        map[k] = { label: format(d, "EEEE", { locale: arSA }), count: 0 };
      });
      logs.forEach(l => {
        const k = format(toTzDate(l.createdAt, tz), "yyyy-MM-dd");
        if (map[k]) map[k].count += l.idhafa || 0;
      });
      chartData = Object.values(map).map(v => ({ hour: v.label, cups: v.count }));
    }

    const shiftCount = Math.min(3, Math.max(1, settings?.shiftCount || 2));
    const shift1 = device?.morningCups || 0;
    const shift2 = device?.eveningCups || 0;
    const shift3 = device?.nightCups || 0;
    const currentShiftIndex = device?.currentShiftIndex || (device?.isMorningClosed ? 2 : 1);

    return NextResponse.json({
      chartData,
      monthlyTotal: logs.reduce((acc, l) => acc + (l.idhafa || 0), 0),
      dailyTotalSent: shift1 + shift2 + shift3,
      machineTotal: device?.totalCups || 0,
      shiftCount,
      currentShiftIndex,
      morningShift: shift1,
      eveningShift: shift2,
      nightShift: shift3,
      morningSingle: currentShiftIndex === 1 ? (device?.currentSingle || 0) : (latestMorningShift?.singleCount || 0),
      morningDouble: currentShiftIndex === 1 ? (device?.currentDouble || 0) : (latestMorningShift?.doubleCount || 0),
      eveningSingle: currentShiftIndex === 2 ? (device?.currentSingle || 0) : (latestEveningShift?.singleCount || 0),
      eveningDouble: currentShiftIndex === 2 ? (device?.currentDouble || 0) : (latestEveningShift?.doubleCount || 0),
      nightSingle: currentShiftIndex === 3 ? (device?.currentSingle || 0) : (latestNightShift?.singleCount || 0),
      nightDouble: currentShiftIndex === 3 ? (device?.currentDouble || 0) : (latestNightShift?.doubleCount || 0),
      isMorningClosed: currentShiftIndex >= 2,
      connection: {
        isOnline: (now.getTime() - new Date(device?.updatedAt).getTime()) < 65000,
        signal: device?.wifiSignal || "-100"
      }
    });
  } catch (e) { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}