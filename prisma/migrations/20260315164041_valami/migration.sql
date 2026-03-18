/*
  Warnings:

  - You are about to drop the column `availability` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Transaction` table. All the data in the column will be lost.
  - The `status` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `pricePerDay` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDays` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "availability",
DROP COLUMN "image",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Sedan',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deposit" DOUBLE PRECISION,
ADD COLUMN     "drivetrain" TEXT,
ADD COLUMN     "fuelType" TEXT NOT NULL DEFAULT 'Petrol',
ADD COLUMN     "horsepower" INTEGER,
ADD COLUMN     "licensePlate" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "location" TEXT NOT NULL DEFAULT 'Budapest',
ADD COLUMN     "mileage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minimumAge" INTEGER,
ADD COLUMN     "minimumRentalDays" INTEGER,
ADD COLUMN     "model" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "reviewCount" INTEGER,
ADD COLUMN     "seats" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "topSpeed" INTEGER,
ADD COLUMN     "transmission" TEXT NOT NULL DEFAULT 'Automatic',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "year" INTEGER NOT NULL DEFAULT 2020,
ADD COLUMN     "zeroToHundred" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "price",
ADD COLUMN     "deposit" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "pricePerDay" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalDays" INTEGER NOT NULL,
ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "CarImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "CarImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CarImage" ADD CONSTRAINT "CarImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
