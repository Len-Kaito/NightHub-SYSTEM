const db = require('./config/database');
async function test() {
  await db.initialize();
  try {
    await db.execute(`
      BEGIN
        RAISE_APPLICATION_ERROR(-20012, 'Bạn đã xem hết 2 tập miễn phí. Vui lòng nâng cấp gói VIP để xem tập 3 trở đi.');
      END;
    `);
  } catch (err) {
    console.log('--- RAW ERROR MESSAGE ---');
    console.log(err.message);
    console.log('-----------------------');
    console.log('Includes ORA-20?', err.message.includes('ORA-20'));
  } finally {
    await db.close();
  }
}
test();
