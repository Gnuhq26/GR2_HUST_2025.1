/*
  Warnings:

  - Added the required column `UnitName` to the `PriceList` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add UnitName column as nullable first
ALTER TABLE `PriceList` ADD COLUMN `UnitName` VARCHAR(50);

-- Step 2: Update existing records - set UnitName to Product's BaseUnit
UPDATE `PriceList` pl
INNER JOIN `Product` p ON pl.ProductID = p.ProductID
SET pl.UnitName = p.BaseUnit;

-- Step 3: Make UnitName NOT NULL
ALTER TABLE `PriceList` MODIFY COLUMN `UnitName` VARCHAR(50) NOT NULL;
