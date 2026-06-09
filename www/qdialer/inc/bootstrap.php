<?php
# qDialer lightweight bootstrap.
# This file intentionally uses old-PHP-compatible syntax because VICIDIAL
# installations often run conservative PHP stacks.

if (!defined('QDIALER_BOOTSTRAPPED'))
	{
	define('QDIALER_BOOTSTRAPPED', 1);
	define('QDIALER_ROOT', dirname(dirname(__FILE__)));

	$qdialer_script_name = isset($_SERVER['SCRIPT_NAME']) ? $_SERVER['SCRIPT_NAME'] : '/qdialer/index.php';
	$qdialer_pos = strpos($qdialer_script_name, '/qdialer/');
	if ($qdialer_pos === false)
		{$qdialer_base_url = '/qdialer';}
	else
		{$qdialer_base_url = substr($qdialer_script_name, 0, $qdialer_pos) . '/qdialer';}
	define('QDIALER_BASE_URL', $qdialer_base_url);

	$qdialer_vicidial_dbconnect = QDIALER_ROOT . '/../vicidial/dbconnect.php';
	if (function_exists('mysql_connect') and file_exists($qdialer_vicidial_dbconnect))
		{@include_once($qdialer_vicidial_dbconnect);}
	else
		{qdialer_connect_mysqli();}
	}

function qdialer_h($value)
	{
	return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
	}

function qdialer_current_user()
	{
	if (isset($_SERVER['PHP_AUTH_USER']) and strlen($_SERVER['PHP_AUTH_USER']) > 0)
		{return $_SERVER['PHP_AUTH_USER'];}
	return 'demo';
	}

function qdialer_has_mysql()
	{
	return ((function_exists('mysql_query') and isset($GLOBALS['link']) and $GLOBALS['link']) or (isset($GLOBALS['qdialer_mysqli']) and $GLOBALS['qdialer_mysqli']));
	}

function qdialer_db_config()
	{
	$config = array(
		'VARDB_server' => 'localhost',
		'VARDB_port' => '3306',
		'VARDB_user' => 'cron',
		'VARDB_pass' => '1234',
		'VARDB_database' => 'asterisk'
	);
	if (file_exists('/etc/astguiclient.conf'))
		{
		$lines = file('/etc/astguiclient.conf');
		foreach ($lines as $line)
			{
			$line = preg_replace('/\s+|#.*|;.*/', '', $line);
			if (strpos($line, '=>') !== false)
				{
				list($key, $value) = explode('=>', $line, 2);
				if (isset($config[$key]))
					{$config[$key] = $value;}
				}
			}
		}
	return $config;
	}

function qdialer_connect_mysqli()
	{
	if (!function_exists('mysqli_connect'))
		{return false;}
	if (function_exists('mysqli_report'))
		{mysqli_report(MYSQLI_REPORT_OFF);}
	$config = qdialer_db_config();
	$port = (int)$config['VARDB_port'];
	$link = @mysqli_connect($config['VARDB_server'], $config['VARDB_user'], $config['VARDB_pass'], $config['VARDB_database'], $port);
	if ($link)
		{
		$GLOBALS['qdialer_mysqli'] = $link;
		$GLOBALS['link'] = $link;
		return true;
		}
	return false;
	}

function qdialer_escape($value)
	{
	if (function_exists('mysql_real_escape_string') and qdialer_has_mysql())
		{return mysql_real_escape_string($value, $GLOBALS['link']);}
	if (isset($GLOBALS['qdialer_mysqli']) and $GLOBALS['qdialer_mysqli'])
		{return mysqli_real_escape_string($GLOBALS['qdialer_mysqli'], $value);}
	return addslashes($value);
	}

function qdialer_query($sql)
	{
	if (!qdialer_has_mysql())
		{return false;}
	if (function_exists('mysql_query') and !isset($GLOBALS['qdialer_mysqli']))
		{return @mysql_query($sql, $GLOBALS['link']);}
	try
		{return @mysqli_query($GLOBALS['qdialer_mysqli'], $sql);}
	catch (Exception $e)
		{return false;}
	}

function qdialer_fetch_assoc($rslt)
	{
	if (!$rslt)
		{return false;}
	if (function_exists('mysql_fetch_assoc') and !isset($GLOBALS['qdialer_mysqli']))
		{return mysql_fetch_assoc($rslt);}
	return mysqli_fetch_assoc($rslt);
	}

function qdialer_fetch_row($rslt)
	{
	if (!$rslt)
		{return false;}
	if (function_exists('mysql_fetch_row') and !isset($GLOBALS['qdialer_mysqli']))
		{return mysql_fetch_row($rslt);}
	return mysqli_fetch_row($rslt);
	}

function qdialer_num_rows($rslt)
	{
	if (!$rslt)
		{return 0;}
	if (function_exists('mysql_num_rows') and !isset($GLOBALS['qdialer_mysqli']))
		{return mysql_num_rows($rslt);}
	return mysqli_num_rows($rslt);
	}

function qdialer_table_exists($table_name)
	{
	$table_name = qdialer_escape($table_name);
	$rslt = qdialer_query("SHOW TABLES LIKE '$table_name'");
	if (!$rslt)
		{return false;}
	return (qdialer_num_rows($rslt) > 0);
	}

function qdialer_schema_ready()
	{
	return qdialer_table_exists('qdialer_vendors') and qdialer_table_exists('qdialer_cost_rules');
	}

function qdialer_role_flag($flag_name)
	{
	if (!qdialer_has_mysql())
		{return true;}
	$user = qdialer_escape(qdialer_current_user());
	$flag_name = preg_replace('/[^a-z_]/', '', $flag_name);
	if (qdialer_table_exists('qdialer_roles'))
		{
		$rslt = qdialer_query("SELECT $flag_name FROM qdialer_roles WHERE user='$user' LIMIT 1");
		if ($rslt and qdialer_num_rows($rslt) > 0)
			{
			$row = qdialer_fetch_row($rslt);
			return ($row[0] === 'Y');
			}
		}
	$rslt = qdialer_query("SELECT user_level FROM vicidial_users WHERE user='$user' LIMIT 1");
	if ($rslt and qdialer_num_rows($rslt) > 0)
		{
		$row = qdialer_fetch_row($rslt);
		return ((int)$row[0] >= 8);
		}
	return false;
	}

function qdialer_can_view_costs()
	{
	return qdialer_role_flag('can_view_costs');
	}

function qdialer_can_export_reports()
	{
	return qdialer_role_flag('can_export_reports');
	}

function qdialer_date_input($name, $default)
	{
	$value = isset($_GET[$name]) ? $_GET[$name] : $default;
	return preg_replace('/[^0-9\-]/', '', $value);
	}

function qdialer_selected($actual, $expected)
	{
	return ((string)$actual === (string)$expected) ? ' selected' : '';
	}
?>
