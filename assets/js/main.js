/*
 * Page logic: rendering from data.js, the lens switch, theme, scroll effects,
 * the case study drawer and the command palette. Plain JavaScript, no libraries.
 */
(function () {
  "use strict";

  var D = window.PORTFOLIO;
  var doc = document.documentElement;
  var ROOT = doc.getAttribute("data-root") || "";
  var PAGE = document.body.getAttribute("data-page") || "home";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function icon(name, cls) {
    return '<svg class="icon' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  }
  function pad2(n) { return String(n).padStart(2, "0"); }
  function rank(list, lens) {
    var i = list.indexOf(lens);
    return i === -1 ? 99 : i;
  }
  function byLens(items, lens) {
    return items.slice().sort(function (a, b) { return rank(a.lens, lens) - rank(b.lens, lens); });
  }
  function fmt(n, decimals) {
    return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  function workUrl(slug) { return ROOT + "work/" + slug + ".html"; }
  function homeUrl(hash) { return PAGE === "home" ? hash : ROOT + "index.html" + hash; }
  function img(src) { return ROOT + src; }
  var ACCENT = { volt: "var(--volt)", iris: "var(--iris)", aqua: "var(--aqua)" };

  /* Bold the figures in a sentence so results can be scanned. */
  var FIG = /(\$?\d[\d,.]*\s?(?:%|K\+?|M\+?|\+)?(?:\s?to\s?\d[\d,.]*\s?(?:%|\+)?)?)/g;
  function figures(text) {
    return String(text).split(FIG).map(function (part, i) {
      if (i % 2 === 1 && /\d/.test(part) && /(%|K|M|\+|,\d{3}|\d{2,})/.test(part)) return "<strong>" + esc(part) + "</strong>";
      return esc(part);
    }).join("");
  }

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ------------------------------------------------------------------ */
  /* App state shared with assistant.js                                  */
  /* ------------------------------------------------------------------ */

  var listeners = [];
  var App = (window.App = {
    root: ROOT,
    page: PAGE,
    lens: doc.getAttribute("data-lens") || "pm",
    theme: doc.getAttribute("data-theme") || "dark",
    activeSection: null,
    onLens: function (fn) { listeners.push(fn); },
    icon: icon,
    esc: esc,
    workUrl: workUrl
  });

  /* ------------------------------------------------------------------ */
  /* Theme                                                               */
  /* ------------------------------------------------------------------ */

  var field = null;

  function applyTheme(next) {
    doc.setAttribute("data-theme", next);
    App.theme = next;
    store.set("theme", next);
    if (field) field.setTheme(next);
    $$(".theme-btn").forEach(function (b) {
      b.setAttribute("aria-label", "Switch to " + (next === "dark" ? "light" : "dark") + " theme");
    });
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "dark" ? "#07080b" : "#f3f2ec");
  }

  App.toggleTheme = function (origin) {
    var next = App.theme === "dark" ? "light" : "dark";
    if (!document.startViewTransition || reduced.matches) return applyTheme(next);
    var x = origin ? origin.x : window.innerWidth - 80;
    var y = origin ? origin.y : 40;
    var r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    var vt = document.startViewTransition(function () { applyTheme(next); });
    vt.ready.then(function () {
      doc.animate(
        { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + r + "px at " + x + "px " + y + "px)"] },
        { duration: 700, easing: "cubic-bezier(0.76, 0, 0.24, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(function () {});
  };

  /* ------------------------------------------------------------------ */
  /* Lens: reorder the story for the role a visitor is hiring for        */
  /* ------------------------------------------------------------------ */

  function lensSwitchHTML(compact) {
    var buttons = D.lenses.map(function (l) {
      var label = compact ? esc(l.short) : '<span class="seg__short">' + esc(l.short) + '</span><span class="seg__long">' + esc(l.label) + "</span>";
      return '<button type="button" class="seg__btn" role="radio" data-lens="' + l.id + '" aria-label="' + esc(l.label) + '" aria-checked="false">' + label + "</button>";
    }).join("");
    return '<div class="seg" role="radiogroup" aria-label="Choose the role to tailor this portfolio to">' + buttons + "</div>";
  }

  function syncLensButtons() {
    $$("[data-lens]").forEach(function (b) {
      if (b.tagName === "BUTTON") b.setAttribute("aria-checked", String(b.getAttribute("data-lens") === App.lens));
    });
  }

  App.setLens = function (next) {
    if (next === App.lens) return;
    App.lens = next;
    doc.setAttribute("data-lens", next);
    store.set("lens", next);
    syncLensButtons();
    listeners.forEach(function (fn) { fn(next); });
  };

  document.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-lens]");
    if (b) App.setLens(b.getAttribute("data-lens"));
  });

  /* ------------------------------------------------------------------ */
  /* Scroll: smooth anchor links with an offset for the floating nav     */
  /* ------------------------------------------------------------------ */

  App.scrollTo = function (target) {
    if (target === 0 || target === "#top") return window.scrollTo({ top: 0, behavior: reduced.matches ? "auto" : "smooth" });
    var el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: top, behavior: reduced.matches ? "auto" : "smooth" });
  };

  /* Route an assistant/palette href: "/work/slug", "/#id" or "case:id". */
  App.go = function (href) {
    if (href.indexOf("case:") === 0) return App.openCase(href.slice(5));
    if (href.indexOf("/work/") === 0) { window.location.href = workUrl(href.slice(6)); return; }
    var hash = href.replace(/^\//, "");
    if (PAGE === "home") { App.scrollTo(hash); history.replaceState(null, "", hash === "#top" ? location.pathname : hash); }
    else window.location.href = ROOT + "index.html" + hash;
  };

  /* ------------------------------------------------------------------ */
  /* Nav                                                                  */
  /* ------------------------------------------------------------------ */

  function initNav() {
    var nav = $(".nav");
    if (!nav) return;
    var menu = $(".mobile-menu");
    var menuBtn = $(".menu-btn");
    var lastY = window.scrollY;

    function setMenu(open) {
      nav.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("is-locked", open);
    }
    menuBtn.addEventListener("click", function () { setMenu(!menu.classList.contains("is-open")); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("is-open")) setMenu(false); });
    $(".mobile-menu__search").addEventListener("click", function () { setMenu(false); App.openPalette(); });

    // In-page links scroll smoothly and keep the URL tidy.
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"], a[data-home-link]');
      if (!a || PAGE !== "home") return;
      var href = a.getAttribute("href").replace(/^index\.html/, "");
      if (href.charAt(0) !== "#" || href.length < 2) {
        if (a.hasAttribute("data-home-link")) { e.preventDefault(); App.scrollTo(0); history.replaceState(null, "", location.pathname); }
        return;
      }
      if (!document.querySelector(href)) return;
      e.preventDefault();
      App.scrollTo(href);
      history.replaceState(null, "", href);
    });

    $$(".theme-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var r = b.getBoundingClientRect();
        App.toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      });
    });
    $$("[data-open-palette]").forEach(function (b) { b.addEventListener("click", function () { App.openPalette(); }); });
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || "");
    $$(".kbd-k").forEach(function (k) { k.textContent = isMac ? "⌘K" : "Ctrl K"; });

    App.onScroll(function (y) {
      nav.classList.toggle("is-scrolled", y > 24);
      if (!nav.classList.contains("is-open")) {
        if (y > 500 && y - lastY > 6) nav.classList.add("is-hidden");
        else if (lastY - y > 4 || y < 200) nav.classList.remove("is-hidden");
      }
      lastY = y;
    });
  }

  /* ------------------------------------------------------------------ */
  /* One rAF-throttled scroll loop for every scroll-linked effect        */
  /* ------------------------------------------------------------------ */

  var scrollFns = [];
  App.onScroll = function (fn) { scrollFns.push(fn); };
  var ticking = false;
  function runScroll() {
    ticking = false;
    var y = window.scrollY;
    for (var i = 0; i < scrollFns.length; i++) scrollFns[i](y);
  }
  function queueScroll() { if (!ticking) { ticking = true; requestAnimationFrame(runScroll); } }
  window.addEventListener("scroll", queueScroll, { passive: true });
  window.addEventListener("resize", queueScroll);

  function initProgress() {
    var bar = $(".progress");
    if (!bar) return;
    App.onScroll(function (y) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
    });
  }

  function initActiveSection() {
    var ids = ["top", "impact", "work", "shipped", "experience", "skills", "about", "contact"];
    var links = $$(".nav__link");
    App.onScroll(function () {
      var mid = window.innerHeight * 0.4;
      var best = null;
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) best = id;
      });
      App.activeSection = best;
      var navId = best === "shipped" ? "work" : best;
      links.forEach(function (a) {
        if (a.getAttribute("href") === "#" + navId) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Reveal on scroll, and "in view" triggers for bars and curves        */
  /* ------------------------------------------------------------------ */

  var revealIO = null;
  App.observe = function (root) {
    var els = $$("[data-reveal], [data-inview]", root || document);
    if (!revealIO || reduced.matches) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    els.forEach(function (el) { if (!el.classList.contains("is-in")) revealIO.observe(el); });
  };
  function initReveal() {
    if ("IntersectionObserver" in window) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            revealIO.unobserve(en.target);
          }
        });
      }, { rootMargin: "0px 0px -12% 0px" });
    }
    App.observe();
  }

  /* ------------------------------------------------------------------ */
  /* Counters                                                             */
  /* ------------------------------------------------------------------ */

  function counterHTML(m) {
    var final = (m.prefix || "") + fmt(m.value, m.decimals || 0) + m.suffix;
    return '<span class="counter tabular" aria-hidden="true" data-value="' + m.value + '" data-from="' + (m.from || 0) +
      '" data-decimals="' + (m.decimals || 0) + '" data-prefix="' + esc(m.prefix || "") + '" data-suffix="' + esc(m.suffix) + '">' +
      esc(final) + '</span><span class="sr-only">' + esc(final) + "</span>";
  }
  function runCounters(root) {
    var els = $$(".counter:not([data-done])", root);
    if (!("IntersectionObserver" in window) || reduced.matches) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target;
        el.setAttribute("data-done", "");
        var to = +el.dataset.value, from = +el.dataset.from, dec = +el.dataset.decimals;
        var pre = el.dataset.prefix, suf = el.dataset.suffix;
        var t0 = performance.now(), dur = 1800;
        (function step(now) {
          var t = clamp((now - t0) / dur, 0, 1);
          var e = 1 - Math.pow(1 - t, 4);
          el.textContent = pre + fmt(from + (to - from) * e, dec) + suf;
          if (t < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { rootMargin: "0px 0px -15% 0px" });
    els.forEach(function (el) {
      el.textContent = (el.dataset.prefix || "") + fmt(+el.dataset.from, +el.dataset.decimals) + el.dataset.suffix;
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Kinetic variable-font type                                          */
  /* ------------------------------------------------------------------ */

  function kineticWord(text) {
    return '<span class="kw">' + Array.from(text).map(function (ch) { return '<span class="k">' + esc(ch) + "</span>"; }).join("") + "</span>";
  }
  function initKinetic(root) {
    if (!root) return;
    $$("[data-kinetic]", root).forEach(function (w) { w.outerHTML = kineticWord(w.textContent); });
    var chars = $$(".k", root);
    if (!chars.length) return;
    var REST_W = 600, REST_D = 86;
    function apply(el, w, d) { el.style.setProperty("--w", w.toFixed(1)); el.style.setProperty("--d", d.toFixed(2)); }
    if (reduced.matches) { chars.forEach(function (c) { apply(c, REST_W, REST_D); }); return; }
    var fine = finePointer.matches;
    var cur = chars.map(function () { return { w: 200, d: 75 }; });
    var px = -9999, py = -9999, hovering = false, visible = true;
    var t0 = performance.now();
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible) return;
      var t = (now - t0) / 1000;
      var rects = fine && hovering ? chars.map(function (c) { return c.getBoundingClientRect(); }) : null;
      for (var i = 0; i < chars.length; i++) {
        var tw = REST_W + Math.sin(t * 1.15 - i * 0.42) * (fine ? 46 : 90), td = REST_D;
        if (rects) {
          var r = rects[i];
          var prox = Math.max(0, 1 - Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2)) / (r.height * 1.9));
          var e = prox * prox;
          tw = REST_W - 160 + e * 360;
          td = REST_D - 4 + e * 18;
        }
        cur[i].w += (tw - cur[i].w) * 0.12;
        cur[i].d += (td - cur[i].d) * 0.12;
        apply(chars[i], cur[i].w, cur[i].d);
      }
    }
    if (fine) {
      window.addEventListener("pointermove", function (e) {
        px = e.clientX; py = e.clientY;
        var r = root.getBoundingClientRect(), p = 140;
        hovering = px > r.left - p && px < r.right + p && py > r.top - p && py < r.bottom + p;
      }, { passive: true });
    }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(root);
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ */
  /* Pointer effects: spotlight surfaces, magnetic buttons, tilt          */
  /* ------------------------------------------------------------------ */

  function initPointer() {
    document.addEventListener("pointermove", function (e) {
      var s = e.target.closest && e.target.closest(".spot");
      if (s) {
        var r = s.getBoundingClientRect();
        s.style.setProperty("--mx", e.clientX - r.left + "px");
        s.style.setProperty("--my", e.clientY - r.top + "px");
      }
    }, { passive: true });
    if (!finePointer.matches || reduced.matches) return;
    $$(".magnetic").forEach(function (m) {
      m.addEventListener("pointermove", function (e) {
        var r = m.getBoundingClientRect();
        m.style.transition = "transform 0.15s linear";
        m.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.28 + "px," + (e.clientY - r.top - r.height / 2) * 0.28 + "px)";
      });
      m.addEventListener("pointerleave", function () { m.style.transition = ""; m.style.transform = ""; });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Home: hero                                                           */
  /* ------------------------------------------------------------------ */

  function lensLabel(id) {
    for (var i = 0; i < D.lenses.length; i++) if (D.lenses[i].id === id) return D.lenses[i].label;
    return "";
  }

  function initHero() {
    var hero = $("#top");
    if (!hero) return;
    initKinetic($(".hero__title", hero));
    var lensBox = $(".hero__lens");
    if (lensBox) lensBox.insertAdjacentHTML("beforeend", lensSwitchHTML(false));
    var role = $(".hero__role"), summary = $(".hero__summary");
    function paint() { role.textContent = lensLabel(App.lens); summary.textContent = D.profile.summary[App.lens]; }
    paint();
    App.onLens(function () {
      role.classList.add("is-swapping"); summary.classList.add("is-swapping");
      setTimeout(function () { paint(); role.classList.remove("is-swapping"); summary.classList.remove("is-swapping"); }, 300);
    });
    var orgs = D.profile.organizations.map(function (o) {
      return '<span class="org"><span class="org__name display">' + esc(o) + '</span><span class="c-accent">✦</span></span>';
    }).join("");
    $(".hero__orgs").innerHTML =
      '<div class="marquee" style="--dur:46s" aria-hidden="true"><div class="marquee__track"><div class="marquee__group">' + orgs +
      '</div><div class="marquee__group">' + orgs + '</div></div></div><p class="sr-only">Organizations worked with: ' +
      esc(D.profile.organizations.join(", ")) + "</p>";

    var body = $(".hero__body");
    App.onScroll(function (y) {
      if (reduced.matches) return;
      var p = clamp(y / hero.offsetHeight, 0, 1);
      body.style.transform = "translate3d(0," + (-90 * p).toFixed(1) + "px,0)";
      body.style.opacity = String(clamp(1 - p / 0.75, 0, 1));
    });
  }

  /* ------------------------------------------------------------------ */
  /* Home: impact                                                         */
  /* ------------------------------------------------------------------ */

  function initImpact() {
    var section = $("#impact");
    if (!section) return;

    // Word-by-word statement that lights up as it scrolls through.
    var st = $(".statement", section);
    var words = [];
    $$("[data-words]", st).forEach(function (span) {
      var serif = span.classList.contains("serif");
      span.outerHTML = span.textContent.trim().split(/\s+/).map(function (w) {
        return '<span class="w' + (serif ? " serif" : "") + '">' + esc(w) + "</span>";
      }).join(" ");
    });
    words = $$(".w", st);
    App.onScroll(function () {
      if (reduced.matches) { words.forEach(function (w) { w.classList.add("is-lit"); }); return; }
      var r = st.getBoundingClientRect(), vh = window.innerHeight;
      var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.4), 0, 1);
      var lit = Math.round(p * (words.length + 3));
      for (var i = 0; i < words.length; i++) words[i].classList.toggle("is-lit", i < lit);
    });

    var grid = $(".bento", section);
    function card(m, i) {
      var big = m.id === "mau", wide = m.id === "accuracy";
      var extra = "";
      if (big) {
        extra =
          '<svg class="curve" data-inview viewBox="0 0 400 140" preserveAspectRatio="none" aria-hidden="true">' +
          '<defs><linearGradient id="cs" x1="0" x2="1"><stop offset="0" stop-color="var(--iris)"/><stop offset="0.55" stop-color="var(--aqua)"/><stop offset="1" stop-color="var(--volt)"/></linearGradient>' +
          '<linearGradient id="cf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--aqua)" stop-opacity="0.22"/><stop offset="1" stop-color="var(--aqua)" stop-opacity="0"/></linearGradient></defs>' +
          '<path class="curve__fill" d="M0 132 C 70 128, 110 118, 160 100 S 250 62, 300 34 S 370 8, 400 4 L 400 140 L 0 140 Z" fill="url(#cf)"/>' +
          '<path class="curve__line" pathLength="1" d="M0 132 C 70 128, 110 118, 160 100 S 250 62, 300 34 S 370 8, 400 4" fill="none" stroke="url(#cs)" stroke-width="2.5" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
      }
      if (wide) {
        extra =
          '<div class="bars" data-inview aria-hidden="true">' +
          '<div class="bar"><span class="mono">Before</span><div class="bar__track"><div class="bar__fill" style="width:48%"></div></div><span class="bar__value">48%</span></div>' +
          '<div class="bar"><span class="mono">After</span><div class="bar__track"><div class="bar__fill bar__fill--accent" style="width:98%;--delay:.5s"></div></div><span class="bar__value">98%</span></div></div>';
      }
      return '<div class="' + (big ? "is-big is-wide" : wide ? "is-wide" : "") + '" data-reveal style="--delay:' + 0.05 * (i % 4) + 's">' +
        '<a class="metric glass spot" href="' + esc(m.href) + '">' +
        '<div><div class="metric__value display">' + counterHTML(m) + '</div><p class="metric__label mono">' + esc(m.label) + "</p></div>" +
        "<div>" + extra + '<p class="metric__context">' + esc(m.context) + "</p></div></a></div>";
    }
    function render() {
      var ordered = D.metrics.slice().sort(function (a, b) {
        if (a.id === "mau") return -1;
        if (b.id === "mau") return 1;
        return rank(a.lens, App.lens) - rank(b.lens, App.lens);
      });
      grid.innerHTML = ordered.map(card).join("");
      App.observe(grid);
      runCounters(grid);
    }
    render();
    App.onLens(render);
  }

  /* ------------------------------------------------------------------ */
  /* Home: selected work (stacked, pinned cards)                          */
  /* ------------------------------------------------------------------ */

  function frameHTML(shot, url, eager) {
    return '<div class="frame"><div class="frame__bar"><span class="frame__dot"></span><span class="frame__dot"></span><span class="frame__dot"></span>' +
      (url ? '<span class="frame__url">' + esc(url) + "</span>" : "") + "</div>" +
      '<img src="' + img(shot.src) + '" alt="' + esc(shot.alt) + '" width="1800" height="1125"' + (eager ? "" : ' loading="lazy"') + ' decoding="async"></div>';
  }

  function initWork() {
    var stack = $("#work .stack");
    if (!stack) return;
    var html = D.caseStudies.map(function (p, i) {
      var chips = p.stack.slice(0, 7).map(function (s) { return '<span class="chip">' + esc(s) + "</span>"; }).join("") +
        (p.stack.length > 7 ? '<span class="chip">+' + (p.stack.length - 7) + "</span>" : "");
      var facts = p.facts.slice(0, 4).map(function (f) {
        return '<div><dt class="mono">' + esc(f.label) + '</dt><dd class="display">' + esc(f.value) + "</dd></div>";
      }).join("");
      return '<div class="stack__item" style="--spot:' + ACCENT[p.accent] + '"><article class="case"><div class="case__glow"></div><div class="case__grid">' +
        '<div class="case__text"><div class="case__meta mono"><span>0' + (i + 1) + "</span><span>" + esc(p.kind) + "</span><span>" + esc(p.year) + "</span></div>" +
        '<h3 class="case__title display"><a href="' + workUrl(p.slug) + '">' + esc(p.name) + "</a></h3>" +
        '<p class="case__tagline serif">' + esc(p.tagline) + '</p><p class="case__summary">' + esc(p.summary) + "</p>" +
        '<dl class="facts">' + facts + "</dl>" +
        '<div class="case__ctas"><a class="btn btn--primary" href="' + workUrl(p.slug) + '">Read the case study ' + icon("arrow-right", "i-right") + "</a>" +
        (p.repo ? '<a class="btn btn--glass" href="' + esc(p.repo) + '" target="_blank" rel="noopener noreferrer">' + icon("github") + " Source " + icon("arrow-up-right", "c-mute") + "</a>" : "") +
        "</div></div>" +
        '<div class="case__visual">' + (p.cover ? frameHTML(p.cover, "localhost:3000 · " + p.name) : "") + '<div class="chips">' + chips + "</div></div>" +
        '</div><div class="case__dim"></div></article></div>';
    }).join("");

    var c = D.clearline;
    var steps = c.steps.map(function (s, i) {
      return '<li class="step" style="--i:' + i + '"><span class="mono c-mute">Step 0' + (i + 1) + "</span><p>" + esc(s) + "</p></li>";
    }).join("");
    html += '<div class="stack__item" style="--spot:var(--volt)"><article class="case"><div class="case__glow"></div><div class="case__grid">' +
      '<div class="case__text"><div class="case__meta mono"><span>0' + (D.caseStudies.length + 1) + "</span><span>" + esc(c.kind) + "</span><span>" + esc(c.year) + "</span></div>" +
      '<h3 class="case__title display">' + esc(c.name) + '</h3><p class="case__tagline serif">' + esc(c.tagline) + '</p><p class="case__summary">' + esc(c.summary) + "</p>" +
      '<div class="case__ctas chips">' + c.stack.map(function (s) { return '<span class="chip">' + esc(s) + "</span>"; }).join("") + "</div></div>" +
      '<div class="pipeline"><div class="pipeline__head mono"><span>Agent pipeline</span><span><i class="blink-dot"></i>LangGraph</span></div><ol>' + steps + "</ol>" +
      '<div class="pipeline__io"><span>women\'s knit cotton pullover</span>' + icon("arrow-right", "c-mute") + "<span>HTS heading + rationale</span></div>" +
      '<p class="note">Illustrative flow. The repository is coursework and not public.</p></div>' +
      '</div><div class="case__dim"></div></article></div>';
    stack.innerHTML = html;

    var items = $$(".stack__item", stack);
    var total = items.length;
    var wide = window.matchMedia("(min-width: 1024px)");
    function place() {
      items.forEach(function (el, i) {
        // Pin near the top when the card fits; otherwise pin once its bottom edge is in view.
        el.style.top = wide.matches ? Math.min(88 + i * 22, window.innerHeight - el.offsetHeight - 20) + "px" : "";
      });
    }
    place();
    window.addEventListener("resize", place);
    if (window.ResizeObserver) new ResizeObserver(place).observe(stack);

    App.onScroll(function () {
      if (!wide.matches || reduced.matches) {
        items.forEach(function (el) { var a = el.firstChild; a.style.transform = ""; a.style.setProperty("--dim", 0); });
        return;
      }
      var r = stack.getBoundingClientRect();
      var span = r.height - window.innerHeight;
      var p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
      items.forEach(function (el, i) {
        var start = i / total;
        var t = clamp((p - start) / (1 - start), 0, 1);
        var depth = total - 1 - i;
        el.firstChild.style.transform = "scale(" + (1 - depth * 0.035 * t).toFixed(4) + ")";
        el.firstChild.style.setProperty("--dim", (depth * 0.22 * t).toFixed(3));
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Home: case study gallery                                             */
  /* ------------------------------------------------------------------ */

  function initGallery() {
    var section = $("#shipped");
    if (!section) return;
    var INITIAL = 9;
    var filter = "All", expanded = false;
    $(".gallery-count", section).textContent = D.shipped.length;
    var filtersEl = $(".filters", section), list = $(".gallery", section), more = $(".more", section);

    function counts(f) {
      return f === "All" ? D.shipped.length : D.shipped.filter(function (s) { return s.category.indexOf(f) !== -1; }).length;
    }
    filtersEl.innerHTML = ["All"].concat(D.categories).map(function (f) {
      return '<button type="button" class="filter" role="tab" data-filter="' + esc(f) + '" aria-selected="' + (f === filter) + '">' +
        esc(f) + " <small>" + counts(f) + "</small></button>";
    }).join("");

    function tile(s, i) {
      return '<li id="shipped-' + s.id + '" style="--i:' + i + '"><div class="tile glass spot"><button type="button" data-case="' + s.id + '" aria-haspopup="dialog">' +
        '<span class="tile__top"><span class="mono">' + esc(s.org) + '</span><span class="tile__arrow">' + icon("arrow-up-right") + "</span></span>" +
        '<span class="tile__value display">' + esc(s.metric.value) + '</span><span class="tile__label mono">' + esc(s.metric.label) + "</span>" +
        '<span class="tile__name">' + esc(s.name) + '</span><span class="tile__text">' + esc(s.text) + "</span>" +
        '<span class="tile__domain">' + s.domain.map(function (d) { return "<span>" + esc(d) + "</span>"; }).join("") + "</span>" +
        "</button></div></li>";
    }
    function render() {
      var matching = byLens(D.shipped.filter(function (s) { return filter === "All" || s.category.indexOf(filter) !== -1; }), App.lens);
      var collapsible = filter === "All" && matching.length > INITIAL;
      var shown = collapsible && !expanded ? matching.slice(0, INITIAL) : matching;
      list.innerHTML = shown.map(tile).join("");
      more.innerHTML = collapsible
        ? '<button type="button" class="mono" aria-expanded="' + expanded + '">' + (expanded ? "Show fewer" : "Show all " + matching.length + " case studies") + " " + icon("chevron-down") + "</button>"
        : "";
    }
    filtersEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-filter]");
      if (!b) return;
      filter = b.getAttribute("data-filter");
      $$(".filter", filtersEl).forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
      render();
    });
    more.addEventListener("click", function () {
      expanded = !expanded;
      render();
      if (!expanded) App.scrollTo(section);
    });
    list.addEventListener("click", function (e) {
      var b = e.target.closest("[data-case]");
      if (b) App.openCase(b.getAttribute("data-case"));
    });
    render();
    App.onLens(render);
  }

  /* ------------------------------------------------------------------ */
  /* Home: experience                                                     */
  /* ------------------------------------------------------------------ */

  function initExperience() {
    var section = $("#experience");
    if (!section) return;
    $(".head__aside", section).innerHTML = lensSwitchHTML(true);
    var tl = $(".timeline", section);
    var VISIBLE = 4;
    var open = {};

    function role(r) {
      var bullets = byLens(r.bullets, App.lens);
      var shown = open[r.id] ? bullets : bullets.slice(0, VISIBLE);
      var extra = bullets.length - VISIBLE;
      return '<article class="role" id="role-' + r.id + '"><span class="role__node" aria-hidden="true"></span>' +
        '<div class="role__side" data-reveal><div class="role__years mono"><span>' + esc(r.start) + "</span><i></i><span>" + esc(r.end) + "</span></div>" +
        '<h3 class="role__company display">' + esc(r.company) + '</h3><p class="role__title">' + esc(r.role) + '</p><p class="role__when">' + esc(r.place) + " · " + esc(r.period) + "</p></div>" +
        '<div data-reveal style="--delay:.06s"><p class="role__blurb serif">' + esc(r.blurb) + "</p>" +
        '<ul class="bullets">' + shown.map(function (b, i) {
          return '<li class="bullet" style="--i:' + i + '"><h4><span>' + pad2(i + 1) + "</span>" + esc(b.title) + "</h4><p>" + figures(b.text) + "</p></li>";
        }).join("") + "</ul>" +
        '<div class="role__foot"><div class="chips">' + r.stack.map(function (s) { return '<span class="chip chip--sm">' + esc(s) + "</span>"; }).join("") + "</div>" +
        (extra > 0 ? '<button type="button" class="pill-btn mono" data-more="' + r.id + '" aria-expanded="' + !!open[r.id] + '">' + (open[r.id] ? "Show fewer" : "Show " + extra + " more") + " " + icon("chevron-down") + "</button>" : "") +
        "</div></div></article>";
    }
    function render() {
      tl.innerHTML = '<div class="timeline__rail" aria-hidden="true"><span></span></div>' + D.experience.map(role).join("");
      App.observe(tl);
    }
    tl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-more]");
      if (!b) return;
      var id = b.getAttribute("data-more");
      open[id] = !open[id];
      var art = document.getElementById("role-" + id);
      var tmp = document.createElement("div");
      tmp.innerHTML = role(D.experience.filter(function (r) { return r.id === id; })[0]);
      var fresh = tmp.firstChild;
      $$("[data-reveal]", fresh).forEach(function (x) { x.classList.add("is-in"); });
      art.replaceWith(fresh);
    });
    render();
    App.onLens(render);
    App.onScroll(function () {
      var rail = $(".timeline__rail span", tl);
      if (!rail) return;
      var r = tl.getBoundingClientRect();
      rail.style.setProperty("--p", clamp((window.innerHeight * 0.6 - r.top) / r.height, 0, 1).toFixed(4));
    });
  }

  /* ------------------------------------------------------------------ */
  /* Home: skills                                                         */
  /* ------------------------------------------------------------------ */

  function initSkills() {
    var section = $("#skills");
    if (!section) return;
    var rows = [
      D.technologies.slice(0, 2).reduce(function (a, g) { return a.concat(g.items); }, []),
      D.technologies.slice(2, 5).reduce(function (a, g) { return a.concat(g.items); }, [])
    ];
    $(".ticker", section).innerHTML = rows.map(function (row, i) {
      var g = row.map(function (t) {
        return '<span class="ticker__item display' + (i ? " ticker__item--outline" : "") + '">' + esc(t) + "<i>/</i></span>";
      }).join("");
      return '<div class="marquee' + (i ? " marquee--reverse" : "") + '" style="--dur:' + (70 + i * 14) + 's"><div class="marquee__track"><div class="marquee__group">' + g + '</div><div class="marquee__group">' + g + "</div></div></div>";
    }).join("");

    var mode = "technologies", picked = null;
    var modeBox = $(".head__aside", section);
    modeBox.innerHTML = '<div class="seg" role="radiogroup" aria-label="Skill view">' + ["technologies", "capabilities"].map(function (m) {
      return '<button type="button" class="seg__btn" role="radio" data-mode="' + m + '" aria-checked="' + (m === mode) + '" style="text-transform:capitalize">' + m + "</button>";
    }).join("") + "</div>";

    var box = $(".explorer", section);
    function render() {
      var groups = byLens(mode === "technologies" ? D.technologies : D.capabilities, App.lens);
      var active = groups.filter(function (g) { return g.id === picked; })[0] || groups[0];
      box.innerHTML =
        '<div class="tabs" role="tablist" aria-orientation="vertical" aria-label="' + mode + '">' + groups.map(function (g, i) {
          return '<button type="button" class="tab" role="tab" data-group="' + g.id + '" aria-selected="' + (g.id === active.id) + '">' +
            '<span class="tab__label"><span class="mono">' + pad2(i + 1) + '</span><span class="tab__name display">' + esc(g.label) + "</span></span>" +
            '<span class="tab__count">' + g.items.length + "</span></button>";
        }).join("") + "</div>" +
        '<div class="panel glass" role="tabpanel"><div class="panel__head mono"><span>' + esc(active.label) + "</span><span>" + active.items.length + " items</span></div>" +
        '<ul class="skills">' + active.items.map(function (s, i) {
          return '<li style="--i:' + i + '"><button type="button" class="skill" data-skill="' + esc(s) + '" title="Ask where Robin has used ' + esc(s) + '">' + esc(s) + "</button></li>";
        }).join("") + '</ul><p class="note">Select any skill to ask the assistant where it was used.</p></div>';
    }
    function pick(id) {
      if (id === picked) return;
      picked = id;
      render();
    }
    box.addEventListener("click", function (e) {
      var t = e.target.closest("[data-group]");
      if (t) return pick(t.getAttribute("data-group"));
      var s = e.target.closest("[data-skill]");
      if (s && App.ask) App.ask("Where has Robin used " + s.getAttribute("data-skill") + "?");
    });
    box.addEventListener("mouseover", function (e) {
      var t = e.target.closest("[data-group]");
      if (t && finePointer.matches) pick(t.getAttribute("data-group"));
    });
    modeBox.addEventListener("click", function (e) {
      var b = e.target.closest("[data-mode]");
      if (!b) return;
      mode = b.getAttribute("data-mode");
      picked = null;
      $$("[data-mode]", modeBox).forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); });
      render();
    });
    render();
    App.onLens(function () { picked = null; render(); });
  }

  /* ------------------------------------------------------------------ */
  /* Home: about                                                          */
  /* ------------------------------------------------------------------ */

  function initAbout() {
    var section = $("#about");
    if (!section) return;
    $(".story", section).innerHTML = D.story.map(function (p, i) {
      return '<p data-reveal style="--delay:' + i * 0.12 + 's">' + esc(p) + "</p>";
    }).join("");
    $(".strengths", section).innerHTML = D.strengths.map(function (s, i) {
      return '<li data-reveal style="--delay:' + (i % 2) * 0.08 + 's"><span class="num">' + pad2(i + 1) + '</span><h4 class="display">' + esc(s.title) + "</h4><p>" + esc(s.text) + "</p></li>";
    }).join("");
    $(".edu", section).innerHTML = D.education.map(function (e, i) {
      return '<div data-reveal style="--delay:' + i * 0.08 + 's"><div class="edu__card glass spot"><div class="edu__top"><span class="edu__icon">' + icon("graduation-cap") +
        '</span><span class="mono">' + esc(e.period) + '</span></div><h4 class="edu__school display">' + esc(e.school) + '</h4><p class="edu__degree">' + esc(e.degree) +
        '</p><div class="edu__foot"><span>' + esc(e.place) + '</span><span>GPA <span class="c-accent">' + esc(e.gpa) + "</span></span></div></div></div>";
    }).join("");
    $(".awards", section).innerHTML = D.awards.map(function (a) {
      return '<li><span class="awards__year">' + esc(a.year) + '</span><span class="awards__title display">' + esc(a.title) + '</span><span class="awards__org">' + esc(a.org) + "</span></li>";
    }).join("");

    var card = $(".portrait__card", section);
    if (card && finePointer.matches && !reduced.matches) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.transition = "transform 0.12s linear";
        card.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 22).toFixed(2) + "deg");
        card.style.setProperty("--rx", (((e.clientY - r.top) / r.height - 0.5) * -18).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", function () {
        card.style.transition = "";
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Home: contact                                                        */
  /* ------------------------------------------------------------------ */

  App.copyEmail = function (done) {
    var email = D.profile.email;
    function fallback() { window.location.href = "mailto:" + email; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(function () { if (done) done(true); }, fallback);
    } else fallback();
  };

  function initContact() {
    var section = $("#contact");
    if (!section) return;
    initKinetic($(".contact__title", section));
    var btn = $(".email-btn", section), status = $(".email-status", section), timer;
    btn.addEventListener("click", function () {
      App.copyEmail(function () {
        btn.classList.add("is-copied");
        status.textContent = "Copied to clipboard";
        clearTimeout(timer);
        timer = setTimeout(function () { btn.classList.remove("is-copied"); status.textContent = "Select to copy"; }, 2200);
      });
    });
    var clock = $(".local-time", section);
    function tick() {
      try {
        clock.textContent = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: D.profile.timezone, timeZoneName: "short" }).format(new Date());
      } catch (e) {}
    }
    tick();
    setInterval(tick, 15000);
  }

  /* ------------------------------------------------------------------ */
  /* Case study drawer (gallery)                                          */
  /* ------------------------------------------------------------------ */

  function initDrawer() {
    var root = $("#case-drawer");
    if (!root) return;
    var body = $(".drawer__body", root), counter = $(".drawer__count", root);
    var prevBtn = $("[data-step='-1']", root), nextBtn = $("[data-step='1']", root);
    var index = -1, opener = null;

    function render() {
      var s = D.shipped[index];
      var n = D.shipped.length;
      var prev = D.shipped[(index - 1 + n) % n], next = D.shipped[(index + 1) % n];
      counter.innerHTML = '<span class="c-accent">' + pad2(index + 1) + "</span> / " + n + " · Case study";
      body.innerHTML =
        '<div class="drawer__content"><p class="mono c-mute">' + esc(s.org) + " · " + esc(s.role) + "</p>" +
        '<h2 id="case-title" class="display">' + esc(s.name) + '</h2><p class="drawer__headline serif">' + esc(s.headline) + "</p>" +
        '<div class="drawer__metrics"><div class="is-main"><div class="display">' + esc(s.metric.value) + '</div><div class="mono">' + esc(s.metric.label) + "</div></div>" +
        (s.secondary || []).map(function (x) { return '<div><div class="display">' + esc(x.value) + '</div><div class="mono">' + esc(x.label) + "</div></div>"; }).join("") + "</div>" +
        '<div class="chips" style="margin-top:1.5rem">' + s.domain.map(function (d) { return '<span class="chip chip--sm chip--accent">' + esc(d) + "</span>"; }).join("") + "</div>" +
        '<h3 class="mono">Overview</h3><p class="drawer__overview">' + esc(s.text) + "</p>" +
        '<h3 class="mono">What I did</h3><ol class="did">' + s.did.map(function (d, i) { return "<li><span>" + pad2(i + 1) + "</span><span>" + esc(d) + "</span></li>"; }).join("") + "</ol>" +
        '<h3 class="mono">Impact</h3><ul class="impact">' + s.impact.map(function (m) { return '<li><span class="tick">' + icon("check") + "</span><span class=\"figures\">" + figures(m) + "</span></li>"; }).join("") + "</ul>" +
        '<h3 class="mono">Tools and methods</h3><div class="chips">' + s.tools.map(function (t) { return '<span class="chip chip--sm">' + esc(t) + "</span>"; }).join("") + "</div>" +
        '<button type="button" class="link-btn drawer__ask" data-ask-case="' + esc(s.name) + '">' + icon("sparkles") + " Ask the assistant about this</button></div>";
      $("b", prevBtn).textContent = prev.name;
      $("b", nextBtn).textContent = next.name;
      body.scrollTop = 0;
    }

    App.openCase = function (id) {
      var i = -1;
      for (var k = 0; k < D.shipped.length; k++) if (D.shipped[k].id === id) i = k;
      if (i === -1) return;
      if (PAGE !== "home") { window.location.href = ROOT + "index.html#shipped-" + id; return; }
      var wasOpen = root.classList.contains("is-open");
      index = i;
      render();
      if (!wasOpen) {
        opener = document.activeElement;
        root.classList.add("is-open");
        root.setAttribute("aria-hidden", "false");
        document.body.classList.add("is-locked");
        if (App.closePalette) App.closePalette();
        setTimeout(function () { $(".drawer__close", root).focus({ preventScroll: true }); }, 50);
      }
    };
    function close() {
      if (!root.classList.contains("is-open")) return;
      root.classList.remove("is-open");
      root.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }
    App.closeCase = close;
    App.caseOpen = function () { return root.classList.contains("is-open"); };
    function step(d) { App.openCase(D.shipped[(index + d + D.shipped.length) % D.shipped.length].id); }

    root.addEventListener("click", function (e) {
      if (e.target.closest(".overlay__scrim, .drawer__close")) return close();
      var s = e.target.closest("[data-step]");
      if (s) return step(+s.getAttribute("data-step"));
      var a = e.target.closest("[data-ask-case]");
      if (a && App.ask) { close(); App.ask("Tell me more about " + a.getAttribute("data-ask-case")); }
    });
    document.addEventListener("keydown", function (e) {
      if (!root.classList.contains("is-open")) return;
      if (e.key === "Escape") { e.stopImmediatePropagation(); close(); }
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "Tab") trapFocus(e, $(".drawer", root));
    }, true);

    // Deep link: index.html#shipped-<id> opens that case study.
    var m = /^#shipped-(.+)$/.exec(location.hash);
    if (m) setTimeout(function () { App.scrollTo("#shipped"); App.openCase(m[1]); }, 400);
  }

  function trapFocus(e, box) {
    var f = $$('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])', box).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ------------------------------------------------------------------ */
  /* Command palette (Cmd/Ctrl + K)                                       */
  /* ------------------------------------------------------------------ */

  function initPalette() {
    var root = $("#palette");
    if (!root) return;
    var input = $("input", root), list = $(".palette__list", root);
    var items = [], visible = [], active = 0;

    var sections = [
      ["top", "Home", "home"], ["impact", "Impact", "zap"], ["work", "Selected work", "layers"], ["shipped", "Case study gallery", "layers"],
      ["experience", "Experience", "briefcase"], ["skills", "Toolkit", "zap"], ["about", "About", "user"], ["contact", "Contact", "mail"]
    ];
    sections.forEach(function (s) {
      items.push({ group: "Go to", label: s[1], icon: s[2], keys: "go " + s[1], run: function () { App.go("/#" + s[0]); } });
    });
    D.caseStudies.forEach(function (c) {
      items.push({ group: "Case studies", label: c.name, hint: c.year, icon: "file-text", keys: "case " + c.name + " " + c.stack.join(" "), run: function () { window.location.href = workUrl(c.slug); } });
    });
    D.shipped.forEach(function (s) {
      items.push({ group: "Case gallery", label: s.name, hint: s.metric.value, icon: "layers", keys: "gallery " + s.name + " " + s.headline + " " + s.org + " " + s.tools.join(" "), run: function () { App.openCase(s.id); } });
    });
    D.lenses.forEach(function (l) {
      items.push({ group: "Read this site as", label: l.label, icon: "eye", keys: "lens view as " + l.label + " " + l.short, run: function () { App.setLens(l.id); } });
    });
    items.push(
      { group: "Actions", label: "Switch theme", icon: "sun", keys: "toggle theme dark light mode", run: function () { App.toggleTheme(); } },
      { group: "Actions", label: "Copy email", hint: D.profile.email, icon: "copy", keys: "copy email address contact", run: function () { App.copyEmail(); } },
      { group: "Actions", label: "Open LinkedIn", icon: "linkedin", keys: "open linkedin profile", run: function () { window.open(D.profile.links.linkedin, "_blank", "noopener"); } },
      { group: "Actions", label: "Open GitHub", icon: "github", keys: "open github profile source code", run: function () { window.open(D.profile.links.github, "_blank", "noopener"); } },
      { group: "Actions", label: "Ask the assistant for a summary", icon: "sparkles", keys: "ask ai assistant chat summary", run: function () { if (App.ask) App.ask("Give me the 30-second version of Robin."); } }
    );

    function render() {
      var q = input.value.trim().toLowerCase();
      var terms = q.split(/\s+/).filter(Boolean);
      visible = items.filter(function (it) {
        var k = it.keys.toLowerCase();
        return terms.every(function (t) { return k.indexOf(t) !== -1; });
      });
      if (q.length > 2 && App.ask) {
        var raw = input.value.trim();
        visible.push({ group: "Assistant", label: "Ask: " + raw, hint: "AI", icon: "sparkles", run: function () { App.ask(raw); } });
      }
      active = clamp(active, 0, Math.max(0, visible.length - 1));
      if (!visible.length) { list.innerHTML = '<p class="palette__empty">Nothing matches that.</p>'; return; }
      var html = "", group = null;
      visible.forEach(function (it, i) {
        if (it.group !== group) { group = it.group; html += '<p class="palette__group mono">' + esc(group) + "</p>"; }
        html += '<button type="button" class="palette__item' + (i === active ? " is-active" : "") + '" data-i="' + i + '" role="option" aria-selected="' + (i === active) + '">' +
          '<span class="palette__icon">' + icon(it.icon) + '</span><span class="palette__text">' + esc(it.label) + "</span>" +
          (it.hint ? '<span class="palette__hint">' + esc(it.hint) + "</span>" : "") + "</button>";
      });
      list.innerHTML = html;
    }
    function setActive(i) {
      active = i;
      $$(".palette__item", list).forEach(function (b) {
        var on = +b.getAttribute("data-i") === i;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
        if (on) b.scrollIntoView({ block: "nearest" });
      });
    }
    function choose(i) {
      var it = visible[i];
      if (!it) return;
      close();
      setTimeout(it.run, 60);
    }

    App.openPalette = function () {
      root.classList.add("is-open");
      root.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-locked");
      input.value = "";
      active = 0;
      render();
      setTimeout(function () { input.focus(); }, 30);
    };
    function close() {
      if (!root.classList.contains("is-open")) return;
      root.classList.remove("is-open");
      root.setAttribute("aria-hidden", "true");
      if (!App.caseOpen || !App.caseOpen()) document.body.classList.remove("is-locked");
    }
    App.closePalette = close;

    input.addEventListener("input", function () { active = 0; render(); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((active + 1) % visible.length); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive((active - 1 + visible.length) % visible.length); }
      if (e.key === "Enter") { e.preventDefault(); choose(active); }
    });
    list.addEventListener("click", function (e) { var b = e.target.closest("[data-i]"); if (b) choose(+b.getAttribute("data-i")); });
    list.addEventListener("mousemove", function (e) { var b = e.target.closest("[data-i]"); if (b && +b.getAttribute("data-i") !== active) setActive(+b.getAttribute("data-i")); });
    root.addEventListener("click", function (e) { if (e.target.closest(".overlay__scrim")) close(); });
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (root.classList.contains("is-open")) close(); else App.openPalette();
      } else if (e.key === "Escape" && root.classList.contains("is-open")) { e.stopImmediatePropagation(); close(); }
    }, true);
  }

  /* ------------------------------------------------------------------ */
  /* Case study pages (work/*.html)                                       */
  /* ------------------------------------------------------------------ */

  function evalTable(e) {
    function ratio(v) {
      var s = String(v);
      if (/%$/.test(s)) return parseFloat(s) / 100;
      if (/^0\.\d+$/.test(s)) return parseFloat(s);
      return null;
    }
    var head = "<tr>" + e.columns.map(function (c) { return '<th scope="col" class="mono">' + esc(c) + "</th>"; }).join("") + "</tr>";
    var rows = e.rows.map(function (row, r) {
      return '<tr class="' + (r === e.highlight ? "is-top" : "") + '" style="--r:' + r + '">' + row.map(function (cell, i) {
        if (i === 0) return '<th scope="row"><span></span>' + esc(cell) + "</th>";
        var v = ratio(cell);
        return "<td><b>" + esc(cell) + "</b>" + (v !== null ? '<span class="eval__bar"><i style="width:' + v * 100 + '%"></i></span>' : "") + "</td>";
      }).join("") + "</tr>";
    }).join("");
    return '<div class="eval glass" data-reveal data-inview><div class="eval__head"><h3 class="display">' + esc(e.title) + "</h3><p>" + esc(e.note) + "</p></div>" +
      '<div class="eval__scroll"><table><thead>' + head + "</thead><tbody>" + rows + "</tbody></table></div></div>";
  }

  function initCasePage() {
    var slug = document.body.getAttribute("data-slug");
    var idx = -1;
    D.caseStudies.forEach(function (c, i) { if (c.slug === slug) idx = i; });
    if (idx === -1) return;
    var p = D.caseStudies[idx];
    var next = D.caseStudies[(idx + 1) % D.caseStudies.length];
    var main = $("#main");
    main.style.setProperty("--spot", ACCENT[p.accent]);
    function label(n, text) { return '<p class="cs-label mono" data-index="' + n + '"><span>' + esc(text) + "</span></p>"; }
    var n = 0;
    function idxLabel(text) { n++; return label(pad2(n), text); }

    var html =
      '<header class="cs-head wrap" data-scene="2">' +
      '<a class="back mono" href="' + ROOT + 'index.html#work">' + icon("arrow-left") + " All work</a>" +
      '<div data-reveal><div class="cs-meta mono"><span>Case study</span><span>' + esc(p.kind) + "</span><span>" + esc(p.year) + "</span></div>" +
      '<h1 class="cs-title display">' + esc(p.name) + "</h1></div>" +
      '<p class="cs-tagline serif" data-reveal style="--delay:.1s">' + esc(p.tagline) + "</p>" +
      '<div class="cs-ctas" data-reveal style="--delay:.16s">' +
      (p.repo ? '<a class="btn btn--primary btn--lg" href="' + esc(p.repo) + '" target="_blank" rel="noopener noreferrer">' + icon("github") + " View the source " + icon("arrow-up-right") + "</a>" : "") +
      '<a class="btn btn--glass btn--lg" href="#how">How it is built</a></div></header>';

    if (p.cover) {
      html += '<div class="wrap cs-cover" data-reveal>' + frameHTML(p.cover, "localhost:3000 · " + p.name, true) +
        (p.screenshotNote ? '<p class="note">' + esc(p.screenshotNote) + "</p>" : "") + "</div>";
    }
    html += '<div class="wrap"><dl class="cs-facts" data-reveal>' + p.facts.map(function (f) {
      return '<div><dt class="mono">' + esc(f.label) + '</dt><dd class="display">' + esc(f.value) + "</dd></div>";
    }).join("") + "</dl></div>";

    html += '<section class="section wrap"><div class="split"><div data-reveal>' + idxLabel("The problem") + '<p class="c-soft" style="max-width:24rem;line-height:1.7">' + esc(p.summary) + "</p></div>" +
      '<p class="cs-problem display" data-reveal style="--delay:.1s">' + esc(p.problem) + "</p></div></section>";

    html += '<section class="wrap" style="padding-bottom:6rem"><div data-reveal>' + idxLabel("What it does") + '</div><div class="features">' + p.features.map(function (f, i) {
      return '<div data-reveal style="--delay:' + (i % 3) * 0.07 + 's"><div class="feature glass spot"><span class="mono c-mute">' + pad2(i + 1) + '</span><h3 class="display">' + esc(f.title) + "</h3><p>" + esc(f.text) + "</p></div></div>";
    }).join("") + "</div></section>";

    html += '<section class="wrap" style="padding-bottom:6rem"><div data-reveal>' + idxLabel("In the product") + '</div><div class="shots">' + p.shots.map(function (s, i) {
      var wide = i === 0 && p.shots.length % 2 === 1;
      return '<figure class="' + (wide ? "is-wide" : "") + '" data-reveal style="--delay:' + (i % 2) * 0.06 + 's">' + frameHTML(s) +
        "<figcaption><span>" + pad2(i + 1) + "</span>" + esc(s.caption) + "</figcaption></figure>";
    }).join("") + "</div></section>";

    html += '<section id="how" class="wrap" style="padding-bottom:6rem;scroll-margin-top:7rem"><div class="split"><div data-reveal>' + idxLabel("Why it is built this way") +
      '<h2 class="h2 display" style="font-size:clamp(2rem,4vw,3.5rem)">Decisions, <span class="serif gradient">not defaults</span></h2></div>' +
      '<ul class="principles">' + p.principles.map(function (x, i) {
        return '<li data-reveal style="--delay:' + i * 0.05 + 's"><h3 class="display">' + esc(x.concern) + "</h3><p>" + esc(x.approach) + "</p></li>";
      }).join("") + "</ul></div></section>";

    if (p.evals) {
      html += '<section class="wrap" style="padding-bottom:6rem"><div data-reveal>' + idxLabel("Evaluation") +
        '<h2 class="h2 display" style="font-size:clamp(2rem,4vw,3.5rem);max-width:48rem">Measured before it was <span class="serif gradient">trusted</span></h2></div>' +
        '<div class="evals">' + p.evals.map(evalTable).join("") + "</div></section>";
    }

    html += '<section class="wrap" style="padding-bottom:5rem"><div class="pair">' +
      '<div class="glass" data-reveal><h2 class="mono c-mute">Stack</h2><div class="chips">' + p.stack.map(function (s) { return '<span class="chip">' + esc(s) + "</span>"; }).join("") + "</div></div>" +
      '<div class="limits" data-reveal style="--delay:.08s"><h2 class="mono c-mute">Honest limits</h2><p>' + esc(p.limits) + "</p></div></div></section>";

    html += '<section class="wrap" data-scene="4"><a class="next" href="' + workUrl(next.slug) + '"><span class="next__glow" style="background:' + ACCENT[next.accent] + '"></span>' +
      '<span class="mono c-mute" style="position:relative">Next case study</span><span class="next__row"><span class="next__name display">' + esc(next.name) +
      '</span><span class="next__go">' + icon("arrow-right") + "</span></span><p>" + esc(next.tagline) + "</p></a></section>";

    main.innerHTML = html;
    document.title = p.name + " · " + D.profile.name;
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                 */
  /* ------------------------------------------------------------------ */

  function boot() {
    syncLensButtons();
    if (PAGE === "case") initCasePage();
    initNav();
    initProgress();
    if (PAGE === "home") {
      initActiveSection();
      initHero();
      initImpact();
      initWork();
      initGallery();
      initExperience();
      initSkills();
      initAbout();
      initContact();
    }
    initDrawer();
    initPalette();
    syncLensButtons();
    initReveal();
    initPointer();
    applyTheme(App.theme);

    var backdrop = $(".backdrop");
    if (backdrop && window.ParticleField) field = window.ParticleField.start(backdrop);
    if (field) field.setTheme(App.theme);

    runScroll();
    // Play the hero entrance once fonts are in, so the lines do not reflow mid-animation.
    var ready = function () { doc.classList.add("is-ready"); };
    if (document.fonts && document.fonts.ready) {
      Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 700); })]).then(ready);
    } else ready();

    // Arriving from another page with a #section in the URL.
    if (PAGE === "home" && location.hash && !/^#shipped-/.test(location.hash)) {
      setTimeout(function () { var t = document.querySelector(location.hash); if (t) App.scrollTo(t); }, 300);
    }
  }

  boot();
})();
