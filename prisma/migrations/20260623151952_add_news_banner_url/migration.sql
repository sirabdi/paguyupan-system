-- AlterTable
ALTER TABLE `news` ADD COLUMN `banner_url` VARCHAR(191) NULL;

-- RenameIndex
ALTER TABLE `news` RENAME INDEX `news_penulis_id_fkey` TO `news_penulis_id_idx`;
