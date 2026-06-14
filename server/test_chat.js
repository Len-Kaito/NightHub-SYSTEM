const oracledb = require('oracledb');
const fs = require('fs');

async function test() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: "C##NIGHTHUB",
      password: "123",
      connectString: "localhost:1521/XEPDB1"
    });

    const result = await connection.execute(
      `SELECT MaTN, NoiDung, NguoiGui, ThoiGian, MaPhien FROM TIN_NHAN_AI ORDER BY ThoiGian DESC FETCH FIRST 10 ROWS ONLY`
    );
    console.log(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}
test();
