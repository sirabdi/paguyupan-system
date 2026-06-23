-- AlterTable: tambah password_hash dengan default sementara, lalu hapus default-nya
ALTER TABLE `anggota`
    ADD COLUMN `password_hash` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `role` ENUM('ADMIN', 'BENDAHARA', 'ANGGOTA') NOT NULL DEFAULT 'ANGGOTA',
    MODIFY `email` VARCHAR(191) NOT NULL;

-- Hapus default setelah kolom ditambahkan (password wajib diisi secara eksplisit)
ALTER TABLE `anggota` ALTER COLUMN `password_hash` DROP DEFAULT;
