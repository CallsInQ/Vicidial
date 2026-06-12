<?php
require_once(dirname(__FILE__) . '/inc/layout.php');
require_once(dirname(__FILE__) . '/inc/realtime.php');

$campaign_id = qdialer_rt_campaign_from_request();
$refresh = qdialer_rt_refresh_from_request();
$snapshot = qdialer_rt_snapshot($campaign_id);
$campaign_options = qdialer_rt_campaign_options();

function qdialer_rt_metric_card($key, $label, $value, $detail, $tone)
	{
	echo "<article class=\"qd-card qd-metric qd-tone-" . qdialer_h($tone) . "\">\n";
	echo "<span>" . qdialer_h($label) . "</span>\n";
	echo "<strong data-qd-rt-value=\"" . qdialer_h($key) . "\">" . qdialer_h($value) . "</strong>\n";
	echo "<p>" . qdialer_h($detail) . "</p>\n";
	echo "</article>\n";
	}

function qdialer_rt_status_badge($status)
	{
	$class = strtolower(preg_replace('/[^A-Za-z0-9]+/', '-', $status));
	return "<span class=\"qd-status qd-status-" . qdialer_h($class) . "\">" . qdialer_h($status) . "</span>";
	}

function qdialer_rt_empty_row($columns, $message)
	{
	echo "<tr class=\"qd-empty-row\"><td colspan=\"" . (int)$columns . "\">" . qdialer_h($message) . "</td></tr>\n";
	}

function qdialer_rt_agent_row($row)
	{
	echo "<tr>\n";
	echo "<td>" . qdialer_rt_status_badge($row['status']) . "</td>\n";
	echo "<td><strong>" . qdialer_h($row['user']) . "</strong><span>" . qdialer_h($row['full_name']) . "</span></td>\n";
	echo "<td>" . qdialer_h($row['campaign_id']) . "</td>\n";
	echo "<td>" . qdialer_h($row['state_label']) . "</td>\n";
	echo "<td>" . number_format((int)$row['calls_today']) . "</td>\n";
	echo "<td>" . qdialer_h($row['pause_code']) . "</td>\n";
	echo "<td>" . qdialer_h($row['server_ip']) . "</td>\n";
	echo "</tr>\n";
	}

function qdialer_rt_call_row($row)
	{
	$queue = strlen($row['group_name']) > 0 ? $row['group_name'] : $row['campaign_id'];
	echo "<tr>\n";
	echo "<td>" . qdialer_rt_status_badge($row['status']) . "</td>\n";
	echo "<td>" . qdialer_h($row['call_type']) . "</td>\n";
	echo "<td><strong>" . qdialer_h($row['campaign_id']) . "</strong><span>" . qdialer_h($queue) . "</span></td>\n";
	echo "<td>" . qdialer_h($row['stage']) . "</td>\n";
	echo "<td>" . qdialer_h($row['call_label']) . "</td>\n";
	echo "<td>" . number_format((int)$row['queue_priority']) . "</td>\n";
	echo "<td>" . qdialer_h($row['phone_display']) . "</td>\n";
	echo "<td>" . qdialer_h($row['server_ip']) . "</td>\n";
	echo "</tr>\n";
	}

function qdialer_rt_campaign_row($row)
	{
	echo "<tr>\n";
	echo "<td><strong>" . qdialer_h($row['campaign_id']) . "</strong><span>" . qdialer_h($row['campaign_name']) . "</span></td>\n";
	echo "<td>" . qdialer_h($row['dial_method']) . "</td>\n";
	echo "<td>" . number_format((float)$row['auto_dial_level'], 2) . "</td>\n";
	echo "<td>" . number_format((int)$row['dialable_leads']) . "</td>\n";
	echo "<td>" . number_format((int)$row['calls_today']) . "</td>\n";
	echo "<td>" . number_format((int)$row['answers_today']) . "</td>\n";
	echo "<td>" . number_format((int)$row['drops_today']) . "</td>\n";
	echo "<td>" . number_format((float)$row['drop_pct'], 2) . "%</td>\n";
	echo "</tr>\n";
	}

