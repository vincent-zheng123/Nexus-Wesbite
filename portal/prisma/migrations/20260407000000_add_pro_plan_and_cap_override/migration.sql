-- AlterEnum: Add PRO value to ClientPlan
-- Note: PostgreSQL ADD VALUE cannot run inside a transaction block.
-- Prisma handles this automatically during migrate deploy.
ALTER TYPE "ClientPlan" ADD VALUE 'PRO';

-- AlterTable: Add plan_cap_override to client_config
ALTER TABLE "client_config" ADD COLUMN "plan_cap_override" BOOLEAN NOT NULL DEFAULT false;
