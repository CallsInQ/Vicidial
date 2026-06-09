-- qDialer v1 agency cost and productivity schema.
-- Import this into the same MySQL database VICIDIAL uses, usually `asterisk`.
-- These tables are intentionally prefixed and separate from core VICIDIAL tables.

CREATE TABLE IF NOT EXISTS qdialer_roles (
  role_id INT(9) UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
  user VARCHAR(20) NOT NULL,
  role_name ENUM('OWNER','ADMIN','MANAGER','AGENT') default 'AGENT',
  can_view_costs ENUM('Y','N') default 'N',
  can_export_reports ENUM('Y','N') default 'N',
  can_correct_records ENUM('Y','N') default 'N',
  can_review_recordings ENUM('Y','N') default 'N',
  created_at DATETIME,
  updated_at TIMESTAMP,
  UNIQUE KEY qdialer_roles_user (user)
);

CREATE TABLE IF NOT EXISTS qdialer_vendors (
  vendor_id INT(9) UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
  vendor_name VARCHAR(80) NOT NULL,
  vendor_code VARCHAR(40),
  active ENUM('Y','N') default 'Y',
  notes TEXT,
  created_by VARCHAR(20),
  created_at DATETIME,
  updated_at TIMESTAMP,
  UNIQUE KEY qdialer_vendor_code (vendor_code),
  KEY qdialer_vendor_active (active)
);

CREATE TABLE IF NOT EXISTS qdialer_cost_rules (
  rule_id INT(9) UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
  vendor_id INT(9) UNSIGNED NOT NULL,
  source_type ENUM('INGROUP','LIST','WEBHOOK') NOT NULL,
  source_id VARCHAR(80) NOT NULL,
  campaign_id VARCHAR(20),
  cost_model ENUM('CPA','CPL') NOT NULL,
  cost_amount DECIMAL(10,2) NOT NULL default '0.00',
  duration_threshold_sec INT(10) UNSIGNED NOT NULL default '0',
  duration_basis ENUM('AGENT_TALK','TOTAL_CALL') default 'AGENT_TALK',
  conversion_statuses VARCHAR(255) default 'SALE',
  active ENUM('Y','N') default 'Y',
  created_by VARCHAR(20),
  created_at DATETIME,
  updated_at TIMESTAMP,
  KEY qdialer_cost_rule_source (source_type,source_id),
  KEY qdialer_cost_rule_vendor (vendor_id),
  KEY qdialer_cost_rule_campaign (campaign_id)
);

CREATE TABLE IF NOT EXISTS qdialer_lead_attribution (
  attribution_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
  lead_id INT(9) UNSIGNED NOT NULL,
  list_id BIGINT(14) UNSIGNED,
  vendor_id INT(9) UNSIGNED,
  rule_id INT(9) UNSIGNED,
  attribution_type ENUM('INGROUP','LIST','WEBHOOK','ORGANIC','REFERRAL','CALLBACK','INTERNAL','UNATTRIBUTED') default 'UNATTRIBUTED',
  source_id VARCHAR(80),
  accepted_at DATETIME,
  accepted_cost DECIMAL(10,2) default '0.00',
  inherited_from_lead_id INT(9) UNSIGNED,
  review_status ENUM('OK','NEEDS_REVIEW','CORRECTED') default 'OK',
  created_at DATETIME,
  updated_at TIMESTAMP,
  UNIQUE KEY qdialer_lead_attr_lead (lead_id),
  KEY qdialer_lead_attr_vendor (vendor_id),
  KEY qdialer_lead_attr_list (list_id),
  KEY qdialer_lead_attr_source (attribution_type,source_id)
);

