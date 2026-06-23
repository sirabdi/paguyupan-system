-- AlterTable
ALTER TABLE `anggota` MODIFY `role` ENUM('ADMIN', 'SEKERTARIS', 'BENDAHARA', 'ANGGOTA') NOT NULL DEFAULT 'ANGGOTA';

-- CreateTable
CREATE TABLE `news` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` VARCHAR(191) NOT NULL,
    `konten` TEXT NOT NULL,
    `penulis_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `news` ADD CONSTRAINT `news_penulis_id_fkey` FOREIGN KEY (`penulis_id`) REFERENCES `anggota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
