# qDialer Database Seeds

qDialer stores its own metadata in `qdialer_*` tables and leaves core VICIDIAL tables intact.

For a light first-server/dev install, import in this order:

```sh
mariadb asterisk < bin/MySQL_AST_CREATE_tables.sql
mariadb asterisk < extras/qdialer/qdialer_schema.sql
mariadb asterisk < extras/qdialer/qdialer_first_server_seed.sql
```

On newer MariaDB builds, the legacy VICIDIAL schema/seed may need non-strict SQL mode because some upstream seed values exceed older column lengths:

```sh
mariadb --init-command="SET SESSION sql_mode='NO_ENGINE_SUBSTITUTION'" asterisk < bin/MySQL_AST_CREATE_tables.sql
```

`qdialer_first_server_seed.sql` creates the familiar first VICIDIAL admin:

```text
User: 6666
Pass: 1234
```

It also sets `force_change_password='Y'` and gives that user the qDialer `OWNER` role. Change this password immediately on first login, or replace this seed with an installer-generated password before production use.

For a full traditional VICIDIAL install, the upstream `extras/first_server_install.sql` can still be used to seed sample server, phone, conference, and dialer records.
