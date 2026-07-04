-- AlterTable
ALTER TABLE `news` ADD COLUMN `kategori` ENUM('UNDANGAN', 'BERITA', 'PENGUMUMAN') NOT NULL DEFAULT 'BERITA';

-- CreateIndex
CREATE INDEX `news_kategori_idx` ON `news`(`kategori`);
