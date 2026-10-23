/* Concepts — interactive pieces for the permutation-power page.
   Needs window.CONCEPT_DATA (data.js) and window.CONCEPT_I18N (set inline per language). */
(function () {
  "use strict";
  var D = window.CONCEPT_DATA;
  var T = window.CONCEPT_I18N || {};
  if (!D) { return; }
  var NS = "http://www.w3.org/2000/svg";

  function $(id) { return document.getElementById(id); }
  function fmt(str, v) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; });
  }
  function S(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") { e.textContent = attrs[k]; } else { e.setAttribute(k, attrs[k]); }
      });
    }
    if (parent) { parent.appendChild(e); }
    return e;
  }
  function lin(d0, d1, r0, r1) { var k = (r1 - r0) / (d1 - d0); return function (v) { return r0 + (v - d0) * k; }; }
  function lg(d0, d1, r0, r1) {
    var a = Math.log(d0), k = (r1 - r0) / (Math.log(d1) - a);
    return function (v) { return r0 + (Math.log(v) - a) * k; };
  }
  function path(pts) {
    return "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L");
  }
  function niceAxis(maxv, target) {
    var raw = maxv / (target || 5), p = Math.pow(10, Math.floor(Math.log10(raw))), step = p * 10;
    [1, 2, 2.5, 5, 10].some(function (f) { if (f * p >= raw) { step = f * p; return true; } return false; });
    var top = Math.ceil(maxv / step - 1e-9) * step, ticks = [];
    for (var t = 0; t <= top + 1e-9; t += step) { ticks.push(+t.toFixed(6)); }
    return { max: top, ticks: ticks };
  }
  function fixed(v, k) { return (+v).toFixed(k); }

  /* ---------- generic SVG chart ---------- */
  function chart(container, o) {
    var lastW = 0, svgEl = null;
    function render(force) {
      var W = Math.floor(container.clientWidth);
      if (!W) { return; }
      if (!force && W === lastW) { return; }
      lastW = W;
      var m = o.margin;
      var H = typeof o.height === "function" ? o.height(W) : o.height;
      var iw = W - m.l - m.r, ih = H - m.t - m.b;
      var ax = o.axes();
      var X = ax.x, Y = ax.y;
      if (svgEl) { container.removeChild(svgEl); }
      svgEl = S("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": o.label || "" });
      container.appendChild(svgEl);
      var g = S("g", { transform: "translate(" + m.l + "," + m.t + ")" }, svgEl);
      var sx = (X.type === "log" ? lg : lin)(X.domain[0], X.domain[1], 0, iw);
      var sy = lin(Y.domain[0], Y.domain[1], ih, 0);
      var a = S("g", { "class": "ax" }, g);
      S("line", { x1: 0, x2: iw, y1: ih, y2: ih }, a);
      if (!Y.hide) { S("line", { x1: 0, x2: 0, y1: 0, y2: ih }, a); }
      X.ticks.forEach(function (t) {
        var x = sx(t);
        S("line", { x1: x, x2: x, y1: ih, y2: ih + 6 }, a);
        S("text", { x: x, y: ih + 22, "text-anchor": "middle", text: (X.format || String)(t) }, a);
      });
      Y.ticks.forEach(function (t) {
        var y = sy(t);
        S("line", { x1: -6, x2: 0, y1: y, y2: y }, a);
        S("text", { x: -10, y: y + 4, "text-anchor": "end", text: (Y.format || String)(t) }, a);
      });
      if (X.title) { S("text", { x: iw, y: ih + 46, "text-anchor": "end", "class": "ax-title", text: X.title }, a); }
      if (Y.title) { S("text", { x: 0, y: -14, "text-anchor": "start", "class": "ax-title", text: Y.title }, a); }
      o.draw({ g: g, svg: svgEl, sx: sx, sy: sy, iw: iw, ih: ih, W: W, H: H });
    }
    render(true);
    if (window.ResizeObserver) {
      new ResizeObserver(function () { render(false); }).observe(container);
    } else {
      window.addEventListener("resize", function () { render(false); });
    }
    return { render: render };
  }

  var INK = "var(--ink)", BLUE = "var(--blue)", VERM = "var(--vermilion)", GREY = "var(--grey-series)";

  /* ---------- explorer: trials per condition vs subjects needed ---------- */
  (function explorer() {
    var nIn = $("exp-n"), dIn = $("exp-d");
    if (!nIn || !dIn) { return; }
    var box = $("exp-chart");
    var state = { i: 0, dl: 15, need: 0, floor: 0 };
    var cx = chart(box, {
      margin: { t: 30, r: 18, b: 54, l: 46 },
      height: function (W) { return W < 420 ? 300 : 340; },
      label: T.chartExp,
      axes: function () {
        var req = D.req[state.dl].n;
        var Y = niceAxis(req[0] * 1.04, 5);
        return {
          x: { type: "log", domain: [4.2, 780], ticks: [5, 10, 20, 40, 80, 160, 320, 640], title: T.xTrials },
          y: { domain: [0, Y.max], ticks: Y.ticks, title: T.yReqN }
        };
      },
      draw: function (c) {
        var req = D.req[state.dl], g = c.g, G = D.nGrid;
        var fy = c.sy(req.inf);
        var area = G.map(function (n, k) { return [c.sx(n), c.sy(req.n[k])]; });
        var poly = area.slice();
        poly.push([c.sx(G[G.length - 1]), fy]);
        poly.push([c.sx(G[0]), fy]);
        S("path", { d: path(poly) + "Z", style: "fill:var(--vermilion-soft);stroke:none" }, g);
        S("line", { x1: 0, x2: c.iw, y1: fy, y2: fy, style: "stroke:" + BLUE + ";stroke-width:1.8;stroke-dasharray:7 5" }, g);
        S("text", { x: c.iw, y: fy - 8, "text-anchor": "end", "class": "lab-svg", style: "fill:" + BLUE, text: fmt(T.floor, { v: req.inf }) }, g);
        S("path", { d: path(area), style: "fill:none;stroke:" + INK + ";stroke-width:2.2" }, g);
        area.forEach(function (p) { S("circle", { cx: p[0], cy: p[1], r: 2.6, style: "fill:" + INK }, g); });
        var px = c.sx(G[state.i]), py = c.sy(req.n[state.i]);
        S("line", { x1: px, x2: px, y1: py, y2: c.ih, style: "stroke:" + INK + ";stroke-width:1;stroke-dasharray:2 3" }, g);
        S("circle", { cx: px, cy: py, r: 7.5, style: "fill:var(--surface);stroke:" + INK + ";stroke-width:2.6" }, g);
        var anchor = px > c.iw * 0.62 ? "end" : "start";
        var dx = anchor === "end" ? -13 : 13;
        S("text", { x: px + dx, y: py - 12, "text-anchor": anchor, "class": "lab-svg", style: "fill:" + INK,
          text: fmt(T.here, { n: D.nGrid[state.i], need: req.n[state.i] }) }, g);
      }
    });
    function update() {
      var i = +nIn.value, dl = +dIn.value, n = D.nGrid[i];
      var between = D.sdB * D.sdB, noise = 2 * D.sigmaT * D.sigmaT / n, total = between + noise;
      var maxTotal = between + 2 * D.sigmaT * D.sigmaT / D.nGrid[0];
      var sd = Math.sqrt(total), dz = dl / sd;
      var need = D.req[dl].n[i], floor = D.req[dl].inf;
      state.i = i; state.dl = dl; state.need = need; state.floor = floor;
      $("exp-n-out").textContent = n;
      $("exp-d-out").textContent = dl + " ms";
      nIn.setAttribute("aria-valuetext", "n = " + n);
      dIn.setAttribute("aria-valuetext", dl + " ms");
      $("mix-b").style.width = (between / maxTotal * 100).toFixed(2) + "%";
      $("mix-o").style.width = (noise / maxTotal * 100).toFixed(2) + "%";
      $("mix-cap").innerHTML = fmt(T.mixCap, { sd: fixed(sd, 1), dz: fixed(dz, 2), between: between, noise: Math.round(noise) });
      $("ans-need").textContent = need;
      $("ans-floor").textContent = floor;
      var save = need - floor;
      $("ans-foot").textContent = save <= 1 ? T.footDone : fmt(T.footMore, { save: save });
      cx.render(true);
    }
    nIn.addEventListener("input", update);
    dIn.addEventListener("input", update);
    update();
  })();

  /* ---------- sign-flip demo ---------- */
  (function signFlip() {
    var dotBox = $("flip-dots"), histBox = $("flip-hist"), read = $("flip-read");
    if (!dotBox || !histBox) { return; }
    var base = D.signFlip, N = base.length;
    var obs = base.reduce(function (a, b) { return a + b; }, 0) / N;
    var LO = -40, HI = 40, BW = 2, NB = (HI - LO) / BW;
    var signs = base.map(function () { return 1; });
    var counts = [], nFlips = 0, nExtreme = 0;
    var refs = null, meanRef = null, dotScale = null;
    function resetCounts() { counts = []; for (var b = 0; b < NB; b++) { counts.push(0); } nFlips = 0; nExtreme = 0; }
    resetCounts();

    function meanOf(s) { var t = 0; for (var i = 0; i < N; i++) { t += base[i] * s[i]; } return t / N; }
    function curMean() { return meanOf(signs); }

    var dots = chart(dotBox, {
      margin: { t: 26, r: 16, b: 54, l: 16 },
      height: 310,
      label: T.chartFlipDots,
      axes: function () { return { x: { domain: [-80, 80], ticks: [-80, -40, 0, 40, 80], title: T.flipX }, y: { domain: [0, 1], ticks: [], hide: true } }; },
      draw: function (c) {
        dotScale = c.sx;
        var g = c.g, rowH = c.ih / N;
        S("line", { x1: c.sx(0), x2: c.sx(0), y1: 0, y2: c.ih, style: "stroke:" + GREY + ";stroke-width:1" }, g);
        var mg = S("g", { "class": "dot no-anim" }, g);
        S("line", { x1: 0, x2: 0, y1: -4, y2: c.ih, style: "stroke:" + INK + ";stroke-width:1.5;stroke-dasharray:3 3" }, mg);
        var mt = S("text", { x: 0, y: -10, "text-anchor": "middle", "class": "lab-svg", style: "fill:" + INK, text: "" }, mg);
        meanRef = { g: mg, t: mt };
        refs = base.map(function (v, i) {
          var y = c.ih - (i + 0.5) * rowH;
          S("circle", { cx: c.sx(v), cy: y, r: 2, style: "fill:" + GREY }, g);
          var dg = S("g", { "class": "dot no-anim", style: "transform:translate(" + c.sx(v) + "px,0)" }, g);
          var ci = S("circle", { cx: 0, cy: y, r: 6 }, dg);
          return { g: dg, c: ci };
        });
        paintDots(false);
      }
    });

    function paintDots(animate) {
      if (!refs || !dotScale) { return; }
      var all = refs.map(function (r) { return r.g; }).concat([meanRef.g]);
      if (!animate) { all.forEach(function (e) { e.classList.add("no-anim"); }); }
      refs.forEach(function (r, i) {
        r.g.style.transform = "translate(" + dotScale(base[i] * signs[i]) + "px,0)";
        if (signs[i] < 0) {
          r.c.setAttribute("style", "fill:var(--surface);stroke:" + INK + ";stroke-width:2.2");
        } else {
          r.c.setAttribute("style", "fill:" + INK + ";stroke:" + INK + ";stroke-width:2.2");
        }
      });
      var mu = curMean();
      meanRef.g.style.transform = "translate(" + dotScale(mu) + "px,0)";
      meanRef.t.textContent = fmt(T.meanLab, { v: fixed(mu, 1) });
      if (!animate) {
        void meanRef.g.getBoundingClientRect();
        all.forEach(function (e) { e.classList.remove("no-anim"); });
      } else {
        all.forEach(function (e) { e.classList.remove("no-anim"); });
      }
    }

    var hist = chart(histBox, {
      margin: { t: 26, r: 16, b: 54, l: 46 },
      height: 310,
      label: T.chartFlipHist,
      axes: function () {
        var mx = Math.max.apply(null, counts), Y = niceAxis(Math.max(6, mx * 1.12), 4);
        return { x: { domain: [LO, HI], ticks: [-40, -20, 0, 20, 40], title: T.histX }, y: { domain: [0, Y.max], ticks: Y.ticks, title: T.histY } };
      },
      draw: function (c) {
        var g = c.g, defs = S("defs", null, g);
        var pat = S("pattern", { id: "hatch-tail", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
        S("line", { x1: 0, y1: 0, x2: 0, y2: 6, style: "stroke:" + INK + ";stroke-width:1.2;opacity:.5" }, pat);
        var xo = c.sx(obs), xm = c.sx(-obs);
        S("rect", { x: xo, y: 0, width: Math.max(0, c.iw - xo), height: c.ih, style: "fill:url(#hatch-tail)" }, g);
        S("rect", { x: 0, y: 0, width: Math.max(0, xm), height: c.ih, style: "fill:url(#hatch-tail)" }, g);
        counts.forEach(function (n, b) {
          var x0 = c.sx(LO + b * BW), x1 = c.sx(LO + (b + 1) * BW), mid = LO + (b + 0.5) * BW;
          var h = c.ih - c.sy(n);
          if (n > 0) {
            S("rect", { x: x0 + 0.5, y: c.sy(n), width: Math.max(1, x1 - x0 - 1), height: h,
              style: "fill:" + (Math.abs(mid) >= obs ? INK : GREY) }, g);
          }
        });
        S("line", { x1: xo, x2: xo, y1: -4, y2: c.ih, style: "stroke:" + INK + ";stroke-width:1.8;stroke-dasharray:5 3" }, g);
        S("text", { x: xo - 6, y: -10, "text-anchor": c.iw - xo < 70 ? "end" : "start", "class": "lab-svg", style: "fill:" + INK,
          text: fmt(T.observed, { v: fixed(obs, 1) }) }, g);
      }
    });

    function readout() {
      if (!nFlips) { read.innerHTML = T.flipIdle; return; }
      var p = (nExtreme + 1) / (nFlips + 1);
      read.innerHTML = fmt(T.flipRun, { n: nFlips, k: nExtreme, obs: fixed(obs, 1), p: fixed(p, 4) });
    }
    function one(record) {
      var s = signs.map(function () { return Math.random() < 0.5 ? -1 : 1; });
      var mu = meanOf(s);
      var b = Math.min(NB - 1, Math.max(0, Math.floor((mu - LO) / BW)));
      counts[b] += 1; nFlips += 1;
      if (Math.abs(mu) >= obs - 1e-9) { nExtreme += 1; }
      if (record) { signs = s; }
      return s;
    }
    function run(times) {
      var last = null;
      for (var t = 0; t < times; t++) { last = one(false); }
      signs = last;
      paintDots(times === 1);
      hist.render(true);
      readout();
    }
    document.querySelectorAll("[data-flip]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = btn.getAttribute("data-flip");
        if (v === "reset") {
          signs = base.map(function () { return 1; });
          resetCounts(); paintDots(true); hist.render(true); readout();
        } else {
          run(parseInt(v, 10));
        }
      });
    });
    readout();
  })();

  /* ---------- power vs N ---------- */
  (function powerN() {
    var box = $("chart-power-n");
    if (!box) { return; }
    chart(box, {
      margin: { t: 30, r: 18, b: 54, l: 46 },
      height: function (W) { return W < 420 ? 290 : 340; },
      label: T.chartPowerN,
      axes: function () {
        return {
          x: { domain: [5, 45], ticks: [10, 20, 30, 40], title: T.xN },
          y: { domain: [0, 1.02], ticks: [0, 0.2, 0.4, 0.6, 0.8, 1], title: T.yPower, format: function (v) { return fixed(v, 1); } }
        };
      },
      draw: function (c) {
        var g = c.g, P = D.powN, sim = D.simN;
        S("line", { x1: 0, x2: c.iw, y1: c.sy(0.8), y2: c.sy(0.8), style: "stroke:" + INK + ";stroke-width:1;stroke-dasharray:1.5 3.5" }, g);
        S("text", { x: c.iw, y: c.sy(0.8) + 16, "text-anchor": "end", "class": "ax", style: "fill:var(--muted);font-size:12px", text: "0.80" }, g);
        [["a25", INK], ["a15", GREY]].forEach(function (s) {
          var pts = P.N.map(function (n, k) { return [c.sx(n), c.sy(P[s[0]][k])]; });
          S("path", { d: path(pts), style: "fill:none;stroke:" + s[1] + ";stroke-width:1.6;stroke-dasharray:6 4" }, g);
        });
        sim.N.forEach(function (n, k) {
          S("circle", { cx: c.sx(n), cy: c.sy(sim.p25[k]), r: 4.6, style: "fill:" + INK + ";stroke:" + INK + ";stroke-width:1.6" }, g);
          S("rect", { x: c.sx(n) - 4.2, y: c.sy(sim.p15[k]) - 4.2, width: 8.4, height: 8.4, style: "fill:var(--surface);stroke:" + GREY + ";stroke-width:2" }, g);
        });
      }
    });
  })();

  /* ---------- power vs trials ---------- */
  (function powerT() {
    var box = $("chart-power-t");
    if (!box) { return; }
    chart(box, {
      margin: { t: 30, r: 18, b: 54, l: 46 },
      height: function (W) { return W < 420 ? 290 : 340; },
      label: T.chartPowerT,
      axes: function () {
        return {
          x: { type: "log", domain: [8, 700], ticks: [10, 20, 40, 80, 160, 320, 640], title: T.xTrials },
          y: { domain: [0, 1.02], ticks: [0, 0.2, 0.4, 0.6, 0.8, 1], title: T.yPower, format: function (v) { return fixed(v, 1); } }
        };
      },
      draw: function (c) {
        var g = c.g, P = D.powT, sim = D.simT, cy = c.sy(P.ceiling);
        var ana = P.n.map(function (n, k) { return [c.sx(n), c.sy(P.analytic[k])]; });
        var poly = ana.slice();
        poly.push([c.sx(P.n[P.n.length - 1]), cy]);
        poly.push([c.sx(P.n[0]), cy]);
        S("path", { d: path(poly) + "Z", style: "fill:var(--vermilion-soft);stroke:none" }, g);
        S("line", { x1: 0, x2: c.iw, y1: c.sy(0.8), y2: c.sy(0.8), style: "stroke:" + INK + ";stroke-width:1;stroke-dasharray:1.5 3.5" }, g);
        S("text", { x: 4, y: c.sy(0.8) - 6, "text-anchor": "start", "class": "ax", style: "fill:var(--muted);font-size:12px", text: "0.80" }, g);
        S("line", { x1: 0, x2: c.iw, y1: cy, y2: cy, style: "stroke:" + BLUE + ";stroke-width:1.8;stroke-dasharray:7 5" }, g);
        S("text", { x: c.iw, y: cy - 8, "text-anchor": "end", "class": "lab-svg", style: "fill:" + BLUE, text: fmt(T.ceiling, { v: fixed(P.ceiling, 2) }) }, g);
        S("path", { d: path(ana), style: "fill:none;stroke:" + GREY + ";stroke-width:1.6;stroke-dasharray:6 4" }, g);
        var line = sim.n.map(function (n, k) { return [c.sx(n), c.sy(sim.sim[k])]; });
        S("path", { d: path(line), style: "fill:none;stroke:" + INK + ";stroke-width:2" }, g);
        line.forEach(function (p) { S("circle", { cx: p[0], cy: p[1], r: 4.6, style: "fill:" + INK }, g); });
      }
    });
  })();
})();
