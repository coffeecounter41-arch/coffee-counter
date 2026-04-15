-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "username" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSettings" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "gramsSingle" DOUBLE PRECISION NOT NULL DEFAULT 7,
    "gramsDouble" DOUBLE PRECISION NOT NULL DEFAULT 14,
    "shiftCount" INTEGER NOT NULL DEFAULT 2,
    "resetFrom" TEXT NOT NULL DEFAULT 'COUNTER',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Tripoli',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientShift" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "needsReset" BOOLEAN NOT NULL DEFAULT false,
    "firmwareVersion" TEXT,
    "macAddress" TEXT,
    "wifiSignal" TEXT,
    "lastIpAddress" TEXT,
    "morningCups" INTEGER NOT NULL DEFAULT 0,
    "eveningCups" INTEGER NOT NULL DEFAULT 0,
    "nightCups" INTEGER NOT NULL DEFAULT 0,
    "currentShiftIndex" INTEGER NOT NULL DEFAULT 1,
    "isMorningClosed" BOOLEAN NOT NULL DEFAULT false,
    "currentSingle" INTEGER NOT NULL DEFAULT 0,
    "currentDouble" INTEGER NOT NULL DEFAULT 0,
    "totalCups" INTEGER NOT NULL DEFAULT 0,
    "lastTotalSent" INTEGER NOT NULL DEFAULT 0,
    "lastSingleSent" INTEGER NOT NULL DEFAULT 0,
    "lastDoubleSent" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceLog" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "coffeeType" TEXT NOT NULL DEFAULT 'single',
    "idhafa" INTEGER NOT NULL,
    "totalSent" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'cup',
    "isCorrection" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "singleCount" INTEGER NOT NULL DEFAULT 0,
    "doubleCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticState" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "serviceStatus" TEXT NOT NULL DEFAULT 'active',
    "sensors" JSONB,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sensorKey" TEXT,
    "sensorValue" BOOLEAN,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticCommand" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT NOT NULL DEFAULT 'CLIENT_DASHBOARD',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "DiagnosticCommand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_uid_key" ON "Client"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Client_username_key" ON "Client"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSettings_clientId_key" ON "ClientSettings"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientShift_settingsId_index_key" ON "ClientShift"("settingsId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "Device_serialNumber_key" ON "Device"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticState_deviceId_key" ON "DiagnosticState"("deviceId");

-- CreateIndex
CREATE INDEX "DiagnosticEvent_deviceId_createdAt_idx" ON "DiagnosticEvent"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "DiagnosticCommand_deviceId_status_createdAt_idx" ON "DiagnosticCommand"("deviceId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "ClientSettings" ADD CONSTRAINT "ClientSettings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientShift" ADD CONSTRAINT "ClientShift_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "ClientSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLog" ADD CONSTRAINT "DeviceLog_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticState" ADD CONSTRAINT "DiagnosticState_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticEvent" ADD CONSTRAINT "DiagnosticEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticCommand" ADD CONSTRAINT "DiagnosticCommand_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
