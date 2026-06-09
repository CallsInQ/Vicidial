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
	if (file_exists($qdialer_vicidial_dbconnect))
		{@include_once($qdialer_vicidial_dbconnect);}
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
	return function_exists('mysql_query') and isset($GLOBALS['link']) and $GLOBALS['link'];
	}

function qdialer_escape($value)
	{
	if (function_exists('mysql_real_escape_string') and qdialer_has_mysql())
		{return mysql_real_escape_string($value, $GLOBALS['link']);}
	return addslashes($value);
	}

function qdialer_query($sql)
	{
	if (!qdialer_has_mysql())
		{return false;}
	return @mysql_query($sql, $GLOBALS['link']);
	}

function qdialer_table_exists($table_name)
	{
	$table_name = qdialer_escape($table_name);
	$rslt = qdialer_query("SHOW TABLES LIKE '$table_name'");
	if (!$rslt)
		{return false;}
	return (mysql_num_rows($rslt) > 0);
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
		if ($rslt and mysql_num_rows($rslt) > 0)
			{
			$row = mysql_fetch_row($rslt);
			return ($row[0] === 'Y');
			}
		}
	$rslt = qdialer_query("SELECT user_level FROM vicidial_users WHERE user='$user' LIMIT 1");
	if ($rslt and mysql_num_rows($rslt) > 0)
		{
		$row = mysql_fetch_row($rslt);
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
