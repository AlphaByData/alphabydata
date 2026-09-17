import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../v1/.env') });

// Local DB Config
const localConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gmgn'
};

// TiDB Cloud Config
const cloudConfig = {
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'pV4r7kaQjvc2DJ5.root',
  password: '65djRWxhrNvpwnDy',
  database: 'test',
  ssl: {
    rejectUnauthorized: false
  }
};

async function migrate() {
  console.log('🔌 Connecting to local MySQL...');
  const localConn = await mysql.createConnection(localConfig);

  console.log('☁️ Connecting to TiDB Cloud MySQL...');
  const cloudConn = await mysql.createConnection(cloudConfig);

  console.log('🛠️ Creating database gmgn on TiDB Cloud if not exists...');
  await cloudConn.query('CREATE DATABASE IF NOT EXISTS gmgn');
  await cloudConn.query('USE gmgn');

  console.log('🛠️ Creating approved_wallets table on TiDB Cloud...');
  await cloudConn.query(`
    CREATE TABLE IF NOT EXISTS approved_wallets (
      wallet_address VARCHAR(128) PRIMARY KEY,
      trader_type VARCHAR(32) DEFAULT 'KOL',
      name VARCHAR(128),
      twitter_username VARCHAR(128),
      twitter_name VARCHAR(128),
      avatar TEXT,
      tags TEXT,
      trade_count INT DEFAULT 0,
      first_seen_at DATETIME,
      last_seen_at DATETIME
    )
  `);

  console.log('🛠️ Creating kol_trades table on TiDB Cloud...');
  await cloudConn.query(`
    CREATE TABLE IF NOT EXISTS kol_trades (
      id INT AUTO_INCREMENT PRIMARY KEY,
      transaction_hash VARCHAR(128),
      maker VARCHAR(128),
      side VARCHAR(16),
      base_address VARCHAR(128),
      base_token_symbol VARCHAR(32),
      quote_amount DECIMAL(18,4),
      amount_usd DECIMAL(18,4),
      price_usd DECIMAL(18,8),
      trade_time DATETIME
    )
  `);

  console.log('📦 Fetching KOL approved_wallets from local DB...');
  const [wallets] = await localConn.query("SELECT * FROM approved_wallets WHERE trader_type = 'KOL'");
  console.log(`Found ${wallets.length} local KOL wallets. Migrating to TiDB Cloud...`);

  for (const w of wallets) {
    await cloudConn.query(`
      INSERT INTO approved_wallets (wallet_address, trader_type, name, twitter_username, twitter_name, avatar, tags, trade_count, first_seen_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        trader_type=VALUES(trader_type), 
        twitter_username=VALUES(twitter_username), 
        twitter_name=VALUES(twitter_name), 
        avatar=VALUES(avatar), 
        tags=VALUES(tags), 
        trade_count=VALUES(trade_count)
    `, [
      w.wallet_address,
      w.trader_type || 'KOL',
      w.name || null,
      w.twitter_username || null,
      w.twitter_name || null,
      w.avatar || null,
      typeof w.tags === 'object' ? JSON.stringify(w.tags) : (w.tags || '[]'),
      w.trade_count || 0,
      w.first_seen_at || new Date(),
      w.last_seen_at || new Date()
    ]);
  }

  console.log('📦 Fetching kol_trades from local DB...');
  const [trades] = await localConn.query("SELECT * FROM kol_trades ORDER BY trade_time DESC LIMIT 1000");
  console.log(`Found ${trades.length} local trade logs. Migrating to TiDB Cloud...`);

  for (const t of trades) {
    await cloudConn.query(`
      INSERT INTO kol_trades (transaction_hash, maker, side, base_address, base_token_symbol, quote_amount, amount_usd, price_usd, trade_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      t.transaction_hash || null,
      t.maker,
      t.side || 'BUY',
      t.base_address || null,
      t.base_token_symbol || 'TOKEN',
      t.quote_amount || 0,
      t.amount_usd || 0,
      t.price_usd || 0,
      t.trade_time || new Date()
    ]);
  }

  console.log('✅ [SUCCESS] Migration to TiDB Cloud Database completed successfully!');
  await localConn.end();
  await cloudConn.end();
}

migrate().catch(err => {
  console.error('❌ Migration Error:', err);
});
