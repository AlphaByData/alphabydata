import mysql from 'mysql2/promise';

async function checkNullColumns() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'alphabydata',
    waitForConnections: true,
    connectionLimit: 3
  });

  try {
    const [rows] = await pool.query('SELECT * FROM approved_wallets LIMIT 10');
    console.log('📋 Sample `approved_wallets` rows in DB:\n');
    console.log(JSON.stringify(rows, null, 2));

    const [cols] = await pool.query('DESCRIBE approved_wallets');
    console.log('\n📐 `approved_wallets` Table Schema:\n', cols.map(c => `${c.Field} (${c.Type}, Null: ${c.Null})`).join('\n'));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkNullColumns();
