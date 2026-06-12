<?php
require_once(dirname(__FILE__) . '/bootstrap.php');

function qdialer_rt_clean_campaign($value)
	{
	$value = trim((string)$value);
	if ($value === '' or strtoupper($value) === 'ALL-ACTIVE')
		{return 'ALL-ACTIVE';}
	$value = preg_replace('/[^A-Za-z0-9_\-]/', '', $value);
	if ($value === '')
		{return 'ALL-ACTIVE';}
	return $value;
	}

function qdialer_rt_campaign_from_request()
	{
	$value = isset($_GET['campaign_id']) ? $_GET['campaign_id'] : 'ALL-ACTIVE';
	return qdialer_rt_clean_campaign($value);
	}

function qdialer_rt_refresh_from_request()
	{
	$value = isset($_GET['refresh']) ? (int)$_GET['refresh'] : 5;
	if ($value < 3)
		{$value = 3;}
	if ($value > 60)
		{$value = 60;}
	return $value;
	}

function qdialer_rt_campaign_where($campaign_id, $column_name)
	{
	if ($campaign_id === 'ALL-ACTIVE')
		{return '';}
	return " AND $column_name='" . qdialer_escape($campaign_id) . "'";
	}

function qdialer_rt_campaign_scope_list($campaign_id)
	{
	if ($campaign_id === 'ALL-ACTIVE')
		{return '';}
	$ids = array();
	$seen = array();
	$ids[] = $campaign_id;
	$seen[$campaign_id] = 1;

	if (qdialer_table_exists('vicidial_campaigns'))
		{
		$campaign = qdialer_escape($campaign_id);
		$rslt = qdialer_query("SELECT closer_campaigns FROM vicidial_campaigns WHERE campaign_id='$campaign' LIMIT 1");
		if ($rslt and qdialer_num_rows($rslt) > 0)
			{
			$row = qdialer_fetch_row($rslt);
			$closer_campaigns = preg_replace('/^ | -$/', '', $row[0]);
			$closer_campaigns = preg_replace('/ - /', ' ', $closer_campaigns);
			$parts = preg_split('/\s+/', $closer_campaigns);
			$i = 0;
			while ($i < count($parts))
				{
				$part = qdialer_rt_clean_campaign($parts[$i]);
				if ($part !== 'ALL-ACTIVE' and !isset($seen[$part]))
					{
					$ids[] = $part;
					$seen[$part] = 1;
					}
				$i++;
				}
			}
		}

	$sql_ids = array();
	$i = 0;
	while ($i < count($ids))
		{
		$sql_ids[] = "'" . qdialer_escape($ids[$i]) . "'";
		$i++;
		}
	return implode(',', $sql_ids);
	}

function qdialer_rt_campaign_scope_where($campaign_id, $column_name)
	{
	if ($campaign_id === 'ALL-ACTIVE')
		{return '';}
	$scope = qdialer_rt_campaign_scope_list($campaign_id);
	if (strlen($scope) < 1)
		{return qdialer_rt_campaign_where($campaign_id, $column_name);}
	return " AND $column_name IN($scope)";
	}

function qdialer_rt_required_tables()
	{
	return array('vicidial_live_agents','vicidial_auto_calls','vicidial_campaigns','vicidial_campaign_stats');
	}

function qdialer_rt_missing_tables()
	{
	$missing = array();
	$tables = qdialer_rt_required_tables();
	$i = 0;
	while ($i < count($tables))
		{
		if (!qdialer_table_exists($tables[$i]))
			{$missing[] = $tables[$i];}
		$i++;
		}
	return $missing;
	}

function qdialer_rt_campaign_options()
	{
	if (!qdialer_has_mysql() or !qdialer_table_exists('vicidial_campaigns'))
		{
		return array(
			array('campaign_id' => 'ALL-ACTIVE', 'campaign_name' => 'All active campaigns'),
			array('campaign_id' => 'SALES', 'campaign_name' => 'Demo Sales'),
			array('campaign_id' => 'INBOUND', 'campaign_name' => 'Demo Inbound')
			);
		}

	$options = array(array('campaign_id' => 'ALL-ACTIVE', 'campaign_name' => 'All active campaigns'));
	$rslt = qdialer_query("SELECT campaign_id,campaign_name FROM vicidial_campaigns WHERE active='Y' ORDER BY campaign_id LIMIT 500");
	if (!$rslt)
		{return $options;}
	while ($row = qdialer_fetch_assoc($rslt))
		{$options[] = $row;}
	return $options;
	}