function qdialer_rt_server_row($row)
	{
	echo "<tr>\n";
	echo "<td><strong>" . qdialer_h($row['server_id']) . "</strong><span>" . qdialer_h($row['server_ip']) . "</span></td>\n";
	echo "<td>" . qdialer_h($row['active_asterisk_server']) . "</td>\n";
	echo "<td>" . number_format((int)$row['channels_total']) . "</td>\n";
	echo "<td>" . number_format((int)$row['max_vicidial_trunks']) . "</td>\n";
	echo "<td>" . number_format((int)$row['outbound_calls_per_second']) . "</td>\n";
	echo "<td>" . number_format((int)$row['cpu_idle_percent']) . "%</td>\n";
	echo "<td>" . qdialer_h($row['sysload']) . "</td>\n";
	echo "</tr>\n";
	}

qdialer_page_begin('Realtime Operations', 'realtime');
?>

<section class="qd-card qd-rt-toolbar">
  <form class="qd-filters" method="get" action="<?php echo qdialer_h(QDIALER_BASE_URL); ?>/realtime.php">
    <div class="qd-field">
      <label for="campaign_id">Campaign</label>
      <select id="campaign_id" name="campaign_id">
        <?php
        $i = 0;
        while ($i < count($campaign_options))
          {
          $option = $campaign_options[$i];
          $label = $option['campaign_id'] . ' - ' . $option['campaign_name'];
          if ($option['campaign_id'] === 'ALL-ACTIVE')
            {$label = $option['campaign_name'];}
          echo "<option value=\"" . qdialer_h($option['campaign_id']) . "\"" . qdialer_selected($campaign_id, $option['campaign_id']) . ">" . qdialer_h($label) . "</option>\n";
          $i++;
          }
        ?>
      </select>
    </div>
    <div class="qd-field">
      <label for="refresh">Refresh</label>
      <select id="refresh" name="refresh">
        <option value="3"<?php echo qdialer_selected($refresh, 3); ?>>3 seconds</option>
        <option value="5"<?php echo qdialer_selected($refresh, 5); ?>>5 seconds</option>
        <option value="10"<?php echo qdialer_selected($refresh, 10); ?>>10 seconds</option>
        <option value="30"<?php echo qdialer_selected($refresh, 30); ?>>30 seconds</option>
      </select>
    </div>
    <button class="qd-button" type="submit">Apply</button>
    <a class="qd-button qd-button-secondary" href="../vicidial/realtime_report.php">Open Legacy Realtime</a>
  </form>
  <div class="qd-rt-meta">
    <span>Last refresh</span>
    <strong data-qd-rt-last><?php echo qdialer_h($snapshot['generated_at']); ?></strong>
  </div>
</section>

<?php
if ($snapshot['demo'])
	{
	echo "<section class=\"qd-alert qd-alert-warn\">\n";
	echo "<strong>Demo realtime data is showing.</strong> Live data will appear when the VICIdial tables are reachable";
	if (count($snapshot['missing']) > 0)
		{echo "; missing: <code>" . qdialer_h(implode(', ', $snapshot['missing'])) . "</code>";}
	echo ".\n</section>\n";
	}
?>

