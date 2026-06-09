<?php
require_once(dirname(dirname(__FILE__)) . '/inc/layout.php');

$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' and qdialer_schema_ready())
	{
	$user = qdialer_escape(qdialer_current_user());
	$action = isset($_POST['action']) ? $_POST['action'] : '';
	if ($action === 'vendor')
		{
		$name = qdialer_escape(trim($_POST['vendor_name']));
		$code = qdialer_escape(trim($_POST['vendor_code']));
		$notes = qdialer_escape(trim($_POST['notes']));
		if (strlen($name) > 0)
			{
			qdialer_query("INSERT INTO qdialer_vendors (vendor_name,vendor_code,notes,created_by,created_at) VALUES ('$name','$code','$notes','$user',NOW())");
			$message = 'Vendor saved.';
			}
		}
	if ($action === 'rule')
		{
		$vendor_id = (int)$_POST['vendor_id'];
		$source_type = qdialer_escape($_POST['source_type']);
		$source_id = qdialer_escape(trim($_POST['source_id']));
		$campaign_id = qdialer_escape(trim($_POST['campaign_id']));
		$cost_model = qdialer_escape($_POST['cost_model']);
		$cost_amount = (float)$_POST['cost_amount'];
		$duration_threshold_sec = (int)$_POST['duration_threshold_sec'];
		$duration_basis = qdialer_escape($_POST['duration_basis']);
		$conversion_statuses = qdialer_escape(trim($_POST['conversion_statuses']));
		if ($vendor_id > 0 and strlen($source_id) > 0)
			{
			qdialer_query("INSERT INTO qdialer_cost_rules (vendor_id,source_type,source_id,campaign_id,cost_model,cost_amount,duration_threshold_sec,duration_basis,conversion_statuses,created_by,created_at) VALUES ('$vendor_id','$source_type','$source_id','$campaign_id','$cost_model','$cost_amount','$duration_threshold_sec','$duration_basis','$conversion_statuses','$user',NOW())");
			$message = 'Cost rule saved.';
			}
		}
	if ($action === 'status')
		{
		$status = qdialer_escape(strtoupper(trim($_POST['status'])));
		$category = qdialer_escape($_POST['category']);
		if (strlen($status) > 0)
			{
			qdialer_query("REPLACE INTO qdialer_status_categories (status,category,active,created_by,created_at) VALUES ('$status','$category','Y','$user',NOW())");
			$message = 'Status mapping saved.';
			}
		}
	if ($action === 'role')
		{
		$role_user = qdialer_escape(trim($_POST['role_user']));
		$role_name = qdialer_escape($_POST['role_name']);
		$can_view_costs = isset($_POST['can_view_costs']) ? 'Y' : 'N';
		$can_export_reports = isset($_POST['can_export_reports']) ? 'Y' : 'N';
		$can_correct_records = isset($_POST['can_correct_records']) ? 'Y' : 'N';
		$can_review_recordings = isset($_POST['can_review_recordings']) ? 'Y' : 'N';
		if (strlen($role_user) > 0)
			{
			qdialer_query("REPLACE INTO qdialer_roles (user,role_name,can_view_costs,can_export_reports,can_correct_records,can_review_recordings,created_at) VALUES ('$role_user','$role_name','$can_view_costs','$can_export_reports','$can_correct_records','$can_review_recordings',NOW())");
			$message = 'Role flags saved.';
			}
		}
	}

function qdialer_vendor_options()
	{
	if (!qdialer_schema_ready())
		{return '<option value="1">Demo Vendor</option>';}
	$rslt = qdialer_query("SELECT vendor_id,vendor_name FROM qdialer_vendors WHERE active='Y' ORDER BY vendor_name");
	$out = '';
	if ($rslt)
		{
		while ($row = qdialer_fetch_assoc($rslt))
			{$out .= '<option value="' . qdialer_h($row['vendor_id']) . '">' . qdialer_h($row['vendor_name']) . '</option>';}
		}
	if (strlen($out) < 1)
		{$out = '<option value="">Create a vendor first</option>';}
	return $out;
	}

qdialer_page_begin('Vendor & Source Setup', 'setup');
?>

<?php if (strlen($message) > 0) { ?>
<section class="qd-alert qd-tone-good"><strong><?php echo qdialer_h($message); ?></strong></section>
<?php } ?>

