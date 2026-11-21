/*
 * Portfolio assistant: the chat panel.
 * Answers come from engine.js, which only uses what is published on this site.
 * Streams each reply, shows its sources, offers follow-ups, and can act on the page.
 */
(function () {
  "use strict";

  var App = window.App;
  var Engine = window.AssistantEngine;
  if (!App || !Engine) return;

  var esc = App.esc, icon = App.icon;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var panel = document.getElementById("assistant");
  var fab = document.getElementById("assistant-fab");
  if (!panel || !fab) return;

  var log = panel.querySelector(".chat__log");
  var form = panel.querySelector("form");
  var field = panel.querySelector("textarea");
  var sendBtn = panel.querySelector(".send");
  var micBtn = panel.querySelector(".mic");
  var clearBtn = panel.querySelector("[data-clear]");
  var nudge = fab.parentElement.querySelector(".nudge");
  var count = 0;

  /* ---------- Markdown-lite: paragraphs, "- " bullets, **bold** ---------- */

  function inline(text) {
    return text.split(/(\*\*[^*]+\*\*)/g).map(function (part) {
      if (/^\*\*[^*]+\*\*$/.test(part)) return "<strong>" + esc(part.slice(2, -2)) + "</strong>";
      return esc(part.replace(/\*\*/g, ""));
    }).join("");
  }
  function rich(text) {
    return text.split(/\n{2,}/).map(function (block) {
      var lines = block.split("\n");
      if (lines.every(function (l) { return l.indexOf("- ") === 0; })) {
        return "<ul>" + lines.map(function (l) { return "<li>" + inline(l.slice(2)) + "</li>"; }).join("") + "</ul>";
      }
      return "<p>" + inline(block) + "</p>";
    }).join("");
  }

  /* ---------- Suggestions that fit what the visitor is looking at ---------- */

  function suggestions() {
    var path = App.page === "case" ? "/work/" + document.body.getAttribute("data-slug") : "/";
    return Engine.suggestionsFor(App.activeSection, path);
  }

  function welcome() {
    var s = suggestions().concat(["Take me to the contact section", "View this as an engineer"]);
    var looking = App.activeSection && App.activeSection !== "top";
    log.innerHTML =
      '<div class="chat__welcome"><h2 class="display">What would you like to <span class="serif gradient">know?</span></h2>' +
      "<p>I search this portfolio's own content and answer only from what is published here. No language model, no network calls, nothing you type leaves this page.</p>" +
      '<p class="mono">' + (looking ? "Based on what you are viewing" : "Try asking") + "</p>" +
      '<div class="suggest">' + s.map(function (q, i) {
        return '<button type="button" data-q="' + esc(q) + '" style="--i:' + i + '">' + esc(q) + "</button>";
      }).join("") + "</div></div>";
    clearBtn.hidden = true;
  }

  /* ---------- Actions the assistant can take ---------- */

  function toast(text) {
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = "<span>" + icon("check") + esc(text) + "</span>";
    panel.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }

  function perform(a) {
    switch (a.type) {
      case "scroll": return App.go("/" + a.target);
      case "route": return App.go(a.href);
      case "case": return App.openCase(a.id);
      case "theme": return App.toggleTheme();
      case "lens": return App.setLens(a.lens);
      case "copy-email": return App.copyEmail(function () { toast("Email copied"); });
      case "open": return window.open(a.href, "_blank", "noopener,noreferrer");
    }
  }

  /* ---------- Conversation ---------- */

  var actionsById = {};

  function extras(id, a, isLast) {
    var html = "";
    if (a.sources.length) {
      html += '<div class="sources"><span class="mono">' + icon("shield-check") + " Sources</span>" + a.sources.map(function (s) {
        return '<button type="button" data-href="' + esc(s.href) + '">' + esc(s.label) + "</button>";
      }).join("") + "</div>";
    }
    if (a.actions.length) {
      html += '<div class="actions">' + a.actions.map(function (act, i) {
        return '<button type="button" data-act="' + id + ":" + i + '">' + esc(act.label) + icon("arrow-up-right") + "</button>";
      }).join("") + "</div>";
    }
    if (isLast && a.followups.length) {
      html += '<div class="followups">' + a.followups.map(function (f) {
        return '<button type="button" data-q="' + esc(f) + '">' + esc(f) + "</button>";
      }).join("") + "</div>";
    }
    return '<div class="msg-extras">' + html + "</div>";
  }

  function follow(question) {
    // Follow the reply as it streams, but stop once the question reaches the top,
    // so a long answer can be read from its first line.
    var bottom = log.scrollHeight - log.clientHeight;
    log.scrollTop = Math.min(question.offsetTop - 12, bottom);
  }

  // The reply that is still streaming, if any. A new question completes it first,
  // so two answers never type into the log at once.
  var streaming = null;

  function send(raw) {
    var text = String(raw || "").trim();
    if (!text) return;
    if (App.track) App.track("ask", text);
    if (streaming) streaming(false);
    if (log.querySelector(".chat__welcome")) log.innerHTML = "";
    log.querySelectorAll(".followups").forEach(function (f) { f.remove(); });
    clearBtn.hidden = false;

    // On a case study page, "this project" means the project on screen.
    var query = text;
    if (App.page === "case") {
      var slug = document.body.getAttribute("data-slug");
      var here = (window.PORTFOLIO.caseStudies || []).filter(function (c) { return c.slug === slug; })[0];
      if (here) query = text.replace(/\b(this|the) (project|app|tool|system|case study)\b/gi, here.name);
    }
    var a = Engine.answer(query, App.lens);
    var id = ++count;
    actionsById[id] = a.actions;

    var q = document.createElement("div");
    q.className = "msg-user";
    q.innerHTML = "<p>" + esc(text) + "</p>";
    log.appendChild(q);

    var m = document.createElement("div");
    m.className = "msg-bot";
    m.innerHTML = '<span class="avatar avatar--sm">' + icon("sparkles") + '</span><div class="msg-bot__body">' +
      (a.run ? '<div class="ran">' + icon("check") + esc(a.run.label) + "</div>" : "") + '<div class="msg-text"></div></div>';
    log.appendChild(m);
    var out = m.querySelector(".msg-text");
    field.value = "";
    autosize();
    follow(q);

    if (a.run) setTimeout(function () { perform(a.run); }, 350);

    var timer = null;
    // isLast is false when a newer question interrupts: the old reply is completed
    // with its sources and actions, but without follow-up suggestions.
    function finish(isLast) {
      clearInterval(timer);
      streaming = null;
      out.innerHTML = rich(a.text);
      m.querySelector(".msg-bot__body").insertAdjacentHTML("beforeend", extras(id, a, isLast !== false));
      if (isLast !== false) follow(q);
    }
    if (reduced.matches) return finish(true);

    // Stream a few characters at a time, without cutting a bold marker in half.
    var n = 0;
    var stepSize = Math.max(3, Math.round(a.text.length / 110));
    streaming = finish;
    timer = setInterval(function () {
      n = Math.min(a.text.length, n + stepSize);
      var shown = a.text.slice(0, n);
      if ((shown.match(/\*\*/g) || []).length % 2 === 1) shown += "**";
      out.innerHTML = rich(shown) + '<span class="caret"></span>';
      follow(q);
      if (n >= a.text.length) finish(true);
    }, 16);
  }

  log.addEventListener("click", function (e) {
    var q = e.target.closest("[data-q]");
    if (q) return send(q.getAttribute("data-q"));
    var s = e.target.closest("[data-href]");
    if (s) return App.go(s.getAttribute("data-href"));
    var act = e.target.closest("[data-act]");
    if (act) {
      var parts = act.getAttribute("data-act").split(":");
      var list = actionsById[parts[0]];
      if (list) perform(list[+parts[1]]);
    }
  });

  /* ---------- Open / close ---------- */

  function isOpen() { return panel.classList.contains("is-open"); }
  function open() {
    dismissNudge();
    if (!log.children.length) welcome();
    panel.classList.add("is-open");
    panel.inert = false;
    fab.classList.add("is-hidden");
    $$(".ask-toggle").forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    setTimeout(function () { field.focus({ preventScroll: true }); }, 250);
  }
  function close() {
    panel.classList.remove("is-open");
    panel.inert = true;
    fab.classList.remove("is-hidden");
    $$(".ask-toggle").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
  }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  App.ask = function (q) {
    if (App.closePalette) App.closePalette();
    var wasOpen = isOpen();
    open();
    setTimeout(function () { send(q); }, wasOpen ? 0 : 280);
  };

  fab.addEventListener("click", open);
  $$(".ask-toggle").forEach(function (b) { b.addEventListener("click", function () { isOpen() ? close() : open(); }); });
  $$("[data-ask]").forEach(function (b) { b.addEventListener("click", function () { App.ask(b.getAttribute("data-ask")); }); });
  panel.querySelector("[data-close]").addEventListener("click", close);
  clearBtn.addEventListener("click", function () { if (streaming) streaming(false); log.innerHTML = ""; welcome(); });
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") { e.preventDefault(); isOpen() ? close() : open(); }
    else if (e.key === "Escape" && isOpen() && !(App.caseOpen && App.caseOpen())) close();
  });

  /* ---------- Input ---------- */

  function autosize() {
    field.style.height = "auto";
    field.style.height = Math.min(field.scrollHeight, 112) + "px";
    sendBtn.disabled = !field.value.trim();
  }
  field.addEventListener("input", autosize);
  field.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(field.value); }
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); send(field.value); });
  autosize();

  // Voice input where the browser supports it.
  var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (Recognition) {
    micBtn.hidden = false;
    var rec = null;
    micBtn.addEventListener("click", function () {
      if (rec) { rec.stop(); return; }
      rec = new Recognition();
      rec.lang = "en-US";
      rec.interimResults = true;
      var finalText = "";
      rec.onresult = function (e) {
        var t = "";
        for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        field.value = t;
        autosize();
        if (e.results[e.results.length - 1].isFinal) finalText = t;
      };
      rec.onend = function () {
        rec = null;
        micBtn.setAttribute("aria-pressed", "false");
        micBtn.setAttribute("aria-label", "Ask by voice");
        field.placeholder = "Ask about projects, skills, results…";
        if (finalText.trim()) send(finalText);
      };
      rec.onerror = function () { if (rec) rec.stop(); };
      micBtn.setAttribute("aria-pressed", "true");
      micBtn.setAttribute("aria-label", "Stop listening");
      field.placeholder = "Listening…";
      rec.start();
    });
  }

  /* ---------- One gentle, dismissible nudge per visit ---------- */

  function dismissNudge() {
    if (!nudge) return;
    nudge.classList.remove("is-on");
    try { sessionStorage.setItem("assistant-nudge", "1"); } catch (e) {}
  }
  if (nudge) {
    var seen = false;
    try { seen = !!sessionStorage.getItem("assistant-nudge"); } catch (e) { seen = true; }
    if (!seen) {
      setTimeout(function () {
        if (isOpen()) return;
        nudge.querySelector(".nudge__go").textContent = suggestions()[0];
        nudge.classList.add("is-on");
      }, 9000);
      setTimeout(function () { nudge.classList.remove("is-on"); }, 24000);
    }
    nudge.querySelector(".nudge__x").addEventListener("click", dismissNudge);
    nudge.querySelector(".nudge__go").addEventListener("click", function () {
      var q = this.textContent;
      dismissNudge();
      App.ask(q);
    });
  }

})();
