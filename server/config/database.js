const oracledb = require('oracledb');
require('dotenv').config();

// Cấu hình output thành Object thay vì Array
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true; // Auto commit cho các lệnh INSERT/UPDATE đơn giản

async function initialize() {
    try {
        await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECTION_STRING,
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 2
        });
        console.log('Oracle Database connection pool started.');
    } catch (err) {
        console.error('init() error: ' + err.message);
        throw err;
    }
}

async function close() {
    try {
        await oracledb.getPool().close(0);
        console.log('Oracle Database connection pool closed.');
    } catch (err) {
        console.error('close() error: ' + err.message);
        throw err;
    }
}

function getPool() {
    return oracledb.getPool();
}

async function execute(sql, bindParams = {}, options = {}) {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(sql, bindParams, options);
        return result;
    } catch (err) {
        console.error('Database execute error:', err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}

module.exports = {
    initialize,
    close,
    getPool,
    execute
};
