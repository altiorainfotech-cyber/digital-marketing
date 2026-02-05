require('dotenv').config();
const { Pool } = require('pg');

async function deleteAsset() {
  const assetId = process.argv[2];
  
  if (!assetId) {
    console.error('Usage: node scripts/delete-broken-asset.js <asset-id>');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Check if asset exists
    const checkResult = await pool.query(
      'SELECT id, title FROM "Asset" WHERE id = $1',
      [assetId]
    );

    if (checkResult.rows.length === 0) {
      console.log('Asset not found');
      process.exit(0);
    }

    console.log('Deleting asset:', checkResult.rows[0].title);
    
    // First delete related audit logs
    await pool.query('DELETE FROM "AuditLog" WHERE "assetId" = $1', [assetId]);
    console.log('✓ Deleted related audit logs');
    
    // Delete the asset
    await pool.query('DELETE FROM "Asset" WHERE id = $1', [assetId]);

    console.log('✓ Asset deleted successfully');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

deleteAsset();
