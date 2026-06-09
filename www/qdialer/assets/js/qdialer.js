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
