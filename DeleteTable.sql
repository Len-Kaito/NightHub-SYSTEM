BEGIN
   FOR c IN (
      SELECT table_name
      FROM user_tables
      WHERE table_name NOT LIKE 'LOGMNR%'
      AND table_name NOT LIKE 'MLOG$%'
      AND table_name NOT LIKE 'AQ$%'
   ) LOOP
      BEGIN
         EXECUTE IMMEDIATE
            'DROP TABLE "' || c.table_name || '" CASCADE CONSTRAINTS';
      EXCEPTION
         WHEN OTHERS THEN
            NULL;
      END;
   END LOOP;
END;
/