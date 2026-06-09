<?php
require_once(dirname(__FILE__) . '/bootstrap.php');

function qdialer_default_dates()
	{
	$today = date('Y-m-d');
	return array(
		'begin_date' => qdialer_date_input('begin_date', $today),
		'end_date' => qdialer_date_input('end_date', $today)
		);
	}

function qdialer_vendor_rows($begin_date, $end_date)
	{
	if (!qdialer_schema_ready() or !qdialer_table_exists('qdialer_cost_events'))
		{return qdialer_demo_vendor_rows();}

	$begin = qdialer_escape($begin_date . ' 00:00:00');
	$end = qdialer_escape($end_date . ' 23:59:59');
	$sql = "SELECT COALESCE(v.vendor_name,'Unattributed Needs Review') vendor_name,"
		. " COALESCE(e.source_type,'UNATTRIBUTED') source_type,"
		. " COUNT(*) calls,"
		. " SUM(CASE WHEN e.is_billable='Y' THEN 1 ELSE 0 END) billable_calls,"
		. " SUM(CASE WHEN e.is_acquisition='Y' THEN 1 ELSE 0 END) acquisitions,"
		. " SUM(e.applied_cost) spend,"
		. " SUM(e.talk_seconds) talk_seconds,"
		. " SUM(CASE WHEN e.attribution_bucket='UNATTRIBUTED_REVIEW' THEN 1 ELSE 0 END) needs_review"
		. " FROM qdialer_cost_events e"
		. " LEFT JOIN qdialer_vendors v ON e.vendor_id=v.vendor_id"
		. " WHERE e.event_date BETWEEN '$begin' AND '$end'"
		. " GROUP BY vendor_name, source_type"
		. " ORDER BY spend DESC, acquisitions DESC";
	$rslt = qdialer_query($sql);
	if (!$rslt)
		{return qdialer_demo_vendor_rows();}
	$rows = array();
	while ($row = mysql_fetch_assoc($rslt))
		{$rows[] = qdialer_normalize_vendor_row($row);}
	return $rows;
	}

function qdialer_normalize_vendor_row($row)
	{
	$acq = (int)$row['acquisitions'];
	$spend = (float)$row['spend'];
	$talk = (int)$row['talk_seconds'];
	$row['vendor_cpa'] = ($acq > 0) ? ($spend / $acq) : 0;
	$row['agent_minutes_per_acquisition'] = ($acq > 0) ? (($talk / 60) / $acq) : 0;
	return $row;
	}

function qdialer_agent_rows($begin_date, $end_date)
	{
	$begin = qdialer_escape($begin_date . ' 00:00:00');
	$end = qdialer_escape($end_date . ' 23:59:59');
	if (!qdialer_has_mysql())
		{return qdialer_demo_agent_rows();}

	$sql = "SELECT user,"
		. " COUNT(*) calls,"
		. " SUM(length_in_sec) talk_seconds,"
		. " SUM(CASE WHEN status='SALE' THEN 1 ELSE 0 END) acquisitions"
		. " FROM ("
		. " SELECT user,length_in_sec,status,call_date FROM vicidial_log WHERE call_date BETWEEN '$begin' AND '$end'"
		. " UNION ALL "
		. " SELECT user,length_in_sec,status,call_date FROM vicidial_closer_log WHERE call_date BETWEEN '$begin' AND '$end'"
		. " ) qd_agent_calls"
		. " WHERE user IS NOT NULL AND user <> ''"
		. " GROUP BY user"
		. " ORDER BY acquisitions DESC, calls DESC";
	$rslt = qdialer_query($sql);
	if (!$rslt)
		{return qdialer_demo_agent_rows();}
	$rows = array();
	while ($row = mysql_fetch_assoc($rslt))
		{
		$calls = (int)$row['calls'];
		$acq = (int)$row['acquisitions'];
		$talk = (int)$row['talk_seconds'];
		$row['close_rate'] = ($calls > 0) ? (($acq / $calls) * 100) : 0;
		$row['talk_minutes_per_acquisition'] = ($acq > 0) ? (($talk / 60) / $acq) : 0;
		$rows[] = $row;
		}
	return $rows;
	}

function qdialer_dashboard_summary($begin_date, $end_date)
	{
	$vendors = qdialer_vendor_rows($begin_date, $end_date);
	$agents = qdialer_agent_rows($begin_date, $end_date);
	$spend = 0;
	$acq = 0;
	$billable = 0;
	$talk = 0;
	$i = 0;
	while ($i < count($vendors))
		{
		$spend += (float)$vendors[$i]['spend'];
		$acq += (int)$vendors[$i]['acquisitions'];
		$billable += (int)$vendors[$i]['billable_calls'];
		$talk += (int)$vendors[$i]['talk_seconds'];
		$i++;
		}
	return array(
		'spend' => $spend,
		'acquisitions' => $acq,
		'billable_calls' => $billable,
		'vendor_cpa' => ($acq > 0) ? ($spend / $acq) : 0,
		'agent_minutes_per_acquisition' => ($acq > 0) ? (($talk / 60) / $acq) : 0,
		'top_vendor' => (count($vendors) > 0) ? $vendors[0]['vendor_name'] : 'No vendor data',
		'top_agent' => (count($agents) > 0) ? $agents[0]['user'] : 'No agent data'
		);
	}

function qdialer_demo_vendor_rows()
	{
	return array(
		qdialer_normalize_vendor_row(array('vendor_name'=>'Blue River Transfers','source_type'=>'INGROUP','calls'=>164,'billable_calls'=>91,'acquisitions'=>18,'spend'=>6370,'talk_seconds'=>52440,'needs_review'=>3)),
		qdialer_normalize_vendor_row(array('vendor_name'=>'Northstar Data Leads','source_type'=>'WEBHOOK','calls'=>420,'billable_calls'=>420,'acquisitions'=>32,'spend'=>1260,'talk_seconds'=>78210,'needs_review'=>7)),
		qdialer_normalize_vendor_row(array('vendor_name'=>'Organic / Referral','source_type'=>'ORGANIC','calls'=>76,'billable_calls'=>0,'acquisitions'=>11,'spend'=>0,'talk_seconds'=>18410,'needs_review'=>0))
		);
	}

function qdialer_demo_agent_rows()
	{
	return array(
		array('user'=>'agent01','calls'=>94,'talk_seconds'=>24540,'acquisitions'=>14,'close_rate'=>14.89,'talk_minutes_per_acquisition'=>29.21),
		array('user'=>'agent04','calls'=>112,'talk_seconds'=>31800,'acquisitions'=>13,'close_rate'=>11.61,'talk_minutes_per_acquisition'=>40.77),
		array('user'=>'agent07','calls'=>78,'talk_seconds'=>15180,'acquisitions'=>9,'close_rate'=>11.54,'talk_minutes_per_acquisition'=>28.11)
		);
	}

function qdialer_money($value)
	{
	return '$' . number_format((float)$value, 2);
	}

function qdialer_minutes($seconds)
	{
	return number_format(((int)$seconds) / 60, 1);
	}
?>
