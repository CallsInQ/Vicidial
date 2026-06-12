<?php
require_once(dirname(__FILE__) . '/bootstrap.php');

function qdialer_page_begin($title, $active)
	{
	$base = QDIALER_BASE_URL;
	$user = qdialer_current_user();
	header("Content-type: text/html; charset=utf-8");
	echo "<!doctype html>\n";
	echo "<html lang=\"en\">\n";
	echo "<head>\n";
	echo "<meta charset=\"utf-8\">\n";
	echo "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n";
	echo "<title>" . qdialer_h($title) . " | qDialer</title>\n";
	echo "<link rel=\"icon\" type=\"image/png\" href=\"" . qdialer_h($base) . "/assets/img/qdialer-favicon.png\">\n";
	echo "<link rel=\"stylesheet\" href=\"" . qdialer_h($base) . "/assets/css/qdialer.css\">\n";
	echo "</head>\n";
	echo "<body class=\"qdialer-app\">\n";
	echo "<div class=\"qd-shell\">\n";
	echo "<aside class=\"qd-sidebar\">\n";
	echo "<a class=\"qd-brand\" href=\"" . qdialer_h($base) . "/\">\n";
	echo "<img src=\"" . qdialer_h($base) . "/assets/img/qdialer-logo.png\" alt=\"qDialer\">\n";
	echo "</a>\n";
	echo "<nav class=\"qd-nav\" aria-label=\"qDialer navigation\">\n";
	qdialer_nav_link('Dashboard', $base . '/', $active, 'dashboard');
	qdialer_nav_link('Live Agents', $base . '/../vicidial/realtime_report.php', $active, 'live-agents');
	qdialer_nav_link('Realtime', $base . '/realtime.php', $active, 'realtime');
	qdialer_nav_link('Users', $base . '/../vicidial/admin.php?ADD=0', $active, 'users');
	qdialer_nav_link('Lead Lookup', $base . '/../vicidial/admin_search_lead.php', $active, 'lead-lookup');
	qdialer_nav_link('Recording Lookup', $base . '/../vicidial/recording_lookup.php', $active, 'recording-lookup');
	qdialer_nav_link('Numbers', $base . '/../vicidial/admin.php?ADD=10000000000', $active, 'numbers');
	qdialer_nav_link('In-Groups', $base . '/../vicidial/admin.php?ADD=1000', $active, 'ingroups');
	qdialer_nav_link('Campaigns', $base . '/../vicidial/admin.php?ADD=10', $active, 'campaigns');
	qdialer_nav_link('Lists', $base . '/../vicidial/admin.php?ADD=100', $active, 'lists');
	qdialer_nav_link('Vendor Cost', $base . '/reports/vendor-cost.php', $active, 'vendor-cost');
	qdialer_nav_link('Agent Productivity', $base . '/reports/agent-productivity.php', $active, 'agent-productivity');
	qdialer_nav_link('Recording Review', $base . '/recordings.php', $active, 'recordings');
	qdialer_nav_link('Setup', $base . '/setup/vendors.php', $active, 'setup');
	qdialer_nav_link('Advanced VICIDIAL', $base . '/../vicidial/admin.php', $active, 'advanced-vicidial');
	echo "</nav>\n";
	echo "<div class=\"qd-legacy-links\">\n";
	echo "<span>Launch</span>\n";
	echo "<a href=\"" . qdialer_h($base) . "/../agc/vicidial.php\">Agent Console</a>\n";
	echo "<a href=\"" . qdialer_h($base) . "/../vicidial/admin.php?ADD=999999\">Reports</a>\n";
	echo "</div>\n";
	echo "</aside>\n";
	echo "<main class=\"qd-main\">\n";
	echo "<header class=\"qd-topbar\">\n";
	echo "<div>\n";
	echo "<p class=\"qd-kicker\">qDialer live report</p>\n";
	echo "<h1>" . qdialer_h($title) . "</h1>\n";
	echo "</div>\n";
	echo "<div class=\"qd-user-pill\">Signed in as <strong>" . qdialer_h($user) . "</strong></div>\n";
	echo "</header>\n";
	if (!qdialer_schema_ready())
		{
		echo "<section class=\"qd-alert qd-alert-warn\">\n";
		echo "<strong>Schema setup needed.</strong> Import <code>extras/qdialer/qdialer_schema.sql</code> into the VICIDIAL MySQL database to enable live qDialer vendor rules, cost events, roles, corrections, and recording reviews. Demo data is shown until then.\n";
		echo "</section>\n";
		}
	}

function qdialer_nav_link($label, $href, $active, $key)
	{
	$class = ($active === $key) ? ' class="is-active"' : '';
	echo "<a" . $class . " href=\"" . qdialer_h($href) . "\">" . qdialer_h($label) . "</a>\n";
	}

function qdialer_page_end()
	{
	echo "</main>\n";
	echo "</div>\n";
	echo "<script src=\"" . qdialer_h(QDIALER_BASE_URL) . "/assets/js/qdialer.js\"></script>\n";
	echo "</body>\n";
	echo "</html>\n";
	}

function qdialer_metric_card($label, $value, $detail, $tone)
	{
	echo "<article class=\"qd-card qd-metric qd-tone-" . qdialer_h($tone) . "\">\n";
	echo "<span>" . qdialer_h($label) . "</span>\n";
	echo "<strong>" . qdialer_h($value) . "</strong>\n";
	echo "<p>" . qdialer_h($detail) . "</p>\n";
	echo "</article>\n";
	}

function qdialer_empty_state($title, $body)
	{
	echo "<section class=\"qd-empty\">\n";
	echo "<img src=\"" . qdialer_h(QDIALER_BASE_URL) . "/assets/img/qdialer-icon.png\" alt=\"\">\n";
	echo "<h2>" . qdialer_h($title) . "</h2>\n";
	echo "<p>" . qdialer_h($body) . "</p>\n";
	echo "</section>\n";
	}
?>
