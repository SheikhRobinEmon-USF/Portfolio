/*
 * Visit analytics: a small, cookie-free tracker that writes to your own Firebase project.
 *
 * What it records, per page view: the page, the referring site, campaign tags (utm_*),
 * device type, browser, operating system, screen width, language, time zone, engaged time,
 * scroll depth, the home page sections reached, and interactions (lens and theme switches,
 * case studies opened, gallery filters, outbound links, email copies, assistant questions).
 * It never records IP addresses, names, or anything typed except assistant questions.
 *
 * Anonymous IDs: a random visitor ID in localStorage, and a session ID that resets after
 * 30 idle minutes. Opt out on any device by opening the site with ?notrack (undo: ?track).
 * Browsers that send Do Not Track or Global Privacy Control are not recorded.
 *
 * Each page view writes one document when it opens and one more each time the tab is
 * hidden or closed, carrying what happened since. Documents are create-only; the Firestore
 * rules let anyone create a well-formed one and only the site owner read them.
 */
(function () {
  "use strict";

  var C = window.ANALYTICS_CONFIG || {};
  var App = window.App || {};
  var queue = [];
  App.track = function (name, detail) { queue.push([name, detail]); };

  function storeGet(area, k) { try { return window[area].getItem(k); } catch (e) { return null; } }
  function storeSet(area, k, v) { try { window[area].setItem(k, v); } catch (e) {} }
  function storeDel(area, k) { try { window[area].removeItem(k); } catch (e) {} }

  // Opt-out switch, settable from any device by URL.
  var params = new URLSearchParams(location.search);
  if (params.has("notrack")) storeSet("localStorage", "pa-optout", "1");
  if (params.has("track")) storeDel("localStorage", "pa-optout");

  var local = location.protocol === "file:" || /^(localhost|127\.|\[::1\])/.test(location.hostname);
  var ua = navigator.userAgent || "";
  var off =
    !C.projectId || !C.apiKey ||
    (local && !C.trackLocal) ||
    storeGet("localStorage", "pa-optout") === "1" ||
    navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true ||
    navigator.webdriver ||
    /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|whatsapp/i.test(ua);
  if (off) { App.track = function () {}; return; }

  /* ---------------- IDs ---------------- */

  function rid(n) {
    var a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(36)).slice(-2); }).join("").slice(0, n * 2);
  }

  var visitor = storeGet("localStorage", "pa-vid");
  var isNew = !visitor;
  if (!visitor) { visitor = rid(8); storeSet("localStorage", "pa-vid", visitor); }

  var IDLE = 30 * 60 * 1000;
  function sessionId() {
    var raw = storeGet("localStorage", "pa-sid");
    var now = Date.now();
    var s = null;
    try { s = raw && JSON.parse(raw); } catch (e) {}
    if (!s || now - s.last > IDLE) s = { id: rid(8), last: now };
    s.last = now;
    storeSet("localStorage", "pa-sid", JSON.stringify(s));
    return s.id;
  }
  var session = sessionId();
  var view = rid(8);

  /* ---------------- What the visit looks like ---------------- */

  function cut(s, n) { s = String(s == null ? "" : s); return s.length > n ? s.slice(0, n) : s; }

  function pagePath() {
    var p = location.pathname.replace(/^\/Portfolio(?=\/|$)/, "").replace(/index\.html$/, "");
    return cut(p || "/", 200);
  }

  function browser() {
    if (/Edg\//.test(ua)) return "Edge";
    if (/OPR\/|Opera/.test(ua)) return "Opera";
    if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
    if (/Firefox\/|FxiOS/.test(ua)) return "Firefox";
    if (/Chrome\/|CriOS/.test(ua)) return "Chrome";
    if (/Safari\//.test(ua)) return "Safari";
    return "Other";
  }
  function os() {
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "iOS";
    if (/Android/.test(ua)) return "Android";
    if (/Windows/.test(ua)) return "Windows";
    if (/Mac OS X|Macintosh/.test(ua)) return "macOS";
    if (/CrOS/.test(ua)) return "ChromeOS";
    if (/Linux/.test(ua)) return "Linux";
    return "Other";
  }
  function device() {
    var w = Math.min(screen.width || innerWidth, screen.height || innerHeight);
    if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "Tablet";
    if (/Mobi|iPhone|Android/.test(ua) || w < 500) return "Mobile";
    return "Desktop";
  }
  function referrer() {
    if (!document.referrer) return "";
    try {
      var r = new URL(document.referrer);
      if (r.host === location.host) return "";
      return cut(r.host + r.pathname.replace(/\/$/, ""), 300);
    } catch (e) { return ""; }
  }
  function utm() {
    var o = {};
    ["source", "medium", "campaign"].forEach(function (k) {
      var v = params.get("utm_" + k);
      if (v) o[k] = cut(v, 100);
    });
    if (!o.source && params.get("ref")) o.source = cut(params.get("ref"), 100);
    return o;
  }
  var tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}

  /* ---------------- Firestore REST ---------------- */

  var base = (C.firestoreUrl || "https://firestore.googleapis.com") + "/v1/";
  var dbPath = "projects/" + C.projectId + "/databases/(default)/documents";

  function enc(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === "boolean") return { booleanValue: v };
    if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
    if (typeof v === "object") return { mapValue: { fields: fields(v) } };
    return { stringValue: String(v) };
  }
  function fields(o) {
    var f = {};
    Object.keys(o).forEach(function (k) { if (o[k] !== undefined) f[k] = enc(o[k]); });
    return f;
  }

  function write(data) {
    var body = JSON.stringify({
      writes: [{
        update: { name: dbPath + "/hits/" + rid(10), fields: fields(data) },
        updateTransforms: [{ fieldPath: "at", setToServerValue: "REQUEST_TIME" }],
        currentDocument: { exists: false }
      }]
    });
    try {
      fetch(base + dbPath + ":commit?key=" + encodeURIComponent(C.apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: body.length < 60000,
        credentials: "omit"
      }).catch(function () {});
    } catch (e) {}
  }

  /* ---------------- The page view ---------------- */

  var start = Date.now();
  var events = [];
  var sections = {};
  var sent = {};
  var depth = 0;
  var engaged = 0;
  var flushedEvents = 0;
  var flushedDepth = 0;
  var visibleSince = document.visibilityState === "visible" ? performance.now() : null;

  function common(kind) {
    return { k: kind, v: visitor, s: session, p: view, path: pagePath() };
  }

  write(Object.assign(common("view"), {
    title: cut(document.title, 150),
    ref: referrer(),
    utm: utm(),
    dev: device(),
    br: browser(),
    os: os(),
    sw: Math.round(innerWidth),
    lang: cut(navigator.language || "", 20),
    tz: cut(tz, 60),
    nv: isNew
  }));

  App.track = function (name, detail) {
    if (events.length >= 200) return;
    events.push({ n: cut(name, 40), d: cut(detail == null ? "" : detail, 200), t: Date.now() - start });
    if (events.length - flushedEvents >= 40) flush();
  };
  queue.forEach(function (q) { App.track(q[0], q[1]); });

  function flush() {
    if (visibleSince !== null) { engaged += performance.now() - visibleSince; visibleSince = performance.now(); }
    var newEvents = events.slice(flushedEvents, flushedEvents + 60);
    var newSecs = Object.keys(sections).filter(function (k) { return !sent[k]; }).slice(0, 20);
    var ms = Math.round(Math.min(engaged, 6 * 3600 * 1000));
    if (!newEvents.length && !newSecs.length && ms < 1000 && depth <= flushedDepth) return;
    flushedEvents += newEvents.length;
    flushedDepth = depth;
    newSecs.forEach(function (k) { sent[k] = 1; });
    engaged = 0;
    write(Object.assign(common("more"), { ev: newEvents, secs: newSecs, dur: ms, depth: depth }));
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
    else { visibleSince = performance.now(); sessionId(); }
  });
  addEventListener("pagehide", flush);
  // Keep the visit fresh for "active now" and avoid losing long visits if the tab crashes.
  setInterval(function () { if (document.visibilityState === "visible") { sessionId(); flush(); } }, 120000);

  /* ---------------- Scroll depth and sections ---------------- */

  function measure() {
    var h = document.documentElement.scrollHeight - innerHeight;
    var d = h <= 0 ? 100 : Math.round(Math.min(1, scrollY / h) * 100);
    if (d > depth) depth = d;
  }
  addEventListener("scroll", measure, { passive: true });
  measure();

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting && en.target.id) sections[en.target.id] = 1; });
    }, { rootMargin: "-45% 0px -45% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { io.observe(s); });
  }

  /* ---------------- Interactions ---------------- */

  function wrap(name, after) {
    var fn = App[name];
    if (typeof fn !== "function") return;
    App[name] = function () {
      var out = fn.apply(this, arguments);
      try { after.apply(null, arguments); } catch (e) {}
      return out;
    };
  }
  var lastLens = App.lens;
  wrap("setLens", function (l) { if (l !== lastLens) { lastLens = l; App.track("lens", l); } });
  wrap("toggleTheme", function () { App.track("theme", App.theme === "dark" ? "light" : "dark"); });
  wrap("openCase", function (id) { App.track("case", id); });
  wrap("openPalette", function () { App.track("palette", ""); });
  wrap("copyEmail", function () { App.track("email", "copy"); });

  function label(el) {
    return cut((el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim(), 80);
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var a = t.closest("a[href]");
    if (a) {
      var href = a.getAttribute("href");
      if (/^mailto:/i.test(href)) return App.track("email", "mailto");
      if (/^tel:/i.test(href)) return App.track("phone", href.slice(4));
      var url;
      try { url = new URL(a.href); } catch (err) { return; }
      if (/\.pdf$/i.test(url.pathname)) return App.track("download", url.pathname.split("/").pop());
      if (url.host !== location.host) return App.track("out", url.host + url.pathname.replace(/\/$/, ""));
      if (url.pathname !== location.pathname) return App.track("nav", url.pathname.replace(/^\/Portfolio/, "") + url.hash);
      if (url.hash) return App.track("jump", url.hash);
      return;
    }
    var f = t.closest("[data-filter]");
    if (f) return App.track("filter", f.getAttribute("data-filter"));
    var tab = t.closest('[role="tab"]');
    if (tab) return App.track("tab", label(tab));
    if (t.closest(".fab, .ask-toggle")) return App.track("assistant", "open");
    var b = t.closest("[data-track]");
    if (b) return App.track(b.getAttribute("data-track") || "click", label(b));
  }, true);

  window.App = App;
})();
