import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../v1/.env') });

const dbHost = process.env.DB_HOST || 'localhost';
const isCloudDb = dbHost !== 'localhost' && dbHost !== '127.0.0.1';

async function migrate() {
  const pool = mysql.createPool({
    host: dbHost,
    port: parseInt(process.env.DB_PORT || (isCloudDb ? '4000' : '3306')),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gmgn',
    ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 5
  });

  try {
    console.log(`🔧 Running Database Schema Expansion on host '${dbHost}'...`);

    // 1. Add missing analytical columns to approved_wallets
    const walletCols = [
      "ADD COLUMN IF NOT EXISTS win_rate_7d DECIMAL(5,2) DEFAULT NULL COMMENT '7-day win rate %'",
      "ADD COLUMN IF NOT EXISTS pnl_7d_usd DECIMAL(20,4) DEFAULT NULL COMMENT '7-day PnL in USD'",
      "ADD COLUMN IF NOT EXISTS realized_pnl_usd DECIMAL(20,4) DEFAULT NULL COMMENT 'Total realized PnL USD'",
      "ADD COLUMN IF NOT EXISTS unrealized_pnl_usd DECIMAL(20,4) DEFAULT NULL COMMENT 'Total unrealized PnL USD'",
      "ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT NULL COMMENT 'Twitter followers count'",
      "ADD COLUMN IF NOT EXISTS sol_balance DECIMAL(20,9) DEFAULT NULL COMMENT 'Live SOL wallet balance'"
    ];

    for (const colDef of walletCols) {
      try {
        await pool.query(`ALTER TABLE approved_wallets ${colDef}`);
      } catch (err) {
        console.log(`Notice on approved_wallets alter: ${err.message}`);
      }
    }
    console.log('✅ `approved_wallets` schema updated with win_rate_7d, pnl_7d_usd, followers_count, sol_balance.');

    // 2. Add missing trade & market columns to kol_trades
    const tradeCols = [
      "ADD COLUMN IF NOT EXISTS market_cap_usd DECIMAL(24,2) DEFAULT NULL COMMENT 'Market cap at trade time'",
      "ADD COLUMN IF NOT EXISTS volume_24h_usd DECIMAL(24,2) DEFAULT NULL COMMENT '24h token volume'",
      "ADD COLUMN IF NOT EXISTS profit_usd DECIMAL(20,8) DEFAULT NULL COMMENT 'Realized profit USD'",
      "ADD COLUMN IF NOT EXISTS realized_pnl_usd DECIMAL(20,8) DEFAULT NULL COMMENT 'Realized PnL USD'"
    ];

    for (const colDef of tradeCols) {
      try {
        await pool.query(`ALTER TABLE kol_trades ${colDef}`);
        await pool.query(`ALTER TABLE smart_money_trades ${colDef}`);
      } catch (err) {
        console.log(`Notice on trades alter: ${err.message}`);
      }
    }
    console.log('✅ `kol_trades` & `smart_money_trades` updated with market_cap_usd, volume_24h_usd, profit_usd.');

    console.log('\n🎉 Database Schema Migration Completed Successfully!');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
