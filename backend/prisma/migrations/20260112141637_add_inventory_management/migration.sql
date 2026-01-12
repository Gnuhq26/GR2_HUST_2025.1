-- CreateTable
CREATE TABLE `Supplier` (
    `SupplierID` INTEGER NOT NULL AUTO_INCREMENT,
    `StoreID` INTEGER NOT NULL,
    `SupplierName` VARCHAR(255) NOT NULL,
    `Phone` VARCHAR(20) NULL,
    `Address` TEXT NULL,
    `CreatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `UpdatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `Supplier_StoreID_SupplierName_key`(`StoreID`, `SupplierName`),
    PRIMARY KEY (`SupplierID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inventory` (
    `InventoryID` INTEGER NOT NULL AUTO_INCREMENT,
    `StoreID` INTEGER NOT NULL,
    `ProductID` INTEGER NOT NULL,
    `Quantity` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `LastUpdated` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `Inventory_StoreID_ProductID_key`(`StoreID`, `ProductID`),
    PRIMARY KEY (`InventoryID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockReceipt` (
    `ReceiptID` INTEGER NOT NULL AUTO_INCREMENT,
    `StoreID` INTEGER NOT NULL,
    `SupplierID` INTEGER NOT NULL,
    `ImportDate` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `TotalAmount` DECIMAL(18, 2) NOT NULL,
    `Note` TEXT NULL,
    `CreatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`ReceiptID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockReceiptDetail` (
    `DetailID` INTEGER NOT NULL AUTO_INCREMENT,
    `ReceiptID` INTEGER NOT NULL,
    `ProductID` INTEGER NOT NULL,
    `UnitName` VARCHAR(50) NOT NULL,
    `Quantity` DECIMAL(18, 2) NOT NULL,
    `UnitPrice` DECIMAL(18, 2) NOT NULL,

    PRIMARY KEY (`DetailID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Supplier` ADD CONSTRAINT `Supplier_StoreID_fkey` FOREIGN KEY (`StoreID`) REFERENCES `Store`(`StoreID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inventory` ADD CONSTRAINT `Inventory_StoreID_fkey` FOREIGN KEY (`StoreID`) REFERENCES `Store`(`StoreID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inventory` ADD CONSTRAINT `Inventory_ProductID_fkey` FOREIGN KEY (`ProductID`) REFERENCES `Product`(`ProductID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockReceipt` ADD CONSTRAINT `StockReceipt_SupplierID_fkey` FOREIGN KEY (`SupplierID`) REFERENCES `Supplier`(`SupplierID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockReceiptDetail` ADD CONSTRAINT `StockReceiptDetail_ReceiptID_fkey` FOREIGN KEY (`ReceiptID`) REFERENCES `StockReceipt`(`ReceiptID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockReceiptDetail` ADD CONSTRAINT `StockReceiptDetail_ProductID_fkey` FOREIGN KEY (`ProductID`) REFERENCES `Product`(`ProductID`) ON DELETE RESTRICT ON UPDATE CASCADE;
