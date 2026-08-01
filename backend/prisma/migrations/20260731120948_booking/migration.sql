/*
  Warnings:

  - Added the required column `label` to the `seats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "seats" ADD COLUMN     "label" INTEGER NOT NULL;
