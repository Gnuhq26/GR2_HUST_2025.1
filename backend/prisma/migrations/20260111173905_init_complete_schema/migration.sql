-- CreateTable
CREATE TABLE `Store` (
    `StoreID` INTEGER NOT NULL AUTO_INCREMENT,
    `StoreName` VARCHAR(255) NOT NULL,
    `Subdomain` VARCHAR(100) NOT NULL,
    `Phone` VARCHAR(20) NULL,
    `Address` VARCHAR(500) NULL,
    `Status` VARCHAR(50) NOT NULL DEFAULT 'Active',
    `CreatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `Store_Subdomain_key`(`Subdomain`),
    PRIMARY KEY (`StoreID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `RoleID` INTEGER NOT NULL AUTO_INCREMENT,
    `StoreID` INTEGER NOT NULL,
    `RoleName` VARCHAR(100) NOT NULL,
    `Description` VARCHAR(255) NULL,
    `CreatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `UpdatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `Role_StoreID_RoleName_key`(`StoreID`, `RoleName`),
    PRIMARY KEY (`RoleID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `PermissionID` INTEGER NOT NULL AUTO_INCREMENT,
    `Action` VARCHAR(100) NOT NULL,
    `Subject` VARCHAR(100) NOT NULL,
    `CreatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `UpdatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `Permission_Action_Subject_key`(`Action`, `Subject`),
    PRIMARY KEY (`PermissionID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `RoleID` INTEGER NOT NULL,
    `PermissionID` INTEGER NOT NULL,
    `CreatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `UpdatedAt` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`RoleID`, `PermissionID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `UserID` INTEGER NOT NULL AUTO_INCREMENT,
    `Email` VARCHAR(255) NOT NULL,
    `PasswordHash` VARCHAR(255) NOT NULL,
    `FullName` VARCHAR(100) NULL,
    `Phone` VARCHAR(20) NULL,
    `Address` VARCHAR(255) NULL,
    `CreatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `User_Email_key`(`Email`),
    PRIMARY KEY (`UserID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoreUser` (
    `StoreID` INTEGER NOT NULL,
    `UserID` INTEGER NOT NULL,
    `RoleID` INTEGER NOT NULL,
    `CreatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `UpdatedAt` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`StoreID`, `UserID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `CategoryID` INTEGER NOT NULL AUTO_INCREMENT,
    `StoreID` INTEGER NOT NULL,
    `CategoryName` VARCHAR(255) NOT NULL,
    `Description` TEXT NULL,
    `CreatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `UpdatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `Category_StoreID_CategoryName_key`(`StoreID`, `CategoryName`),
    PRIMARY KEY (`CategoryID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `ProductID` INTEGER NOT NULL AUTO_INCREMENT,
    `StoreID` INTEGER NOT NULL,
    `CategoryID` INTEGER NOT NULL,
    `ProductName` VARCHAR(255) NOT NULL,
    `SKU` VARCHAR(50) NULL,
    `BaseUnit` VARCHAR(50) NOT NULL,
    `Description` TEXT NULL,
    `IsActive` BOOLEAN NOT NULL DEFAULT true,
    `CreatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `UpdatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `Product_StoreID_SKU_key`(`StoreID`, `SKU`),
    PRIMARY KEY (`ProductID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductUnit` (
    `UnitID` INTEGER NOT NULL AUTO_INCREMENT,
    `ProductID` INTEGER NOT NULL,
    `UnitName` VARCHAR(50) NOT NULL,
    `ExchangeValue` DECIMAL(18, 3) NOT NULL,
    `IsDefault` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`UnitID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PriceList` (
    `PriceID` INTEGER NOT NULL AUTO_INCREMENT,
    `ProductID` INTEGER NOT NULL,
    `PriceName` VARCHAR(100) NOT NULL,
    `UnitPrice` DECIMAL(18, 2) NOT NULL,
    `MinQuantity` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`PriceID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Role` ADD CONSTRAINT `Role_StoreID_fkey` FOREIGN KEY (`StoreID`) REFERENCES `Store`(`StoreID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_RoleID_fkey` FOREIGN KEY (`RoleID`) REFERENCES `Role`(`RoleID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_PermissionID_fkey` FOREIGN KEY (`PermissionID`) REFERENCES `Permission`(`PermissionID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreUser` ADD CONSTRAINT `StoreUser_StoreID_fkey` FOREIGN KEY (`StoreID`) REFERENCES `Store`(`StoreID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreUser` ADD CONSTRAINT `StoreUser_UserID_fkey` FOREIGN KEY (`UserID`) REFERENCES `User`(`UserID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreUser` ADD CONSTRAINT `StoreUser_RoleID_fkey` FOREIGN KEY (`RoleID`) REFERENCES `Role`(`RoleID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_StoreID_fkey` FOREIGN KEY (`StoreID`) REFERENCES `Store`(`StoreID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_StoreID_fkey` FOREIGN KEY (`StoreID`) REFERENCES `Store`(`StoreID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_CategoryID_fkey` FOREIGN KEY (`CategoryID`) REFERENCES `Category`(`CategoryID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductUnit` ADD CONSTRAINT `ProductUnit_ProductID_fkey` FOREIGN KEY (`ProductID`) REFERENCES `Product`(`ProductID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PriceList` ADD CONSTRAINT `PriceList_ProductID_fkey` FOREIGN KEY (`ProductID`) REFERENCES `Product`(`ProductID`) ON DELETE CASCADE ON UPDATE CASCADE;
