-- AlterTable
ALTER TABLE `Recipe`
    ADD COLUMN `difficulty` VARCHAR(50) NULL AFTER `cookTimeMinutes`;
