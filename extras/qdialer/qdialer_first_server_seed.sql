-- qDialer first-server seed for light/dev installs.
--
-- Import after the core VICIDIAL schema and after qdialer_schema.sql:
--   mariadb asterisk < bin/MySQL_AST_CREATE_tables.sql
--   mariadb asterisk < extras/qdialer/qdialer_schema.sql
--   mariadb asterisk < extras/qdialer/qdialer_first_server_seed.sql
--
-- This mirrors the normal VICIDIAL first-login behavior by creating the
-- stock first admin account, but marks it for forced password change.
-- Production installers should replace this with a generated password or
-- disable/delete user 6666 immediately after first login.

INSERT IGNORE INTO vicidial_user_groups
  SET user_group='ADMIN',
      group_name='VICIDIAL ADMINISTRATORS',
      allowed_campaigns=' -ALL-CAMPAIGNS- - -',
      agent_status_viewable_groups=' --ALL-GROUPS-- ';

INSERT IGNORE INTO vicidial_users
  (user, pass, full_name, user_level, user_group, load_leads, campaign_detail,
   ast_admin_access, modify_users, view_reports, export_reports, active,
   force_change_password)
VALUES
  ('6666', '1234', 'qDialer First Admin', '9', 'ADMIN', '1', '1',
   '1', '1', '1', '1', 'Y', 'Y');

INSERT IGNORE INTO qdialer_roles
  (user, role_name, can_view_costs, can_export_reports, can_correct_records,
   can_review_recordings, created_at)
VALUES
  ('6666', 'OWNER', 'Y', 'Y', 'Y', 'Y', NOW());