function qdialer_rt_seconds($epoch)
	{
	$epoch = (int)$epoch;
	if ($epoch < 1)
		{return 0;}
	$seconds = time() - $epoch;
	if ($seconds < 0)
		{return 0;}
	return $seconds;
	}

function qdialer_rt_duration($seconds)
	{
	$seconds = (int)$seconds;
	if ($seconds < 0)
		{$seconds = 0;}
	$hours = floor($seconds / 3600);
	$minutes = floor(($seconds % 3600) / 60);
	$secs = $seconds % 60;
	return sprintf('%02d:%02d:%02d', $hours, $minutes, $secs);
	}

function qdialer_rt_mask_phone($phone)
	{
	$phone = preg_replace('/[^0-9+]/', '', (string)$phone);
	$length = strlen($phone);
	if ($length < 5)
		{return $phone;}
	return str_repeat('*', $length - 4) . substr($phone, -4);
	}

function qdialer_rt_display_agent_status($row)
	{
	$status = isset($row['status']) ? $row['status'] : '';
	if (isset($row['on_hook_agent']) and $row['on_hook_agent'] === 'Y' and isset($row['ring_callerid']) and strlen($row['ring_callerid']) > 0)
		{return 'RING';}
	if ($status === 'PAUSED' and isset($row['lead_id']) and (int)$row['lead_id'] > 0)
		{return 'DISPO';}
	return $status;
	}

function qdialer_rt_agent_rows($campaign_id)
	{
	$where = qdialer_rt_campaign_where($campaign_id, 'vla.campaign_id');
	$join_users = qdialer_table_exists('vicidial_users');
	if ($join_users)
		{
		$sql = "SELECT vla.extension,vla.user,vla.conf_exten,vla.status,vla.server_ip,"
			. " UNIX_TIMESTAMP(vla.last_call_time) last_call_epoch,"
			. " UNIX_TIMESTAMP(vla.last_call_finish) last_call_finish_epoch,"
			. " vla.call_server_ip,vla.campaign_id,vu.user_group,vu.full_name,"
			. " vla.comments,vla.calls_today,vla.callerid,vla.lead_id,"
			. " UNIX_TIMESTAMP(vla.last_state_change) state_epoch,"
			. " vla.on_hook_agent,vla.ring_callerid,vla.agent_log_id"
			. " FROM vicidial_live_agents vla"
			. " LEFT JOIN vicidial_users vu ON vla.user=vu.user"
			. " WHERE 1=1$where"
			. " ORDER BY vla.status DESC,vla.last_call_time DESC LIMIT 500";
		}
	else
		{
		$sql = "SELECT extension,user,conf_exten,status,server_ip,"
			. " UNIX_TIMESTAMP(last_call_time) last_call_epoch,"
			. " UNIX_TIMESTAMP(last_call_finish) last_call_finish_epoch,"
			. " call_server_ip,campaign_id,'' user_group,'' full_name,"
			. " comments,calls_today,callerid,lead_id,"
			. " UNIX_TIMESTAMP(last_state_change) state_epoch,"
			. " on_hook_agent,ring_callerid,agent_log_id"
			. " FROM vicidial_live_agents WHERE 1=1" . qdialer_rt_campaign_where($campaign_id, 'campaign_id')
			. " ORDER BY status DESC,last_call_time DESC LIMIT 500";
		}
	$rslt = qdialer_query($sql);
	$rows = array();
	if (!$rslt)
		{return $rows;}
	while ($row = qdialer_fetch_assoc($rslt))
		{
		$status = qdialer_rt_display_agent_status($row);
		$timer_epoch = (int)$row['last_call_epoch'];
		if ($status === 'READY' or $status === 'PAUSED' or $status === 'DISPO' or $status === 'RING')
			{$timer_epoch = (int)$row['state_epoch'];}
		$seconds = qdialer_rt_seconds($timer_epoch);
		$rows[] = array(
			'extension' => $row['extension'],
			'user' => $row['user'],
			'full_name' => $row['full_name'],
			'user_group' => $row['user_group'],
			'session' => $row['conf_exten'],
			'status' => $status,
			'raw_status' => $row['status'],
			'state_seconds' => $seconds,
			'state_label' => qdialer_rt_duration($seconds),
			'campaign_id' => $row['campaign_id'],
			'calls_today' => (int)$row['calls_today'],
			'server_ip' => $row['server_ip'],
			'call_server_ip' => $row['call_server_ip'],
			'lead_id' => (int)$row['lead_id'],
			'callerid' => $row['callerid'],
			'on_hook_agent' => $row['on_hook_agent'],
			'pause_code' => $row['comments'],
			'agent_log_id' => (int)$row['agent_log_id']
			);
		}
	return $rows;
	}

