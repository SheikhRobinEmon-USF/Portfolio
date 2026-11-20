/*
 * Particle field: the WebGL backdrop.
 * One cloud of points that morphs between five shapes as the page scrolls:
 * sphere, wave, knot, helix and halo. Plain WebGL, no libraries.
 * Sections opt in with data-scene="0..4".
 */
(function () {
  "use strict";

  var SHAPES = 5;

  /* Deterministic random numbers, so the field looks the same on every visit. */
  function mulberry32(seed) {
    var a = seed;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildShapes(count) {
    var rnd = mulberry32(20261116);
    var shapes = [];
    for (var s = 0; s < SHAPES; s++) shapes.push(new Float32Array(count * 3));
    var rand = new Float32Array(count * 3);
    var golden = Math.PI * (3 - Math.sqrt(5));
    var cols = Math.ceil(Math.sqrt(count * 2.1));
    var rows = Math.ceil(count / cols);

    for (var i = 0; i < count; i++) {
      var t = i / (count - 1);
      var r1 = rnd(), r2 = rnd(), r3 = rnd();
      var o = i * 3;
      rand[o] = r1; rand[o + 1] = r2; rand[o + 2] = r3;

      // 0. Fibonacci sphere with a thin shell
      var y = 1 - t * 2;
      var rad = Math.sqrt(1 - y * y);
      var th = golden * i;
      var shell = 1.55 + (r1 - 0.5) * 0.08 + (r2 > 0.94 ? r3 * 0.5 : 0);
      shapes[0][o] = Math.cos(th) * rad * shell;
      shapes[0][o + 1] = y * shell;
      shapes[0][o + 2] = Math.sin(th) * rad * shell;

      // 1. Wave sheet (the shader keeps it rolling)
      var cx = (i % cols) / (cols - 1) - 0.5;
      var cz = Math.floor(i / cols) / (rows - 1) - 0.5;
      var wx = cx * 7.4, wz = cz * 3.8;
      shapes[1][o] = wx;
      shapes[1][o + 1] = Math.sin(wx * 1.25) * 0.34 + Math.cos(wz * 2.1 + wx * 0.6) * 0.26 - 0.2;
      shapes[1][o + 2] = wz;

      // 2. Trefoil knot tube
      var u = t * Math.PI * 6 + r1 * 0.02;
      var k = u / 3;
      var cr = 0.95 + 0.42 * Math.cos(3 * k);
      var bx = cr * Math.cos(2 * k), by = cr * Math.sin(2 * k), bz = 0.46 * Math.sin(3 * k);
      var a = r2 * Math.PI * 2;
      var tube = 0.2 * Math.sqrt(r3);
      shapes[2][o] = (bx + Math.cos(a) * tube * Math.cos(2 * k)) * 1.35;
      shapes[2][o + 1] = (by + Math.cos(a) * tube * Math.sin(2 * k)) * 1.35;
      shapes[2][o + 2] = (bz + Math.sin(a) * tube) * 1.35;

      // 3. Double helix with rungs
      if (r1 > 0.72) {
        var sn = Math.round(t * 34) / 34;
        var ya = (sn - 0.5) * 5.4, aa = sn * Math.PI * 7, sp = (r2 - 0.5) * 2;
        shapes[3][o] = Math.cos(aa) * 0.95 * sp;
        shapes[3][o + 1] = ya;
        shapes[3][o + 2] = Math.sin(aa) * 0.95 * sp;
      } else {
        var ang = t * Math.PI * 7, strand = i % 2 === 0 ? 0 : Math.PI, j = 0.07;
        shapes[3][o] = Math.cos(ang + strand) * 0.95 + (r2 - 0.5) * j;
        shapes[3][o + 1] = (t - 0.5) * 5.4 + (r3 - 0.5) * j;
        shapes[3][o + 2] = Math.sin(ang + strand) * 0.95 + (r1 - 0.5) * j;
      }

      // 4. Halo: a dense ring with a faint spiral disc
      var ha = r1 * Math.PI * 2;
      var inner = r2 > 0.3;
      var hr = inner ? 1.75 + (r3 - 0.5) * 0.14 : 0.5 + Math.pow(r3, 0.6) * 2.5;
      var tw = inner ? 0 : hr * 0.9;
      shapes[4][o] = Math.cos(ha + tw) * hr;
      shapes[4][o + 1] = (r2 - 0.5) * (inner ? 0.07 : 0.16);
      shapes[4][o + 2] = Math.sin(ha + tw) * hr;
    }
    return { shapes: shapes, rand: rand };
  }

  /* Where the cloud sits for each shape, as fractions of the visible half-size. */
  var POSES = {
    desktop: [
      { x: 0.5, y: 0.02, scale: 1.12, rx: 0.15, ry: 0, rz: 0.1, spin: 0.09, opacity: 1 },
      { x: 0, y: -0.38, scale: 1.25, rx: 0.42, ry: 0.2, rz: 0, spin: 0, opacity: 0.6 },
      { x: 0.62, y: 0.3, scale: 0.92, rx: 0.5, ry: 0.3, rz: 0.2, spin: 0.07, opacity: 0.42 },
      { x: 0.72, y: 0, scale: 0.98, rx: 0.1, ry: 0, rz: -0.22, spin: 0.14, opacity: 0.55 },
      { x: 0, y: -0.1, scale: 1.5, rx: 1.12, ry: 0, rz: 0.12, spin: 0.05, opacity: 0.8 }
    ],
    mobile: [
      { x: 0.35, y: 0.42, scale: 0.78, rx: 0.15, ry: 0, rz: 0.1, spin: 0.09, opacity: 0.75 },
      { x: 0, y: -0.5, scale: 0.8, rx: 0.42, ry: 0.2, rz: 0, spin: 0, opacity: 0.45 },
      { x: 0.5, y: 0.5, scale: 0.6, rx: 0.5, ry: 0.3, rz: 0.2, spin: 0.07, opacity: 0.28 },
      { x: 0.85, y: 0, scale: 0.7, rx: 0.1, ry: 0, rz: -0.22, spin: 0.14, opacity: 0.32 },
      { x: 0, y: -0.25, scale: 0.85, rx: 1.12, ry: 0, rz: 0.12, spin: 0.05, opacity: 0.6 }
    ]
  };

  var VERT = [
    "attribute vec3 aPos0;",
    "attribute vec3 aPos1;",
    "attribute vec3 aPos2;",
    "attribute vec3 aPos3;",
    "attribute vec3 aPos4;",
    "attribute vec3 aRand;",
    "uniform mat4 uModelView;",
    "uniform mat4 uProjection;",
    "uniform float uTime;",
    "uniform float uProgress;",
    "uniform float uPixelRatio;",
    "uniform float uSize;",
    "uniform float uCalm;",
    "uniform float uSolidV;",
    "uniform vec3 uColorA;",
    "uniform vec3 uColorB;",
    "uniform vec3 uColorC;",
    "varying vec3 vColor;",
    "varying float vAlpha;",
    "vec3 flow(vec3 p, float t) {",
    "  return vec3(",
    "    sin(p.y * 1.7 + t * 0.9) + sin(p.z * 2.3 - t * 0.6),",
    "    sin(p.z * 1.9 + t * 0.7) + sin(p.x * 2.1 + t * 0.5),",
    "    sin(p.x * 1.6 - t * 0.8) + sin(p.y * 2.5 + t * 0.4)) * 0.5;",
    "}",
    "vec3 shape(float i) {",
    "  if (i < 0.5) return aPos0;",
    "  if (i < 1.5) return aPos1;",
    "  if (i < 2.5) return aPos2;",
    "  if (i < 3.5) return aPos3;",
    "  return aPos4;",
    "}",
    "void main() {",
    "  float p = clamp(uProgress, 0.0, 3.9999);",
    "  float seg = floor(p);",
    "  float f = p - seg;",
    // Each particle leaves and arrives on its own schedule.
    "  float delay = aRand.x * 0.4;",
    "  float ft = smoothstep(delay, delay + 0.6, f);",
    "  ft = ft * ft * (3.0 - 2.0 * ft);",
    "  vec3 pos = mix(shape(seg), shape(seg + 1.0), ft);",
    "  float waveAmt = 1.0 - clamp(abs(uProgress - 1.0), 0.0, 1.0);",
    "  pos.y += sin(pos.x * 1.3 + uTime * 0.8) * cos(pos.z * 1.6 + uTime * 0.5) * 0.22 * waveAmt * uCalm;",
    // Turbulence peaks mid-morph, then settles into a slow drift.
    "  float mid = sin(ft * 3.14159265);",
    "  vec3 n = flow(pos * 0.9 + aRand * 4.0, uTime * 0.6);",
    "  pos += n * (0.035 + mid * (0.5 + aRand.y * 0.9)) * uCalm;",
    "  vec4 mv = uModelView * vec4(pos, 1.0);",
    "  gl_Position = uProjection * mv;",
    "  float size = uSize * (0.55 + aRand.z * 1.1);",
    "  size *= 1.0 + step(0.985, aRand.y) * mix(2.2, 0.6, uSolidV);",
    "  size *= mix(1.0, 0.62, uSolidV);",
    "  gl_PointSize = size * uPixelRatio * (1.0 / -mv.z);",
    "  float g = clamp(pos.y * 0.26 + 0.5 + (aRand.z - 0.5) * 0.35, 0.0, 1.0);",
    "  vColor = g < 0.5 ? mix(uColorA, uColorB, g * 2.0) : mix(uColorB, uColorC, (g - 0.5) * 2.0);",
    "  float depth = smoothstep(-9.5, -4.0, mv.z);",
    "  vAlpha = (0.35 + 0.65 * depth) * (0.55 + aRand.x * 0.45);",
    "}"
  ].join("\n");

  var FRAG = [
    "precision mediump float;",
    "uniform float uOpacity;",
    "uniform float uSolid;",
    "varying vec3 vColor;",
    "varying float vAlpha;",
    "void main() {",
    "  vec2 uv = gl_PointCoord - 0.5;",
    "  float d = length(uv);",
    "  if (d > 0.5) discard;",
    "  float soft = smoothstep(0.5, 0.0, d);",
    "  float core = smoothstep(0.22, 0.0, d);",
    "  float a = mix(soft * soft, smoothstep(0.5, 0.32, d), uSolid) * vAlpha * uOpacity;",
    "  gl_FragColor = vec4(vColor + core * 0.35 * (1.0 - uSolid), a);",
    "}"
  ].join("\n");

  var PALETTES = {
    dark: ["#7a5cff", "#3fd0ff", "#d6ff3f"],
    light: ["#4a2fe0", "#0b84b8", "#5f7d00"]
  };

  function hex(c) {
    var n = parseInt(c.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function damp(a, b, lambda, dt) { return a + (b - a) * (1 - Math.exp(-lambda * dt)); }

  /* Minimal column-major 4x4 matrix helpers. */
  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
  }
  function multiply(a, b) {
    var out = new Array(16);
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        out[c * 4 + r] =
          a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
    return out;
  }
  /* Translation, then rotation in XYZ order, then uniform scale. */
  function modelMatrix(tx, ty, tz, rx, ry, rz, s) {
    var cx = Math.cos(rx), sx = Math.sin(rx);
    var cy = Math.cos(ry), sy = Math.sin(ry);
    var cz = Math.cos(rz), sz = Math.sin(rz);
    // R = Rx * Ry * Rz (same as three.js Euler "XYZ")
    var m00 = cy * cz, m01 = -cy * sz, m02 = sy;
    var m10 = cx * sz + sx * sy * cz, m11 = cx * cz - sx * sy * sz, m12 = -sx * cy;
    var m20 = sx * sz - cx * sy * cz, m21 = sx * cz + cx * sy * sz, m22 = cx * cy;
    return [
      m00 * s, m10 * s, m20 * s, 0,
      m01 * s, m11 * s, m21 * s, 0,
      m02 * s, m12 * s, m22 * s, 0,
      tx, ty, tz, 1
    ];
  }

  function mixPose(list, p) {
    var i = clamp(Math.floor(p), 0, SHAPES - 2);
    var t = clamp(p - i, 0, 1);
    var e = t * t * (3 - 2 * t);
    var a = list[i], b = list[i + 1], out = {};
    for (var key in a) out[key] = a[key] + (b[key] - a[key]) * e;
    return out;
  }

  function collectAnchors() {
    var out = [];
    var vh = window.innerHeight;
    var els = document.querySelectorAll("[data-scene]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var v = Number(el.getAttribute("data-scene"));
      var r = el.getBoundingClientRect();
      var top = r.top + window.scrollY;
      var pad = Math.min(r.height * 0.3, vh * 0.55);
      out.push({ y: top + pad, v: v }, { y: top + r.height - pad, v: v });
    }
    return out.sort(function (a, b) { return a.y - b.y; });
  }

  function progressAt(anchors, y) {
    if (!anchors.length) return 0;
    if (y <= anchors[0].y) return anchors[0].v;
    for (var i = 0; i < anchors.length - 1; i++) {
      var a = anchors[i], b = anchors[i + 1];
      if (y >= a.y && y <= b.y) {
        var span = b.y - a.y;
        return span <= 0 ? b.v : a.v + ((y - a.y) / span) * (b.v - a.v);
      }
    }
    return anchors[anchors.length - 1].v;
  }

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function start(container) {
    var canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    var gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: "high-performance" });
    if (!gl) return null;

    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    var small = window.innerWidth < 900;
    var weak = (navigator.hardwareConcurrency || 8) <= 4;
    var count = small ? 6500 : weak ? 10000 : 16000;
    var data = buildShapes(count);

    function attribute(name, array) {
      var loc = gl.getAttribLocation(prog, name);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    }
    for (var s = 0; s < SHAPES; s++) attribute("aPos" + s, data.shapes[s]);
    attribute("aRand", data.rand);

    var U = {};
    ["uModelView", "uProjection", "uTime", "uProgress", "uPixelRatio", "uSize", "uCalm", "uSolidV", "uSolid", "uOpacity", "uColorA", "uColorB", "uColorC"].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });
    gl.uniform1f(U.uSize, 30);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);

    container.appendChild(canvas);

    // Phones may reclaim the GPU in background tabs. Hide the canvas cleanly and
    // stop drawing; the page keeps its colour glows underneath.
    var lost = false;
    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      lost = true;
      canvas.style.display = "none";
    });

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    var state = { anchors: [], progress: 0, spin: 0, mx: 0, my: 0, tmx: 0, tmy: 0, opacity: 0, ready: false, solid: 0, visible: true };
    var dpr = 1, w = 1, h = 1;

    function setTheme(theme) {
      var p = PALETTES[theme] || PALETTES.dark;
      gl.uniform3fv(U.uColorA, hex(p[0]));
      gl.uniform3fv(U.uColorB, hex(p[1]));
      gl.uniform3fv(U.uColorC, hex(p[2]));
      state.solid = theme === "light" ? 1 : 0;
      gl.uniform1f(U.uSolid, state.solid);
      gl.uniform1f(U.uSolidV, state.solid);
      if (state.solid) gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      else gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      state.anchors = collectAnchors();
    }

    var measureQueued = false;
    function remeasure() {
      if (measureQueued) return;
      measureQueued = true;
      requestAnimationFrame(function () {
        measureQueued = false;
        state.anchors = collectAnchors();
      });
    }

    window.addEventListener("resize", resize);
    if (window.ResizeObserver) new ResizeObserver(remeasure).observe(document.body);
    window.addEventListener("pointermove", function (e) {
      state.tmx = (e.clientX / window.innerWidth) * 2 - 1;
      state.tmy = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    document.addEventListener("visibilitychange", function () { state.visible = !document.hidden; });

    resize();
    setTheme(document.documentElement.getAttribute("data-theme") || "dark");

    var FOV = (42 * Math.PI) / 180, CAM = 7;
    var t0 = performance.now(), last = t0;

    function frame(now) {
      requestAnimationFrame(frame);
      if (!state.visible || lost) { last = now; return; }
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      var calm = reduced.matches;

      var target = progressAt(state.anchors, window.scrollY + window.innerHeight * 0.5);
      if (!state.ready) { state.progress = target; state.ready = true; }
      state.progress = calm ? target : damp(state.progress, target, 3.2, dt);

      var pose = mixPose(w < 900 ? POSES.mobile : POSES.desktop, state.progress);
      state.mx = damp(state.mx, state.tmx, 2.5, dt);
      state.my = damp(state.my, state.tmy, 2.5, dt);
      if (!calm) state.spin += dt * pose.spin;

      var aspect = w / h;
      var visH = 2 * CAM * Math.tan(FOV / 2), visW = visH * aspect;
      var model = modelMatrix(
        pose.x * visW * 0.5, pose.y * visH * 0.5, 0,
        pose.rx + state.my * 0.12, pose.ry + state.spin + state.mx * 0.18, pose.rz,
        pose.scale
      );
      var view = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -CAM, 1];
      gl.uniformMatrix4fv(U.uModelView, false, new Float32Array(multiply(view, model)));
      gl.uniformMatrix4fv(U.uProjection, false, new Float32Array(perspective(FOV, aspect, 0.1, 40)));

      state.opacity = damp(state.opacity, pose.opacity * (state.solid ? 0.62 : 0.9), 2.2, dt);
      gl.uniform1f(U.uTime, calm ? 0 : (now - t0) / 1000);
      gl.uniform1f(U.uProgress, state.progress);
      gl.uniform1f(U.uCalm, calm ? 0.25 : 1);
      gl.uniform1f(U.uPixelRatio, dpr * (h / 900));
      gl.uniform1f(U.uOpacity, state.opacity);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, count);
    }
    requestAnimationFrame(frame);

    return { setTheme: setTheme, remeasure: remeasure };
  }

  window.ParticleField = {
    start: function (container) {
      try {
        return start(container);
      } catch (err) {
        // No WebGL, or the GPU refused the shader: the page still works without the backdrop.
        if (window.console) console.warn("Particle field disabled:", err);
        return null;
      }
    }
  };
})();