<section
  class="qd-rt"
  data-qd-realtime
  data-api="<?php echo qdialer_h(QDIALER_BASE_URL); ?>/api/realtime.php?campaign_id=<?php echo qdialer_h(urlencode($campaign_id)); ?>"
  data-refresh="<?php echo (int)$refresh; ?>">

  <section class="qd-grid qd-grid-4 qd-rt-metrics">
    <?php
    qdialer_rt_metric_card('agents_total', 'Agents Logged In', number_format($snapshot['summary']['agents_total']), 'Ready, paused, ringing, and on-call agents.', 'blue');
    qdialer_rt_metric_card('agents_incall', 'Agents In Calls', number_format($snapshot['summary']['agents_incall']), 'Live agent call load across selected campaigns.', 'good');
    qdialer_rt_metric_card('calls_waiting', 'Calls Waiting', number_format($snapshot['summary']['calls_waiting']), 'Live calls waiting for an agent.', 'warn');
    qdialer_rt_metric_card('drop_pct', 'Drop Rate', number_format($snapshot['summary']['drop_pct'], 2) . '%', 'Drops divided by answered calls today.', 'danger');
    ?>
  </section>

  <section class="qd-grid qd-grid-4 qd-rt-strips" style="margin-top:18px;">
    <article class="qd-card qd-rt-strip"><span>Ready</span><strong data-qd-rt-value="agents_ready"><?php echo number_format($snapshot['summary']['agents_ready']); ?></strong></article>
    <article class="qd-card qd-rt-strip"><span>Paused</span><strong data-qd-rt-value="agents_paused"><?php echo number_format($snapshot['summary']['agents_paused']); ?></strong></article>
    <article class="qd-card qd-rt-strip"><span>Ringing</span><strong data-qd-rt-value="agents_ringing"><?php echo number_format($snapshot['summary']['agents_ringing']); ?></strong></article>
    <article class="qd-card qd-rt-strip"><span>Dialable Leads</span><strong data-qd-rt-value="dialable_leads"><?php echo number_format($snapshot['summary']['dialable_leads']); ?></strong></article>
  </section>

  <section class="qd-grid qd-grid-2" style="margin-top:18px;">
    <article class="qd-card">
      <div class="qd-section-head qd-rt-section-head">
        <div>
          <h2>Live Agents</h2>
          <p>Current VICIdial agent states for the selected campaign scope.</p>
        </div>
      </div>
      <div class="qd-table-wrap">
        <table class="qd-table qd-rt-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Agent</th>
              <th>Campaign</th>
              <th>Timer</th>
              <th>Calls</th>
              <th>Code</th>
              <th>Server</th>
            </tr>
          </thead>
          <tbody data-qd-rt-agents>
            <?php
            if (count($snapshot['agents']) < 1)
              {qdialer_rt_empty_row(7, 'No agents are logged in for this scope.');}
            else
              {
              $i = 0;
              while ($i < count($snapshot['agents']))
                {qdialer_rt_agent_row($snapshot['agents'][$i]); $i++;}
              }
            ?>
          </tbody>
        </table>
      </div>
    </article>

    <article class="qd-card">
      <div class="qd-section-head qd-rt-section-head">
        <div>
          <h2>Active Calls</h2>
          <p>Calls currently ringing, waiting, or inside IVR/queue handling.</p>
        </div>
      </div>
      <div class="qd-table-wrap">
        <table class="qd-table qd-rt-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Type</th>
              <th>Campaign</th>
              <th>Stage</th>
              <th>Timer</th>
              <th>Priority</th>
              <th>Phone</th>
              <th>Server</th>
            </tr>
          </thead>
          <tbody data-qd-rt-calls>
            <?php
            if (count($snapshot['calls']) < 1)
              {qdialer_rt_empty_row(8, 'No active calls are being placed or queued right now.');}
            else
              {
              $i = 0;
              while ($i < count($snapshot['calls']))
                {qdialer_rt_call_row($snapshot['calls'][$i]); $i++;}
              }
            ?>
          </tbody>
        </table>
      </div>
    </article>
  </section>

  <section class="qd-grid qd-grid-2" style="margin-top:18px;">
    <article class="qd-card">
      <div class="qd-section-head qd-rt-section-head">
        <div>
          <h2>Campaign Pulse</h2>
          <p>Dial level, dialable lead inventory, answer volume, and drops.</p>
        </div>
      </div>
      <div class="qd-table-wrap">
        <table class="qd-table qd-rt-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Method</th>
              <th>Dial</th>
              <th>Dialable</th>
              <th>Calls</th>
              <th>Answers</th>
              <th>Drops</th>
              <th>Drop %</th>
            </tr>
          </thead>
          <tbody data-qd-rt-campaigns>
            <?php
            if (count($snapshot['campaigns']) < 1)
              {qdialer_rt_empty_row(8, 'No active campaigns matched this scope.');}
            else
              {
              $i = 0;
              while ($i < count($snapshot['campaigns']))
                {qdialer_rt_campaign_row($snapshot['campaigns'][$i]); $i++;}
              }
            ?>
          </tbody>
        </table>
      </div>
    </article>

    <article class="qd-card">
      <div class="qd-section-head qd-rt-section-head">
        <div>
          <h2>Server Capacity</h2>
          <p>Asterisk server activity, channels, trunk ceiling, and outbound CPS.</p>
        </div>
      </div>
      <div class="qd-table-wrap">
        <table class="qd-table qd-rt-table">
          <thead>
            <tr>
              <th>Server</th>
              <th>AST</th>
              <th>Channels</th>
              <th>Trunks</th>
              <th>CPS</th>
              <th>CPU Idle</th>
              <th>Load</th>
            </tr>
          </thead>
          <tbody data-qd-rt-servers>
            <?php
            if (count($snapshot['servers']) < 1)
              {qdialer_rt_empty_row(7, 'No active server capacity rows were available.');}
            else
              {
              $i = 0;
              while ($i < count($snapshot['servers']))
                {qdialer_rt_server_row($snapshot['servers'][$i]); $i++;}
              }
            ?>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</section>

<?php qdialer_page_end(); ?>