<section class="qd-grid qd-grid-2">
  <article class="qd-card">
    <h3>Add Vendor</h3>
    <p>Track the lead vendor, transfer provider, referral source, or data partner that should appear in the Vendor Cost Report.</p>
    <form method="post">
      <input type="hidden" name="action" value="vendor">
      <div class="qd-form-grid" style="grid-template-columns:1fr 1fr;">
        <div class="qd-field">
          <label for="vendor_name">Vendor name</label>
          <input id="vendor_name" name="vendor_name" required>
        </div>
        <div class="qd-field">
          <label for="vendor_code">Vendor code</label>
          <input id="vendor_code" name="vendor_code">
        </div>
      </div>
      <div class="qd-field" style="margin-top:14px;">
        <label for="notes">Notes</label>
        <textarea id="notes" name="notes" rows="4"></textarea>
      </div>
      <button class="qd-button" type="submit" style="margin-top:14px;">Save vendor</button>
    </form>
  </article>

  <article class="qd-card">
    <h3>Add Cost Rule</h3>
    <p>Map costs to inbound queues, lists, or VICI-compatible webhook sources. CPA defaults to <strong>SALE</strong>; CPL applies a fixed cost when the duration threshold is met.</p>
    <form method="post">
      <input type="hidden" name="action" value="rule">
      <div class="qd-form-grid">
        <div class="qd-field">
          <label for="vendor_id">Vendor</label>
          <select id="vendor_id" name="vendor_id"><?php echo qdialer_vendor_options(); ?></select>
        </div>
        <div class="qd-field">
          <label for="source_type">Source type</label>
          <select id="source_type" name="source_type">
            <option value="INGROUP">Inbound Queue</option>
            <option value="LIST">List</option>
            <option value="WEBHOOK">Webhook</option>
          </select>
        </div>
        <div class="qd-field">
          <label for="source_id">Source ID</label>
          <input id="source_id" name="source_id" placeholder="Example: SALESXFER or 1001" required>
        </div>
        <div class="qd-field">
          <label for="campaign_id">Campaign</label>
          <input id="campaign_id" name="campaign_id">
        </div>
        <div class="qd-field">
          <label for="cost_model">Model</label>
          <select id="cost_model" name="cost_model">
            <option value="CPA">CPA</option>
            <option value="CPL">CPL duration</option>
          </select>
        </div>
        <div class="qd-field">
          <label for="cost_amount">Cost</label>
          <input id="cost_amount" name="cost_amount" type="number" min="0" step="0.01" value="0.00">
        </div>
        <div class="qd-field">
          <label for="duration_threshold_sec">Billable seconds</label>
          <input id="duration_threshold_sec" name="duration_threshold_sec" type="number" min="0" value="0">
        </div>
        <div class="qd-field">
          <label for="duration_basis">Duration basis</label>
          <select id="duration_basis" name="duration_basis">
            <option value="AGENT_TALK">Agent talk time</option>
            <option value="TOTAL_CALL">Total call duration</option>
          </select>
        </div>
        <div class="qd-field">
          <label for="conversion_statuses">Conversion statuses</label>
          <input id="conversion_statuses" name="conversion_statuses" value="SALE">
        </div>
      </div>
      <button class="qd-button" type="submit" style="margin-top:14px;">Save rule</button>
    </form>
  </article>
</section>

<section class="qd-grid qd-grid-2" style="margin-top:18px;">
  <article class="qd-card">
    <h3>Status Mapping</h3>
    <p>Map local VICIDIAL dispositions into qDialer reporting categories. <strong>SALE</strong> is seeded as the default acquisition status.</p>
    <form method="post">
      <input type="hidden" name="action" value="status">
      <div class="qd-form-grid" style="grid-template-columns:1fr 1fr;">
        <div class="qd-field">
          <label for="status">VICIDIAL status</label>
          <input id="status" name="status" placeholder="SALE" maxlength="6" required>
        </div>
        <div class="qd-field">
          <label for="category">qDialer category</label>
          <select id="category" name="category">
            <option value="ACQUISITION">Acquisition</option>
            <option value="CONTACT">Contact</option>
            <option value="NO_ANSWER">No Answer</option>
            <option value="BAD_LEAD">Bad Lead</option>
            <option value="DNC">DNC</option>
            <option value="CALLBACK">Callback</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>
      <button class="qd-button" type="submit" style="margin-top:14px;">Save status mapping</button>
    </form>
  </article>

  <article class="qd-card">
    <h3>qDialer Role Flags</h3>
    <p>Layer qDialer cost, export, correction, and recording-review permissions on top of VICIDIAL users.</p>
    <form method="post">
      <input type="hidden" name="action" value="role">
      <div class="qd-form-grid" style="grid-template-columns:1fr 1fr;">
        <div class="qd-field">
          <label for="role_user">VICIDIAL user</label>
          <input id="role_user" name="role_user" required>
        </div>
        <div class="qd-field">
          <label for="role_name">Role</label>
          <select id="role_name" name="role_name">
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="AGENT">Agent</option>
          </select>
        </div>
      </div>
      <p>
        <label><input type="checkbox" name="can_view_costs" value="Y"> View vendor costs/CPA</label><br>
        <label><input type="checkbox" name="can_export_reports" value="Y"> Export reports</label><br>
        <label><input type="checkbox" name="can_correct_records" value="Y"> Correct records</label><br>
        <label><input type="checkbox" name="can_review_recordings" value="Y"> Review recordings</label>
      </p>
      <button class="qd-button" type="submit">Save role flags</button>
    </form>
  </article>
</section>

<section class="qd-card" style="margin-top:18px;">
  <h3>Setup notes</h3>
  <p>For the first implementation slice, qDialer stores setup metadata in its own tables and preserves the underlying VICIDIAL queue, list, and campaign mechanics. The next pass can turn this into full qDialer-native inbound queue and list/webhook wizards that write both VICIDIAL config and qDialer cost metadata.</p>
</section>

<?php qdialer_page_end(); ?>
