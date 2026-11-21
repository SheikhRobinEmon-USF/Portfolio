/*
 * Private analytics dashboard.
 *
 * Signs in to Firebase Authentication over its REST API, reads the visit records from
 * Firestore over its REST API, and draws everything here with plain SVG and HTML.
 * No SDKs, no chart libraries. Reads are allowed only for the owner's account by the
 * Firestore security rules (firebase/firestore.rules).
 */
(function () {
  "use strict";

  var C = window.ANALYTICS_CONFIG || {};
  var D = window.PORTFOLIO || {};
  var configured = !!(C.projectId && C.apiKey);
  var doc = document.documentElement;

  var AUTH = (C.authUrl || "https://identitytoolkit.googleapis.com") + "/v1/";
  var TOKEN = (C.tokenUrl || "https://securetoken.googleapis.com") + "/v1/token";
  var FS = (C.firestoreUrl || "https://firestore.googleapis.com") + "/v1/";
  var DB = "projects/" + C.projectId + "/databases/(default)/documents";

  var DAY = 86400000;
  var HOUR = 3600000;

  /* ================================================================== */
  /* Small helpers                                                        */
  /* ================================================================== */

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var nf = new Intl.NumberFormat();
  function num(n) { return nf.format(Math.round(n)); }
  function pct(n) { return (n * 100).toFixed(n > 0 && n < 0.1 ? 1 : 0) + "%"; }
  function dur(ms) {
    var s = Math.round(ms / 1000);
    if (s < 60) return s + "s";
    var m = Math.floor(s / 60);
    if (m < 60) return m + "m " + String(s % 60).padStart(2, "0") + "s";
    return Math.floor(m / 60) + "h " + String(m % 60).padStart(2, "0") + "m";
  }
  function ago(t) {
    var s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 45) return "just now";
    if (s < 3600) return Math.round(s / 60) + " min ago";
    if (s < 86400) return Math.round(s / 3600) + " h ago";
    if (s < 86400 * 30) return Math.round(s / 86400) + " d ago";
    return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  function stamp(t) {
    return new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }
  function toast(text) {
    var t = $("#toast");
    t.textContent = text;
    t.classList.add("is-on");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.classList.remove("is-on"); }, 2200);
  }
  function download(name, text, type) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ================================================================== */
  /* Names for things                                                     */
  /* ================================================================== */

  var caseNames = {};
  (D.shipped || []).forEach(function (s) { caseNames[s.id] = s.name; });
  var studyNames = {};
  (D.caseStudies || []).forEach(function (c) { studyNames[c.slug] = c.name || c.title || c.slug; });
  var lensNames = {};
  (D.lenses || []).forEach(function (l) { lensNames[l.id] = l.label; });

  var SECTIONS = [
    ["top", "Hero"], ["impact", "Impact"], ["work", "Selected work"], ["shipped", "Case gallery"],
    ["experience", "Experience"], ["skills", "Toolkit"], ["about", "About"], ["contact", "Contact"]
  ];

  function pageName(path) {
    if (path === "/" || path === "") return "Home";
    var m = path.match(/^\/work\/([\w-]+?)(?:\.html)?$/);
    if (m) return studyNames[m[1]] || m[1];
    return path;
  }

  function sourceOf(meta) {
    if (!meta) return "Unknown";
    var u = meta.utm || {};
    if (u.source) return titleCase(u.source);
    var r = (meta.ref || "").toLowerCase();
    if (!r) return "Direct";
    var host = r.split("/")[0].replace(/^www\./, "").replace(/^m\./, "");
    var known = [
      [/(^|\.)linkedin\.com$|^lnkd\.in$/, "LinkedIn"],
      [/(^|\.)google\.[a-z.]+$/, "Google"],
      [/(^|\.)github\.com$|\.github\.io$/, "GitHub"],
      [/(^|\.)bing\.com$/, "Bing"],
      [/duckduckgo\.com$/, "DuckDuckGo"],
      [/(^|\.)yahoo\.com$/, "Yahoo"],
      [/^t\.co$|(^|\.)x\.com$|twitter\.com$/, "X"],
      [/facebook\.com$|^fb\.me$/, "Facebook"],
      [/instagram\.com$/, "Instagram"],
      [/joinhandshake\.com$/, "Handshake"],
      [/(^|\.)usf\.edu$/, "USF"],
      [/notion\.(so|site)$/, "Notion"],
      [/mail\.google\.com$|outlook\.|mail\./, "Email"],
      [/chatgpt\.com$|openai\.com$|perplexity\.ai$|claude\.ai$/, "AI assistants"],
      [/slack\.com$/, "Slack"],
      [/reddit\.com$/, "Reddit"]
    ];
    for (var i = 0; i < known.length; i++) if (known[i][0].test(host)) return known[i][1];
    return host;
  }
  function titleCase(s) {
    s = String(s).replace(/[_-]+/g, " ").trim();
    var map = { linkedin: "LinkedIn", github: "GitHub", google: "Google", email: "Email", handshake: "Handshake" };
    return map[s.toLowerCase()] || s.charAt(0).toUpperCase() + s.slice(1);
  }
  function regionOf(meta) {
    var tz = meta && meta.tz;
    if (!tz) return "Unknown";
    var parts = tz.split("/");
    var city = parts[parts.length - 1].replace(/_/g, " ");
    if (tz === "Asia/Calcutta") city = "Kolkata";
    if (tz === "Asia/Dacca") city = "Dhaka";
    return city;
  }
  function outName(d) {
    var host = d.split("/")[0].replace(/^www\./, "");
    if (/linkedin\.com/.test(host)) return "LinkedIn profile";
    if (/^github\.com$/.test(host)) {
      var repo = d.split("/").slice(1, 3).join("/");
      return repo && repo.indexOf("/") > 0 ? "GitHub: " + repo.split("/")[1] : "GitHub profile";
    }
    if (/\.github\.io$/.test(host)) return "Live demo: " + (d.split("/")[1] || host);
    return d;
  }

  /* ================================================================== */
  /* Firebase over REST                                                   */
  /* ================================================================== */

  function api(url, body, token, form) {
    var headers = { "Content-Type": form ? "application/x-www-form-urlencoded" : "application/json" };
    if (token) headers.Authorization = "Bearer " + token;
    return fetch(url, { method: "POST", headers: headers, body: form ? body : JSON.stringify(body) })
      .then(function (r) {
        return r.text().then(function (t) {
          var j = null;
          try { j = t ? JSON.parse(t) : null; } catch (e) {}
          if (!r.ok) {
            var err = (Array.isArray(j) ? j[0] : j) || {};
            err = err.error || err;
            var e2 = new Error(err.message || "Request failed (" + r.status + ")");
            e2.status = err.status || r.status;
            throw e2;
          }
          return j;
        });
      });
  }

  var session = null; // { email, uid, refresh }
  try { session = JSON.parse(store.get("pa-auth") || "null"); } catch (e) {}
  var idToken = null;
  var idExpires = 0;

  function signIn(email, password) {
    return api(AUTH + "accounts:signInWithPassword?key=" + encodeURIComponent(C.apiKey),
      { email: email, password: password, returnSecureToken: true })
      .then(function (r) {
        session = { email: r.email, uid: r.localId, refresh: r.refreshToken };
        store.set("pa-auth", JSON.stringify(session));
        idToken = r.idToken;
        idExpires = Date.now() + (+r.expiresIn || 3600) * 1000;
      });
  }
  function token() {
    if (idToken && Date.now() < idExpires - 60000) return Promise.resolve(idToken);
    if (!session) return Promise.reject(new Error("Signed out"));
    return api(TOKEN + "?key=" + encodeURIComponent(C.apiKey),
      "grant_type=refresh_token&refresh_token=" + encodeURIComponent(session.refresh), null, true)
      .then(function (r) {
        idToken = r.id_token;
        idExpires = Date.now() + (+r.expires_in || 3600) * 1000;
        session.refresh = r.refresh_token || session.refresh;
        store.set("pa-auth", JSON.stringify(session));
        return idToken;
      });
  }
  function signOut() {
    session = null;
    idToken = null;
    store.del("pa-auth");
    location.reload();
  }

  function decode(v) {
    if ("stringValue" in v) return v.stringValue;
    if ("integerValue" in v) return +v.integerValue;
    if ("doubleValue" in v) return +v.doubleValue;
    if ("booleanValue" in v) return v.booleanValue;
    if ("timestampValue" in v) return Date.parse(v.timestampValue);
    if ("nullValue" in v) return null;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(decode);
    if ("mapValue" in v) return decodeFields(v.mapValue.fields || {});
    return null;
  }
  function decodeFields(f) {
    var o = {};
    Object.keys(f).forEach(function (k) { o[k] = decode(f[k]); });
    return o;
  }

  var PAGE = 1000;
  // Records with from <= at < to, oldest first, following the cursor until done.
  function fetchHits(from, to) {
    var out = [];
    function page(after) {
      var q = {
        from: [{ collectionId: "hits" }],
        where: { compositeFilter: { op: "AND", filters: [
          { fieldFilter: { field: { fieldPath: "at" }, op: "GREATER_THAN_OR_EQUAL", value: { timestampValue: new Date(from).toISOString() } } },
          { fieldFilter: { field: { fieldPath: "at" }, op: "LESS_THAN", value: { timestampValue: new Date(to).toISOString() } } }
        ] } },
        orderBy: [{ field: { fieldPath: "at" }, direction: "ASCENDING" }, { field: { fieldPath: "__name__" }, direction: "ASCENDING" }],
        limit: PAGE
      };
      if (after) q.startAt = { values: [{ timestampValue: after.ts }, { referenceValue: after.name }], before: false };
      return token().then(function (t) {
        return api(FS + DB + ":runQuery", { structuredQuery: q }, t);
      }).then(function (rows) {
        var docs = (rows || []).filter(function (r) { return r.document; }).map(function (r) { return r.document; });
        docs.forEach(function (d) {
          var h = decodeFields(d.fields || {});
          h.id = d.name.split("/").pop();
          out.push(h);
        });
        if (docs.length === PAGE && out.length < 200000) {
          var last = docs[docs.length - 1];
          return page({ ts: last.fields.at.timestampValue, name: last.name });
        }
        return out;
      });
    }
    return page(null);
  }

  /* ================================================================== */
  /* Data: cache of raw records, then page views and sessions             */
  /* ================================================================== */

  var demo = false;
  var cache = { from: null, hits: [], ids: {}, fetchedAt: 0 };

  function addHits(list) {
    list.forEach(function (h) {
      if (cache.ids[h.id]) return;
      cache.ids[h.id] = 1;
      cache.hits.push(h);
    });
    cache.hits.sort(function (a, b) { return a.at - b.at; });
  }

  // Make sure everything from `from` until now is loaded; only missing spans are fetched.
  function ensure(from) {
    if (demo) return Promise.resolve();
    var now = Date.now() + 60000;
    var jobs = [];
    if (cache.from === null) {
      jobs.push(fetchHits(from, now));
    } else {
      if (from < cache.from) jobs.push(fetchHits(from, cache.from));
      var last = cache.hits.length ? cache.hits[cache.hits.length - 1].at : cache.from;
      jobs.push(fetchHits(Math.max(last - 1000, cache.from), now));
    }
    return Promise.all(jobs).then(function (parts) {
      parts.forEach(addHits);
      cache.from = cache.from === null ? from : Math.min(cache.from, from);
      cache.fetchedAt = Date.now();
    });
  }

  function views(hits) {
    var by = {};
    var list = [];
    hits.forEach(function (h) {
      var v = by[h.p];
      if (!v) {
        v = by[h.p] = { p: h.p, v: h.v, s: h.s, path: h.path || "/", at: h.at, end: h.at, dur: 0, depth: 0, secs: {}, ev: [], meta: null };
        list.push(v);
      }
      if (h.at < v.at) v.at = h.at;
      if (h.at > v.end) v.end = h.at;
      if (h.k === "view") v.meta = h;
      else {
        v.dur += h.dur || 0;
        if ((h.depth || 0) > v.depth) v.depth = h.depth;
        (h.secs || []).forEach(function (k) { v.secs[k] = 1; });
        (h.ev || []).forEach(function (e) { v.ev.push(e); });
      }
    });
    list.forEach(function (v) { v.ev.sort(function (a, b) { return a.t - b.t; }); });
    return list;
  }

  function sessions(pvs) {
    var by = {};
    var list = [];
    pvs.forEach(function (pv) {
      var s = by[pv.s];
      if (!s) { s = by[pv.s] = { id: pv.s, v: pv.v, at: pv.at, end: pv.end, pvs: [], dur: 0, events: 0 }; list.push(s); }
      s.pvs.push(pv);
      if (pv.at < s.at) s.at = pv.at;
      if (pv.end > s.end) s.end = pv.end;
      s.dur += pv.dur;
      s.events += pv.ev.length;
    });
    list.forEach(function (s) {
      s.pvs.sort(function (a, b) { return a.at - b.at; });
      var first = null;
      for (var i = 0; i < s.pvs.length; i++) if (s.pvs[i].meta) { first = s.pvs[i].meta; break; }
      s.meta = first;
      s.isNew = s.pvs.some(function (p) { return p.meta && p.meta.nv; });
      s.source = sourceOf(first);
      s.region = regionOf(first);
      s.device = (first && first.dev) || "Unknown";
      s.engaged = s.pvs.length > 1 || s.dur >= 10000 || s.events > 0;
      // Page views inherit how the visit started, so filters work at either level.
      s.pvs.forEach(function (p) {
        p.source = s.source; p.region = s.region; p.device = s.device;
        p.browser = (first && first.br) || "Unknown";
        p.os = (first && first.os) || "Unknown";
        p.lang = (first && first.lang) || "Unknown";
      });
    });
    return list.sort(function (a, b) { return b.at - a.at; });
  }

  var CONTACT = { email: 1, download: 1, phone: 1 };
  function isContact(e) {
    return CONTACT[e.n] || (e.n === "out" && /linkedin\.com/.test(e.d));
  }

  function summarize(pvs) {
    var ss = sessions(pvs);
    var visitors = {};
    var newV = {};
    var contacts = 0;
    var engaged = 0;
    var time = 0;
    pvs.forEach(function (p) {
      visitors[p.v] = 1;
      if (p.meta && p.meta.nv) newV[p.v] = 1;
      p.ev.forEach(function (e) { if (isContact(e)) contacts++; });
    });
    ss.forEach(function (s) { if (s.engaged) engaged++; time += s.dur; });
    return {
      sessions: ss,
      visitors: Object.keys(visitors).length,
      newVisitors: Object.keys(newV).length,
      views: pvs.length,
      sessionsCount: ss.length,
      engagement: ss.length ? engaged / ss.length : 0,
      time: ss.length ? time / ss.length : 0,
      contacts: contacts
    };
  }

  /* ================================================================== */
  /* State                                                                */
  /* ================================================================== */

  var state = {
    range: +(store.get("pa-range") || 7),
    filters: [] // { key, value, label }
  };
  var FILTER_LABELS = { path: "Page", source: "Source", region: "Location", device: "Device", browser: "Browser", os: "OS", lang: "Language" };

  function bounds() {
    var now = Date.now();
    var from;
    if (state.range === 1) from = now - DAY;
    else {
      var d = new Date(); d.setHours(0, 0, 0, 0);
      from = d.getTime() - (state.range - 1) * DAY;
    }
    var span = now - from;
    return { from: from, to: now, prevFrom: from - span, prevTo: from };
  }

  function applyFilters(pvs) {
    if (!state.filters.length) return pvs;
    return pvs.filter(function (p) {
      return state.filters.every(function (f) { return String(p[f.key]) === f.value; });
    });
  }

  /* ================================================================== */
  /* Charts                                                               */
  /* ================================================================== */

  var tip = $("#tip");
  function showTip(html, x, y) {
    tip.innerHTML = html;
    tip.hidden = false;
    var r = tip.getBoundingClientRect();
    var left = Math.min(window.innerWidth - r.width - 8, Math.max(8, x + 14));
    var top = y - r.height - 12;
    if (top < 8) top = y + 16;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  function hideTip() { tip.hidden = true; }

  function niceMax(v) {
    if (v <= 4) return 4;
    var p = Math.pow(10, Math.floor(Math.log10(v)));
    var steps = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < steps.length; i++) if (steps[i] * p >= v) return steps[i] * p;
    return 10 * p;
  }

  function buckets(from, to) {
    var out = [];
    var t;
    if (state.range === 1) {
      t = new Date(from); t.setMinutes(0, 0, 0);
      for (var h = t.getTime(); h < to; h += HOUR) out.push({ from: h, to: h + HOUR, label: new Date(h).toLocaleTimeString(undefined, { hour: "numeric" }) });
    } else if (state.range === 365) {
      t = new Date(from); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
      for (var w = t.getTime(); w < to; w += 7 * DAY) out.push({ from: w, to: w + 7 * DAY, label: new Date(w).toLocaleDateString(undefined, { month: "short", day: "numeric" }), week: true });
    } else {
      t = new Date(from); t.setHours(0, 0, 0, 0);
      while (t.getTime() < to) {
        var next = new Date(t); next.setDate(next.getDate() + 1);
        out.push({ from: t.getTime(), to: next.getTime(), label: t.toLocaleDateString(undefined, { month: "short", day: "numeric" }) });
        t = next;
      }
    }
    return out;
  }

  function series(pvs, bs) {
    var i = 0;
    var sorted = pvs.slice().sort(function (a, b) { return a.at - b.at; });
    return bs.map(function (b) {
      var vis = {}; var views = 0;
      while (i < sorted.length && sorted[i].at < b.to) {
        if (sorted[i].at >= b.from) { views++; vis[sorted[i].v] = 1; }
        i++;
      }
      return { b: b, visitors: Object.keys(vis).length, views: views };
    });
  }

  var LINES = [
    { key: "views", label: "Page views", cls: "s2" },
    { key: "visitors", label: "Visitors", cls: "s1" }
  ];

  function lineChart(el, rows) {
    var W = Math.max(220, el.clientWidth);
    var H = W < 560 ? 200 : 290;
    var L = 34, R = 10, T = 12, B = 26;
    var iw = W - L - R, ih = H - T - B;
    var max = niceMax(Math.max.apply(null, rows.map(function (r) { return r.views; }).concat([1])));
    var n = rows.length;
    function x(i) { return L + (n === 1 ? iw / 2 : (i / (n - 1)) * iw); }
    function y(v) { return T + ih - (v / max) * ih; }

    var g = "";
    for (var k = 0; k <= 4; k++) {
      var gv = (max / 4) * k;
      g += '<line class="gl" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(gv) + '" y2="' + y(gv) + '"/>';
      g += '<text class="axis" x="' + (L - 8) + '" y="' + (y(gv) + 4) + '" text-anchor="end">' + num(gv) + "</text>";
    }
    var every = Math.max(1, Math.ceil(n / Math.floor(iw / 70)));
    rows.forEach(function (r, i) {
      if (i % every === 0) g += '<text class="axis" x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(r.b.label) + "</text>";
    });

    var paths = LINES.map(function (s) {
      var d = rows.map(function (r, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(r[s.key]).toFixed(1); }).join(" ");
      var area = d + " L" + x(n - 1).toFixed(1) + " " + y(0) + " L" + x(0).toFixed(1) + " " + y(0) + " Z";
      return '<path class="area ' + s.cls + '" d="' + area + '"/><path class="line ' + s.cls + '" d="' + d + '"/>';
    }).join("");

    el.innerHTML =
      '<svg width="' + W + '" height="' + H + '" role="img" aria-label="Page views and visitors over time">' + g + paths +
      '<line class="cross" id="cross" y1="' + T + '" y2="' + (T + ih) + '" visibility="hidden"/>' +
      LINES.map(function (s) { return '<circle class="dot ' + s.cls + '" r="4.5" visibility="hidden" data-k="' + s.key + '"/>'; }).join("") +
      '<rect class="hit" x="' + L + '" y="' + T + '" width="' + iw + '" height="' + ih + '"/></svg>';

    var svg = el.firstChild;
    var cross = $("#cross", el);
    var dots = $$(".dot", el);
    function move(e) {
      var box = svg.getBoundingClientRect();
      var px = (e.touches ? e.touches[0].clientX : e.clientX) - box.left;
      var i = n === 1 ? 0 : Math.round(((px - L) / iw) * (n - 1));
      i = Math.max(0, Math.min(n - 1, i));
      var r = rows[i];
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
      dots.forEach(function (d) { d.setAttribute("cx", x(i)); d.setAttribute("cy", y(r[d.getAttribute("data-k")])); d.setAttribute("visibility", "visible"); });
      var label = r.b.week ? "Week of " + r.b.label : r.b.label;
      showTip('<strong>' + esc(label) + "</strong>" + LINES.map(function (s) {
        return '<span class="tip__row"><i class="key ' + s.cls + '"></i>' + s.label + "<b>" + num(r[s.key]) + "</b></span>";
      }).join(""), box.left + x(i), box.top + y(r.views));
    }
    function leave() { cross.setAttribute("visibility", "hidden"); dots.forEach(function (d) { d.setAttribute("visibility", "hidden"); }); hideTip(); }
    var hit = $(".hit", el);
    hit.addEventListener("mousemove", move);
    hit.addEventListener("touchstart", move, { passive: true });
    hit.addEventListener("touchmove", move, { passive: true });
    hit.addEventListener("mouseleave", leave);
    hit.addEventListener("touchend", leave);
  }

  function spark(values, cls) {
    var W = 120, H = 32;
    var max = Math.max.apply(null, values.concat([1]));
    var n = values.length;
    if (n < 2) return "";
    var d = values.map(function (v, i) { return (i ? "L" : "M") + ((i / (n - 1)) * W).toFixed(1) + " " + (H - 2 - (v / max) * (H - 4)).toFixed(1); }).join(" ");
    return '<svg class="spark" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" aria-hidden="true"><path class="line ' + cls + '" d="' + d + '"/></svg>';
  }

  // Ranked horizontal bars. rows: { label, value, sub?, filter?: [key, value] }
  function bars(rows, opts) {
    opts = opts || {};
    var limit = opts.limit || 8;
    if (!rows.length) return empty(opts.empty);
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; }));
    var total = opts.total || rows.reduce(function (a, r) { return a + r.value; }, 0);
    var shown = rows.slice(0, limit);
    var html = shown.map(function (r) {
      var w = max ? Math.max(2, (r.value / max) * 100) : 0;
      var share = opts.percent ? pct(r.value) : num(r.value);
      var tag = r.filter ? "button" : "div";
      var attrs = r.filter ? ' type="button" data-fk="' + esc(r.filter[0]) + '" data-fv="' + esc(r.filter[1]) + '" data-fl="' + esc(r.label) + '" title="Filter by ' + esc(r.label) + '"' : "";
      var tipText = opts.percent ? pct(r.value) + " reached" : num(r.value) + (opts.unit ? " " + opts.unit : "") + (total ? " · " + pct(r.value / total) + " of total" : "");
      return "<" + tag + ' class="bar"' + attrs + ' data-tip="' + esc(tipText) + '">' +
        '<span class="bar__fill" style="width:' + w.toFixed(1) + '%"></span>' +
        '<span class="bar__label">' + esc(r.label) + (r.sub ? ' <small>' + esc(r.sub) + "</small>" : "") + "</span>" +
        '<span class="bar__value">' + share + "</span></" + tag + ">";
    }).join("");
    if (rows.length > limit) html += '<p class="more-note">+ ' + (rows.length - limit) + " more</p>";
    return '<div class="bars">' + html + "</div>";
  }

  // A 100% stacked bar with a legend. parts: { label, value }
  var STACK = ["c1", "c2", "c3", "c4"];
  function stack(title, parts) {
    var total = parts.reduce(function (a, p) { return a + p.value; }, 0);
    if (!total) return "";
    parts = parts.slice().sort(function (a, b) { return b.value - a.value; });
    if (parts.length > 4) {
      var rest = parts.slice(3).reduce(function (a, p) { return a + p.value; }, 0);
      parts = parts.slice(0, 3).concat([{ label: "Other", value: rest }]);
    }
    return '<div class="stack"><p class="stack__title">' + esc(title) + '</p><div class="stack__bar">' +
      parts.map(function (p, i) {
        return '<span class="' + STACK[i] + '" style="flex:' + p.value + '" data-tip="' + esc(p.label + ": " + num(p.value) + " (" + pct(p.value / total) + ")") + '"></span>';
      }).join("") + '</div><ul class="stack__legend">' +
      parts.map(function (p, i) {
        return '<li><i class="key ' + STACK[i] + '"></i>' + esc(p.label) + " <b>" + pct(p.value / total) + "</b></li>";
      }).join("") + "</ul></div>";
  }

  function empty(text) { return '<p class="empty">' + esc(text || "Nothing recorded in this period yet.") + "</p>"; }

  function count(list, keyFn) {
    var m = {};
    list.forEach(function (x) {
      var k = keyFn(x);
      if (k === null || k === undefined || k === "") return;
      m[k] = (m[k] || 0) + 1;
    });
    return Object.keys(m).map(function (k) { return { label: k, value: m[k] }; }).sort(function (a, b) { return b.value - a.value; });
  }
  function eventsOf(pvs, name) {
    var out = [];
    pvs.forEach(function (p) { p.ev.forEach(function (e) { if (!name || e.n === name || (Array.isArray(name) && name.indexOf(e.n) !== -1)) out.push({ e: e, pv: p }); }); });
    return out;
  }

  /* ================================================================== */
  /* Render                                                               */
  /* ================================================================== */

  function render() {
    var b = bounds();
    var all = views(cache.hits);
    var cur = applyFilters(all.filter(function (p) { return p.at >= b.from && p.at < b.to; }));
    var prev = applyFilters(all.filter(function (p) { return p.at >= b.prevFrom && p.at < b.prevTo; }));
    var S = summarize(cur);
    var P = summarize(prev);
    var bs = buckets(b.from, b.to);
    var rows = series(cur, bs);

    $$("#ranges button").forEach(function (x) { x.setAttribute("aria-checked", String(+x.getAttribute("data-range") === state.range)); });
    renderFilters();
    renderKpis(S, P, cur, bs);

    $("#chart-sub").textContent = num(S.views) + " page views from " + num(S.visitors) + " visitors" + (state.range === 365 ? ", by week" : state.range === 1 ? ", by hour" : ", by day");
    $("#chart-legend").innerHTML = LINES.slice().reverse().map(function (s) { return '<span><i class="key ' + s.cls + '"></i>' + s.label + "</span>"; }).join("");
    lineChart($("#chart"), rows);
    $("#chart-table").innerHTML = '<table><thead><tr><th>' + (state.range === 1 ? "Hour" : state.range === 365 ? "Week of" : "Day") + "</th><th>Visitors</th><th>Page views</th></tr></thead><tbody>" +
      rows.slice().reverse().map(function (r) { return "<tr><td>" + esc(r.b.label) + "</td><td>" + r.visitors + "</td><td>" + r.views + "</td></tr>"; }).join("") + "</tbody></table>";

    renderLive(all);

    // Pages
    var byPage = {};
    cur.forEach(function (p) {
      var x = byPage[p.path] || (byPage[p.path] = { views: 0, vis: {}, dur: 0 });
      x.views++; x.vis[p.v] = 1; x.dur += p.dur;
    });
    $("#pages").innerHTML = bars(Object.keys(byPage).map(function (k) {
      var x = byPage[k];
      return { label: pageName(k), value: x.views, sub: Object.keys(x.vis).length + " visitors · " + dur(x.dur / x.views) + " avg", filter: ["path", k] };
    }).sort(function (a, b2) { return b2.value - a.value; }), { unit: "views" });

    // Sources (per session)
    var srcRows = count(S.sessions, function (s) { return s.source; }).map(function (r) { r.filter = ["source", r.label]; return r; });
    var refs = count(S.sessions.filter(function (s) { return s.meta && s.meta.ref; }), function (s) { return s.meta.ref; });
    var camp = count(S.sessions.filter(function (s) { return s.meta && s.meta.utm && s.meta.utm.campaign; }), function (s) { return s.meta.utm.campaign; });
    $("#sources").innerHTML = bars(srcRows, { unit: "visits" }) +
      (refs.length ? '<p class="mini-title">Referring pages</p>' + bars(refs, { limit: 5, unit: "visits" }) : "") +
      (camp.length ? '<p class="mini-title">Campaigns (utm_campaign)</p>' + bars(camp, { limit: 5, unit: "visits" }) : "");

    // Funnel
    var home = cur.filter(function (p) { return p.path === "/"; });
    $("#funnel").innerHTML = home.length ? bars(SECTIONS.map(function (s, i) {
      var reached = home.filter(function (p) { return i === 0 || p.secs[s[0]]; }).length;
      return { label: s[1], value: reached / home.length };
    }), { percent: true, limit: 10 }) + '<p class="foot-note">Average scroll depth ' + pct(home.reduce(function (a, p) { return a + p.depth; }, 0) / home.length / 100) + " across " + num(home.length) + " home page views</p>" : empty("No home page views in this period.");

    // Projects
    var proj = {};
    cur.forEach(function (p) {
      var m = p.path.match(/^\/work\/([\w-]+?)(?:\.html)?$/);
      if (m) { var k = studyNames[m[1]] || m[1]; (proj[k] = proj[k] || { page: 0, card: 0 }).page++; }
    });
    eventsOf(cur, "case").forEach(function (x) {
      var k = caseNames[x.e.d] || x.e.d;
      (proj[k] = proj[k] || { page: 0, card: 0 }).card++;
    });
    $("#cases").innerHTML = bars(Object.keys(proj).map(function (k) {
      var x = proj[k];
      var sub = [x.page ? x.page + " page views" : "", x.card ? x.card + " card opens" : ""].filter(Boolean).join(" · ");
      return { label: k, value: x.page + x.card, sub: sub };
    }).sort(function (a, b2) { return b2.value - a.value; }), { limit: 10, empty: "No case studies opened yet." });

    // Outbound and contact
    var outs = count(eventsOf(cur, ["out", "email", "download", "phone"]), function (x) {
      if (x.e.n === "email") return x.e.d === "copy" ? "Email copied" : "Email link clicked";
      if (x.e.n === "download") return "Downloaded " + x.e.d;
      if (x.e.n === "phone") return "Phone link";
      return outName(x.e.d);
    });
    $("#outbound").innerHTML = bars(outs, { limit: 10, empty: "No contact or outbound clicks yet." });

    // Preferences
    var lens = count(eventsOf(cur, "lens"), function (x) { return lensNames[x.e.d] || x.e.d; });
    var theme = count(eventsOf(cur, "theme"), function (x) { return x.e.d === "light" ? "Switched to light" : "Switched to dark"; });
    var filt = count(eventsOf(cur, "filter"), function (x) { return x.e.d; });
    var misc = [
      { label: "Opened the assistant", value: eventsOf(cur, "assistant").length },
      { label: "Opened the command palette", value: eventsOf(cur, "palette").length },
      { label: "Switched the theme", value: eventsOf(cur, "theme").length },
      { label: "Changed the lens", value: eventsOf(cur, "lens").length }
    ].filter(function (r) { return r.value; }).sort(function (a, b2) { return b2.value - a.value; });
    var prefsHtml = (lens.length ? stack("Lens switched to", lens) : "") + (theme.length ? stack("Theme", theme) : "") +
      (misc.length ? '<p class="mini-title">Interactions</p>' + bars(misc) : "") +
      (filt.length ? '<p class="mini-title">Gallery filters used</p>' + bars(filt, { limit: 5 }) : "");
    $("#prefs").innerHTML = prefsHtml || empty("No interactions recorded yet.");

    renderAsks(cur);

    // Location and tech, per session
    $("#regions").innerHTML = bars(count(S.sessions, function (s) { return s.region; }).map(function (r) { r.filter = ["region", r.label]; return r; }), { unit: "visits", limit: 10 }) +
      '<p class="mini-title">Languages</p>' + bars(count(S.sessions, function (s) { return s.meta && s.meta.lang; }).map(function (r) { r.filter = ["lang", r.label]; return r; }), { limit: 4, unit: "visits" });
    var tech = stack("Device", count(S.sessions, function (s) { return s.device; })) +
      stack("Browser", count(S.sessions, function (s) { return s.meta && s.meta.br; })) +
      stack("Operating system", count(S.sessions, function (s) { return s.meta && s.meta.os; })) +
      stack("Visitors", [{ label: "First visit", value: S.newVisitors }, { label: "Returning", value: Math.max(0, S.visitors - S.newVisitors) }]);
    $("#tech").innerHTML = tech || empty();

    renderHeat(cur);
    renderSessions(S.sessions);
    $("#grid").setAttribute("aria-busy", "false");
    // Entry animations play once; later re-renders (filters, ranges, refresh) update in place.
    if (!doc.classList.contains("is-ready")) setTimeout(function () { doc.classList.add("is-ready"); }, 900);
    updateStamp();
  }

  function delta(cur, prev, invert) {
    if (!prev && !cur) return '<span class="delta">no change</span>';
    if (!prev) return '<span class="delta up">new</span>';
    var d = (cur - prev) / prev;
    if (Math.abs(d) < 0.005) return '<span class="delta">no change</span>';
    var up = d > 0;
    var good = invert ? !up : up;
    return '<span class="delta ' + (good ? "up" : "down") + '"><span aria-hidden="true">' + (up ? "▲" : "▼") + "</span> " + pct(Math.abs(d)) + '<span class="sr-only"> ' + (up ? "up" : "down") + "</span></span>";
  }

  function renderKpis(S, P, cur, bs) {
    var rows = series(cur, bs);
    var sessByB = bs.map(function (b) { return 0; });
    S.sessions.forEach(function (s) {
      for (var i = 0; i < bs.length; i++) if (s.at >= bs[i].from && s.at < bs[i].to) { sessByB[i]++; break; }
    });
    var label = state.range === 1 ? "previous 24 hours" : "previous " + (state.range === 365 ? "12 months" : state.range + " days");
    var tiles = [
      { name: "Visitors", value: num(S.visitors), d: delta(S.visitors, P.visitors), spark: spark(rows.map(function (r) { return r.visitors; }), "s1"), sub: num(S.newVisitors) + " first-time" },
      { name: "Page views", value: num(S.views), d: delta(S.views, P.views), spark: spark(rows.map(function (r) { return r.views; }), "s2"), sub: (S.sessionsCount ? (S.views / S.sessionsCount).toFixed(1) : "0") + " per visit" },
      { name: "Visits", value: num(S.sessionsCount), d: delta(S.sessionsCount, P.sessionsCount), spark: spark(sessByB, "s1"), sub: "30 idle minutes ends a visit" },
      { name: "Engaged visits", value: pct(S.engagement), d: delta(S.engagement, P.engagement), sub: "10s+, 2+ pages, or a click" },
      { name: "Avg. engaged time", value: dur(S.time), d: delta(S.time, P.time), sub: "per visit, tab in view" },
      { name: "Contact actions", value: num(S.contacts), d: delta(S.contacts, P.contacts), sub: "email, LinkedIn, downloads" }
    ];
    $("#kpis").innerHTML = tiles.map(function (t) {
      return '<div class="kpi"><p class="kpi__name">' + t.name + '</p><p class="kpi__value">' + t.value + "</p>" +
        '<p class="kpi__meta">' + t.d + ' <span class="kpi__vs">vs ' + label + "</span></p>" +
        '<p class="kpi__sub">' + esc(t.sub) + "</p>" + (t.spark || "") + "</div>";
    }).join("");
  }

  function renderLive(all) {
    var now = Date.now();
    var recent = all.filter(function (p) { return now - p.end < 30 * 60000; });
    var active = {};
    recent.forEach(function (p) { active[p.v] = 1; });
    var ss = sessions(all.filter(function (p) { return now - p.at < 7 * DAY; })).slice(0, 4);
    var n = Object.keys(active).length;
    $("#live").innerHTML =
      '<p class="live__count"><b>' + n + "</b> " + (n === 1 ? "visitor" : "visitors") + " in the last 30 minutes</p>" +
      (ss.length ? '<ul class="feed">' + ss.map(function (s) {
        return '<li><span class="feed__when">' + ago(s.end) + '</span><span class="feed__what">' + esc(s.pvs.map(function (p) { return pageName(p.path); }).filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 3).join(" → ")) +
          '</span><span class="feed__who">' + esc(s.source) + " · " + esc(s.region) + " · " + esc(s.device) + (s.isNew ? "" : " · returning") + "</span></li>";
      }).join("") + "</ul>" : empty("No visits in the last 7 days."));
  }

  function renderAsks(cur) {
    var asks = eventsOf(cur, "ask").sort(function (a, b) { return (b.pv.at + b.e.t) - (a.pv.at + a.e.t); });
    $("#asks-sub").textContent = asks.length ? num(asks.length) + " questions in this period, newest first" : "Every question typed or picked in the chat";
    if (!asks.length) { $("#asks").innerHTML = empty("No questions asked yet."); return; }
    var top = count(asks, function (x) { return x.e.d.toLowerCase().replace(/[?.!\s]+$/, "").trim(); }).filter(function (r) { return r.value > 1; });
    $("#asks").innerHTML = '<div class="asks">' +
      '<ul class="ask-list" tabindex="0" aria-label="Questions, newest first">' + asks.slice(0, 40).map(function (x) {
        return '<li><q>' + esc(x.e.d) + '</q><span>' + ago(x.pv.at + x.e.t) + " · on " + esc(pageName(x.pv.path)) + " · " + esc(x.pv.source) + "</span></li>";
      }).join("") + "</ul>" +
      (top.length ? '<div><p class="mini-title">Asked more than once</p>' + bars(top, { limit: 8 }) + "</div>" : "") + "</div>";
  }

  function renderHeat(cur) {
    var grid = [];
    for (var d = 0; d < 7; d++) { grid.push([]); for (var h = 0; h < 24; h++) grid[d].push(0); }
    cur.forEach(function (p) { var t = new Date(p.at); grid[(t.getDay() + 6) % 7][t.getHours()]++; });
    var max = 0;
    grid.forEach(function (r) { r.forEach(function (v) { if (v > max) max = v; }); });
    var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    var zone = "";
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " "); } catch (e) {}
    $("#heat-sub").textContent = "Page views by weekday and hour, in your time (" + zone + ")";
    if (!max) { $("#heat").innerHTML = empty(); return; }
    var html = '<div class="heat" role="img" aria-label="Page views by weekday and hour">';
    grid.forEach(function (r, d) {
      html += '<span class="heat__day">' + days[d] + "</span>";
      r.forEach(function (v, h) {
        var lvl = v ? Math.ceil((v / max) * 5) : 0;
        var hour = new Date(2000, 0, 1, h).toLocaleTimeString(undefined, { hour: "numeric" });
        html += '<span class="heat__cell l' + lvl + '" data-tip="' + esc(days[d] + " " + hour + ": " + v + " page views") + '"></span>';
      });
    });
    html += '<span></span>' + [0, 6, 12, 18].map(function (h) {
      return '<span class="heat__hour" style="grid-column:' + (h + 2) + ' / span 6">' + new Date(2000, 0, 1, h).toLocaleTimeString(undefined, { hour: "numeric" }) + "</span>";
    }).join("") + "</div>";
    html += '<div class="heat__scale" aria-hidden="true">Fewer' + [0, 1, 2, 3, 4, 5].map(function (l) { return '<span class="heat__cell l' + l + '"></span>'; }).join("") + "More</div>";
    $("#heat").innerHTML = html;
  }

  var sessionLimit = 25;
  var openSession = null;
  function renderSessions(ss) {
    if (!ss.length) { $("#sessions").innerHTML = empty("No visits in this period."); return; }
    var html = '<div class="table-wrap"><table class="sessions"><thead><tr><th>Started</th><th>Visitor</th><th>Came from</th><th>Location</th><th>Device</th><th class="num">Pages</th><th class="num">Time</th><th class="num">Clicks</th></tr></thead><tbody>';
    ss.slice(0, sessionLimit).forEach(function (s) {
      var open = s.id === openSession;
      html += '<tr class="srow' + (open ? " is-open" : "") + '" data-sid="' + esc(s.id) + '">' +
        '<td><button type="button" class="srow__btn" aria-expanded="' + open + '" aria-label="' + esc(stamp(s.at) + ", show the journey") + '">' + esc(stamp(s.at)) + "</button></td>" +
        '<td><span class="badge' + (s.isNew ? " badge--new" : "") + '">' + (s.isNew ? "New" : "Returning") + '</span> <code>' + esc(s.v.slice(0, 6)) + "</code></td>" +
        "<td>" + esc(s.source) + "</td><td>" + esc(s.region) + "</td><td>" + esc(s.device + (s.meta ? " · " + s.meta.br : "")) + "</td>" +
        '<td class="num">' + s.pvs.length + '</td><td class="num">' + dur(s.dur) + '</td><td class="num">' + s.events + "</td></tr>";
      if (open) html += '<tr class="journey"><td colspan="8">' + journey(s) + "</td></tr>";
    });
    html += "</tbody></table></div>";
    if (ss.length > sessionLimit) html += '<button type="button" class="btn btn--ghost more-btn" id="more-sessions">Show ' + Math.min(25, ss.length - sessionLimit) + " more of " + (ss.length - sessionLimit) + "</button>";
    $("#sessions").innerHTML = html;
  }

  var EVENT_TEXT = {
    lens: function (d) { return "Switched the lens to " + (lensNames[d] || d); },
    theme: function (d) { return "Switched to the " + d + " theme"; },
    case: function (d) { return "Opened the case card " + (caseNames[d] || d); },
    palette: function () { return "Opened the command palette"; },
    email: function (d) { return d === "copy" ? "Copied the email address" : "Clicked the email link"; },
    out: function (d) { return "Left for " + d; },
    nav: function (d) { return "Went to " + pageName(d.split("#")[0].replace(/index\.html$/, "") || "/") + (d.indexOf("#") > -1 ? " " + d.slice(d.indexOf("#")) : ""); },
    jump: function (d) { return "Jumped to " + d; },
    filter: function (d) { return "Filtered the gallery by " + d; },
    tab: function (d) { return "Opened the " + d + " tab"; },
    assistant: function () { return "Opened the assistant"; },
    ask: function (d) { return "Asked: “" + d + "”"; },
    download: function (d) { return "Downloaded " + d; },
    phone: function (d) { return "Tapped the phone number"; }
  };

  function journey(s) {
    var m = s.meta || {};
    var facts = [
      m.ref ? "Referrer " + m.ref : "No referrer",
      m.utm && m.utm.campaign ? "Campaign " + m.utm.campaign : "",
      m.os ? m.os + ", " + m.br : "",
      m.sw ? m.sw + " px wide" : "",
      m.lang || "",
      m.tz || ""
    ].filter(Boolean);
    return '<div class="jr"><p class="jr__facts">' + facts.map(esc).join(" · ") + '</p><ol class="jr__steps">' +
      s.pvs.map(function (p) {
        var secs = SECTIONS.filter(function (x) { return p.secs[x[0]]; }).map(function (x) { return x[1]; });
        return '<li><div class="jr__page"><b>' + esc(pageName(p.path)) + '</b><span>' + esc(new Date(p.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })) + " · " + dur(p.dur) + " · scrolled " + p.depth + "%</span></div>" +
          (secs.length && p.path === "/" ? '<p class="jr__secs">Reached: ' + esc(secs.join(", ")) + "</p>" : "") +
          (p.ev.length ? '<ul class="jr__ev">' + p.ev.map(function (e) {
            var f = EVENT_TEXT[e.n];
            return "<li><span>+" + dur(e.t) + "</span>" + esc(f ? f(e.d) : e.n + (e.d ? ": " + e.d : "")) + "</li>";
          }).join("") + "</ul>" : "") + "</li>";
      }).join("") + "</ol></div>";
  }

  function renderFilters() {
    var box = $("#filters");
    box.hidden = !state.filters.length;
    box.innerHTML = state.filters.length ? '<span class="filters__label">Filtered to</span>' + state.filters.map(function (f, i) {
      return '<button type="button" class="chip" data-rm="' + i + '" aria-label="Remove filter ' + esc(FILTER_LABELS[f.key] + ": " + f.label) + '">' + esc(FILTER_LABELS[f.key]) + ": <b>" + esc(f.label) + '</b> <span aria-hidden="true">×</span></button>';
    }).join("") + '<button type="button" class="chip chip--clear" data-rm="all">Clear all</button>' : "";
  }

  function updateStamp() {
    var el = $("#updated");
    el.textContent = demo ? "Sample data" : cache.fetchedAt ? "Updated " + ago(cache.fetchedAt) : "";
  }

  /* ================================================================== */
  /* Sample data, so the dashboard can be previewed before setup          */
  /* ================================================================== */

  function sampleHits() {
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    function pick(list) {
      var total = list.reduce(function (a, x) { return a + x[1]; }, 0);
      var r = rnd() * total;
      for (var i = 0; i < list.length; i++) { r -= list[i][1]; if (r <= 0) return list[i][0]; }
      return list[0][0];
    }
    function id() { return Math.floor(rnd() * 1e12).toString(36); }
    var sources = [[{ ref: "" }, 30], [{ ref: "www.linkedin.com/feed" }, 28], [{ ref: "www.google.com" }, 12], [{ ref: "github.com/SheikhRobinEmon-USF" }, 10],
      [{ ref: "", utm: { source: "handshake", medium: "jobs", campaign: "fall-apply" } }, 6], [{ ref: "lnkd.in" }, 5], [{ ref: "mail.google.com" }, 4], [{ ref: "chatgpt.com" }, 2]];
    var zones = [["America/New_York", 40], ["America/Chicago", 12], ["America/Los_Angeles", 14], ["Asia/Dhaka", 10], ["Europe/London", 5], ["Asia/Kolkata", 4], ["America/Denver", 3], ["Europe/Berlin", 2]];
    var devs = [[["Desktop", "Chrome", "macOS", 1440], 34], [["Desktop", "Chrome", "Windows", 1536], 18], [["Desktop", "Safari", "macOS", 1512], 10], [["Mobile", "Safari", "iOS", 390], 24], [["Mobile", "Chrome", "Android", 412], 9], [["Desktop", "Edge", "Windows", 1920], 5]];
    var studies = Object.keys(studyNames).length ? Object.keys(studyNames) : ["paylineage", "hospital-ops-copilot", "modelroi-ai"];
    var cards = Object.keys(caseNames).length ? Object.keys(caseNames) : ["scribe"];
    var questions = ["Give me the 30-second version of Robin.", "What is PayLineage?", "Is he open to relocation?", "What did he do at PTC?", "Tell me about the Scribe revamp",
      "Why should we hire him as an AI PM?", "What were the eval results?", "Is there a live demo?", "Where did he study?", "Does he know LangGraph?", "Tell me about his fintech work"];
    var hits = [];
    var visitors = [];
    var now = Date.now();
    for (var day = 400; day >= 0; day--) {
      var growth = 0.35 + 0.65 * (1 - day / 400);
      var dow = new Date(now - day * DAY).getDay();
      var n = Math.round((3 + rnd() * 9) * growth * (dow === 0 || dow === 6 ? 0.6 : 1));
      for (var k = 0; k < n; k++) {
        var back = visitors.length && rnd() < 0.22;
        var vis = back ? visitors[Math.floor(rnd() * visitors.length)] : { id: id(), dev: pick(devs), tz: pick(zones) };
        if (!back) visitors.push(vis);
        var src = pick(sources);
        var hour = Math.floor(8 + rnd() * 13 + (rnd() < 0.2 ? -6 : 0));
        var t = now - day * DAY - (now % DAY) + hour * HOUR + Math.floor(rnd() * HOUR);
        if (t > now) t = now - Math.floor(rnd() * 3 * HOUR);
        var sid = id();
        var pages = ["/"];
        if (rnd() < 0.45) pages.push("/work/" + studies[Math.floor(rnd() * studies.length)] + ".html");
        if (rnd() < 0.15) pages.push("/work/" + studies[Math.floor(rnd() * studies.length)] + ".html");
        if (src.ref.indexOf("github.com") === 0 && rnd() < 0.5) pages.reverse();
        pages.forEach(function (path, pi) {
          var p = id();
          var d = vis.dev;
          hits.push({ id: id(), k: "view", at: t, v: vis.id, s: sid, p: p, path: path, title: pageName(path), ref: pi ? "" : src.ref, utm: pi ? {} : (src.utm || {}),
            dev: d[0], br: d[1], os: d[2], sw: d[3], lang: vis.tz.indexOf("Asia") === 0 && rnd() < 0.3 ? "bn-BD" : "en-US", tz: vis.tz, nv: !back && pi === 0 });
          var stay = Math.floor((rnd() < 0.2 ? 3 + rnd() * 8 : 20 + rnd() * 200) * 1000);
          var ev = [];
          var secs = [];
          var depth = Math.floor(stay < 10000 ? rnd() * 25 : 30 + rnd() * 70);
          if (path === "/") {
            var reach = Math.round((depth / 100) * (SECTIONS.length - 1));
            for (var si = 0; si <= reach; si++) secs.push(SECTIONS[si][0]);
            if (rnd() < 0.28) ev.push({ n: "lens", d: pick([["fde", 5], ["ba", 3], ["pm", 2]]), t: 4000 });
            if (rnd() < 0.3) ev.push({ n: "case", d: cards[Math.floor(rnd() * cards.length)], t: 30000 });
            if (rnd() < 0.12) ev.push({ n: "filter", d: pick([["AI", 4], ["Analytics", 2], ["Product", 3]]), t: 26000 });
            if (rnd() < 0.1) ev.push({ n: "theme", d: "light", t: 9000 });
          }
          if (rnd() < 0.18) { ev.push({ n: "assistant", d: "open", t: 15000 }); ev.push({ n: "ask", d: questions[Math.floor(rnd() * questions.length)], t: 19000 }); }
          if (rnd() < 0.12) ev.push({ n: "out", d: "www.linkedin.com/in/sheikh-robin-emon-2807a1146", t: stay - 2000 });
          if (rnd() < 0.08) ev.push({ n: "out", d: "github.com/SheikhRobinEmon-USF/Paylineage", t: stay - 3000 });
          if (rnd() < 0.06) ev.push({ n: "email", d: "copy", t: stay - 1500 });
          if (rnd() < 0.05) ev.push({ n: "out", d: "sheikhrobinemon-usf.github.io/Paylineage", t: stay - 4000 });
          ev.sort(function (a, b) { return a.t - b.t; });
          hits.push({ id: id(), k: "more", at: Math.min(now, t + stay), v: vis.id, s: sid, p: p, path: path, ev: ev, secs: secs, dur: stay, depth: depth });
          t += stay + 2000;
        });
      }
    }
    [9, 22].forEach(function (mins, i) {
      var t0 = now - mins * 60000, p0 = id(), s0 = id(), v0 = id();
      hits.push({ id: id(), k: "view", at: t0, v: v0, s: s0, p: p0, path: "/", title: "Home", ref: i ? "www.google.com" : "www.linkedin.com/feed", utm: {}, dev: i ? "Desktop" : "Mobile", br: i ? "Chrome" : "Safari", os: i ? "Windows" : "iOS", sw: i ? 1536 : 390, lang: "en-US", tz: i ? "America/Chicago" : "America/New_York", nv: true });
      hits.push({ id: id(), k: "more", at: t0 + 90000, v: v0, s: s0, p: p0, path: "/", ev: [{ n: "lens", d: "pm", t: 5000 }], secs: ["top", "impact", "work"], dur: 85000, depth: 48 });
    });
    return hits.filter(function (h) { return h.at <= now; });
  }

  /* ================================================================== */
  /* Setup panel                                                          */
  /* ================================================================== */

  function openSetup(reason) {
    var body = $("#setup-body");
    var uid = session && session.uid;
    var intro = reason === "denied"
      ? '<p class="warn">You are signed in, but the security rules do not let this account read the data yet. Publish the rules below once and refresh.</p>'
      : "";
    body.innerHTML = intro +
      "<ol class=\"steps\">" +
      "<li>In the Firebase console, open <b>Firestore Database &gt; Rules</b>.</li>" +
      "<li>Replace everything there with the rules below" + (uid ? ", already filled in with your account" : " and put your user UID where it says OWNER_UID") + ".</li>" +
      "<li>Press <b>Publish</b>, then refresh this page.</li></ol>" +
      (uid ? '<p class="uid">Your user UID <code>' + esc(uid) + "</code></p>" : "") +
      '<pre class="rules" id="rules-text">Loading the rules…</pre>' +
      '<button type="button" class="btn btn--primary" id="copy-rules">Copy the rules</button>' +
      '<p class="foot-note">The same file is in the repository at firebase/firestore.rules. Full steps are in ANALYTICS.md.</p>';
    $("#setup").hidden = false;
    $("#copy-rules").focus();
    fetch("../firebase/firestore.rules").then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (t) {
      $("#rules-text").textContent = uid ? t.replace(/'OWNER_UID'/g, "'" + uid + "'") : t;
    }).catch(function () {
      $("#rules-text").textContent = "Open firebase/firestore.rules in the repository" + (uid ? " and replace OWNER_UID with " + uid : "") + ".";
    });
  }
  function closeSetup() { $("#setup").hidden = true; $("#menu-btn").focus(); }

  /* ================================================================== */
  /* Boot and wiring                                                      */
  /* ================================================================== */

  function showGate(message) {
    $("#dash").hidden = true;
    $("#gate").hidden = false;
    if (!configured) {
      $("#gate-lead").innerHTML = "Analytics is not connected yet. Add your Firebase <code>projectId</code> and <code>apiKey</code> to <code>assets/js/analytics-config.js</code> (steps in ANALYTICS.md). Until then you can look around with sample data.";
      $("#gate-fields").hidden = true;
    }
    if (message) $("#gate-error").textContent = message;
    var first = configured ? $('#signin input[name="email"]') : $("#demo-btn");
    if (session && session.email && configured) $('#signin input[name="email"]').value = session.email;
    first.focus();
  }

  function showDash() {
    $("#gate").hidden = true;
    $("#dash").hidden = false;
    var banner = $("#banner");
    if (demo) {
      banner.hidden = false;
      banner.innerHTML = "You are looking at <b>sample data</b>, generated in your browser. " + (configured ? '<button type="button" class="link" id="leave-demo">Sign in for real data</button>' : "Connect Firebase to see real visits (ANALYTICS.md).");
    } else banner.hidden = true;
    $("#signout-btn").hidden = demo;
    syncOptout();
  }

  function load(force) {
    var b = bounds();
    $("#grid").setAttribute("aria-busy", "true");
    $("#refresh").classList.add("is-spinning");
    return ensure(b.prevFrom).then(function () {
      render();
    }).catch(function (e) {
      if (/PERMISSION_DENIED|Missing or insufficient permissions/i.test(e.status + " " + e.message)) {
        render();
        openSetup("denied");
      } else if (/TOKEN_EXPIRED|INVALID_REFRESH_TOKEN|USER_NOT_FOUND|USER_DISABLED|Signed out|UNAUTHENTICATED/i.test(e.status + " " + e.message)) {
        session = null; store.del("pa-auth");
        showGate("Your sign-in expired. Please sign in again.");
      } else {
        toast("Could not load data: " + e.message);
        if (force) render();
      }
    }).then(function () { $("#refresh").classList.remove("is-spinning"); });
  }

  function startDemo() {
    demo = true;
    cache = { from: 0, hits: sampleHits(), ids: {}, fetchedAt: Date.now() };
    showDash();
    render();
  }

  var AUTH_ERRORS = {
    INVALID_LOGIN_CREDENTIALS: "That email and password do not match.",
    INVALID_PASSWORD: "That email and password do not match.",
    EMAIL_NOT_FOUND: "That email and password do not match.",
    INVALID_EMAIL: "Enter a valid email address.",
    MISSING_PASSWORD: "Enter your password.",
    USER_DISABLED: "This account is disabled.",
    TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Try again in a few minutes.",
    OPERATION_NOT_ALLOWED: "Email and password sign-in is turned off in Firebase Authentication."
  };

  $("#signin").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    var btn = $("#signin-btn");
    $("#gate-error").textContent = "";
    btn.disabled = true;
    btn.textContent = "Signing in…";
    signIn(f.email.value.trim(), f.password.value).then(function () {
      f.password.value = "";
      demo = false;
      showDash();
      return load(true);
    }).catch(function (err) {
      var code = String(err.message || "").split(" ")[0].split(":")[0];
      $("#gate-error").textContent = AUTH_ERRORS[code] || "Sign-in failed: " + err.message;
    }).then(function () {
      btn.disabled = false;
      btn.textContent = "Sign in";
    });
  });
  $("#demo-btn").addEventListener("click", startDemo);

  $("#ranges").addEventListener("click", function (e) {
    var b = e.target.closest("[data-range]");
    if (!b) return;
    state.range = +b.getAttribute("data-range");
    store.set("pa-range", state.range);
    sessionLimit = 25;
    demo ? render() : load();
  });
  $("#ranges").addEventListener("keydown", function (e) {
    if (["ArrowLeft", "ArrowRight"].indexOf(e.key) === -1) return;
    var btns = $$("#ranges button");
    var i = btns.indexOf(document.activeElement);
    var next = btns[(i + (e.key === "ArrowRight" ? 1 : -1) + btns.length) % btns.length];
    next.focus(); next.click();
    e.preventDefault();
  });

  $("#refresh").addEventListener("click", function () { demo ? render() : load(true); });
  $("#theme").addEventListener("click", function () {
    var next = doc.getAttribute("data-theme") === "dark" ? "light" : "dark";
    doc.setAttribute("data-theme", next);
    store.set("theme", next);
  });

  var menuBtn = $("#menu-btn");
  var menu = $("#menu");
  function setMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    if (open) menu.querySelector("button:not([hidden])").focus();
  }
  menuBtn.addEventListener("click", function () { setMenu(menu.hidden); });
  document.addEventListener("click", function (e) { if (!menu.hidden && !e.target.closest(".menu")) setMenu(false); });
  menu.addEventListener("keydown", function (e) {
    var items = $$("button:not([hidden])", menu);
    var i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { items[(i + 1) % items.length].focus(); e.preventDefault(); }
    if (e.key === "ArrowUp") { items[(i - 1 + items.length) % items.length].focus(); e.preventDefault(); }
    if (e.key === "Escape") { setMenu(false); menuBtn.focus(); }
  });
  menu.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    setMenu(false);
    var act = b.getAttribute("data-act");
    var bnd = bounds();
    var pvs = applyFilters(views(cache.hits).filter(function (p) { return p.at >= bnd.from && p.at < bnd.to; }));
    sessions(pvs);
    if (act === "csv") {
      var cols = ["time", "visitor", "visit", "page", "source", "referrer", "campaign", "location", "time_zone", "language", "device", "browser", "os", "screen_px", "engaged_s", "scroll_pct", "events"];
      var lines = [cols.join(",")].concat(pvs.map(function (p) {
        var m = p.meta || {};
        return [new Date(p.at).toISOString(), p.v, p.s, p.path, p.source, m.ref || "", (m.utm && m.utm.campaign) || "", p.region, m.tz || "", m.lang || "", p.device, m.br || "", m.os || "", m.sw || "",
          Math.round(p.dur / 1000), p.depth, p.ev.map(function (x) { return x.n + (x.d ? ":" + x.d : ""); }).join(" | ")]
          .map(function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(",");
      }));
      download("portfolio-page-views.csv", lines.join("\n"), "text/csv");
    } else if (act === "json") {
      download("portfolio-records.json", JSON.stringify(cache.hits.filter(function (h) { return h.at >= bnd.from; }), null, 1), "application/json");
    } else if (act === "optout") {
      if (store.get("pa-optout") === "1") { store.del("pa-optout"); toast("This browser is counted again"); }
      else { store.set("pa-optout", "1"); toast("Visits from this browser are no longer counted"); }
      syncOptout();
    } else if (act === "setup") openSetup();
    else if (act === "signout") signOut();
  });
  function syncOptout() {
    $("#optout-btn").textContent = store.get("pa-optout") === "1" ? "Count this browser again" : "Stop counting this browser";
  }

  $("#setup").addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) closeSetup();
    if (e.target.id === "copy-rules") {
      navigator.clipboard.writeText($("#rules-text").textContent).then(function () { toast("Rules copied"); }, function () { toast("Select the text and copy it"); });
    }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#setup").hidden) closeSetup(); });

  // Filters from clickable bars; chips remove them.
  $("#grid").addEventListener("click", function (e) {
    var b = e.target.closest("[data-fk]");
    if (b) {
      var key = b.getAttribute("data-fk"), value = b.getAttribute("data-fv");
      if (!state.filters.some(function (f) { return f.key === key && f.value === value; })) {
        state.filters = state.filters.filter(function (f) { return f.key !== key; });
        state.filters.push({ key: key, value: value, label: b.getAttribute("data-fl") });
      }
      sessionLimit = 25;
      render();
      return;
    }
    if (e.target.id === "more-sessions") { sessionLimit += 25; render(); return; }
    var row = e.target.closest(".srow");
    if (row) { var sid = row.getAttribute("data-sid"); openSession = openSession === sid ? null : sid; render(); var again = $('.srow[data-sid="' + sid + '"] .srow__btn'); if (again) again.focus(); }
  });
  $("#filters").addEventListener("click", function (e) {
    var b = e.target.closest("[data-rm]");
    if (!b) return;
    var i = b.getAttribute("data-rm");
    state.filters = i === "all" ? [] : state.filters.filter(function (_, j) { return j !== +i; });
    render();
  });
  $("#banner").addEventListener("click", function (e) {
    if (e.target.id !== "leave-demo") return;
    demo = false;
    cache = { from: null, hits: [], ids: {}, fetchedAt: 0 };
    if (session) { showDash(); load(true); } else showGate();
  });

  // Hover tips on any element with data-tip.
  document.addEventListener("mouseover", function (e) {
    var t = e.target.closest && e.target.closest("[data-tip]");
    if (!t) return;
    var r = t.getBoundingClientRect();
    showTip(esc(t.getAttribute("data-tip")), r.left + r.width / 2 - 14, r.top);
  });
  document.addEventListener("mouseout", function (e) {
    var t = e.target.closest && e.target.closest("[data-tip]");
    if (t && !t.contains(e.relatedTarget)) hideTip();
  });
  addEventListener("scroll", hideTip, { passive: true });

  var resizeTimer;
  addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { if (!$("#dash").hidden) render(); }, 150);
  });

  // Live: new records every minute while the tab is in view.
  setInterval(function () {
    if (!demo && session && !$("#dash").hidden && document.visibilityState === "visible") load();
    else updateStamp();
  }, 60000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && !demo && session && !$("#dash").hidden && Date.now() - cache.fetchedAt > 60000) load();
  });

  if (configured && session) { showDash(); load(true); }
  else if (/[?&]demo\b/.test(location.search)) startDemo();
  else showGate();
})();
