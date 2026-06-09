<?php
require_once(dirname(dirname(__FILE__)) . '/inc/layout.php');
require_once(dirname(dirname(__FILE__)) . '/inc/data.php');

$dates = qdialer_default_dates();
$rows = qdialer_agent_rows($dates['begin_date'], $dates['end_date']);
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
	header('Content-Disposition: attachment; filename="qdialer-agent-productivity.csv"');
	$out = fopen('php://output', 'w');
	fputcsv($out, array('Agent','Calls','Talk Minutes','Acquisitions','Close Rate','Talk Minutes Per Acquisition'));
	foreach ($rows as $row)
		{
		fputcsv($out, array($row['user'],$row['calls'],qdialer_minutes($row['talk_seconds']),$row['acquisitions'],number_format($row['close_rate'],2),number_format($row['talk_minutes_per_acquisition'],1)));
		}
	exit;
	}

qdialer_page_begin('Agent Productivity Report', 'agent-productivity');
?>

<form class="qd-card qd-filters" method="get">
  <div class="qd-field">
    <label for="begin_date">Begin date</label>
    <input id="begin_date" name="begin_date" type="date" value="<?php echo qdialer_h($dates['begin_date']); ?>">
  </div>
  <div class="qd-field">
    <label for="end_date">End date</label>
    <input id="end_date" name="end_date" type="date" value="<?php echo qdialer_h($dates['end_date']); ?>">
  </div>
  <button class="qd-button" type="submit">Apply filters</button>
  <?php if ($can_export_reports) { ?><a class="qd-button qd-button-secondary" href="?begin_date=<?php echo qdialer_h($dates['begin_date']); ?>&end_date=<?php echo qdialer_h($dates['end_date']); ?>&format=csv">Export CSV</a><?php } ?>
</form>

<section class="qd-card">
  <div class="qd-section-head">
    <div>
      <h2>Raw leaderboard plus efficiency</h2>
      <p class="qd-pill">Agents never see vendor cost or CPA unless explicitly allowed by qDialer roles.</p>
    </div>
  </div>
  <div class="qd-table-wrap" style="margin-top:18px;">
    <table class="qd-table">
      <thead>
        <tr>
          <th>Agent</th>
          <th>Calls</th>
          <th>Talk minutes</th>
          <th>Acquisitions</th>
          <th>Close rate</th>
          <th>Talk min / acquisition</th>
          <th>Coaching note</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($rows as $row) { ?>
        <tr>
          <td><strong><?php echo qdialer_h($row['user']); ?></strong></td>
          <td><?php echo number_format($row['calls']); ?></td>
          <td><?php echo qdialer_minutes($row['talk_seconds']); ?></td>
          <td><?php echo number_format($row['acquisitions']); ?></td>
          <td><?php echo number_format($row['close_rate'], 2); ?>%</td>
          <td><?php echo number_format($row['talk_minutes_per_acquisition'], 1); ?></td>
          <td><?php echo ((float)$row['talk_minutes_per_acquisition'] > 40) ? 'Review calls with high talk time' : 'On track'; ?></td>
        </tr>
        <?php } ?>
      </tbody>
    </table>
  </div>
</section>

<section class="qd-grid qd-grid-2" style="margin-top:18px;">
  <article class="qd-card">
    <h3>Productivity model</h3>
    <p>This report intentionally shows both per-call efficiency and productivity over time. A future rollup will add logged-in time, ready/wait time, pause time, and wrap-up time from VICIDIAL agent logs.</p>
  </article>
  <article class="qd-card qd-recommendation" data-qd-recommendation="agent-productivity">
    <button class="qd-dismiss" data-qd-dismiss aria-label="Dismiss recommendation">x</button>
    <h3>Soft suggestion</h3>
    <p>Consider coaching agents who use high talk minutes per acquisition compared with peers on the same campaign or source type.</p>
  </article>
</section>

<?php qdialer_page_end(); ?>
