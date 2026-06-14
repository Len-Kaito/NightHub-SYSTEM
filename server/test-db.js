require('dotenv').config();
const db = require('./config/database');

async function testConnection() {
    try {
        await db.initialize();
        console.log('Fetching tables in current schema...');
        
        // Liệt kê các bảng của user hiện tại
        const tables = await db.execute('SELECT table_name FROM user_tables');
        console.log(`Found ${tables.rows.length} tables:`);
        tables.rows.forEach(t => console.log('- ' + t.TABLE_NAME));
        
        await db.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi:', err);
        process.exit(1);
    }
}

testConnection();
