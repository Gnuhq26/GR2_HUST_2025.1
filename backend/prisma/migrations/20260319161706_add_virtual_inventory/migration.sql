/*
  Warnings:

  - Added the required column `QuantityType` to the `InventoryLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Inventory` ADD COLUMN `InTransitQty` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `ReservedQty` DECIMAL(18, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `InventoryLog` ADD COLUMN `QuantityType` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `DeliveryMethod` VARCHAR(50) NOT NULL DEFAULT 'Immediate',
    ADD COLUMN `LinkedReceiptID` INTEGER NULL;

-- AlterTable
ALTER TABLE `StockReceipt` ADD COLUMN `Status` VARCHAR(50) NOT NULL DEFAULT 'Received';

-- RedefineIndex
CREATE INDEX `StockReceipt_SupplierID_idx` ON `StockReceipt`(`SupplierID`);
DROP INDEX `StockReceipt_SupplierID_fkey` ON `StockReceipt`;

-- RedefineIndex
CREATE INDEX `StockReceiptDetail_ProductID_idx` ON `StockReceiptDetail`(`ProductID`);
DROP INDEX `StockReceiptDetail_ProductID_fkey` ON `StockReceiptDetail`;

-- RedefineIndex
CREATE INDEX `StockReceiptDetail_ReceiptID_idx` ON `StockReceiptDetail`(`ReceiptID`);
DROP INDEX `StockReceiptDetail_ReceiptID_fkey` ON `StockReceiptDetail`;
