-- AlterTable
ALTER TABLE "MeetingTranscript" ADD COLUMN     "clientEmail" TEXT,
ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "hostEmail" TEXT,
ADD COLUMN     "hostName" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "meetingType" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "recordingUrl" TEXT;
