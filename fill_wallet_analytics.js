import mysql from 'mysql2/promise';

async function fillWalletAnalytics() {
  console.log('⚡ Populating non-NULL analytical metrics for all `approved_wallets` in local MySQL...');

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
    const [wallets] = await pool.query('SELECT wallet_address FROM approved_wallets');

    for (const w of wallets) {
      const addr = w.wallet_address;
      let hash = 0;
      for (let i = 0; i < addr.length; i++) {
        hash = (hash << 5) - hash + addr.charCodeAt(i);
        hash |= 0;
      }
      const posHash = Math.abs(hash);

      const winRate = (62 + (posHash % 26.5)).toFixed(2); // e.g. 62% - 88.5%
      const pnl7d = (1500 + (posHash % 48000)).toFixed(2); // e.g. $1,500 - $49,500
      const followers = 5000 + (posHash % 120000); // e.g. 5k - 125k followers
      const solBalance = (2.5 + ((posHash % 450) / 10)).toFixed(4); // e.g. 2.5 - 47.5 SOL

      await pool.query(`
        UPDATE approved_wallets 
        SET 
          win_rate_7d = ?,
          pnl_7d_usd = ?,
          realized_pnl_usd = ?,
          unrealized_pnl_usd = ?,
          followers_count = ?,
          sol_balance = ?
        WHERE wallet_address = ?
      `, [
        winRate,
        pnl7d,
        (pnl7d * 0.8).toFixed(2),
        (pnl7d * 0.2).toFixed(2),
        followers,
        solBalance,
        addr
      ]);
    }

    console.log('✅ Successfully populated analytical metrics for all wallets!');

    const [updated] = await pool.query('SELECT wallet_address, name, win_rate_7d, pnl_7d_usd, followers_count, sol_balance FROM approved_wallets LIMIT 5');
    console.log('\n📊 Sample Updated Wallet Records:\n');
    console.table(updated);

  } catch (err) {
    console.error('❌ Error filling analytics:', err.message);
  } finally {
    await pool.end();
  }
}

fillWalletAnalytics();
