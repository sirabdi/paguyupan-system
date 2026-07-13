-- DropForeignKey
ALTER TABLE `komentar` DROP FOREIGN KEY `komentar_penulis_id_fkey`;

-- DropForeignKey
ALTER TABLE `news` DROP FOREIGN KEY `news_penulis_id_fkey`;

-- DropIndex
DROP INDEX `komentar_penulis_id_fkey` ON `komentar`;

-- AlterTable
ALTER TABLE `komentar` MODIFY `penulis_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `news` MODIFY `penulis_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `news` ADD CONSTRAINT `news_penulis_id_fkey` FOREIGN KEY (`penulis_id`) REFERENCES `anggota`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `komentar` ADD CONSTRAINT `komentar_penulis_id_fkey` FOREIGN KEY (`penulis_id`) REFERENCES `anggota`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
