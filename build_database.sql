
@createtables.sql
@insert_data_new.sql
@View.sql
@Function.sql
@Procedure.sql
@Trigger.sql
@Cursor.sql

-- Cập nhật mật khẩu dễ nhớ cho tài khoản test
UPDATE TAI_KHOAN SET MatKhau = '123456' WHERE Email IN ('huynq@sys.nighthub.com', 'user.vip01@gmail.com');
COMMIT;

EXIT;
