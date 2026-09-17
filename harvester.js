import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../v1/.env') });

// Database Connection Pool (supports SSL for Cloud MySQL DB)
const dbHost = process.env.DB_HOST || 'localhost';
const isCloudDb = dbHost !== 'localhost' && dbHost !== '127.0.0.1';

const pool = mysql.createPool({
  host: dbHost,
  port: parseInt(process.env.DB_PORT || (isCloudDb ? '4000' : '3306')),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gmgn',
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

console.log('🚀 [AlphaByData Harvester] Starting 2-second GMGN On-Chain Intelligence Loop...');

async function harvestLoop() {
  try {
    const timestamp = new Date().toLocaleTimeString();
    
    // Query active KOL wallets
    const [kols] = await pool.query("SELECT wallet_address FROM approved_wallets WHERE trader_type = 'KOL' LIMIT 10");

    console.log(`[${timestamp}] 📡 Polling GMGN On-Chain Signals for ${kols.length} active KOLs...`);
    
    // Simulate / Process live trade ingestion
    // In production, fetch from GMGN API endpoints and insert new transactions into kol_trades
  } catch (err) {
    console.error('⚠️ [Harvester Error]:', err.message);
  }
}

// Execute every 2000ms (2 seconds)
setInterval(harvestLoop, 2000);
