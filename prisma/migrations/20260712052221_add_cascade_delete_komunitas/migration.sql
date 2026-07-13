-- DropForeignKey
ALTER TABLE `anggota` DROP FOREIGN KEY `anggota_komunitas_id_fkey`;

-- DropForeignKey
ALTER TABLE `iuran` DROP FOREIGN KEY `iuran_komunitas_id_fkey`;

-- DropForeignKey
ALTER TABLE `komentar` DROP FOREIGN KEY `komentar_komunitas_id_fkey`;

-- DropForeignKey
ALTER TABLE `like` DROP FOREIGN KEY `like_komunitas_id_fkey`;

-- DropForeignKey
ALTER TABLE `news` DROP FOREIGN KEY `news_komunitas_id_fkey`;

-- DropForeignKey
ALTER TABLE `notifikasi` DROP FOREIGN KEY `notifikasi_komunitas_id_fkey`;

-- AddForeignKey
ALTER TABLE `anggota` ADD CONSTRAINT `anggota_komunitas_id_fkey` FOREIGN KEY (`komunitas_id`) REFERENCES `komunitas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `news` ADD CONSTRAINT `news_komunitas_id_fkey` FOREIGN KEY (`komunitas_id`) REFERENCES `komunitas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `komentar` ADD CONSTRAINT `komentar_komunitas_id_fkey` FOREIGN KEY (`komunitas_id`) REFERENCES `komunitas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `like` ADD CONSTRAINT `like_komunitas_id_fkey` FOREIGN KEY (`komunitas_id`) REFERENCES `komunitas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iuran` ADD CONSTRAINT `iuran_komunitas_id_fkey` FOREIGN KEY (`komunitas_id`) REFERENCES `komunitas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_komunitas_id_fkey` FOREIGN KEY (`komunitas_id`) REFERENCES `komunitas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
