<?php
# Compatibility shims for running this legacy VICIDIAL tree on modern PHP.
# Keep this file small and behavior-focused: it only defines functions that
# were removed from newer PHP runtimes and are still used throughout VICIDIAL.

if (function_exists('mysqli_report'))
	{mysqli_report(MYSQLI_REPORT_OFF);}

if (!defined('MYSQL_ASSOC'))
	{define('MYSQL_ASSOC', 1);}
if (!defined('MYSQL_NUM'))
	{define('MYSQL_NUM', 2);}
if (!defined('MYSQL_BOTH'))
	{define('MYSQL_BOTH', 3);}

function vicidial_compat_regex($pattern, $case_insensitive=false)
	{
	$delimiter = '~';
	$pattern = str_replace($delimiter, '\\' . $delimiter, (string)$pattern);
	return $delimiter . $pattern . $delimiter . ($case_insensitive ? 'i' : '');
	}

if (!function_exists('ereg'))
	{
	function ereg($pattern, $string, &$regs=null)
		{
		$matches = array();
		$result = @preg_match(vicidial_compat_regex($pattern), (string)$string, $matches);
		if ($result < 1)
			{return false;}
		if (is_array($regs))
			{$regs = $matches;}
		$length = strlen($matches[0]);
		return ($length > 0) ? $length : 1;
		}
	}

if (!function_exists('eregi'))
	{
	function eregi($pattern, $string, &$regs=null)
		{
		$matches = array();
		$result = @preg_match(vicidial_compat_regex($pattern, true), (string)$string, $matches);
		if ($result < 1)
			{return false;}
		if (is_array($regs))
			{$regs = $matches;}
		$length = strlen($matches[0]);
		return ($length > 0) ? $length : 1;
		}
	}

if (!function_exists('ereg_replace'))
	{
	function ereg_replace($pattern, $replacement, $string)
		{
		$result = @preg_replace(vicidial_compat_regex($pattern), (string)$replacement, (string)$string);
		return ($result === null) ? (string)$string : $result;
		}
	}

if (!function_exists('eregi_replace'))
	{
	function eregi_replace($pattern, $replacement, $string)
		{
		$result = @preg_replace(vicidial_compat_regex($pattern, true), (string)$replacement, (string)$string);
		return ($result === null) ? (string)$string : $result;
		}
	}

if (!function_exists('split'))
	{
	function split($pattern, $string, $limit=-1)
		{
		$limit = (int)$limit;
		if ($limit === 0)
			{$limit = -1;}
		$result = @preg_split(vicidial_compat_regex($pattern), (string)$string, $limit);
		return ($result === false) ? array((string)$string) : $result;
		}
	}

if (!function_exists('spliti'))
	{
	function spliti($pattern, $string, $limit=-1)
		{
		$limit = (int)$limit;
		if ($limit === 0)
			{$limit = -1;}
		$result = @preg_split(vicidial_compat_regex($pattern, true), (string)$string, $limit);
		return ($result === false) ? array((string)$string) : $result;
		}
	}

if (!function_exists('each'))
	{
	function each(&$array)
		{
		$key = key($array);
		if ($key === null)
			{return false;}
		$value = current($array);
		next($array);
		return array(1 => $value, 'value' => $value, 0 => $key, 'key' => $key);
		}
	}

if (!function_exists('get_magic_quotes_gpc'))
	{
	function get_magic_quotes_gpc()
		{return 0;}
	}

if (!function_exists('set_magic_quotes_runtime'))
	{
	function set_magic_quotes_runtime($new_setting)
		{return false;}
	}

function vicidial_compat_mysql_link($link=null)
	{
	if ($link)
		{return $link;}
	if (isset($GLOBALS['link']) and $GLOBALS['link'])
		{return $GLOBALS['link'];}
	if (isset($GLOBALS['vicidial_compat_mysql_link']) and $GLOBALS['vicidial_compat_mysql_link'])
		{return $GLOBALS['vicidial_compat_mysql_link'];}
	return false;
	}

function vicidial_compat_mysql_host($server)
	{
	$server = (string)$server;
	$host = $server;
	$port = null;
	$socket = null;
	if (strpos($server, ':/') !== false)
		{
		list($host, $socket) = explode(':', $server, 2);
		}
	elseif (strpos($server, ':') !== false)
		{
		list($host, $port) = explode(':', $server, 2);
		$port = (int)$port;
		}
	return array($host, $port, $socket);
	}

