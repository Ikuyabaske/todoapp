ALTER TABLE "NotificationHistory"
ADD COLUMN "reminderSlot" TEXT NOT NULL DEFAULT 'once';

DROP INDEX "NotificationHistory_taskId_type_scheduledFor_key";

CREATE UNIQUE INDEX "NotificationHistory_taskId_type_scheduledFor_reminderSlot_key"
ON "NotificationHistory"("taskId", "type", "scheduledFor", "reminderSlot");
