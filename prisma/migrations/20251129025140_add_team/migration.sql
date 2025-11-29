/*
  Warnings:

  - You are about to drop the column `actorId` on the `team_activity_log` table. All the data in the column will be lost.
  - You are about to drop the column `targetId` on the `team_activity_log` table. All the data in the column will be lost.
  - You are about to drop the column `targetType` on the `team_activity_log` table. All the data in the column will be lost.
  - Added the required column `userId` to the `team_activity_log` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "team_activity_log" DROP CONSTRAINT "team_activity_log_actorId_fkey";

-- AlterTable
ALTER TABLE "team_activity_log" DROP COLUMN "actorId",
DROP COLUMN "targetId",
DROP COLUMN "targetType",
ADD COLUMN     "targetUserId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "team_invite" ADD COLUMN     "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
ADD COLUMN     "status" "InviteStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "team_activity_log" ADD CONSTRAINT "team_activity_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_activity_log" ADD CONSTRAINT "team_activity_log_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
