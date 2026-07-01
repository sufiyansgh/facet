/*
  Warnings:

  - The values [InPrgress] on the enum `InterviewStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InterviewStatus_new" AS ENUM ('Pre', 'InProgress', 'Done');
ALTER TABLE "Interview" ALTER COLUMN "status" TYPE "InterviewStatus_new" USING ("status"::text::"InterviewStatus_new");
ALTER TYPE "InterviewStatus" RENAME TO "InterviewStatus_old";
ALTER TYPE "InterviewStatus_new" RENAME TO "InterviewStatus";
DROP TYPE "public"."InterviewStatus_old";
COMMIT;
