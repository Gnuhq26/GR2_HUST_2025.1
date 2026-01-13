-- AlterTable
ALTER TABLE `order` ADD COLUMN `PaidAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `Status` VARCHAR(50) NOT NULL DEFAULT 'Completed';

-- AlterTable
ALTER TABLE `orderdetail` ADD COLUMN `CostPrice` DECIMAL(18, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `stockreceipt` ADD COLUMN `PaidAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `InventoryLog` (
    `LogID` INTEGER NOT NULL AUTO_INCREMENT,
    `StoreID` INTEGER NOT NULL,
    `ProductID` INTEGER NOT NULL,
    `ChangeType` VARCHAR(50) NOT NULL,
    `ReferenceType` VARCHAR(50) NULL,
    `ReferenceID` INTEGER NULL,
    `OldQuantity` DECIMAL(18, 2) NOT NULL,
    `ChangeQuantity` DECIMAL(18, 2) NOT NULL,
    `NewQuantity` DECIMAL(18, 2) NOT NULL,
    `Note` TEXT NULL,
    `CreatedBy` INTEGER NULL,
    `CreatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `InventoryLog_StoreID_idx`(`StoreID`),
    INDEX `InventoryLog_ProductID_idx`(`ProductID`),
    INDEX `InventoryLog_ReferenceType_ReferenceID_idx`(`ReferenceType`, `ReferenceID`),
    INDEX `InventoryLog_CreatedAt_idx`(`CreatedAt`),
    PRIMARY KEY (`LogID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InventoryLog` ADD CONSTRAINT `InventoryLog_ProductID_fkey` FOREIGN KEY (`ProductID`) REFERENCES `Product`(`ProductID`) ON DELETE RESTRICT ON UPDATE CASCADE;
