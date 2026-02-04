-- AlterEnum: Update Platform enum with new values
ALTER TYPE "Platform" ADD VALUE IF NOT EXISTS 'ADS';
ALTER TYPE "Platform" ADD VALUE IF NOT EXISTS 'META';
ALTER TYPE "Platform" ADD VALUE IF NOT EXISTS 'SEO';
ALTER TYPE "Platform" ADD VALUE IF NOT EXISTS 'BLOGS';
ALTER TYPE "Platform" ADD VALUE IF NOT EXISTS 'SNAPCHAT';

-- AlterTable: Add platforms array to AssetDownload
ALTER TABLE "AssetDownload" ADD COLUMN "platforms" "Platform"[] DEFAULT ARRAY[]::"Platform"[];
