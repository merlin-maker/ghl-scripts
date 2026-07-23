(function () {
  var PIT_TOKEN = "pit-ffd9f87a-62d9-41e5-a603-b34563febadf";
  var LOCATION_CONFIG = {
    "J0LT6jSWLoLGpTazQJAO": {
      surveyUrl: "https://links.legacyfirstinsurance.org/widget/form/63QNmR94zgObUyifFrla"
    }
  };

  var BUTTONS = [
    { label: "NOT INTERESTED", tag: "stage-not-interested", tooltip: "Contact does not want coverage" },
    { label: "NO SHOW", tag: "stage-no-show", tooltip: "Contact missed their appointment, will send a follow up SMS" },
    { label: "THINK ABOUT IT", tag: "stage-think-about-it", tooltip: "Contact needs more time to decide, will send follow up SMS" },
    { label: "MANUAL FOLLOWUP", tag: "stage-manual-followup", tooltip: "Creates a task for personal follow up, plus 1 day reminder." },
    { label: "RE-START - OLDER", tag: "stage-restart-older", tooltip: "Re-engage an older lead with a reintroduction sequence" },
    { label: "RE-START - NEW", tag: "stage-restart-new", tooltip: "Re-engage a recently cold lead" },
    { label: "APPOINTMENT OUTCOME", tag: null, isForm: true, tooltip: "Fill out the appointment result form if appointment is completed and won" },
    { label: "MISSED PREMIUM", tag: "stage-missed-premium", tooltip: "Contact missed a premium payment, will send a follow up SMS and a reminder for you" }
  ];

  function getLocationIdFromUrl() {
    var m = window.location.pathname.match(/location\/([a-zA-Z0-9]+)/);
    return m ? m[1] : null;
  }
  function getContactIdFromUrl() {
    var m = window.location.pathname.match(/contacts\/detail\/([a-zA-Z0-9]+)/);
    return m ? m[1] : null;
  }

  function showToast(msg, isError) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:999999;background:" + (isError ? "#C0392B" : "#0b1e3d") + ";color:#c9a227;padding:12px 20px;border-radius:6px;font-family:sans-serif;font-size:14px;box-shadow:0 2px 10px rgba(0,0,0,0.3);";
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }

  function addTag(contactId, tag) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://services.leadconnectorhq.com/contacts/" + contactId + "/tags", true);
    xhr.setRequestHeader("Authorization", "Bearer " + PIT_TOKEN);
    xhr.setRequestHeader("Version", "2021-07-28");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        showToast(tag.replace("stage-", "").replace(/-/g, " ") + " applied");
      } else {
        showToast("Error adding tag - status " + xhr.status, true);
      }
    };
    xhr.onerror = function () { showToast("Network error adding tag", true); };
    xhr.send(JSON.stringify({ tags: [tag] }));
  }

  function loadJsPanel(cb) {
    if (window.jsPanel) { cb(); return; }
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdn.jsdelivr.net/npm/jspanel4@4.16.0/dist/jspanel.min.css";
    document.head.appendChild(css);
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jspanel4@4.16.0/dist/jspanel.min.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  function openForm(contactId, surveyUrl) {
    loadJsPanel(function () {
      var src = surveyUrl + "?contact_id=" + contactId;
      var html = '<iframe src="' + src + '" style="width:100%;height:100%;border:0;"></iframe>';
      window.jsPanel.create({
        theme: "#0b1e3d filled",
        headerTitle: "Appointment Outcome",
        panelSize: "650 700",
        position: "center-top 0 80",
        content: html,
        contentSize: "100% 100%",
        headerControls: { minimize: "remove", smallify: "enable", maximize: "enable", close: "enable" },
        dragit: {},
        resizeit: { minWidth: 400, minHeight: 400 }
      });
    });
  }

  function buildBar(contactId, surveyUrl) {
    if (document.getElementById("lfi-button-bar")) return;

    var bar = document.createElement("div");
    bar.id = "lfi-button-bar";
    bar.style.cssText = "position:fixed;top:70px;left:16px;right:16px;z-index:999999;display:flex;flex-wrap:nowrap;gap:6px;justify-content:flex-end;overflow-x:auto;";

    BUTTONS.forEach(function (btnDef) {
      var el = document.createElement("button");
      el.textContent = btnDef.label;
      el.title = btnDef.tooltip;
      el.style.cssText = "background:#0b1e3d;color:#c9a227;border:2px solid #c9a227;padding:6px 10px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;";
      el.addEventListener("click", function () {
        if (btnDef.isForm) {
          openForm(contactId, surveyUrl);
        } else {
          addTag(contactId, btnDef.tag);
        }
      });
      bar.appendChild(el);
    });

    document.body.appendChild(bar);
  }

  function init() {
    var existing = document.getElementById("lfi-button-bar");
    var contactId = getContactIdFromUrl();
    var locationId = getLocationIdFromUrl();
    var config = locationId ? LOCATION_CONFIG[locationId] : null;

    if (!contactId || !config) {
      if (existing) existing.remove();
      return;
    }
    if (existing) existing.remove();
    buildBar(contactId, config.surveyUrl);
  }

  var obs = new MutationObserver(function () {
    clearTimeout(window.__lfiDebounce);
    window.__lfiDebounce = setTimeout(init, 500);
  });
  obs.observe(document.body, { childList: true, subtree: true });
  init();
})();
