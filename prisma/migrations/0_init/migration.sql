-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "room" INTEGER NOT NULL,
    "age" INTEGER,
    "disease" TEXT,
    "history" TEXT,
    "progress" TEXT,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NursingRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT,

    CONSTRAINT "NursingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalSigns" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "T" DOUBLE PRECISION,
    "P" INTEGER,
    "R" INTEGER,
    "SBP" INTEGER,
    "DBP" INTEGER,
    "SPO2" INTEGER,

    CONSTRAINT "VitalSigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_room_key" ON "Patient"("room");

-- CreateIndex
CREATE UNIQUE INDEX "VitalSigns_recordId_key" ON "VitalSigns"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "NursingRecord" ADD CONSTRAINT "NursingRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSigns" ADD CONSTRAINT "VitalSigns_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "NursingRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