function qdialer_rt_call_rows($campaign_id)
	{
	$where = qdialer_rt_campaign_scope_where($campaign_id, 'vac.campaign_id');
	$join_ingroups = qdialer_table_exists('vicidial_inbound_groups');
	if ($join_ingroups)
		{
		$sql = "SELECT vac.status,vac.call_type,vac.campaign_id,vac.stage,vac.phone_number,"
			. " vac.lead_id,vac.callerid,vac.server_ip,vac.queue_priority,vac.agent_only,"
			. " UNIX_TIMESTAMP(vac.call_time) call_epoch,vig.group_name"
			. " FROM vicidial_auto_calls vac"
			. " LEFT JOIN vicidial_inbound_groups vig ON vac.campaign_id=vig.group_id"
			. " WHERE vac.status NOT IN('XFER')$where"
			. " ORDER BY vac.queue_priority DESC,vac.campaign_id,vac.call_time LIMIT 300";
		}
	else
		{
		$sql = "SELECT status,call_type,campaign_id,stage,phone_number,lead_id,callerid,server_ip,"
			. " queue_priority,agent_only,UNIX_TIMESTAMP(call_time) call_epoch,'' group_name"
			. " FROM vicidial_auto_calls WHERE status NOT IN('XFER')"
			. qdialer_rt_campaign_scope_where($campaign_id, 'campaign_id')
			. " ORDER BY queue_priority DESC,campaign_id,call_time LIMIT 300";
		}
	$rslt = qdialer_query($sql);
	$rows = array();
	if (!$rslt)
		{return $rows;}
	while ($row = qdialer_fetch_assoc($rslt))
		{
		$seconds = qdialer_rt_seconds($row['call_epoch']);
		$rows[] = array(
			'status' => $row['status'],
			'call_type' => $row['call_type'],
			'campaign_id' => $row['campaign_id'],
			'group_name' => $row['group_name'],
			'stage' => $row['stage'],
			'phone_display' => qdialer_rt_mask_phone($row['phone_number']),
			'lead_id' => (int)$row['lead_id'],
			'callerid' => $row['callerid'],
			'server_ip' => $row['server_ip'],
			'queue_priority' => (int)$row['queue_priority'],
			'agent_only' => $row['agent_only'],
			'call_seconds' => $seconds,
			'call_label' => qdialer_rt_duration($seconds)
			);
		}
	return $rows;
	}

