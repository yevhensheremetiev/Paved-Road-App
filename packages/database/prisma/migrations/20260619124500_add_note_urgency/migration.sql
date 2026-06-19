-- CreateEnum
CREATE TYPE "NoteUrgency" AS ENUM ('URGENT', 'CAN_WAIT', 'ANYTIME');

-- AlterTable
ALTER TABLE "Note" ADD COLUMN "urgency" "NoteUrgency" NOT NULL DEFAULT 'CAN_WAIT';
