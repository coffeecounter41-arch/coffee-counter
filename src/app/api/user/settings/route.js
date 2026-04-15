import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

function isValidTimeHHMM(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

async function getClientIdFromAuth(req) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  if (!payload?.id) return null;
  return payload.id;
}

async function ensureDefaultSettings(clientId) {
  const existing = await prisma.clientSettings.findUnique({
    where: { clientId },
    include: { shifts: { orderBy: { index: "asc" } } },
  });
  if (existing) return existing;

  return await prisma.clientSettings.create({
    data: {
      clientId,
      gramsSingle: 7,
      gramsDouble: 14,
      shiftCount: 2,
      resetFrom: "COUNTER",
      timezone: "Africa/Tripoli",
      shiftCount: 2,
      shifts: {
        create: [
          { index: 1, startTime: "06:00", endTime: "14:00" },
          { index: 2, startTime: "14:00", endTime: "22:00" },
          { index: 3, startTime: "22:00", endTime: "06:00" },
        ],
      },
    },
    include: { shifts: { orderBy: { index: "asc" } } },
  });
}

export async function GET(req) {
  try {
    const clientId = await getClientIdFromAuth(req);
    if (!clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [client, settings] = await Promise.all([
      prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true, name: true, username: true },
      }),
      ensureDefaultSettings(clientId),
    ]);

    return NextResponse.json({
      client,
      settings: {
        gramsSingle: settings.gramsSingle,
        gramsDouble: settings.gramsDouble,
        shiftCount: settings.shiftCount,
        resetFrom: settings.resetFrom,
        shifts: settings.shifts.map((s) => ({
          index: s.index,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        timezone: settings.timezone || "Africa/Tripoli",
      },
    });
  } catch (error) {
    console.error("CLIENT_SETTINGS_GET_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const clientId = await getClientIdFromAuth(req);
    if (!clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const nextUsername = typeof body.username === "string" ? body.username.trim() : null;
    const nextPassword = typeof body.password === "string" ? body.password : null;

    const gramsSingle =
      body.gramsSingle === null || body.gramsSingle === undefined
        ? null
        : Number(body.gramsSingle);
    const gramsDouble =
      body.gramsDouble === null || body.gramsDouble === undefined
        ? null
        : Number(body.gramsDouble);
    const shiftCount =
      body.shiftCount === null || body.shiftCount === undefined
        ? null
        : Number(body.shiftCount);
    const shifts = Array.isArray(body.shifts) ? body.shifts : null;
    const resetFrom =
      typeof body.resetFrom === "string" ? body.resetFrom.toUpperCase() : null;
    const timezone =
      typeof body.timezone === "string" && body.timezone.trim().length > 0
        ? body.timezone.trim()
        : null;

    if (nextUsername !== null && nextUsername.length === 0) {
      return NextResponse.json(
        { error: "اسم المستخدم لا يمكن أن يكون فارغاً" },
        { status: 400 },
      );
    }

    if (gramsSingle !== null && (!Number.isFinite(gramsSingle) || gramsSingle <= 0)) {
      return NextResponse.json(
        { error: "جرام السنقل يجب أن يكون رقماً أكبر من 0" },
        { status: 400 },
      );
    }
    if (gramsDouble !== null && (!Number.isFinite(gramsDouble) || gramsDouble <= 0)) {
      return NextResponse.json(
        { error: "جرام الدبل يجب أن يكون رقماً أكبر من 0" },
        { status: 400 },
      );
    }

    if (shiftCount !== null) {
      if (!Number.isInteger(shiftCount) || shiftCount < 1 || shiftCount > 3) {
        return NextResponse.json(
          { error: "عدد الورديات يجب أن يكون بين 1 و 3" },
          { status: 400 },
        );
      }
    }

    if (shifts !== null) {
      for (const s of shifts) {
        const idx = Number(s?.index);
        if (!Number.isInteger(idx) || idx < 1 || idx > 3) {
          return NextResponse.json({ error: "ترتيب الوردية غير صحيح" }, { status: 400 });
        }
        if (!isValidTimeHHMM(s?.startTime) || !isValidTimeHHMM(s?.endTime)) {
          return NextResponse.json(
            { error: "صيغة الوقت يجب أن تكون HH:MM" },
            { status: 400 },
          );
        }
      }
    }

    if (resetFrom !== null) {
      if (!["COUNTER", "DASHBOARD", "BOTH"].includes(resetFrom)) {
        return NextResponse.json(
          { error: "قيمة resetFrom غير صحيحة" },
          { status: 400 },
        );
      }
    }

    const VALID_TIMEZONES = [
      "Africa/Tripoli",   // ليبيا - بنغازي، طرابلس
      "Africa/Tunis",     // تونس
      "Africa/Cairo",     // مصر
      "Europe/Paris",     // فرنسا
      "UTC",
    ];
    if (timezone !== null && !VALID_TIMEZONES.includes(timezone)) {
      return NextResponse.json(
        { error: "التوقيت غير مدعوم" },
        { status: 400 },
      );
    }

    const settings = await ensureDefaultSettings(clientId);

    // تحديث username/password إذا تم إرسالهم
    if (nextUsername !== null || nextPassword !== null) {
      if (nextUsername !== null) {
        const existing = await prisma.client.findFirst({
          where: { username: nextUsername, NOT: { id: clientId } },
          select: { id: true },
        });
        if (existing) {
          return NextResponse.json({ error: "اسم المستخدم مستعمل" }, { status: 409 });
        }
      }

      await prisma.client.update({
        where: { id: clientId },
        data: {
          ...(nextUsername !== null ? { username: nextUsername } : {}),
          ...(nextPassword !== null && nextPassword.length > 0
            ? { password: nextPassword }
            : {}),
        },
      });
    }

    // تحديث settings
    const updated = await prisma.clientSettings.update({
      where: { id: settings.id },
      data: {
        ...(gramsSingle !== null ? { gramsSingle } : {}),
        ...(gramsDouble !== null ? { gramsDouble } : {}),
        ...(shiftCount !== null ? { shiftCount } : {}),
        ...(resetFrom !== null ? { resetFrom } : {}),
        ...(timezone !== null ? { timezone } : {}),
      },
      include: { shifts: { orderBy: { index: "asc" } } },
    });

    // تحديث shifts (upsert)
    if (shifts !== null) {
      await prisma.$transaction(async (tx) => {
        for (const s of shifts) {
          const idx = Number(s.index);
          await tx.clientShift.upsert({
            where: { settingsId_index: { settingsId: updated.id, index: idx } },
            create: {
              settingsId: updated.id,
              index: idx,
              startTime: s.startTime,
              endTime: s.endTime,
            },
            update: { startTime: s.startTime, endTime: s.endTime },
          });
        }
      });
    }

    const finalSettings = await prisma.clientSettings.findUnique({
      where: { id: updated.id },
      include: { shifts: { orderBy: { index: "asc" } } },
    });

    return NextResponse.json({
      ok: true,
      settings: {
        gramsSingle: finalSettings.gramsSingle,
        gramsDouble: finalSettings.gramsDouble,
        shiftCount: finalSettings.shiftCount,
        resetFrom: finalSettings.resetFrom,
        timezone: finalSettings.timezone || "Africa/Tripoli",
        shifts: finalSettings.shifts.map((s) => ({
          index: s.index,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      },
    });
  } catch (error) {
    console.error("CLIENT_SETTINGS_PUT_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

