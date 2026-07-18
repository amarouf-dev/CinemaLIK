/*
  Warnings:

  - You are about to drop the column `date` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `movieId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `password_hash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token` on the `User` table. All the data in the column will be lost.
  - Added the required column `showingId` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Booking_movieId_date_time_idx";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "date",
DROP COLUMN "movieId",
DROP COLUMN "time",
ADD COLUMN     "showingId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password_hash",
DROP COLUMN "refresh_token",
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "refreshToken" TEXT,
ALTER COLUMN "name" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Showing" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,

    CONSTRAINT "Showing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_showingId_fkey" FOREIGN KEY ("showingId") REFERENCES "Showing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