function qdialer_rt_campaign_rows($campaign_id)
	{
	$where = ($campaign_id === 'ALL-ACTIVE') ? " WHERE c.active='Y'" : " WHERE c.campaign_id='" . qdialer_escape($campaign_id) . "'";
	$sql = "SELECT c.campaign_id,c.campaign_name,c.active,c.dial_method,c.auto_dial_level,c.hopper_level,"
		. " c.campaign_allow_inbound,c.campaign_recording,"
		. " IFNULL(s.dialable_leads,0) dialable_leads,IFNULL(s.calls_today,0) calls_today,"
		. " IFNULL(s.answers_today,0) answers_today,IFNULL(s.drops_today,0) drops_today,"
		. " IFNULL(s.drops_answers_today_pct,0) drops_answers_today_pct,"
		. " IFNULL(s.agent_calls_today,0) agent_calls_today,"
		. " IFNULL(s.agent_wait_today,0) agent_wait_today,"
		. " IFNULL(s.agent_custtalk_today,0) agent_custtalk_today,"
		. " IFNULL(s.agent_acw_today,0) agent_acw_today,"
		. " IFNULL(s.agent_pause_today,0) agent_pause_today,"
		. " s.update_time"
		. " FROM vicidial_campaigns c"
		. " LEFT JOIN vicidial_campaign_stats s ON c.campaign_id=s.campaign_id"
		. $where
		. " ORDER BY c.campaign_id LIMIT 300";
	$rslt = qdialer_query($sql);
	$rows = array();
	if (!$rslt)
		{return $rows;}
	while ($row = qdialer_fetch_assoc($rslt))
		{
		$drop_pct = (float)$row['drops_answers_today_pct'];
		if ($drop_pct <= 0 and (int)$row['answers_today'] > 0)
			{$drop_pct = ((int)$row['drops_today'] / (int)$row['answers_today']) * 100;}
		$row['drop_pct'] = $drop_pct;
		$rows[] = $row;
		}
	return $rows;
	}

function qdialer_rt_server_rows()
	{
	if (!qdialer_table_exists('servers'))
		{return array();}
	$sql = "SELECT server_id,server_description,server_ip,active,active_asterisk_server,"
		. " max_vicidial_trunks,outbound_calls_per_second,sysload,channels_total,cpu_idle_percent,disk_usage"
		. " FROM servers WHERE active='Y' ORDER BY server_id LIMIT 80";
	$rslt = qdialer_query($sql);
	$rows = array();
	if (!$rslt)
		{return $rows;}
	while ($row = qdialer_fetch_assoc($rslt))
		{$rows[] = $row;}
	return $rows;
	}

function qdialer_rt_summary($agents, $calls, $campaigns, $servers)
	{
	$summary = array(
		'agents_total' => count($agents),
		'agents_ready' => 0,
		'agents_incall' => 0,
		'agents_paused' => 0,
		'agents_dispo' => 0,
		'agents_ringing' => 0,
		'calls_total' => count($calls),
		'calls_ringing' => 0,
		'calls_waiting' => 0,
		'calls_ivr' => 0,
		'active_campaigns' => count($campaigns),
		'dialable_leads' => 0,
		'calls_today' => 0,
		'answers_today' => 0,
		'drops_today' => 0,
		'drop_pct' => 0,
		'avg_dial_level' => 0,
		'servers_active' => count($servers),
		'channels_total' => 0,
		'trunk_capacity' => 0,
		'outbound_cps' => 0
		);

	$i = 0;
	while ($i < count($agents))
		{
		$status = $agents[$i]['status'];
		if ($status === 'READY' or $status === 'CLOSER')
			{$summary['agents_ready']++;}
		elseif ($status === 'INCALL' or $status === 'QUEUE' or $status === 'PARK' or $status === '3-WAY')
			{$summary['agents_incall']++;}
		elseif ($status === 'PAUSED')
			{$summary['agents_paused']++;}
		elseif ($status === 'DISPO')
			{$summary['agents_dispo']++;}
		elseif ($status === 'RING')
			{$summary['agents_ringing']++;}
		$i++;
		}

	$i = 0;
	while ($i < count($calls))
		{
		$status = $calls[$i]['status'];
		if ($status === 'RINGING' or $status === 'SENT')
			{$summary['calls_ringing']++;}
		elseif ($status === 'LIVE' or $status === 'CLOSER')
			{$summary['calls_waiting']++;}
		elseif ($status === 'IVR')
			{$summary['calls_ivr']++;}
		$i++;
		}

	$dial_total = 0;
	$dial_count = 0;
	$i = 0;
	while ($i < count($campaigns))
		{
		$summary['dialable_leads'] += (int)$campaigns[$i]['dialable_leads'];
		$summary['calls_today'] += (int)$campaigns[$i]['calls_today'];
		$summary['answers_today'] += (int)$campaigns[$i]['answers_today'];
		$summary['drops_today'] += (int)$campaigns[$i]['drops_today'];
		$dial_total += (float)$campaigns[$i]['auto_dial_level'];
		$dial_count++;
		$i++;
		}
	if ($summary['answers_today'] > 0)
		{$summary['drop_pct'] = ($summary['drops_today'] / $summary['answers_today']) * 100;}
	if ($dial_count > 0)
		{$summary['avg_dial_level'] = $dial_total / $dial_count;}

	$i = 0;
	while ($i < count($servers))
		{
		$summary['channels_total'] += (int)$servers[$i]['channels_total'];
		$summary['trunk_capacity'] += (int)$servers[$i]['max_vicidial_trunks'];
		$summary['outbound_cps'] += (int)$servers[$i]['outbound_calls_per_second'];
		$i++;
		}
	return $summary;
	}

