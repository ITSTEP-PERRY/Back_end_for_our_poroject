RESTORE DATABASE [Perry]
FROM DISK = N'/tmp/restore/Perry.bak'
WITH
    MOVE N'Perry' TO N'/var/opt/mssql/data/Perry.mdf',
    MOVE N'Perry_log' TO N'/var/opt/mssql/data/Perry_log.ldf',
    RECOVERY,
    STATS = 10;
