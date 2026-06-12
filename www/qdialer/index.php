<?php
require_once(dirname(__FILE__) . '/inc/layout.php');
require_once(dirname(__FILE__) . '/inc/data.php');

$dates = qdialer_default_dates();
$summary = qdialer_dashboard_summary($dates['begin_date'], $dates['end_date']);

qdialer_page_begin('Live Report & Action Dashboard', 'dashboard');
?>

<section class="qd-hero">
  <div>
    <h2>Modern dialer operations with cost-aware decisions.</h2>
    <p>qDialer keeps VICIDIAL's proven call engine underneath while giving agency owners and sales managers a cleaner command center for vendor cost, acquisitions, agent productivity, recordings, and daily action.</p>
    <div class="qd-actions" style="justify-content:flex-start;margin-top:24px;">
      <a class="qd-button" href="../vicidial/realtime_report.php">Open Live Agents</a>
      <a class="qd-button" href="<?php echo qdialer_h(QDIALER_BASE_URL); ?>/realtime.php">Open Realtime</a>
      <a class="qd-button" href="<?php echo qdialer_h(QDIALER_BASE_URL); ?>/reports/vendor-cost.php">Open Vendor Cost Report</a>
      <a class="qd-button qd-button-secondary" href="<?php echo qdialer_h(QDIALER_BASE_URL); ?>/setup/vendors.php">Configure vendors</a>
    </div>
  </div>
  <div class="qd-hero-mark">
    <img src="<?php echo qdialer_h(QDIALER_BASE_URL); ?>/assets/img/qdialer-logo.png" alt="qDialer">
  </div>
</section>

<section class="qd-grid qd-grid-3">
  <?php
  qdialer_metric_card('Vendor CPA', qdialer_money($summary['vendor_cpa']), 'Cost Per Acquisition in the selected range.', 'blue');
  qdialer_metric_card('Billable Calls', number_format($summary['billable_calls']), 'Duration or source-qualified cost events.', 'good');
  qdialer_metric_card('Agent Minutes / Acquisition', number_format($summary['agent_minutes_per_acquisition'], 1), 'Talk minutes consumed per acquisition.', 'warn');
  ?>
</section>

<section class="qd-grid qd-grid-2" style="margin-top:18px;">
  <article class="qd-card qd-recommendation" data-qd-recommendation="vendor-watch">
    <button class="qd-dismiss" data-qd-dismiss aria-label="Dismiss recommendation">x</button>
    <h3>Soft suggestion</h3>
    <p>Consider reviewing vendors with rising CPA, high agent minutes per acquisition, or unusually high short-duration/bad-lead outcomes. Recommendations are opt-in and appear at four business-day checkpoints.</p>
  </article>
  <article class="qd-card">
    <h3>Today's focus</h3>
    <p><strong><?php echo qdialer_h($summary['top_vendor']); ?></strong> is currently the highest spend source in this view. Top sales agent by acquisition count: <strong><?php echo qdialer_h($summary['top_agent']); ?></strong>.</p>
  </article>
</section>

<section class="qd-grid qd-grid-3" style="margin-top:18px;">
  <a class="qd-card qd-tile" href="realtime.php">
    <h3>Realtime Operations</h3>
    <p>Monitor live agents, active calls, campaign pulse, and dialer server capacity.</p>
  </a>
  <a class="qd-card qd-tile" href="../agc/vicidial.php">
    <h3>Agent Console</h3>
    <p>Launch the white-labeled agent experience backed by VICIDIAL call controls.</p>
  </a>
  <a class="qd-card qd-tile" href="recordings.php">
    <h3>Recording Review</h3>
    <p>Review calls, tag outcomes, and connect notes to vendor and agent reporting.</p>
  </a>
</section>

<section class="qd-section-head qd-compact-head" style="margin-top:28px;">
  <div>
    <h2>Useful VICI tools</h2>
    <p>Fast access to the legacy pages managers still rely on, wrapped in qDialer styling without changing VICIDIAL behavior.</p>
  </div>
  <a class="qd-button qd-button-secondary" href="../vicidial/admin.php">Open Advanced VICIDIAL</a>
</section>

<section class="qd-quick-grid" aria-label="Useful VICIDIAL pages">
  <a class="qd-quick-link" href="../vicidial/admin.php?ADD=0">
    <span>Users</span>
    <strong>Manage agents and admins</strong>
  </a>
  <a class="qd-quick-link" href="../vicidial/realtime_report.php">
    <span>Live Agents</span>
    <strong>Monitor logged-in agents</strong>
  </a>
  <a class="qd-quick-link" href="../vicidial/recording_lookup.php">
    <span>Recording Lookup</span>
    <strong>Find and listen to calls</strong>
  </a>
  <a class="qd-quick-link" href="../vicidial/admin_search_lead.php">
    <span>Lead Lookup</span>
    <strong>Search lead records</strong>
  </a>
  <a class="qd-quick-link" href="../vicidial/admin.php?ADD=10000000000">
    <span>Numbers</span>
    <strong>Phones and extensions</strong>
  </a>
  <a class="qd-quick-link" href="../vicidial/admin.php?ADD=1000">
    <span>In-Groups</span>
    <strong>Inbound queues and routing</strong>
  </a>
  <a class="qd-quick-link" href="../vicidial/admin.php?ADD=10">
    <span>Campaigns</span>
    <strong>Campaign configuration</strong>
  </a>
  <a class="qd-quick-link" href="../vicidial/admin.php?ADD=100">
    <span>Lists</span>
    <strong>Lead lists and sources</strong>
  </a>
  <a class="qd-quick-link" href="../vicidial/admin.php?ADD=999999">
    <span>Reports</span>
    <strong>Legacy report library</strong>
  </a>
</section>

<?php qdialer_page_end(); ?>
