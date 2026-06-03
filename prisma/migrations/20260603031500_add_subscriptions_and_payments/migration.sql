-- AlterTable
ALTER TABLE `User`
    ADD COLUMN `subscriptionPlan` ENUM('FREE', 'BASIC', 'PRO') NOT NULL DEFAULT 'FREE',
    ADD COLUMN `subscriptionExpiry` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `plan` ENUM('FREE', 'BASIC', 'PRO') NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `amount` INTEGER NOT NULL,
    `periodDays` INTEGER NOT NULL DEFAULT 30,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'IDR',
    `startsAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Subscription_userId_status_idx`(`userId`, `status`),
    INDEX `Subscription_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` VARCHAR(191) NOT NULL,
    `subscriptionId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `provider` VARCHAR(50) NOT NULL DEFAULT 'SIMULATED_MIDTRANS',
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `paymentToken` VARCHAR(191) NOT NULL,
    `paymentUrl` VARCHAR(255) NULL,
    `grossAmount` INTEGER NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentTransaction_orderId_key`(`orderId`),
    UNIQUE INDEX `PaymentTransaction_subscriptionId_key`(`subscriptionId`),
    UNIQUE INDEX `PaymentTransaction_paymentToken_key`(`paymentToken`),
    INDEX `PaymentTransaction_userId_status_idx`(`userId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
