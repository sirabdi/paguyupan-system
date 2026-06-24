-- CreateTable
CREATE TABLE `notifikasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `anggota_id` INTEGER NOT NULL,
    `tipe` ENUM('IURAN_TAGIHAN', 'IURAN_LUNAS') NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `pesan` TEXT NOT NULL,
    `dibaca` BOOLEAN NOT NULL DEFAULT false,
    `referensi_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifikasi_anggota_id_dibaca_idx`(`anggota_id`, `dibaca`),
    UNIQUE INDEX `notifikasi_anggota_id_tipe_referensi_id_key`(`anggota_id`, `tipe`, `referensi_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_anggota_id_fkey` FOREIGN KEY (`anggota_id`) REFERENCES `anggota`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
