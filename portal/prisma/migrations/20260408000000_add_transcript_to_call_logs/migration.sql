-- Add transcript text column to call_logs for legal record-keeping
ALTER TABLE "call_logs" ADD COLUMN "transcript" TEXT;
