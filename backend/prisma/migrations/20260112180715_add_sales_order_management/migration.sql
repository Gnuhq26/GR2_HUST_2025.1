-- CreateTable
CREATE TABLE `Customer` (
    `CustomerID` INTEGER NOT NULL AUTO_INCREMENT,
    `StoreID` INTEGER NOT NULL,
    `CustomerName` VARCHAR(255) NOT NULL,
    `Phone` VARCHAR(20) NULL,
    `Address` TEXT NULL,
    `CreatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `UpdatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `Customer_StoreID_idx`(`StoreID`),
    PRIMARY KEY (`CustomerID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `OrderID` INTEGER NOT NULL AUTO_INCREMENT,
    `StoreID` INTEGER NOT NULL,
    `CustomerID` INTEGER NULL,
    `UserID` INTEGER NOT NULL,
    `OrderDate` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `TotalAmount` DECIMAL(18, 2) NOT NULL,
    `Note` TEXT NULL,

    INDEX `Order_StoreID_idx`(`StoreID`),
    INDEX `Order_CustomerID_idx`(`CustomerID`),
    INDEX `Order_UserID_idx`(`UserID`),
    PRIMARY KEY (`OrderID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderDetail` (
    `DetailID` INTEGER NOT NULL AUTO_INCREMENT,
    `OrderID` INTEGER NOT NULL,
    `ProductID` INTEGER NOT NULL,
    `UnitName` VARCHAR(50) NOT NULL,
    `Quantity` DECIMAL(18, 2) NOT NULL,
    `UnitPrice` DECIMAL(18, 2) NOT NULL,

    INDEX `OrderDetail_OrderID_idx`(`OrderID`),
    INDEX `OrderDetail_ProductID_idx`(`ProductID`),
    PRIMARY KEY (`DetailID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `StockReceipt_StoreID_idx` ON `StockReceipt`(`StoreID`);

-- AddForeignKey
ALTER TABLE `StockReceipt` ADD CONSTRAINT `StockReceipt_StoreID_fkey` FOREIGN KEY (`StoreID`) REFERENCES `Store`(`StoreID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_StoreID_fkey` FOREIGN KEY (`StoreID`) REFERENCES `Store`(`StoreID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_StoreID_fkey` FOREIGN KEY (`StoreID`) REFERENCES `Store`(`StoreID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_CustomerID_fkey` FOREIGN KEY (`CustomerID`) REFERENCES `Customer`(`CustomerID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_UserID_fkey` FOREIGN KEY (`UserID`) REFERENCES `User`(`UserID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderDetail` ADD CONSTRAINT `OrderDetail_OrderID_fkey` FOREIGN KEY (`OrderID`) REFERENCES `Order`(`OrderID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderDetail` ADD CONSTRAINT `OrderDetail_ProductID_fkey` FOREIGN KEY (`ProductID`) REFERENCES `Product`(`ProductID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `stockreceipt` RENAME INDEX `StockReceipt_SupplierID_fkey` TO `StockReceipt_SupplierID_idx`;

-- RenameIndex
ALTER TABLE `stockreceiptdetail` RENAME INDEX `StockReceiptDetail_ProductID_fkey` TO `StockReceiptDetail_ProductID_idx`;

-- RenameIndex
ALTER TABLE `stockreceiptdetail` RENAME INDEX `StockReceiptDetail_ReceiptID_fkey` TO `StockReceiptDetail_ReceiptID_idx`;