CREATE TABLE IF NOT EXISTS qdialer_cost_events (
  event_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
  event_date DATETIME NOT NULL,
  vendor_id INT(9) UNSIGNED,
  rule_id INT(9) UNSIGNED,
  source_type ENUM('INGROUP','LIST','WEBHOOK','ORGANIC','REFERRAL','CALLBACK','INTERNAL','UNATTRIBUTED') default 'UNATTRIBUTED',
  source_id VARCHAR(80),
  campaign_id VARCHAR(20),
  ingroup_id VARCHAR(20),
  list_id BIGINT(14) UNSIGNED,
  lead_id INT(9) UNSIGNED,
  call_uniqueid VARCHAR(20),
  closecallid INT(9) UNSIGNED,
  user VARCHAR(20),
  call_status VARCHAR(6),
  corrected_status VARCHAR(6),
  cost_model ENUM('CPA','CPL','ADJUSTMENT') NOT NULL,
  applied_cost DECIMAL(10,2) NOT NULL default '0.00',
  original_cost DECIMAL(10,2) NOT NULL default '0.00',
  is_billable ENUM('Y','N') default 'N',
  is_acquisition ENUM('Y','N') default 'N',
  duration_basis ENUM('AGENT_TALK','TOTAL_CALL') default 'AGENT_TALK',
  talk_seconds INT(10) UNSIGNED default '0',
  total_seconds INT(10) UNSIGNED default '0',
  sample_confidence ENUM('LOW','NORMAL') default 'NORMAL',
  attribution_bucket ENUM('VENDOR','ORGANIC','REFERRAL','CALLBACK','INTERNAL','UNATTRIBUTED_REVIEW') default 'VENDOR',
  snapshot_note TEXT,
  created_at DATETIME,
  updated_at TIMESTAMP,
  UNIQUE KEY qdialer_cost_event_unique (call_uniqueid,lead_id,cost_model),
  KEY qdialer_cost_event_date (event_date),
  KEY qdialer_cost_event_vendor (vendor_id),
  KEY qdialer_cost_event_user (user),
  KEY qdialer_cost_event_lead (lead_id),
  KEY qdialer_cost_event_source (source_type,source_id)
);

CREATE TABLE IF NOT EXISTS qdialer_status_categories (
  status VARCHAR(6) PRIMARY KEY NOT NULL,
  category ENUM('ACQUISITION','CONTACT','NO_ANSWER','BAD_LEAD','DNC','CALLBACK','OTHER') default 'OTHER',
  active ENUM('Y','N') default 'Y',
  created_by VARCHAR(20),
  created_at DATETIME,
  updated_at TIMESTAMP
);

INSERT IGNORE INTO qdialer_status_categories
  (status, category, active, created_at)
VALUES
  ('SALE','ACQUISITION','Y',NOW());

CREATE TABLE IF NOT EXISTS qdialer_adjustments (
  adjustment_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
  adjustment_type ENUM('CALL_COST','LEAD_COST','VENDOR_DAY_TOTAL','STATUS_SYNC','ATTRIBUTION') NOT NULL,
  vendor_id INT(9) UNSIGNED,
  event_id INT(10) UNSIGNED,
  lead_id INT(9) UNSIGNED,
  call_uniqueid VARCHAR(20),
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  adjusted_by VARCHAR(20),
  adjusted_at DATETIME,
  KEY qdialer_adj_vendor (vendor_id),
  KEY qdialer_adj_event (event_id),
  KEY qdialer_adj_lead (lead_id),
  KEY qdialer_adj_call (call_uniqueid),
  KEY qdialer_adj_date (adjusted_at)
);

CREATE TABLE IF NOT EXISTS qdialer_recording_reviews (
  review_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
  recording_id INT(10) UNSIGNED,
  lead_id INT(9) UNSIGNED,
  call_uniqueid VARCHAR(20),
  vendor_id INT(9) UNSIGNED,
  user VARCHAR(20),
  review_tag ENUM('BILLABLE','NON_BILLABLE','BAD_LEAD','GOOD_TRANSFER','AGENT_ISSUE','VENDOR_ISSUE','NEEDS_FOLLOW_UP') default 'NEEDS_FOLLOW_UP',
  review_note TEXT,
  reviewed_by VARCHAR(20),
  reviewed_at DATETIME,
  KEY qdialer_review_recording (recording_id),
  KEY qdialer_review_vendor (vendor_id),
  KEY qdialer_review_user (user),
  KEY qdialer_review_date (reviewed_at)
);

CREATE TABLE IF NOT EXISTS qdialer_recommendation_settings (
  setting_id INT(9) UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
  enabled ENUM('Y','N') default 'N',
  business_start TIME default '10:00:00',
  business_end TIME default '18:00:00',
  checkpoints_per_day TINYINT(2) UNSIGNED default '4',
  created_by VARCHAR(20),
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qdialer_recommendation_dismissals (
  dismissal_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
  recommendation_key VARCHAR(120) NOT NULL,
  checkpoint_at DATETIME NOT NULL,
  dismissed_by VARCHAR(20),
  dismissed_at DATETIME,
  KEY qdialer_rec_dismiss_key (recommendation_key,checkpoint_at)
);
