-- AlterTable
ALTER TABLE `anggota` ADD COLUMN `komunitas_id` INTEGER NULL,
    MODIFY `role` ENUM('SUPERADMIN', 'ADMIN', 'SEKERTARIS', 'BENDAHARA', 'ANGGOTA') NOT NULL DEFAULT 'ANGGOTA';

-- AlterTable
ALTER TABLE `iuran` ADD COLUMN `komunitas_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `komentar` ADD COLUMN `komunitas_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `like` ADD COLUMN `komunitas_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `news` ADD COLUMN `komunitas_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `notifikasi` ADD COLUMN `komunitas_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `komunitas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `tipe` ENUM('RT', 'RW', 'BLOK', 'CUSTOM') NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `kuota_anggota` INTEGER NOT NULL DEFAULT 50,
    `status` ENUM('TRIAL', 'AKTIF', 'SUSPEND') NOT NULL DEFAULT 'TRIAL',
    `expired_at` DATETIME(3) NULL,
    `alamat_induk` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `komunitas_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `anggota_komunitas_id_idx` ON `anggota`(`komunitas_id`);

-- CreateIndex
CREATE INDEX `iuran_komunitas_id_idx` ON `iuran`(`komunitas_id`);

-- CreateIndex
CREATE INDEX `komentar_komunitas_id_idx` ON `komentar`(`komunitas_id`);

-- CreateIndex
CREATE INDEX `like_komunitas_id_idx` ON `like`(`komunitas_id`);

-- CreateIndex
CREATE INDEX `news_komunitas_id_idx` ON `news`(`komunitas_id`);

-- CreateIndex
CREATE INDEX `notifikasi_komunitas_id_idx` ON `notifikasi`(`komunitas_id`);

-- AddForeignKey
ALTER TABLE `anggota` ADD CONSTRAINT `anggota_komunitas_id_fkey` FOREIGN KEY (`komunitas_id`) REFERENCES `komunitas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `news` ADD CONSTRAINT `news_komunitas_id_fkey` FOREIGN KEY (`komunitas_id`) REFERENCES `komunitas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `komentar` ADD CONSTRAINT `komentar_komunitas_id_fkey` FOREIGN KEY (`komunitas_id`) REFERENCES `komunitas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `like` ADD CONSTRAINT `like_komunitas_id_fkey` FOREIGN KEY (`komunitas_id`) REFERENCES `komunitas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iuran` ADD CONSTRAINT `iuran_komunitas_id_fkey` FOREIGN KEY (`komunitas_id`) REFERENCES `komunitas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_komunitas_id_fkey` FOREIGN KEY (`komunitas_id`) REFERENCES `komunitas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
