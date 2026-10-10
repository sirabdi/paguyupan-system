-- DropIndex
DROP INDEX `komunitas_kode_key` ON `komunitas`;

-- AlterTable
ALTER TABLE `otp_code` ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `ip` VARCHAR(191) NULL,
    ADD COLUMN `percobaan` INTEGER NOT NULL DEFAULT 0,
    MODIFY `anggota_id` INTEGER NULL;

-- Konversi status lama TRIAL → MENUNGGU_PEMBAYARAN (aman untuk DB yang sudah berisi data)
ALTER TABLE `komunitas` MODIFY `status` ENUM('TRIAL', 'MENUNGGU_PEMBAYARAN', 'AKTIF', 'SUSPEND') NOT NULL DEFAULT 'MENUNGGU_PEMBAYARAN';
UPDATE `komunitas` SET `status` = 'MENUNGGU_PEMBAYARAN' WHERE `status` = 'TRIAL';

-- AlterTable
ALTER TABLE `komunitas` DROP COLUMN `durasi_hari`,
    DROP COLUMN `kode`,
    ADD COLUMN `paket` ENUM('BASIC', 'PRO', 'MAX') NULL,
    ADD COLUMN `pengingat_h1_at` DATETIME(3) NULL,
    ADD COLUMN `pengingat_h7_at` DATETIME(3) NULL,
    MODIFY `kuota_anggota` INTEGER NOT NULL DEFAULT 20,
    MODIFY `status` ENUM('MENUNGGU_PEMBAYARAN', 'AKTIF', 'SUSPEND') NOT NULL DEFAULT 'MENUNGGU_PEMBAYARAN';

-- CreateTable
CREATE TABLE `pembayaran` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `komunitas_id` INTEGER NOT NULL,
    `dibuat_oleh_id` INTEGER NULL,
    `external_id` VARCHAR(191) NOT NULL,
    `xendit_invoice_id` VARCHAR(191) NULL,
    `invoice_url` TEXT NULL,
    `paket` ENUM('BASIC', 'PRO', 'MAX') NOT NULL,
    `durasi_bulan` INTEGER NOT NULL,
    `harga` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `metode` VARCHAR(191) NULL,
    `bonus_hari` INTEGER NOT NULL DEFAULT 0,
    `periode_mulai` DATETIME(3) NULL,
    `periode_selesai` DATETIME(3) NULL,
    `kedaluwarsa_at` DATETIME(3) NOT NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pembayaran_external_id_key`(`external_id`),
    UNIQUE INDEX `pembayaran_xendit_invoice_id_key`(`xendit_invoice_id`),
    INDEX `pembayaran_komunitas_id_status_idx`(`komunitas_id`, `status`),
    INDEX `pembayaran_status_kedaluwarsa_at_idx`(`status`, `kedaluwarsa_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `otp_code_email_purpose_idx` ON `otp_code`(`email`, `purpose`);

-- CreateIndex
CREATE INDEX `otp_code_ip_created_at_idx` ON `otp_code`(`ip`, `created_at`);

-- CreateIndex
CREATE INDEX `komunitas_status_expired_at_idx` ON `komunitas`(`status`, `expired_at`);

-- AddForeignKey
ALTER TABLE `pembayaran` ADD CONSTRAINT `pembayaran_komunitas_id_fkey` FOREIGN KEY (`komunitas_id`) REFERENCES `komunitas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pembayaran` ADD CONSTRAINT `pembayaran_dibuat_oleh_id_fkey` FOREIGN KEY (`dibuat_oleh_id`) REFERENCES `anggota`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