function qdialer_rt_snapshot($campaign_id)
	{
	$campaign_id = qdialer_rt_clean_campaign($campaign_id);
	if (!qdialer_has_mysql())
		{return qdialer_rt_demo_snapshot($campaign_id, array('database connection'));}
	$missing = qdialer_rt_missing_tables();
	if (count($missing) > 0)
		{return qdialer_rt_demo_snapshot($campaign_id, $missing);}

	$agents = qdialer_rt_agent_rows($campaign_id);
	$calls = qdialer_rt_call_rows($campaign_id);
	$campaigns = qdialer_rt_campaign_rows($campaign_id);
	$servers = qdialer_rt_server_rows();

	return array(
		'product' => 'qDialer',
		'demo' => false,
		'campaign_id' => $campaign_id,
		'generated_at' => date('Y-m-d H:i:s'),
		'summary' => qdialer_rt_summary($agents, $calls, $campaigns, $servers),
		'agents' => $agents,
		'calls' => $calls,
		'campaigns' => $campaigns,
		'servers' => $servers,
		'missing' => array()
		);
	}

function qdialer_rt_demo_snapshot($campaign_id, $missing)
	{
	$agents = array(
		array('extension'=>'SIP/101','user'=>'agent01','full_name'=>'Avery Stone','user_group'=>'SALES','session'=>'860001','status'=>'INCALL','raw_status'=>'INCALL','state_seconds'=>184,'state_label'=>'00:03:04','campaign_id'=>'SALES','calls_today'=>42,'server_ip'=>'10.0.0.11','call_server_ip'=>'10.0.0.11','lead_id'=>10241,'callerid'=>'M860001','on_hook_agent'=>'N','pause_code'=>'','agent_log_id'=>9001),
		array('extension'=>'SIP/104','user'=>'agent04','full_name'=>'Mira Chen','user_group'=>'SALES','session'=>'860004','status'=>'READY','raw_status'=>'READY','state_seconds'=>38,'state_label'=>'00:00:38','campaign_id'=>'SALES','calls_today'=>37,'server_ip'=>'10.0.0.11','call_server_ip'=>'','lead_id'=>0,'callerid'=>'','on_hook_agent'=>'N','pause_code'=>'','agent_log_id'=>9004),
		array('extension'=>'SIP/107','user'=>'agent07','full_name'=>'Noah Park','user_group'=>'CLOSERS','session'=>'860007','status'=>'PAUSED','raw_status'=>'PAUSED','state_seconds'=>221,'state_label'=>'00:03:41','campaign_id'=>'INBOUND','calls_today'=>29,'server_ip'=>'10.0.0.12','call_server_ip'=>'','lead_id'=>0,'callerid'=>'','on_hook_agent'=>'N','pause_code'=>'LUNCH','agent_log_id'=>9007),
		array('extension'=>'SIP/109','user'=>'agent09','full_name'=>'Iris Vega','user_group'=>'SALES','session'=>'860009','status'=>'RING','raw_status'=>'READY','state_seconds'=>9,'state_label'=>'00:00:09','campaign_id'=>'SALES','calls_today'=>31,'server_ip'=>'10.0.0.11','call_server_ip'=>'','lead_id'=>0,'callerid'=>'','on_hook_agent'=>'Y','pause_code'=>'','agent_log_id'=>9009)
		);
	$calls = array(
		array('status'=>'RINGING','call_type'=>'OUT','campaign_id'=>'SALES','group_name'=>'','stage'=>'START','phone_display'=>'*******1212','lead_id'=>10255,'callerid'=>'M860055','server_ip'=>'10.0.0.11','queue_priority'=>0,'agent_only'=>'','call_seconds'=>14,'call_label'=>'00:00:14'),
		array('status'=>'LIVE','call_type'=>'IN','campaign_id'=>'INBOUND','group_name'=>'Main Inbound','stage'=>'LIVE','phone_display'=>'*******8830','lead_id'=>10256,'callerid'=>'M860056','server_ip'=>'10.0.0.12','queue_priority'=>9,'agent_only'=>'','call_seconds'=>47,'call_label'=>'00:00:47'),
		array('status'=>'IVR','call_type'=>'IN','campaign_id'=>'SUPPORT','group_name'=>'Support Queue','stage'=>'MENU','phone_display'=>'*******4455','lead_id'=>10257,'callerid'=>'M860057','server_ip'=>'10.0.0.12','queue_priority'=>4,'agent_only'=>'','call_seconds'=>31,'call_label'=>'00:00:31')
		);
	$campaigns = array(
		array('campaign_id'=>'SALES','campaign_name'=>'Demo Sales','active'=>'Y','dial_method'=>'RATIO','auto_dial_level'=>'2.5','hopper_level'=>'500','campaign_allow_inbound'=>'N','campaign_recording'=>'ALLCALLS','dialable_leads'=>12840,'calls_today'=>634,'answers_today'=>188,'drops_today'=>4,'drops_answers_today_pct'=>2.13,'agent_calls_today'=>188,'agent_wait_today'=>3290,'agent_custtalk_today'=>28620,'agent_acw_today'=>2110,'agent_pause_today'=>4870,'update_time'=>date('Y-m-d H:i:s'),'drop_pct'=>2.13),
		array('campaign_id'=>'INBOUND','campaign_name'=>'Demo Inbound','active'=>'Y','dial_method'=>'INBOUND_MAN','auto_dial_level'=>'1.0','hopper_level'=>'0','campaign_allow_inbound'=>'Y','campaign_recording'=>'ALLCALLS','dialable_leads'=>0,'calls_today'=>96,'answers_today'=>82,'drops_today'=>2,'drops_answers_today_pct'=>2.44,'agent_calls_today'=>82,'agent_wait_today'=>1820,'agent_custtalk_today'=>15800,'agent_acw_today'=>790,'agent_pause_today'=>2040,'update_time'=>date('Y-m-d H:i:s'),'drop_pct'=>2.44)
		);
	$servers = array(
		array('server_id'=>'dialer1','server_description'=>'Demo Asterisk Node','server_ip'=>'10.0.0.11','active'=>'Y','active_asterisk_server'=>'Y','max_vicidial_trunks'=>240,'outbound_calls_per_second'=>40,'sysload'=>2,'channels_total'=>84,'cpu_idle_percent'=>71,'disk_usage'=>'1'),
		array('server_id'=>'dialer2','server_description'=>'Demo Inbound Node','server_ip'=>'10.0.0.12','active'=>'Y','active_asterisk_server'=>'Y','max_vicidial_trunks'=>180,'outbound_calls_per_second'=>20,'sysload'=>1,'channels_total'=>38,'cpu_idle_percent'=>82,'disk_usage'=>'1')
		);
	return array(
		'product' => 'qDialer',
		'demo' => true,
		'campaign_id' => $campaign_id,
		'generated_at' => date('Y-m-d H:i:s'),
		'summary' => qdialer_rt_summary($agents, $calls, $campaigns, $servers),
		'agents' => $agents,
		'calls' => $calls,
		'campaigns' => $campaigns,
		'servers' => $servers,
		'missing' => $missing
		);
	}
?>
