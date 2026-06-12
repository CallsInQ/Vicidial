<?php
require_once(dirname(dirname(__FILE__)) . '/inc/realtime.php');

$campaign_id = qdialer_rt_campaign_from_request();
$snapshot = qdialer_rt_snapshot($campaign_id);

header('Content-Type: application/json; charset=utf-8');
echo json_encode($snapshot);
?>
