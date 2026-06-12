(function () {
  function todayKey() {
    var now = new Date();
    return now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + "-" + Math.floor(now.getHours() / 2);
  }

  var buttons = document.querySelectorAll("[data-qd-dismiss]");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function () {
      var card = this.closest("[data-qd-recommendation]");
      if (!card) {
        return;
      }
      var key = "qdialer-dismissed-" + card.getAttribute("data-qd-recommendation") + "-" + todayKey();
      try {
        window.localStorage.setItem(key, "Y");
      } catch (ignore) {}
      card.style.display = "none";
    });
  }

  var recommendations = document.querySelectorAll("[data-qd-recommendation]");
  for (var j = 0; j < recommendations.length; j++) {
    var rec = recommendations[j];
    var recKey = "qdialer-dismissed-" + rec.getAttribute("data-qd-recommendation") + "-" + todayKey();
    try {
      if (window.localStorage.getItem(recKey) === "Y") {
        rec.style.display = "none";
      }
    } catch (ignore2) {}
  }
})();

(function () {
  var realtime = document.querySelector("[data-qd-realtime]");
  if (!realtime) {
    return;
  }

  var api = realtime.getAttribute("data-api");
  var refresh = parseInt(realtime.getAttribute("data-refresh"), 10) || 5;
  var lastNode = document.querySelector("[data-qd-rt-last]");

  function number(value) {
    var parsed = parseFloat(value);
    if (isNaN(parsed)) {
      parsed = 0;
    }
    if (window.Intl && window.Intl.NumberFormat) {
      return new Intl.NumberFormat().format(parsed);
    }
    return String(Math.round(parsed));
  }

  function fixed(value, places) {
    var parsed = parseFloat(value);
    if (isNaN(parsed)) {
      parsed = 0;
    }
    return parsed.toFixed(places);
  }

  function setValue(key, value) {
    var nodes = document.querySelectorAll("[data-qd-rt-value='" + key + "']");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = value;
    }
  }

  function statusClass(status) {
    return String(status || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function td(row, text) {
    var cell = document.createElement("td");
    cell.textContent = text || "";
    row.appendChild(cell);
    return cell;
  }

  function tdBadge(row, status) {
    var cell = document.createElement("td");
    var badge = document.createElement("span");
    badge.className = "qd-status qd-status-" + statusClass(status);
    badge.textContent = status || "";
    cell.appendChild(badge);
    row.appendChild(cell);
    return cell;
  }

  function tdStack(row, main, sub) {
    var cell = document.createElement("td");
    var strong = document.createElement("strong");
    var span = document.createElement("span");
    strong.textContent = main || "";
    span.textContent = sub || "";
    cell.appendChild(strong);
    cell.appendChild(span);
    row.appendChild(cell);
    return cell;
  }

  function emptyRow(body, columns, message) {
    var row = document.createElement("tr");
    row.className = "qd-empty-row";
    var cell = document.createElement("td");
    cell.colSpan = columns;
    cell.textContent = message;
    row.appendChild(cell);
    body.appendChild(row);
  }

  function replaceRows(selector, rows, columns, emptyMessage, builder) {
    var body = document.querySelector(selector);
    if (!body) {
      return;
    }
    body.innerHTML = "";
    if (!rows || rows.length < 1) {
      emptyRow(body, columns, emptyMessage);
      return;
    }
    for (var i = 0; i < rows.length; i++) {
      body.appendChild(builder(rows[i]));
    }
  }

  function agentRow(agent) {
    var row = document.createElement("tr");
    tdBadge(row, agent.status);
    tdStack(row, agent.user, agent.full_name);
    td(row, agent.campaign_id);
    td(row, agent.state_label);
    td(row, number(agent.calls_today));
    td(row, agent.pause_code);
    td(row, agent.server_ip);
    return row;
  }

  function callRow(call) {
    var row = document.createElement("tr");
    var queue = call.group_name || call.campaign_id;
    tdBadge(row, call.status);
    td(row, call.call_type);
    tdStack(row, call.campaign_id, queue);
    td(row, call.stage);
    td(row, call.call_label);
    td(row, number(call.queue_priority));
    td(row, call.phone_display);
    td(row, call.server_ip);
    return row;
  }

  function campaignRow(campaign) {
    var row = document.createElement("tr");
    tdStack(row, campaign.campaign_id, campaign.campaign_name);
    td(row, campaign.dial_method);
    td(row, fixed(campaign.auto_dial_level, 2));
    td(row, number(campaign.dialable_leads));
    td(row, number(campaign.calls_today));
    td(row, number(campaign.answers_today));
    td(row, number(campaign.drops_today));
    td(row, fixed(campaign.drop_pct, 2) + "%");
    return row;
  }

  function serverRow(server) {
    var row = document.createElement("tr");
    tdStack(row, server.server_id, server.server_ip);
    td(row, server.active_asterisk_server);
    td(row, number(server.channels_total));
    td(row, number(server.max_vicidial_trunks));
    td(row, number(server.outbound_calls_per_second));
    td(row, number(server.cpu_idle_percent) + "%");
    td(row, server.sysload);
    return row;
  }

  function update(snapshot) {
    if (!snapshot || !snapshot.summary) {
      return;
    }
    var s = snapshot.summary;
    setValue("agents_total", number(s.agents_total));
    setValue("agents_incall", number(s.agents_incall));
    setValue("calls_waiting", number(s.calls_waiting));
    setValue("drop_pct", fixed(s.drop_pct, 2) + "%");
    setValue("agents_ready", number(s.agents_ready));
    setValue("agents_paused", number(s.agents_paused));
    setValue("agents_ringing", number(s.agents_ringing));
    setValue("dialable_leads", number(s.dialable_leads));
    if (lastNode) {
      lastNode.textContent = snapshot.generated_at || "";
    }

    replaceRows("[data-qd-rt-agents]", snapshot.agents, 7, "No agents are logged in for this scope.", agentRow);
    replaceRows("[data-qd-rt-calls]", snapshot.calls, 8, "No active calls are being placed or queued right now.", callRow);
    replaceRows("[data-qd-rt-campaigns]", snapshot.campaigns, 8, "No active campaigns matched this scope.", campaignRow);
    replaceRows("[data-qd-rt-servers]", snapshot.servers, 7, "No active server capacity rows were available.", serverRow);
  }

  function request() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", api + "&_=" + new Date().getTime(), true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) {
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        if (lastNode) {
          lastNode.textContent = "Live update paused";
        }
        return;
      }
      try {
        update(JSON.parse(xhr.responseText));
      } catch (ignore) {
        if (lastNode) {
          lastNode.textContent = "Live update paused";
        }
      }
    };
    xhr.send(null);
  }

  window.setInterval(request, refresh * 1000);
})();
