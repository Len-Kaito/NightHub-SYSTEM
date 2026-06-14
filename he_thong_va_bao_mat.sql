
-- PROFILE BẢO MẬT
ALTER SYSTEM SET RESOURCE_LIMIT = TRUE;

PROMPT Khoi tao ADMIN_PROFILE voi cac rang buoc mat khau...
CREATE PROFILE ADMIN_PROFILE LIMIT
    FAILED_LOGIN_ATTEMPTS 3
    PASSWORD_LOCK_TIME 1
    PASSWORD_LIFE_TIME 90
    PASSWORD_GRACE_TIME 7
    SESSIONS_PER_USER 2
    IDLE_TIME 15;

-- LOGON TRIGGER KIỂM SOÁT IP
PROMPT Khoi tao Logon Trigger kiem soat IP truy cap...
CREATE OR REPLACE TRIGGER TRG_SECURITY_LOGON
AFTER LOGON ON DATABASE
DECLARE
    v_ip_address VARCHAR2(50);
    v_username   VARCHAR2(50);
BEGIN
    v_ip_address := SYS_CONTEXT('USERENV', 'IP_ADDRESS');
    v_username   := SYS_CONTEXT('USERENV', 'SESSION_USER');

    IF v_username IN ('SYSTEM', 'USR_SYSADMIN') THEN
        IF v_ip_address NOT LIKE '192.168.1.%' AND v_ip_address IS NOT NULL AND v_ip_address != '127.0.0.1' THEN
            RAISE_APPLICATION_ERROR(-20500, 'Tu choi truy cap! Dia chi IP cua ban khong duoc phep quan tri he thong.');
        END IF;
    END IF;
END;
/