if (!function_exists('mysql_connect'))
	{
	function mysql_connect($server='localhost', $username='', $password='', $new_link=false, $client_flags=0)
		{
		list($host, $port, $socket) = vicidial_compat_mysql_host($server);
		$link = @mysqli_connect($host, $username, $password, '', $port, $socket);
		if (!$link)
			{
			$GLOBALS['vicidial_compat_mysql_error'] = mysqli_connect_error();
			$GLOBALS['vicidial_compat_mysql_errno'] = mysqli_connect_errno();
			return false;
			}
		$GLOBALS['vicidial_compat_mysql_link'] = $link;
		$GLOBALS['link'] = $link;
		return $link;
		}
	}

if (!function_exists('mysql_pconnect'))
	{
	function mysql_pconnect($server='localhost', $username='', $password='', $client_flags=0)
		{return mysql_connect($server, $username, $password, false, $client_flags);}
	}

if (!function_exists('mysql_select_db'))
	{
	function mysql_select_db($database_name, $link_identifier=null)
		{
		$link = vicidial_compat_mysql_link($link_identifier);
		if (!$link)
			{return false;}
		$result = @mysqli_select_db($link, $database_name);
		if ($result)
			{$GLOBALS['vicidial_compat_mysql_database'] = $database_name;}
		return $result;
		}
	}

if (!function_exists('mysql_query'))
	{
	function mysql_query($query, $link_identifier=null)
		{
		$link = vicidial_compat_mysql_link($link_identifier);
		if (!$link)
			{return false;}
		return @mysqli_query($link, $query);
		}
	}

if (!function_exists('mysql_unbuffered_query'))
	{
	function mysql_unbuffered_query($query, $link_identifier=null)
		{
		$link = vicidial_compat_mysql_link($link_identifier);
		if (!$link)
			{return false;}
		return @mysqli_query($link, $query, MYSQLI_USE_RESULT);
		}
	}

if (!function_exists('mysql_fetch_row'))
	{
	function mysql_fetch_row($result)
		{return $result ? mysqli_fetch_row($result) : false;}
	}

if (!function_exists('mysql_fetch_assoc'))
	{
	function mysql_fetch_assoc($result)
		{return $result ? mysqli_fetch_assoc($result) : false;}
	}

if (!function_exists('mysql_fetch_array'))
	{
	function mysql_fetch_array($result, $result_type=MYSQL_BOTH)
		{return $result ? mysqli_fetch_array($result, $result_type) : false;}
	}

if (!function_exists('mysql_num_rows'))
	{
	function mysql_num_rows($result)
		{return $result ? mysqli_num_rows($result) : 0;}
	}

if (!function_exists('mysql_num_fields'))
	{
	function mysql_num_fields($result)
		{return $result ? mysqli_num_fields($result) : 0;}
	}

if (!function_exists('mysql_field_name'))
	{
	function mysql_field_name($result, $field_offset)
		{
		if (!$result)
			{return false;}
		$field = mysqli_fetch_field_direct($result, (int)$field_offset);
		return $field ? $field->name : false;
		}
	}

if (!function_exists('mysql_affected_rows'))
	{
	function mysql_affected_rows($link_identifier=null)
		{
		$link = vicidial_compat_mysql_link($link_identifier);
		return $link ? mysqli_affected_rows($link) : -1;
		}
	}

if (!function_exists('mysql_insert_id'))
	{
	function mysql_insert_id($link_identifier=null)
		{
		$link = vicidial_compat_mysql_link($link_identifier);
		return $link ? mysqli_insert_id($link) : 0;
		}
	}

if (!function_exists('mysql_real_escape_string'))
	{
	function mysql_real_escape_string($unescaped_string, $link_identifier=null)
		{
		$link = vicidial_compat_mysql_link($link_identifier);
		if (!$link)
			{return addslashes((string)$unescaped_string);}
		return mysqli_real_escape_string($link, (string)$unescaped_string);
		}
	}

if (!function_exists('mysql_error'))
	{
	function mysql_error($link_identifier=null)
		{
		$link = vicidial_compat_mysql_link($link_identifier);
		if ($link)
			{return mysqli_error($link);}
		return isset($GLOBALS['vicidial_compat_mysql_error']) ? $GLOBALS['vicidial_compat_mysql_error'] : '';
		}
	}

if (!function_exists('mysql_errno'))
	{
	function mysql_errno($link_identifier=null)
		{
		$link = vicidial_compat_mysql_link($link_identifier);
		if ($link)
			{return mysqli_errno($link);}
		return isset($GLOBALS['vicidial_compat_mysql_errno']) ? $GLOBALS['vicidial_compat_mysql_errno'] : 0;
		}
	}

if (!function_exists('mysql_close'))
	{
	function mysql_close($link_identifier=null)
		{
		$link = vicidial_compat_mysql_link($link_identifier);
		return $link ? mysqli_close($link) : false;
		}
	}

if (!function_exists('mysql_free_result'))
	{
	function mysql_free_result($result)
		{
		if (!$result)
			{return false;}
		mysqli_free_result($result);
		return true;
		}
	}
?>
