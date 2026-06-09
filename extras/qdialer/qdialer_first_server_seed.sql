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

-- The first admin needs the legacy VICIDIAL "super admin" flags, otherwise
-- setup pages such as Servers, Carriers, Templates, System Settings and
-- System Statuses can render as blank or no-permission pages.
UPDATE vicidial_users
  SET full_name='qDialer First Admin',
      user_level='9',
      user_group='ADMIN',
      delete_users='1',
      delete_user_groups='1',
      delete_lists='1',
      delete_campaigns='1',
      delete_ingroups='1',
      delete_remote_agents='1',
      load_leads='1',
      campaign_detail='1',
      ast_admin_access='1',
      ast_delete_phones='1',
      delete_scripts='1',
      modify_leads='1',
      change_agent_campaign='1',
      delete_filters='1',
      alter_agent_interface_options='1',
      delete_call_times='1',
      modify_call_times='1',
      modify_users='1',
      modify_campaigns='1',
      modify_lists='1',
      modify_scripts='1',
      modify_filters='1',
      modify_ingroups='1',
      modify_usergroups='1',
      modify_remoteagents='1',
      modify_servers='1',
      view_reports='1',
      qc_enabled='1',
      qc_user_level='9',
      add_timeclock_log='1',
      modify_timeclock_log='1',
      delete_timeclock_log='1',
      vdc_agent_api_access='1',
      modify_inbound_dids='1',
      delete_inbound_dids='1',
      active='Y',
      download_lists='1',
      manager_shift_enforcement_override='1',
      export_reports='1',
      delete_from_dnc='1',
      allow_alerts='1',
      callcard_admin='1',
      custom_fields_modify='1'
  WHERE user='6666';

INSERT IGNORE INTO qdialer_roles
  (user, role_name, can_view_costs, can_export_reports, can_correct_records,
   can_review_recordings, created_at)
VALUES
  ('6666', 'OWNER', 'Y', 'Y', 'Y', 'Y', NOW());
