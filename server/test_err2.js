const errMessage = `ORA-20012: Bạn đã xem hết 2 tập miễn phí. Vui lòng nâng cấp gói VIP để xem tập 3 trở đi.
ORA-06512: at line 3
Help: https://docs.oracle.com/error-help/db/ora-20012/`;
const match = errMessage.match(/ORA-20\d{3}:\s*(.*)$/m);
console.log('Match:', match);
