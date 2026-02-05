require('dotenv').config();
const { Pool } = require('pg');

async function markAssetBroken() {
  const assetId = process.argv[2];
  
  if (!assetId) {
    console.error('Usage: node scripts/mark-asset-broken.js <asset-id>');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Check if asset exists
    const checkResult = await pool.query(
      'SELECT id, title, status FROM "Asset" WHERE id = $1',
      [assetId]
    );

    if (checkResult.rows.length === 0) {
      console.log('Asset not found');
      process.exit(0);
    }

    const asset = checkResult.rows[0];
    console.log('Marking asset as broken:', asset.title);
    console.log('Current status:', asset.status);
    
    // Update the asset to REJECTED status with a note
    await pool.query(
      `UPDATE "Asset" 
       SET status = 'REJECTED', 
           "rejectionReason" = 'File not found in R2 storage (404 error)'
       WHERE id = $1`,
      [assetId]
    );

    console.log('✓ Asset marked as REJECTED with reason: File not found in R2 storage');
    console.log('\nNote: The asset record is kept for audit purposes.');
    console.log('The file does not exist in R2 and cannot be accessed.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

markAssetBroken();
