import { NextResponse } from "next/server"; // هذا كان ناقصاً
import { prisma } from "@/lib/prisma";

const ALLOWED_SENSOR_KEYS = ["S1", "S2", "S3", "S4", "A1", "A2", "A3", "A4", "B"];
const SHIFT_TOLERANCE_MINUTES = 40;
const DEFAULT_TIMEZONE = "Africa/Tripoli";

// تحويل التوقيت: ليبيا/مصر UTC+2، تونس/فرنسا UTC+1
const DISPLAY_TZ = {
  "Africa/Tripoli": "Etc/GMT-2",
  "Africa/Tunis": "Etc/GMT-1",
  "Africa/Cairo": "Etc/GMT-2",
  "Europe/Paris": "Etc/GMT-1",
};

function normalizeSensorPayload(raw) {
  if (!raw || typeof raw !== "object") return null;
  const normalized = {};
  for (const key of ALLOWED_SENSOR_KEYS) {
    if (key in raw) normalized[key] = !!raw[key];
  }
  return Object.keys(normalized).length > 0 ? normalized : null;
}

function defaultSensors() {
  return {
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
}

function getDefaultShiftWindows() {
  return [
    { index: 1, startTime: "06:00", endTime: "14:00" },
    { index: 2, startTime: "14:00", endTime: "22:00" },
  ];
}

function parseHHMM(timeString) {
  if (typeof timeString !== "string") return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(timeString.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isInteger(h) || !Number.isInteger(min)) return null;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function getNowMinutesInTimezone(tz = DEFAULT_TIMEZONE) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value || "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value || "0");
  return hour * 60 + minute;
}

function circularDiffMinutes(a, b) {
  const day = 24 * 60;
  const direct = Math.abs(a - b);
  return Math.min(direct, day - direct);
}

function getShiftBoundaryMatch(shifts, nowMinutes, toleranceMinutes) {
  if (!Array.isArray(shifts) || shifts.length === 0) return null;
  let best = null;
  for (let i = 0; i < shifts.length; i++) {
    const endMinutes = parseHHMM(shifts[i]?.endTime);
    if (endMinutes === null) continue;
    const diff = circularDiffMinutes(nowMinutes, endMinutes);
    if (diff <= toleranceMinutes) {
      if (!best || diff < best.diff) {
        best = { index: i, diff, endMinutes };
      }
    }
  }
  return best;
}

function normalizeNfcCards(raw) {
  if (!raw || typeof raw !== "object") return null;
  const toPositiveInt = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    const intVal = Math.trunc(n);
    return intVal > 0 ? intVal : 0;
  };
  const normalized = {
    idTech: toPositiveInt(raw.idTech),
    master1: toPositiveInt(raw.master1),
    master2: toPositiveInt(raw.master2),
  };
  if (!normalized.idTech && !normalized.master1 && !normalized.master2) return null;
  return normalized;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.serialNumber) {
       return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
    }

    const { serialNumber, totalSent, idhafa, wifi } = body;
    const buttonBEvent = !!body.buttonBEvent;
    const forceResetEvent = !!body.forceResetEvent;
    const sensorStates =
      normalizeSensorPayload(body.sensorStates) ||
      normalizeSensorPayload(body.sensors) ||
      normalizeSensorPayload(body.diagnosticSensors);
    const diagnosticError =
      typeof body.errorMessage === "string"
        ? body.errorMessage
        : typeof body.diagnosticError === "string"
          ? body.diagnosticError
          : null;
    const executedCommandId =
      typeof body.executedCommandId === "string" ? body.executedCommandId : null;
    const nfcCards = normalizeNfcCards(body.nfcCards);


    // 1. البحث عن الجهاز وتأكد من وجود العميل المرتبط به
    const device = await prisma.device.findUnique({
      where: { serialNumber },
      include: {
        client: {
          include: {
            settings: {
              include: { shifts: true },
            },
          },
        },
      }, // مهم لضمان صحة العلاقة
    });
    if (!device) return NextResponse.json({ error: "الجهاز غير مسجل" }, { status: 404 });

    if (nfcCards) {
      await prisma.diagnosticEvent.create({
        data: {
          deviceId: device.id,
          type: "INFO",
          message: `NFC_SYNC:${JSON.stringify(nfcCards)}`,
        },
      });
    }

    let counterAction = null;
    let counterMessage = null;
    let deviceForFlow = device;

    if (forceResetEvent) {
      const curIdx = deviceForFlow.currentShiftIndex || (deviceForFlow.isMorningClosed ? 2 : 1);
      const shiftTypes = ["MORNING", "EVENING", "NIGHT"];
      const shiftType = shiftTypes[Math.min(curIdx - 1, 2)];
      const shiftSnapshotCount =
        (deviceForFlow.currentSingle || 0) + (deviceForFlow.currentDouble || 0) * 2;

      const result = await prisma.$transaction(async (tx) => {
        await tx.shift.create({
          data: {
            deviceId: device.id,
            type: shiftType,
            count: shiftSnapshotCount,
            singleCount: deviceForFlow.currentSingle || 0,
            doubleCount: deviceForFlow.currentDouble || 0,
          },
        });

        await tx.deviceLog.updateMany({
          where: { deviceId: device.id, type: "cup" },
          data: { type: "archived_cup" },
        });

        return tx.device.update({
          where: { id: device.id },
          data: {
            updatedAt: new Date(),
            currentSingle: 0,
            currentDouble: 0,
            lastTotalSent: shiftSnapshotCount,
            needsReset: true,
            lastResetAt: new Date(),
            currentShiftIndex: 1,
            isMorningClosed: false,
            morningCups: 0,
            eveningCups: 0,
            nightCups: 0,
          },
        });
      });

      deviceForFlow = result;
      counterAction = "forced_reset_by_nfc";
      counterMessage = "Forced reset from counter (B + NFC)";
      await prisma.diagnosticEvent.create({
        data: {
          deviceId: device.id,
          type: "INFO",
          message: counterMessage,
        },
      });
    } else if (buttonBEvent) {
      const configuredShiftsRaw = Array.isArray(device?.client?.settings?.shifts)
        ? [...device.client.settings.shifts].sort((a, b) => a.index - b.index)
        : [];
      const configuredShifts =
        configuredShiftsRaw.length > 0 ? configuredShiftsRaw : getDefaultShiftWindows();
      const rawTz = device?.client?.settings?.timezone || DEFAULT_TIMEZONE;
      const tz = DISPLAY_TZ[rawTz] || rawTz;
      const nowMinutes = getNowMinutesInTimezone(tz);
      const boundary = getShiftBoundaryMatch(
        configuredShifts,
        nowMinutes,
        SHIFT_TOLERANCE_MINUTES,
      );

      if (!boundary) {
        counterAction = "ignored_outside_window";
        counterMessage = `B pressed outside shift window (+/-${SHIFT_TOLERANCE_MINUTES}m)`;
        await prisma.diagnosticEvent.create({
          data: {
            deviceId: device.id,
            type: "INFO",
            message: counterMessage,
          },
        });
      } else {
        const isLastBoundary = boundary.index === configuredShifts.length - 1;
        const shiftSnapshotCount =
          (deviceForFlow.currentSingle || 0) + (deviceForFlow.currentDouble || 0) * 2;
        const currentIdx = deviceForFlow.currentShiftIndex || (deviceForFlow.isMorningClosed ? 2 : 1);
        const shiftTypes = ["MORNING", "EVENING", "NIGHT"];
        const currentShiftType = shiftTypes[Math.min(currentIdx - 1, 2)];

        const result = await prisma.$transaction(async (tx) => {
          await tx.shift.create({
            data: {
              deviceId: device.id,
              type: currentShiftType,
              count: shiftSnapshotCount,
              singleCount: deviceForFlow.currentSingle || 0,
              doubleCount: deviceForFlow.currentDouble || 0,
            },
          });

          let updateData = {
            updatedAt: new Date(),
            currentSingle: 0,
            currentDouble: 0,
            lastTotalSent: shiftSnapshotCount,
            needsReset: true,
            lastResetAt: new Date(),
          };

          if (!isLastBoundary) {
            const nextIdx = currentIdx + 1;
            updateData = {
              ...updateData,
              currentShiftIndex: nextIdx,
              isMorningClosed: nextIdx >= 2,
            };
            return {
              updated: await tx.device.update({
                where: { id: device.id },
                data: updateData,
              }),
              action: "shift_changed",
              message: "Shift changed from counter button B",
            };
          }

          updateData = {
            ...updateData,
            currentShiftIndex: 1,
            isMorningClosed: false,
            morningCups: 0,
            eveningCups: 0,
            nightCups: 0,
          };
          await tx.deviceLog.updateMany({
            where: { deviceId: device.id, type: "cup" },
            data: { type: "archived_cup" },
          });
          return {
            updated: await tx.device.update({
              where: { id: device.id },
              data: updateData,
            }),
            action: "day_reset",
            message: "End-of-cycle reset from counter button B",
          };
        });

        deviceForFlow = result.updated;
        counterAction = result.action;
        counterMessage = result.message;

        await prisma.diagnosticEvent.create({
          data: {
            deviceId: device.id,
            type: "INFO",
            message: `${counterMessage} (boundary #${boundary.index + 1})`,
          },
        });
      }
    }

    // 1.1 مزامنة حالة التشخيص (sensors + errors) إن وصلت من العداد
    if (sensorStates || diagnosticError) {
      const state = await prisma.diagnosticState.upsert({
        where: { deviceId: device.id },
        create: {
          deviceId: device.id,
          serviceStatus: device.status,
          sensors: sensorStates || defaultSensors(),
          lastError: diagnosticError || null,
        },
        update: {
          ...(sensorStates ? { sensors: sensorStates } : {}),
          ...(diagnosticError ? { lastError: diagnosticError } : {}),
        },
      });

      if (sensorStates) {
        for (const [key, value] of Object.entries(sensorStates)) {
          await prisma.diagnosticEvent.create({
            data: {
              deviceId: device.id,
              type: "SENSOR",
              sensorKey: key,
              sensorValue: !!value,
              message: `${key} => ${value ? "ON" : "OFF"}`,
            },
          });
        }
      }

      if (diagnosticError) {
        await prisma.diagnosticEvent.create({
          data: {
            deviceId: device.id,
            type: "ERROR",
            message: diagnosticError,
          },
        });
      }
    }

    // 1.2 إرسال الأمر المعلق القادم للعداد (إن وجد)
    let pendingCommand = await prisma.diagnosticCommand.findFirst({
      where: { deviceId: device.id, status: "pending" },
      orderBy: { createdAt: "asc" },
    });

    let commandPayload = null;
    if (pendingCommand) {
      await prisma.diagnosticCommand.update({
        where: { id: pendingCommand.id },
        data: { status: "sent", acknowledgedAt: new Date() },
      });
      commandPayload = pendingCommand.payload || null;

      if (pendingCommand.command === "out_service" || pendingCommand.command === "on_service") {
        const nextStatus = pendingCommand.command === "out_service" ? "inactive" : "active";
        await prisma.device.update({
          where: { id: device.id },
          data: { status: nextStatus },
        });
      }

      if (pendingCommand.command === "diagno_start" || pendingCommand.command === "diagno_stop") {
        await prisma.diagnosticState.upsert({
          where: { deviceId: device.id },
          create: {
            deviceId: device.id,
            serviceStatus: device.status,
            isRunning: pendingCommand.command === "diagno_start",
            sensors: defaultSensors(),
          },
          update: { isRunning: pendingCommand.command === "diagno_start" },
        });
      }
    }

    // 1.3 توثيق تنفيذ أمر من طرف الهارد إن أرسله صراحة
    if (executedCommandId) {
      await prisma.diagnosticCommand.updateMany({
        where: { id: executedCommandId, deviceId: device.id },
        data: { status: "executed", executedAt: new Date() },
      });
    }

    const currentTotal = Number(totalSent || 0);
    const finalIdhafa = Number(idhafa) || 0;

    // إذا الجهاز خارج الخدمة، لا نحسب أكواب
    if (deviceForFlow.status !== "active") {
      await prisma.device.update({
        where: { id: deviceForFlow.id },
        data: {
          updatedAt: new Date(),
          wifiSignal: wifi?.toString(),
          lastTotalSent: currentTotal || deviceForFlow.lastTotalSent,
        },
      });
      return NextResponse.json({
        status: "out_service",
        command: pendingCommand?.command || null,
        commandId: pendingCommand?.id || null,
        commandPayload,
        counterAction,
        counterMessage,
      });
    }

    // 2. idhafa=0 = heartbeat: حدث lastTotalSent وحالة الاتصال
    // إذا totalSent زاد عن lastTotalSent = مصالحة (firmware لم يرسل idhafa أو تأخر)
    if (finalIdhafa <= 0) {
      const lastTotal = Number(deviceForFlow.lastTotalSent || 0);
      const delta = Math.max(0, currentTotal - lastTotal);
      const updateData = {
        updatedAt: new Date(),
        wifiSignal: wifi?.toString(),
        status: "active",
        lastTotalSent: currentTotal,
      };
      if (delta > 0) {
        updateData.totalCups = { increment: delta };
        const recIdx = deviceForFlow.currentShiftIndex || (deviceForFlow.isMorningClosed ? 2 : 1);
        const shiftField = recIdx === 1 ? "morningCups" : recIdx === 2 ? "eveningCups" : "nightCups";
        updateData[shiftField] = { increment: delta };
        updateData.currentSingle = { increment: delta };
        const shiftTypes = ["MORNING", "EVENING", "NIGHT"];
        const shiftType = shiftTypes[Math.min(recIdx - 1, 2)];
        const logCreates = Array.from({ length: delta }, () =>
          prisma.deviceLog.create({
            data: {
              deviceId: deviceForFlow.id,
              coffeeType: "single",
              idhafa: 1,
              totalSent: currentTotal,
              type: "cup",
              isCorrection: true,
            },
          })
        );
        await prisma.$transaction([
          prisma.device.update({ where: { id: deviceForFlow.id }, data: updateData }),
          prisma.shift.create({
            data: {
              deviceId: deviceForFlow.id,
              type: shiftType,
              count: delta,
              singleCount: delta,
              doubleCount: 0,
            },
          }),
          ...logCreates,
        ]);
      } else {
        await prisma.device.update({
          where: { id: deviceForFlow.id },
          data: updateData,
        });
      }
      return NextResponse.json({
        status: "online",
        reconciled: delta > 0 ? delta : undefined,
        command: pendingCommand?.command || null,
        commandId: pendingCommand?.id || null,
        commandPayload,
        counterAction,
        counterMessage,
      });
    }

    // 3. idhafa=1 single, idhafa=2 double
    const sInc = finalIdhafa === 1 ? 1 : 0;
    const dInc = finalIdhafa === 2 ? 1 : 0;
    const totalAdded = finalIdhafa;
    const shiftIdx = deviceForFlow.currentShiftIndex || (deviceForFlow.isMorningClosed ? 2 : 1);
    const shiftTypes = ["MORNING", "EVENING", "NIGHT"];
    const shiftType = shiftTypes[Math.min(shiftIdx - 1, 2)];

    // 4. تنفيذ العملية الكبرى (Atomic Transaction)
    const logCreates = [];
    for (let i = 0; i < sInc; i++) {
      logCreates.push(
        prisma.deviceLog.create({
          data: {
            deviceId: deviceForFlow.id,
            coffeeType: "single",
            idhafa: 1,
            totalSent: currentTotal,
            type: "cup",
          },
        })
      );
    }
    for (let i = 0; i < dInc; i++) {
      logCreates.push(
        prisma.deviceLog.create({
          data: {
            deviceId: deviceForFlow.id,
            coffeeType: "double",
            idhafa: 2,
            totalSent: currentTotal,
            type: "cup",
          },
        })
      );
    }
    await prisma.$transaction([
      prisma.device.update({
        where: { id: deviceForFlow.id },
        data: {
          totalCups: { increment: totalAdded },
          currentSingle: { increment: sInc },
          currentDouble: { increment: dInc },
          lastTotalSent: currentTotal,
          ...(shiftIdx === 1
            ? { morningCups: { increment: totalAdded } }
            : shiftIdx === 2
              ? { eveningCups: { increment: totalAdded } }
              : { nightCups: { increment: totalAdded } }
          ),
          updatedAt: new Date(),
        },
      }),
      ...logCreates,
      prisma.shift.create({
        data: {
          deviceId: deviceForFlow.id,
          type: shiftType,
          count: totalAdded,
          singleCount: sInc,
          doubleCount: dInc,
        },
      }),
    ]);

    return NextResponse.json({
      status: "success",
      added: totalAdded,
      command: pendingCommand?.command || null,
      commandId: pendingCommand?.id || null,
      commandPayload,
      counterAction,
      counterMessage,
    });

  } catch (error) {
    console.error("❌ CRITICAL DB ERROR:", error);
    return NextResponse.json({ 
      error: "فشل في تسجيل البيانات", 
      detail: error.message 
    }, { status: 500 });
  }
}