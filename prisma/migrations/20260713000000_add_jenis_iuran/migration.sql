-- AlterTable: kuota jenis iuran tambahan per komunitas
ALTER TABLE `komunitas` ADD COLUMN `max_iuran_tambahan` INTEGER NOT NULL DEFAULT 3;

-- CreateTable: jenis iuran per komunitas
CREATE TABLE `jenis_iuran` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `komunitas_id` INTEGER NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `jumlah` DECIMAL(12, 2) NOT NULL,
    `interval_bulan` INTEGER NOT NULL DEFAULT 1,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `jenis_iuran_komunitas_id_idx`(`komunitas_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: link iuran ke jenis iuran
ALTER TABLE `iuran` ADD COLUMN `jenis_iuran_id` INTEGER NULL;

-- Ganti unique lama (anggota_id, periode) → (anggota_id, periode, jenis_iuran_id).
-- Index baru dibuat DULU agar tetap ada index ber-leftmost `anggota_id` untuk FK,
-- baru index lama boleh di-drop.
CREATE UNIQUE INDEX `iuran_anggota_id_periode_jenis_iuran_id_key` ON `iuran`(`anggota_id`, `periode`, `jenis_iuran_id`);
DROP INDEX `iuran_anggota_id_periode_key` ON `iuran`;
CREATE INDEX `iuran_jenis_iuran_id_idx` ON `iuran`(`jenis_iuran_id`);

-- AddForeignKey
ALTER TABLE `iuran` ADD CONSTRAINT `iuran_jenis_iuran_id_fkey` FOREIGN KEY (`jenis_iuran_id`) REFERENCES `jenis_iuran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `jenis_iuran` ADD CONSTRAINT `jenis_iuran_komunitas_id_fkey` FOREIGN KEY (`komunitas_id`) REFERENCES `komunitas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
