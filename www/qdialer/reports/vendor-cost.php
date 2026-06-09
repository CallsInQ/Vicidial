<?php
require_once(dirname(dirname(__FILE__)) . '/inc/layout.php');
require_once(dirname(dirname(__FILE__)) . '/inc/data.php');

$dates = qdialer_default_dates();
$rows = qdialer_vendor_rows($dates['begin_date'], $dates['end_date']);
$can_view_costs = qdialer_can_view_costs();
$can_export_reports = qdialer_can_export_reports();

if (isset($_GET['format']) and $_GET['format'] === 'csv')
	{
	if (!$can_export_reports)
		{
		header('HTTP/1.0 403 Forbidden');
		echo 'qDialer export permission required.';
		exit;
		}
	header('Content-Type: text/csv; charset=utf-8');
	header('Content-Disposition: attachment; filename="qdialer-vendor-cost.csv"');
	$out = fopen('php://output', 'w');
	fputcsv($out, array('Vendor','Source Type','Calls','Billable Calls','Acquisitions','Spend','Vendor CPA','Agent Minutes Per Acquisition','Needs Review'));
	foreach ($rows as $row)
		{
		fputcsv($out, array($row['vendor_name'],$row['source_type'],$row['calls'],$row['billable_calls'],$row['acquisitions'],number_format($row['spend'],2),number_format($row['vendor_cpa'],2),number_format($row['agent_minutes_per_acquisition'],1),$row['needs_review']));
		}
	exit;
	}

qdialer_page_begin('Vendor Cost Report', 'vendor-cost');
?>

<?php if (!$can_view_costs) { ?>
<section class="qd-alert qd-alert-warn"><strong>Cost visibility restricted.</strong> qDialer roles can grant vendor cost and CPA visibility to owners, admins, and selected managers.</section>
<?php } ?>

<form class="qd-card qd-filters" method="get">
  <div class="qd-field">
    <label for="begin_date">Begin date</label>
    <input id="begin_date" name="begin_date" type="date" value="<?php echo qdialer_h($dates['begin_date']); ?>">
  </div>
  <div class="qd-field">
    <label for="end_date">End date</label>
    <input id="end_date" name="end_date" type="date" value="<?php echo qdialer_h($dates['end_date']); ?>">
  </div>
  <div class="qd-field">
    <label for="source_type">Source type</label>
    <select id="source_type" name="source_type">
      <option value="">All</option>
      <option value="INGROUP">Inbound Queue</option>
      <option value="LIST">List</option>
      <option value="WEBHOOK">Webhook</option>
    </select>
  </div>
  <button class="qd-button" type="submit">Apply filters</button>
  <?php if ($can_export_reports) { ?><a class="qd-button qd-button-secondary" href="?begin_date=<?php echo qdialer_h($dates['begin_date']); ?>&end_date=<?php echo qdialer_h($dates['end_date']); ?>&format=csv">Export CSV</a><?php } ?>
</form>

<section class="qd-card">
  <div class="qd-section-head">
    <div>
      <h2>Vendor performance by cost and outcome</h2>
      <p class="qd-pill">CPA means Cost Per Acquisition</p>
    </div>
  </div>
  <div class="qd-table-wrap" style="margin-top:18px;">
    <table class="qd-table">
      <thead>
        <tr>
          <th>Vendor / source</th>
          <th>Source type</th>
          <th>Calls</th>
          <th>Billable</th>
          <th>Acquisitions</th>
          <th>Spend</th>
          <th>Vendor CPA</th>
          <th>Agent min / acquisition</th>
          <th>Review</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($rows as $row) { ?>
        <tr>
          <td><strong><?php echo qdialer_h($row['vendor_name']); ?></strong></td>
          <td><?php echo qdialer_h($row['source_type']); ?></td>
          <td><?php echo number_format($row['calls']); ?></td>
          <td><?php echo number_format($row['billable_calls']); ?></td>
          <td><?php echo number_format($row['acquisitions']); ?></td>
          <td><?php echo $can_view_costs ? qdialer_money($row['spend']) : 'Restricted'; ?></td>
          <td><?php echo $can_view_costs ? qdialer_money($row['vendor_cpa']) : 'Restricted'; ?></td>
          <td><?php echo number_format($row['agent_minutes_per_acquisition'], 1); ?></td>
          <td><?php echo ((int)$row['needs_review'] > 0) ? qdialer_h($row['needs_review']) . ' needs review' : 'OK'; ?></td>
        </tr>
        <?php } ?>
      </tbody>
    </table>
  </div>
</section>

<section class="qd-grid qd-grid-2" style="margin-top:18px;">
  <article class="qd-card qd-recommendation" data-qd-recommendation="vendor-cost-cpa">
    <button class="qd-dismiss" data-qd-dismiss aria-label="Dismiss recommendation">x</button>
    <h3>Soft suggestion</h3>
    <p>Consider reviewing any source with high Vendor CPA, high agent minutes per acquisition, or unusually high billable calls without acquisitions. Use recordings and call examples before changing spend.</p>
  </article>
  <article class="qd-card">
    <h3>How qDialer reads this</h3>
    <p>Source comparisons should primarily happen against similar source types in the same campaign when enough data exists. Low-volume sources stay visible with caution instead of disappearing from the report.</p>
  </article>
</section>

<?php qdialer_page_end(); ?>
