<?php
require_once(dirname(dirname(__FILE__)) . '/inc/data.php');

$dates = qdialer_default_dates();
$summary = qdialer_dashboard_summary($dates['begin_date'], $dates['end_date']);

header('Content-Type: application/json; charset=utf-8');
echo json_encode(array(
	'product' => 'qDialer',
	'begin_date' => $dates['begin_date'],
	'end_date' => $dates['end_date'],
	'schema_ready' => qdialer_schema_ready() ? true : false,
	'summary' => $summary
	));
?>
