<?php
require_once(dirname(__FILE__) . '/inc/layout.php');

$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' and qdialer_schema_ready() and qdialer_table_exists('qdialer_recording_reviews'))
	{
	$recording_id = (int)$_POST['recording_id'];
	$review_tag = qdialer_escape($_POST['review_tag']);
	$review_note = qdialer_escape(trim($_POST['review_note']));
	$reviewed_by = qdialer_escape(qdialer_current_user());
	qdialer_query("INSERT INTO qdialer_recording_reviews (recording_id,review_tag,review_note,reviewed_by,reviewed_at) VALUES ('$recording_id','$review_tag','$review_note','$reviewed_by',NOW())");
	$message = 'Recording review saved.';
	}

qdialer_page_begin('Recording Review', 'recordings');
?>

<?php if (strlen($message) > 0) { ?>
<section class="qd-alert qd-tone-good"><strong><?php echo qdialer_h($message); ?></strong></section>
<?php } ?>

<section class="qd-grid qd-grid-2">
  <article class="qd-card">
    <h3>Light review workflow</h3>
    <p>Listen to a call, tag the outcome, add a note, and connect the review back to Vendor Cost and Agent Productivity. Access should be role-gated by campaign/source.</p>
    <form method="post">
      <div class="qd-form-grid" style="grid-template-columns:1fr 1fr;">
        <div class="qd-field">
          <label for="recording_id">Recording ID</label>
          <input id="recording_id" name="recording_id" type="number" min="1" required>
        </div>
        <div class="qd-field">
          <label for="review_tag">Review tag</label>
          <select id="review_tag" name="review_tag">
            <option value="BILLABLE">Billable</option>
            <option value="NON_BILLABLE">Non-billable</option>
            <option value="BAD_LEAD">Bad Lead</option>
            <option value="GOOD_TRANSFER">Good Transfer</option>
            <option value="AGENT_ISSUE">Agent Issue</option>
            <option value="VENDOR_ISSUE">Vendor Issue</option>
            <option value="NEEDS_FOLLOW_UP">Needs Follow-up</option>
          </select>
        </div>
      </div>
      <div class="qd-field" style="margin-top:14px;">
        <label for="review_note">Review note</label>
        <textarea id="review_note" name="review_note" rows="5"></textarea>
      </div>
      <button class="qd-button" type="submit" style="margin-top:14px;">Save review</button>
    </form>
  </article>
  <article class="qd-card">
    <h3>Recording lookup</h3>
    <p>Existing VICIDIAL recording lookup remains available for now. qDialer review records are separate so vendor/agent reporting can use notes without changing recording storage.</p>
    <a class="qd-button qd-button-secondary" href="../vicidial/recording_lookup.php">Open legacy recording lookup</a>
  </article>
</section>

<?php qdialer_page_end(); ?>
