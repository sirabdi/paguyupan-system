-- CreateTable
CREATE TABLE `anggota` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `alamat` TEXT NULL,
    `no_telp` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `status` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF',
    `tanggal_gabung` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `anggota_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iuran` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `anggota_id` INTEGER NOT NULL,
    `periode` VARCHAR(191) NOT NULL,
    `jumlah` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('BELUM_BAYAR', 'LUNAS') NOT NULL DEFAULT 'BELUM_BAYAR',
    `tanggal_bayar` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `iuran_periode_idx`(`periode`),
    UNIQUE INDEX `iuran_anggota_id_periode_key`(`anggota_id`, `periode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `iuran` ADD CONSTRAINT `iuran_anggota_id_fkey` FOREIGN KEY (`anggota_id`) REFERENCES `anggota`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
