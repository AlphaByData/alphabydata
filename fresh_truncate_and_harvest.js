import mysql from 'mysql2/promise';

async function resetAndHarvest() {
  console.log('🧹 Truncating all local database tables in `alphabydata`...');

  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'alphabydata',
    waitForConnections: true,
    connectionLimit: 5
  });

  try {
    // 1. Truncate tables
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE approved_wallets');
    await pool.query('TRUNCATE TABLE kol_trades');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Local database `alphabydata` truncated clean!');

    // 2. Verify 0 records
    const [wCount] = await pool.query('SELECT COUNT(*) as count FROM approved_wallets');
    const [tCount] = await pool.query('SELECT COUNT(*) as count FROM kol_trades');
    console.log(`📊 Current DB Record Count: approved_wallets = ${wCount[0].count}, kol_trades = ${tCount[0].count}`);

  } catch (err) {
    console.error('❌ Error truncating DB:', err.message);
  } finally {
    await pool.end();
  }
}

resetAndHarvest();
