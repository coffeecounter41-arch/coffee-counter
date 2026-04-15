import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_COMMANDS = new Set([
  "diagno_start",
  "diagno_stop",
  "out_service",
  "on_service",
  "set_nfc_cards",
]);

const DEFAULT_SENSORS = {
  S1: false,
  S2: false,
  S3: false,
  S4: false,
  A1: false,
  A2: false,
  A3: false,
  A4: false,
  B: false,
};

function hasDiagnosticModels() {
  return (
    prisma?.diagnosticState &&
    prisma?.diagnosticEvent &&
    prisma?.diagnosticCommand
  );
}

function normalizeSensors(sensors) {
  const src = sensors && typeof sensors === "object" ? sensors : {};
  return {
    S1: !!src.S1,
    S2: !!src.S2,
    S3: !!src.S3,
    S4: !!src.S4,
    A1: !!src.A1,
    A2: !!src.A2,
    A3: !!src.A3,
    A4: !!src.A4,
    B: !!src.B,
  };
}

function normalizeNfcCards(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const toPositiveInt = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    const intVal = Math.trunc(n);
    return intVal > 0 ? intVal : 0;
  };
  return {
    idTech: toPositiveInt(src.idTech),
    master1: toPositiveInt(src.master1),
    master2: toPositiveInt(src.master2),
  };
}

function parseNfcFromInfoMessage(message) {
  if (typeof message !== "string" || !message.startsWith("NFC_SYNC:")) return null;
  const raw = message.slice("NFC_SYNC:".length);
  try {
    const parsed = JSON.parse(raw);
    return normalizeNfcCards(parsed);
  } catch {
    return null;
  }
}

async function ensureAdmin(req) {
  return req.headers.get("x-user-role") === "SYSTEM_ADMIN";
}

export async function GET(req, { params }) {
  try {
    if (!hasDiagnosticModels()) {
      return NextResponse.json(
        {
          error:
            "جداول التشخيص غير مفعلة بعد. نفّذ migration أولاً: npx prisma migrate dev --name move_diagnostic_to_admin",
        },
        { status: 503 },
      );
    }

    const isAdmin = await ensureAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deviceId } = await params;
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      select: { id: true, serialNumber: true, name: true, status: true },
    });
    if (!device) {
      return NextResponse.json({ error: "الجهاز غير موجود" }, { status: 404 });
    }

    const state = await prisma.diagnosticState.upsert({
      where: { deviceId: device.id },
      create: {
        deviceId: device.id,
        serviceStatus: device.status,
        sensors: DEFAULT_SENSORS,
      },
      update: {},
    });

    const [events, commands, lastNfcInfoEvent] = await Promise.all([
      prisma.diagnosticEvent.findMany({
        where: { deviceId: device.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.diagnosticCommand.findMany({
        where: { deviceId: device.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.diagnosticEvent.findFirst({
        where: {
          deviceId: device.id,
          type: "INFO",
          message: { startsWith: "NFC_SYNC:" },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const lastNfcCommand = commands.find((cmd) => cmd.command === "set_nfc_cards");
    const nfcFromEvent = parseNfcFromInfoMessage(lastNfcInfoEvent?.message || null);
    const nfcFromCommand = lastNfcCommand?.payload
      ? normalizeNfcCards(lastNfcCommand.payload)
      : null;
    const nfcCards = nfcFromEvent || nfcFromCommand || {
      idTech: 0,
      master1: 0,
      master2: 0,
    };

    return NextResponse.json({
      device,
      state: { ...state, sensors: normalizeSensors(state.sensors) },
      events,
      commands,
      nfcCards,
    });
  } catch (error) {
    console.error("ADMIN_DIAGNOSTIC_GET_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    if (!hasDiagnosticModels()) {
      return NextResponse.json(
        {
          error:
            "جداول التشخيص غير مفعلة بعد. نفّذ migration أولاً: npx prisma migrate dev --name move_diagnostic_to_admin",
        },
        { status: 503 },
      );
    }

    const isAdmin = await ensureAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deviceId } = await params;
    const body = await req.json();
    const action = String(body?.action || "").toLowerCase();
    const nfcCardsInput =
      action === "set_nfc_cards" ? normalizeNfcCards(body?.nfcCards) : null;
    if (action === "set_nfc_cards") {
      const { idTech, master1, master2 } = nfcCardsInput;
      if (!idTech || !master1 || !master2) {
        return NextResponse.json(
          { error: "يجب إدخال IDtech و Master1 و Master2" },
          { status: 400 },
        );
      }
      if (new Set([idTech, master1, master2]).size !== 3) {
        return NextResponse.json(
          { error: "بطاقات NFC يجب أن تكون مختلفة عن بعضها" },
          { status: 400 },
        );
      }
    }

    if (!ALLOWED_COMMANDS.has(action)) {
      return NextResponse.json({ error: "أمر غير مدعوم" }, { status: 400 });
    }

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      select: { id: true, status: true },
    });
    if (!device) {
      return NextResponse.json({ error: "الجهاز غير موجود" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const state = await tx.diagnosticState.upsert({
        where: { deviceId: device.id },
        create: {
          deviceId: device.id,
          serviceStatus: device.status,
          sensors: DEFAULT_SENSORS,
        },
        update: {},
      });

      const command = await tx.diagnosticCommand.create({
        data: {
          deviceId: device.id,
          command: action,
          status: "pending",
          source: "ADMIN_DASHBOARD",
          payload: action === "set_nfc_cards" ? nfcCardsInput : null,
        },
      });

      await tx.diagnosticEvent.create({
        data: {
          deviceId: device.id,
          type: "COMMAND",
          message:
            action === "set_nfc_cards"
              ? `ADMIN -> ${action} ${JSON.stringify(nfcCardsInput)}`
              : `ADMIN -> ${action}`,
        },
      });

      let nextIsRunning = state.isRunning;
      let nextServiceStatus = state.serviceStatus;
      let nextDeviceStatus = device.status;

      if (action === "diagno_start") nextIsRunning = true;
      if (action === "diagno_stop") nextIsRunning = false;
      if (action === "out_service") {
        nextServiceStatus = "inactive";
        nextDeviceStatus = "inactive";
      }
      if (action === "on_service") {
        nextServiceStatus = "active";
        nextDeviceStatus = "active";
      }

      const nextState = await tx.diagnosticState.update({
        where: { deviceId: device.id },
        data: {
          isRunning: nextIsRunning,
          serviceStatus: nextServiceStatus,
        },
      });

      if (nextDeviceStatus !== device.status) {
        await tx.device.update({
          where: { id: device.id },
          data: { status: nextDeviceStatus },
        });
      }

      return { command, nextState };
    });

    return NextResponse.json({
      ok: true,
      command: updated.command,
      state: {
        ...updated.nextState,
        sensors: normalizeSensors(updated.nextState.sensors),
      },
    });
  } catch (error) {
    console.error("ADMIN_DIAGNOSTIC_POST_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

