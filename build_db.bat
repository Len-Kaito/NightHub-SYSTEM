@echo off
chcp 65001
set NLS_LANG=AMERICAN_AMERICA.AL32UTF8
sqlplus SYSTEM/123456@localhost:1521/XEPDB1 @build_database.sql
echo "Database Rebuild Complete!"
