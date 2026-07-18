/*
  Warnings:

  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "passwordHash",
DROP COLUMN "refreshToken",
ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "refresh_token" TEXT;
