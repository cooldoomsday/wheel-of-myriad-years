(() => {
  'use strict';

  const W = 1280;
  const H = 720;
  const TAU = Math.PI * 2;
  const floor = 549;
  const pivot = { x: 957, y: 411 };
  const has = value => Number.isFinite(value);
  const clamp = n => Math.max(0, Math.min(1, n));
  const mix = (a, b, p) => a + (b - a) * p;
  const wrap = (value, period = 1) => ((value % period) + period) % period;
  const ease = p => p * p * (3 - 2 * p);
  const stage = (p, a, b) => ease(clamp((p - a) / (b - a)));
  const rgb = (a, b, p) => a.map((v, i) => Math.round(mix(v, b[i], p)));
  const color = (v, alpha = 1) => `rgba(${v.join(',')},${alpha})`;

  function random(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function polygon(ctx, fill, points) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(...points[i]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function paint(ctx, fill, draw) {
    ctx.beginPath();
    draw(ctx);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function line(ctx, tint, width, draw) {
    ctx.beginPath();
    draw(ctx);
    ctx.strokeStyle = tint;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function beam(ctx, ax, ay, bx, by, tint, width = 1) {
    line(ctx, tint, width, p => { p.moveTo(ax, ay); p.lineTo(bx, by); });
  }

  function oval(ctx, x, y, rx, ry, fill, rotation = 0) {
    paint(ctx, fill, p => p.ellipse(x, y, rx, ry, rotation, 0, TAU));
  }

  function ring(ctx, x, y, radius, width, tint, start = 0, end = TAU) {
    line(ctx, tint, width, p => p.arc(x, y, radius, start, end));
  }

  function rect(ctx, x, y, w, h, r, fill) {
    paint(ctx, fill, p => p.roundRect(x, y, w, h, r));
  }

  function gradient(ctx, x0, y0, x1, y1, stops) {
    const field = ctx.createLinearGradient(x0, y0, x1, y1);
    for (const [where, tint] of stops) field.addColorStop(where, tint);
    return field;
  }

  function glow(ctx, x, y, radius, height, tint, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, height / radius);
    const soft = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    soft.addColorStop(0, color(tint, alpha));
    soft.addColorStop(.47, color(tint, alpha * .47));
    soft.addColorStop(1, color(tint, 0));
    ctx.fillStyle = soft;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.restore();
  }

  function canvas(width, height, draw) {
    const surface = document.createElement('canvas');
    surface.width = width;
    surface.height = height;
    draw(surface.getContext('2d'));
    return surface;
  }

  function paper(ctx, width, height, origin, seed, opacity = 1) {
    const rand = random(seed);
    for (let i = 0; i < 16000 * opacity; i++) {
      const x = rand() * width;
      const y = origin + rand() * height;
      ctx.fillStyle = i % 3 ? 'rgba(49,37,29,.080)' : 'rgba(249,215,155,.11)';
      ctx.fillRect(x, y, .4 + rand() * 2.3, .29 + rand() * 1.3);
    }
  }

  function hills(ctx, base, height, period, seed, tint) {
    const points = [];
    const rand = random(seed);
    const phase = rand() * TAU;
    for (let x = -20; x <= W + 70; x += 10) {
      const v = Math.sin(x * period + phase) * .51 + Math.sin(x * period * 2.13) * .24 + Math.cos(x * period * 5.92 - phase) * .08;
      points.push([x, base - height * (v + rand() * .08)]);
    }
    polygon(ctx, tint, [...points, [W + 60, floor], [-20, floor]]);
  }

  function tree(ctx, x, y, size, seed) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    const rand = random(seed);
    line(ctx, '#6c7958', 3, p => { p.moveTo(0, 0); p.quadraticCurveTo(-1, -37, -6, -62); });
    for (let i = 0; i < 31; i++) {
      const rx = rand() * 17 + 5;
      const py = -65 + rand() ** .70 * 43;
      const px = (rand() - .55) * (16 + (py + 65) * .89);
      oval(ctx, px, py, rx, rx * (.14 + rand() * .32), i % 4 ? 'rgba(103,127,78,.54)' : 'rgba(160,160,96,.63)', rand() * .45 - .20);
    }
    ctx.restore();
  }

  function thatch(ctx, x, y, s, seed) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    polygon(ctx, '#baaa79', [[0, -52], [85, -52], [85, 0], [0, 0]]);
    polygon(ctx, '#9b8a5d', [[85, -52], [112, -47], [113, -4], [85, 0]]);
    polygon(ctx, '#9b8b59', [[-10, -51], [31, -86], [79, -87], [122, -46], [84, -51]]);
    polygon(ctx, '#c3a86e', [[-10, -52], [31, -86], [79, -87], [69, -82], [33, -81]]);
    const rand = random(seed);
    for (let i = 0; i < 40; i++) {
      const x = 8 + rand() * 78;
      const y = -80 + rand() * 25;
      beam(ctx, x, y, x - 4 + rand() * 9, y + 6, i % 3 ? 'rgba(73,73,48,.27)' : 'rgba(220,191,117,.45)', .82);
    }
    ctx.fillStyle = '#696850';
    ctx.fillRect(31, -32, 16, 32);
    ctx.fillRect(63, -35, 10, 13);
    beam(ctx, 27, -32, 48, -33, '#a08a61', 2.6);
    ctx.restore();
  }

  function farmBackdrop(ctx) {
    ctx.fillStyle = gradient(ctx, 0, 0, 0, 551, [[0, '#799fa0'], [.33, '#bec4a5'], [.71, '#ead6a0'], [1, '#b6ab74']]);
    ctx.fillRect(0, 0, W, H);
    glow(ctx, 228, 154, 336, 251, [248, 218, 148], .61);
    oval(ctx, 229, 153, 33, 33, '#ebcd8c');
    oval(ctx, 226, 152, 30, 30, '#f1d697');
    hills(ctx, 322, 134, .0057, 518, '#9cae9b');
    hills(ctx, 365, 106, .0084, 277, '#8a9d84');
    glow(ctx, 280, 364, 558, 81, [235, 223, 171], .41);
    hills(ctx, 424, 62, .0108, 1551, '#829772');
    hills(ctx, 463, 62, .0125, 551, '#919b6a');
    const rand = random(9536);
    for (let i = 0; i < 12; i++) {
      const y = 401 + i * (5 + i * .40);
      for (let j = -1; j < 13; j++) {
        const cell = 78 + i * 4.4;
        const x = j * cell + Math.sin(i * .52 + j) * 10;
        const step = 10 + Math.sin(i * .71) * 20;
        const tint = ['#a9a46b', '#a0a06b', '#8f9a67', '#90975f', '#b1a775'][Math.floor(rand() * 5)];
        polygon(ctx, tint, [[x, y], [x + cell - 4, y - 1], [x + step + cell - 4, y + 9 + i * .22], [x + step, y + 9 + i * .23]]);
        beam(ctx, x + step, y + 9, x + step + cell - 4, y + 8.8, 'rgba(234,211,137,.34)', .95 + i * .09);
        for (let k = 0; k < 4; k++) {
          const stem = x + k * cell / 4 + rand() * 8;
          beam(ctx, stem, y + 2, stem + step, y + 8.5, 'rgba(82,106,64,.25)', .76);
        }
      }
    }
    for (const [x, y, size] of [[94, 447, .64], [189, 461, .47], [318, 448, .52], [475, 475, .81], [586, 461, .58], [654, 438, .41], [711, 475, .66]]) {
      thatch(ctx, x, y, size, x * 38);
      tree(ctx, x + 83 * size, y + 4, size * .83, x * 93);
    }
    for (let i = 0; i < 32; i++) {
      const x = 12 + rand() * 845;
      const y = 482 + rand() * 57;
      for (let j = 0; j < 7; j++) {
        const h = 4 + rand() * 12;
        line(ctx, j % 4 ? '#889261' : '#b0a574', .8, p => {
          p.moveTo(x + j * 2, y);
          p.quadraticCurveTo(x + j * 3.5, y - .42 * h, x + j * 2 + (rand() - .51) * 13, y - h);
        });
      }
    }
    paper(ctx, W, 547, 0, 6278);
  }

  function shopBackdrop(ctx) {
    ctx.fillStyle = gradient(ctx, 0, 0, 0, 630, [[0, '#484447'], [.30, '#81756a'], [.65, '#ae9679'], [1, '#7b695a']]);
    ctx.fillRect(0, 0, W, H);
    glow(ctx, 228, 274, 521, 326, [222, 190, 143], .38);
    hills(ctx, 404, 95, .007, 799, '#8e8376');
    hills(ctx, 474, 95, .0085, 152, '#82756b');
    for (const [x, y, w, h, shade] of [[71, 453, 160, 120, '#746c62'], [238, 487, 99, 119, '#7c6e61'], [346, 485, 102, 89, '#6d635c']]) {
      polygon(ctx, shade, [[x, y - h], [x + w, y - h + 11], [x + w, y], [x, y]]);
      polygon(ctx, '#675d58', [[x - 12, y - h + 2], [x + 61, y - h - 34], [x + w + 9, y - h + 11]]);
      for (let side = 0; side < 2; side++) rect(ctx, x + 17 + side * 45, y - h + 28, 15, 23, 1, '#a59170');
    }
    for (const [x, y, width, height] of [[165, 314, 17, 36], [303, 361, 15, 29], [418, 388, 13, 32]]) {
      polygon(ctx, '#655b55', [[x, y - height], [x + width, y - height], [x + width + 2, y], [x - 1, y + 1]]);
      beam(ctx, x - 3, y - height, x + width + 4, y - height, '#70625a', 3.8);
    }
    paper(ctx, W, 545, 0, 2619);
  }

  function rafters(ctx) {
    ctx.save();
    const upper = gradient(ctx, 635, 60, 1210, 477, [[0, '#685d53'], [.57, '#776558'], [1, '#574845']]);
    polygon(ctx, upper, [[514, 125], [711, 63], [1295, 76], [1292, 547], [486, 546]]);
    const wall = gradient(ctx, 568, 203, 1201, 547, [[0, '#8d7763'], [.53, '#94806c'], [1, '#67574f']]);
    polygon(ctx, wall, [[493, 216], [1287, 178], [1295, 551], [488, 550]]);
    for (let row = 0; row < 19; row++) {
      const y = 218 + row * 17;
      beam(ctx, 490, y, 1297, y - 17 + row * .64, row % 3 ? 'rgba(64,53,46,.31)' : 'rgba(187,148,103,.26)', 1.46);
      for (let col = 0; col < 20; col++) {
        const x = 487 + col * 46 + (row % 2) * 22;
        beam(ctx, x, y - 4, x + 1.3, y + 11.8, 'rgba(63,55,49,.31)', 1.31);
      }
    }
    const umbra = gradient(ctx, 492, 93, 1264, 231, [[0, '#4b4745'], [.67, '#524b47'], [1, '#423b3d']]);
    polygon(ctx, umbra, [[476, 184], [592, 103], [714, 62], [1300, 69], [1297, 177], [881, 175], [499, 216]]);
    for (const [x, y, high] of [[526, 520, 177], [806, 529, 135], [1161, 528, 138], [1261, 540, 133]]) {
      beam(ctx, x, y, x + 6, high, '#514841', 18);
      beam(ctx, x + 5, y, x + 12, high, '#7f6a55', 4.3);
    }
    for (const [x, y, a, b] of [[526, 182, 596, 292], [810, 149, 878, 229], [1157, 164, 1090, 244], [1247, 157, 1206, 226]]) {
      beam(ctx, x, y, a, b, '#584c43', 13.7);
      beam(ctx, x - 2.5, y, a - 4, b + 5, '#78644f', 2.6);
    }
    for (const [x, y, w, h] of [[563, 245, 214, 143], [834, 214, 286, 172], [1192, 231, 75, 153]]) {
      rect(ctx, x - 6, y - 7, w + 13, h + 15, 6, '#514a44');
      const panes = gradient(ctx, x, y, x + w, y + h, [[0, '#bfad88'], [.64, '#a89675'], [1, '#ab9473']]);
      rect(ctx, x, y, w, h, 4, panes);
      for (let col = 1; col < 5; col++) beam(ctx, x + col * w / 5, y + 1, x + col * w / 5 + 1, y + h, '#655a4d', 3);
      for (let row = 1; row < 4; row++) beam(ctx, x, y + row * h / 4, x + w, y + row * h / 4, '#66574a', 3);
      beam(ctx, x - 9, y + h + 5, x + w + 9, y + h + 5, '#8f7761', 5);
    }
    glow(ctx, 914, 281, 329, 171, [242, 206, 157], .22);
    // Narrow teeth and tools on the far wall stay behind the exposed linkage.
    for (let i = 0; i < 16; i++) {
      const x = 528 + 45.5 * i;
      if (i % 3) {
        beam(ctx, x, 393, x - 5.5, 436 + i % 4 * 7, '#6c5b50', 2.3);
        oval(ctx, x, 392, 3.5, 3.5, '#65564c');
      }
    }
    ctx.restore();
  }

  function roadArt(ctx, late) {
    const stops = late ? [[0, '#8a7562'], [.49, '#806d60'], [1, '#494340']] : [[0, '#b0a070'], [.52, '#9a8d63'], [1, '#635b4f']];
    ctx.fillStyle = gradient(ctx, 0, floor, 0, H, stops);
    ctx.fillRect(0, floor, W, H - floor);
    const r = random(92734);
    for (let i = 0; i < 530; i++) {
      const x = r() * 1490 - 70;
      const d = r() ** 1.23;
      const y = 554 + d * 169;
      const length = (4 + r() * 20) * (1 + d * .52);
      beam(ctx, x, y, x + length, y + (r() - .45) * 3.9, i % 4 ? 'rgba(57,49,43,.19)' : 'rgba(226,194,136,.27)', .49 + r() * 1.75);
    }
    const tint = late ? 'rgba(51,47,45,.20)' : 'rgba(92,95,58,.25)';
    for (let i = 0; i < 56; i++) {
      const y = i % 4 ? 687 + r() * 38 : 556 + r() * 10;
      const x = r() * 1297;
      oval(ctx, x, y, 5 + r() * 17, 2 + 1.8 * r(), tint, (r() - .5) * .18);
    }
    line(ctx, 'rgba(229,202,152,.31)', 1.8, p => {
      p.moveTo(0, 559);
      for (let x = 18; x <= 1299; x += 18) p.lineTo(x, 558.5 + Math.sin(x * .024) * 2.1 + Math.sin(x * .012) * 1.8);
    });
    paper(ctx, W, H - floor, floor, 420949, .59);
  }

  let materials;

  function layers() {
    if (materials) return materials;
    materials = {
      farm: canvas(W, H, farmBackdrop),
      shop: canvas(W, H, shopBackdrop),
      rafters: canvas(W, H, rafters),
      reveal: canvas(W, H, () => {}),
      revealMask: canvas(W, H, () => {}),
      dirt: canvas(W, H, ctx => roadArt(ctx, false)),
      cobble: canvas(W, H, ctx => roadArt(ctx, true)),
      smoke: canvas(128, 128, ctx => {
        glow(ctx, 61, 67, 56, 45, [236, 223, 200], .52);
        glow(ctx, 80, 69, 43, 37, [230, 222, 206], .39);
        glow(ctx, 42, 48, 39, 40, [228, 215, 191], .31);
        glow(ctx, 76, 40, 35, 36, [238, 228, 211], .35);
      }),
      soot: canvas(128, 128, ctx => {
        glow(ctx, 65, 57, 51, 44, [65, 56, 52], .55);
        glow(ctx, 41, 74, 30, 34, [62, 54, 52], .42);
        glow(ctx, 84, 78, 38, 29, [76, 63, 54], .43);
      }),
    };
    return materials;
  }

  function spinAt(p) {
    // The shaft keeps turning at the same angle during the entire material change.
    return -.81 + p * TAU * 1.83 + p * p * .60;
  }

  function pool(ctx, t, radius, power) {
    if (power <= .002) return;
    ctx.save();
    ctx.globalAlpha *= power;
    const deep = gradient(ctx, 0, 473, 0, 559, [[0, '#869c89'], [.62, '#668581'], [1, '#54736c']]);
    paint(ctx, deep, l => {
      l.moveTo(1280, 483);
      l.bezierCurveTo(1161, 510, 1122, 520, 1071, 529);
      l.bezierCurveTo(963, 541, 885, 529, 815, 517);
      l.bezierCurveTo(766, 509, 755, 525, 766, 536);
      l.bezierCurveTo(840, 562, 1022, 580, 1125, 555);
      l.quadraticCurveTo(1206, 542, 1280, 532);
      l.closePath();
    });
    line(ctx, 'rgba(94,78,57,.43)', 4.6, l => {
      l.moveTo(769, 536);
      l.bezierCurveTo(840, 562, 1022, 580, 1125, 555);
      l.quadraticCurveTo(1206, 542, 1280, 532);
    });
    line(ctx, 'rgba(217,224,170,.58)', 2.95, l => {
      l.moveTo(1280, 485);
      l.bezierCurveTo(1158, 510, 1126, 520, 1072, 529);
      l.bezierCurveTo(982, 541, 908, 533, 814, 518);
    });
    for (let i = 0; i < 57; i++) {
      const k = wrap((t * (.127 + .017 * (i % 5))) + i * .2154);
      const wide = 9 + i % 6 * 6;
      const x = 1301 - k * 521 + Math.sin(i * 5.32) * 33;
      const y = 533 + Math.sin((x - 1036) / 170) * (x > 1050 ? -28 : 14) + (i % 7 - 3) * 2.75;
      const fade = Math.sin(Math.PI * k);
      line(ctx, `rgba(201,223,194,${.41 * fade})`, (i % 4) * .35 + .63, l => {
        l.moveTo(x, y);
        l.quadraticCurveTo(x + wide * .54, y - 2, x + wide, y + .7);
      });
    }
    for (let i = 0; i < 12; i++) {
      const age = wrap(t * .92 + i / 12);
      const rx = 12 + age * (41 + i % 4 * 7);
      line(ctx, `rgba(202,227,213,${(1 - age) * .40})`, 1.09, l => l.ellipse(pivot.x + 31 - age * 45, pivot.y + radius * .95 - 5 + age * 7,
        rx, rx * .126, .015, .14, 5.81));
    }
    ctx.restore();
  }

  function timber(ctx, hub, radius, water) {
    if (water <= .001) return;
    ctx.save();
    ctx.globalAlpha *= water;
    for (const [x, shift] of [[hub.x - 187, 1], [hub.x + 154, -1], [hub.x + 238, -1]]) {
      beam(ctx, x, 551, x + shift * 31, 270, '#746146', 13.5);
      beam(ctx, x + 3, 552, x + shift * 31 + 3, 269, '#a88e58', 2.9);
    }
    beam(ctx, hub.x - 188, 491, hub.x + 158, 481, '#746246', 11.7);
    beam(ctx, hub.x - 201, 512, hub.x + 149, 502, '#ad9261', 3);
    beam(ctx, hub.x - 186, 540, hub.x - 114, 486, '#8e7853', 6.8);
    beam(ctx, hub.x + 153, 537, hub.x + 96, 488, '#74624c', 6.8);
    const x = hub.x + radius * .66;
    const y = hub.y - radius * 1.07;
    const mouth = gradient(ctx, x, y, x + 215, y + 22, [[0, '#786147'], [.56, '#a58956'], [1, '#8a6f48']]);
    polygon(ctx, mouth, [[x - 8, y - 15], [1290, y - 34], [1290, y - 10], [x + 3, y + 16], [x - 8, y + 11]]);
    polygon(ctx, '#695c44', [[x - 8, y + 9], [1290, y - 17], [1290, y - 8], [x + 2, y + 20], [x - 8, y + 14]]);
    for (let k = 0; k < 17; k++) {
      const m = k / 16;
      const px = mix(x + 12, 1287, m);
      const py = mix(y + 11, y - 15, m);
      beam(ctx, px, py - 18.7, px + 3, py, k % 3 ? 'rgba(69,56,42,.32)' : 'rgba(211,181,109,.49)', 1.29);
    }
    beam(ctx, hub.x - radius - 40, hub.y + 1, hub.x + 164, hub.y, '#5d5547', 15);
    beam(ctx, hub.x - radius - 40, hub.y - 5, hub.x + 164, hub.y - 6, '#9d865c', 3.7);
    ctx.restore();
  }

  function waterIn(ctx, hub, radius, t, alpha) {
    if (alpha <= .001) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const x = hub.x + radius * .66;
    const y = hub.y - radius * 1.07;
    const wash = gradient(ctx, x, y, x + 7, y + 72, [[0, 'rgba(198,224,199,.84)'], [.49, 'rgba(155,198,190,.77)'], [1, 'rgba(145,187,180,.07)']]);
    paint(ctx, wash, l => {
      l.moveTo(x + 15, y + 1);
      l.bezierCurveTo(x - 12, y + 7, x - 10, y + 25, x - 11, y + 62);
      l.bezierCurveTo(x + 1, y + 55, x + 8, y + 39, x + 10, y + 23);
      l.bezierCurveTo(x + 12, y + 10, x + 24, y + 3, x + 37, y - 1);
      l.closePath();
    });
    for (let i = 0; i < 24; i++) {
      const a = wrap(t * (2.63 + i % 5 * .214) + i * .331);
      const x1 = x + 17 * (1 - a) ** 2 - (i % 5 - 2) * 2.18 + Math.sin(a * 6.4 + i) * a * 2.25;
      const y1 = y + 5 + 63 * a ** 1.33;
      beam(ctx, x1, y1, x1 - 1.6, y1 + 3 + 9 * a, `rgba(225,239,215,${(.24 + (i % 3) * .17) * (1 - a * .62)})`, .61 + i % 3 * .31);
    }
    ctx.restore();
  }

  function castBase(ctx, alpha) {
    if (alpha <= .001) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const pedestal = gradient(ctx, 490, 518, 1178, 560, [[0, '#857267'], [.55, '#665951'], [1, '#544b46']]);
    polygon(ctx, pedestal, [[483, 526], [1119, 515], [1200, 542], [1195, 565], [473, 571]]);
    polygon(ctx, '#55504a', [[488, 538], [1140, 532], [1186, 545], [484, 556]]);
    beam(ctx, 494, 549, 1164, 541, '#a4886b', 3.2);
    for (let i = 0; i < 38; i++) {
      const x = 502 + i * 17.8;
      const y = 553 + Math.sin(i * 1.12) * 2;
      beam(ctx, x, y, x + 2.8, y + 11.3, '#564b47', 1.23);
    }
    for (const [x1, x2, y] of [[578, 721, 511], [863, 1049, 527]]) {
      polygon(ctx, '#4b4d49', [[x1, y], [x2, y - 4], [x2 + 19, y + 15], [x1 - 8, y + 17]]);
      beam(ctx, x1 + 8, y + 2, x2 - 5, y - 2, '#8c7b66', 2.2);
    }
    ctx.restore();
  }

  function boiler(ctx, t, theta, alpha) {
    if (alpha <= .001) return;
    const k = ctx.globalAlpha;
    ctx.save();
    ctx.globalAlpha = k * alpha;
    const body = gradient(ctx, 520, 313, 633, 484, [[0, '#877763'], [.29, '#6f6559'], [.57, '#615851'], [1, '#414747']]);
    rect(ctx, 491, 354, 180, 119, 22, body);
    oval(ctx, 499, 413, 29, 59, '#6b6055');
    oval(ctx, 498, 415, 20, 49, '#786655');
    line(ctx, 'rgba(193,163,114,.58)', 2.3, q => q.ellipse(496, 413, 21, 50, 0, 3.3, 5.56));
    for (let i = 0; i < 13; i++) {
      const angle = i / 13 * TAU;
      oval(ctx, 496 + Math.cos(angle) * 17.4, 414 + Math.sin(angle) * 43.0, 2.65, 2.69, '#4c4a44');
    }
    for (const x of [530, 578, 641]) {
      line(ctx, '#4c4844', 6.4, q => { q.moveTo(x, 357); q.quadraticCurveTo(x - 10, 413, x + 1, 471); });
      line(ctx, '#a1886b', 1.2, q => { q.moveTo(x + 2.4, 358); q.quadraticCurveTo(x - 6, 409, x + 3.2, 466); });
    }
    rect(ctx, 504, 421, 44, 35, 8, '#4b4643');
    oval(ctx, 527, 440, 13, 11, '#743f37');
    softFire(ctx, 526, 441, t);
    for (const x of [528, 624]) {
      polygon(ctx, '#53504a', [[x, 465], [x + 23, 465], [x + 28, 513], [x - 8, 514]]);
      beam(ctx, x + 3, 471, x + 6, 509, '#82705e', 2.8);
    }
    line(ctx, '#484a46', 17.5, q => {
      q.moveTo(558, 357);
      q.lineTo(558, 301);
      q.quadraticCurveTo(558, 285, 574, 285);
      q.lineTo(607, 285);
      q.quadraticCurveTo(634, 285, 633, 309);
      q.lineTo(633, 375);
    });
    line(ctx, '#9c8062', 2.35, q => {
      q.moveTo(553, 350);
      q.lineTo(553, 300);
      q.quadraticCurveTo(553, 280, 574, 280);
      q.lineTo(608, 280);
      q.quadraticCurveTo(631, 281, 631, 303);
    });
    rect(ctx, 543, 329, 30, 9, 2, '#776b60');
    rect(ctx, 618, 325, 29, 9, 2, '#73675e');
    line(ctx, '#4e4b45', 12.3, q => {
      q.moveTo(560, 294);
      q.lineTo(547, 290);
      q.quadraticCurveTo(539, 287, 539, 274);
      q.lineTo(539, 254);
    });
    beam(ctx, 536, 254, 536, 279, '#8a735a', 2.7);
    rect(ctx, 530, 250, 18, 6, 1.9, '#6d5f4e');
    // Pressure head and its moving needle are exposed in the upper piping.
    beam(ctx, 600, 353, 601, 327, '#57524a', 6);
    oval(ctx, 601, 316, 18, 18, '#504d46');
    oval(ctx, 601, 316, 14.1, 14.1, '#c2a989');
    ring(ctx, 601, 316, 12.3, .83, '#87755e', 2.4, 6.7);
    for (let j = 0; j < 7; j++) {
      const a = 2.58 + j / 7 * TAU * .66;
      beam(ctx, 601 + 9.5 * Math.cos(a), 316 + 9.5 * Math.sin(a), 601 + 11.1 * Math.cos(a), 316 + 11.1 * Math.sin(a), '#776352', 1);
    }
    const meter = 3.9 + Math.sin(theta - .8) * .47;
    beam(ctx, 601, 316, 601 + Math.cos(meter) * 10.4, 316 + Math.sin(meter) * 10.4, '#8b5846', 1.65);
    oval(ctx, 601, 316, 2.15, 2.15, '#7b6657');
    rect(ctx, 650, 378, 61, 65, 9, '#535551');
    const cylinder = gradient(ctx, 646, 371, 674, 451, [[0, '#9a8d76'], [.25, '#7d776a'], [.49, '#6b6a66'], [1, '#444a4d']]);
    rect(ctx, 570, 378, 127, 63, 10, cylinder);
    oval(ctx, 693, 410.8, 13.5, 34.6, '#555953');
    oval(ctx, 695, 410.8, 9.0, 28.8, '#898678');
    oval(ctx, 697, 410.8, 7.2, 9.2, '#484b4b');
    for (let j = 0; j < 6; j++) {
      const a = j * TAU / 6;
      oval(ctx, 696 + 8 * Math.cos(a), 411 + 24 * Math.sin(a), 2.12, 2.12, '#4c514d');
    }
    beam(ctx, 580, 385, 681, 384, 'rgba(221,197,150,.34)', 2.6);
    beam(ctx, 578, 437, 677, 437, '#4a504e', 2.9);
    ctx.restore();
  }

  function softFire(ctx, x, y, t) {
    glow(ctx, x, y, 20, 15, [244, 151, 84], .55 + .12 * Math.sin(t * 11) + .11 * Math.sin(t * 19));
    const wiggle = Math.sin(t * 8) * 3;
    paint(ctx, '#d09a63', q => {
      q.moveTo(x - 5, y + 4);
      q.quadraticCurveTo(x - 8, y - 2, x + wiggle, y - 9);
      q.quadraticCurveTo(x + 7, y - 3, x + 5, y + 4);
      q.closePath();
    });
  }

  function roundedMetal(ctx, w, r, iron) {
    const metal = gradient(ctx, -8, -w, r, w, [[0, color(rgb([153, 121, 76], [104, 107, 100], iron))],
      [.46, color(rgb([133, 101, 62], [77, 86, 84], iron))],
      [1, color(rgb([106, 84, 58], [57, 67, 69], iron))]]);
    paint(ctx, metal, p => {
      p.moveTo(9, -w);
      p.quadraticCurveTo(r * .56, -w * .79, r - 7, -w * .56);
      p.lineTo(r + 2, w * .59);
      p.quadraticCurveTo(r * .59, w * .57, 10, w);
      p.closePath();
    });
    beam(ctx, 13, -w * .55, r - 4, -w * .18, color(rgb([204, 167, 97], [155, 151, 132], iron), .52), 1.3);
  }

  function wheel(ctx, hub, r, p, theta) {
    const iron = stage(p, .27, .79);
    const trim = rgb([177, 149, 91], [149, 137, 112], iron);
    const dark = rgb([93, 81, 58], [48, 56, 59], iron);
    const light = rgb([145, 119, 76], [80, 90, 90], iron);
    ctx.save();
    ctx.translate(hub.x, hub.y);
    oval(ctx, 10, 8, r + 5, r + 5, 'rgba(49,44,43,.15)');
    ring(ctx, 7, 7, r - 2, mix(10, 17.3, iron), color(dark));
    const tread = gradient(ctx, -r, -r, r, r, [[0, color(trim)], [.31, color(light)], [.68, color(dark)], [1, color(light)]]);
    ring(ctx, 0, 0, r - 1, mix(14, 19.7, iron), tread);
    ring(ctx, -.7, -1.5, r + mix(4.5, 7.1, iron), 1.9, color(trim, .77), 3.28, 5.69);
    ring(ctx, 0, 0, r - 9, 1.52, color(trim, .56), -.05, 3.21);
    for (let i = 0; i < 16; i++) {
      const angle = theta + (i / 16) * TAU;
      const change = stage(p, .26 + (i % 5) * .049, .64 + (i % 5) * .043);
      ctx.save();
      ctx.rotate(angle);
      if (i % 2 === 0) roundedMetal(ctx, mix(5.6, 11.4, change), r - 11, change);
      else if (change < .997) {
        ctx.globalAlpha *= 1 - change;
        roundedMetal(ctx, 3.9, r - 12, 0);
        ctx.globalAlpha /= 1 - change;
      }
      if (change < .998) {
        const blade = 1 - change;
        const w = mix(3.7, 12.5, blade);
        const wet = .51 + .49 * Math.sin(angle + .20);
        const vat = rgb([148, 119, 68], [114, 126, 94], wet * .68);
        polygon(ctx, color(vat, blade), [[r - 7, -w], [r + 13 * blade, -w - 2], [r + 14 * blade, w + 3.7], [r - 7, w]]);
        beam(ctx, r + 12.8 * blade, -w, r + 13.4 * blade, w + 2.2, color([200, 178, 111], blade * .68), 1.48);
        beam(ctx, r - 6, -w + 2.1, r - 5, w - 2.9, color([90, 91, 65], blade * .50), 1.09);
      }
      if (change > .03) {
        oval(ctx, r - 1.2, 0, 2.5, 3.15, color([162, 148, 119], change));
        oval(ctx, r - 1.4, .3, 1.3, 1.9, color([71, 72, 66], change));
      }
      ctx.restore();
    }
    const cap = gradient(ctx, -24, -22, 24, 26, [[0, color(trim)], [.47, color(light)], [1, color(dark)]]);
    oval(ctx, 0, 0, mix(18, 30, iron), mix(18, 30, iron), cap);
    ring(ctx, 0, 0, mix(18, 28.4, iron), 1.9, color(trim, .64), 3.11, 5.59);
    for (let j = 0; j < 6; j++) {
      const a = theta + j * TAU / 6;
      oval(ctx, (13 + 8 * iron) * Math.cos(a), (13 + 8 * iron) * Math.sin(a), 2.47, 2.47, color(dark, .78));
    }
    oval(ctx, 0, 0, mix(7.6, 13.3, iron), mix(7.6, 13.3, iron), color(dark));
    oval(ctx, -1.4, -1.7, mix(3.8, 6.25, iron), mix(3.8, 6.25, iron), color(trim));
    ctx.restore();
  }

  function linkage(ctx, hub, radius, theta, alpha) {
    if (alpha <= .001) return;
    const eccentric = radius * .288;
    const pinX = hub.x + Math.cos(theta) * eccentric;
    const pinY = hub.y + Math.sin(theta) * eccentric;
    const barY = hub.y;
    const rodLength = 218;
    const offset = pinY - barY;
    const slider = pinX - Math.sqrt(rodLength * rodLength - offset * offset);
    const angle = Math.atan2(pinY - barY, pinX - slider);
    ctx.save();
    ctx.globalAlpha *= alpha;
    const rail = gradient(ctx, 699, barY - 16, 821, barY + 26, [[0, '#4c514d'], [.47, '#79776b'], [1, '#4d5351']]);
    rect(ctx, 699, barY + 17, 124, 8.7, 3.1, rail);
    rect(ctx, 699, barY - 24, 124, 8.7, 3.1, rail);
    beam(ctx, 701, barY - 23.5, 823, barY - 23.5, 'rgba(196,173,128,.60)', 1.49);
    beam(ctx, 702, barY + 18.1, 822, barY + 18.1, 'rgba(182,159,122,.49)', 1.01);
    beam(ctx, 699, barY, slider, barY, '#a19d89', 9.15);
    beam(ctx, 699, barY - 2.55, slider, barY - 2.55, '#c6b59b', 2.6);
    rect(ctx, slider - 13, barY - 14.4, 25, 28.7, 5.6, '#5d6260');
    rect(ctx, slider - 9.75, barY - 11, 18.5, 22, 3, '#8c897a');
    beam(ctx, hub.x, hub.y, pinX, pinY, '#464c4d', 21);
    beam(ctx, hub.x - 2.15, hub.y - 2.2, pinX - 2.25, pinY - 2.2, '#847e71', 12.8);
    ctx.save();
    ctx.translate(slider, barY);
    ctx.rotate(angle);
    const rodMetal = gradient(ctx, 0, -8, 0, 9, [[0, '#d0b997'], [.36, '#a5957c'], [.76, '#817b6a'], [1, '#625f55']]);
    paint(ctx, '#4d4d48', q => {
      q.moveTo(0, -9.8);
      q.lineTo(218, -10.4);
      q.quadraticCurveTo(229.5, -.5, 218, 10.2);
      q.lineTo(0, 9.8);
      q.quadraticCurveTo(-11, 0, 0, -9.8);
    });
    rect(ctx, -1, -7.7, 220, 15.1, 6.6, rodMetal);
    beam(ctx, 9, -4.9, 208, -5.0, 'rgba(241,213,166,.72)', 2.1);
    beam(ctx, 12, 4.9, 207, 4.9, 'rgba(63,63,57,.53)', 1.9);
    for (const x of [0, rodLength]) {
      oval(ctx, x, -.4, 9.3, 9.3, '#5b5d56');
      oval(ctx, x, -.4, 6.1, 6.1, '#b29c7c');
      oval(ctx, x, -.4, 3.0, 3.0, '#6d685b');
    }
    ctx.restore();
    ctx.restore();
  }

  function spray(ctx, hub, radius, t, p, theta) {
    const strength = 1 - stage(p, .39, .78);
    if (strength <= .002) return;
    ctx.save();
    ctx.globalAlpha *= strength;
    for (let i = 0; i < 37; i++) {
      const phase = wrap(t * (1.57 + .27 * (i % 5)) + i * .161);
      const base = i % 6 * .082 + .63;
      const angle = base + phase * .85;
      const x = hub.x + Math.cos(angle) * (radius + 9 + phase * (31 + i % 8 * 2));
      const y = hub.y + Math.sin(angle) * (radius + 4 + phase * 2) + phase * phase * (21 + i % 6 * 3);
      const light = (.43 + i % 4 * .105) * (1 - phase) ** .84;
      ellipseDrop(ctx, x, y, .88 + (1 - phase) * i % 4, color([221, 229, 198], light));
    }
    for (let i = 0; i < 16; i++) {
      const angle = theta + i * TAU / 16;
      if (Math.cos(angle) < .35 || Math.sin(angle) > .73 || Math.sin(angle) < -.73) continue;
      const x = hub.x + (radius + 12) * Math.cos(angle);
      const y = hub.y + (radius + 11) * Math.sin(angle);
      beam(ctx, x - 3, y - 1, x + 3, y + 1.9, 'rgba(206,227,197,.53)', 2.9);
    }
    ctx.restore();
  }

  function ellipseDrop(ctx, x, y, size, fill) {
    oval(ctx, x, y, size * .64, size * 1.19, fill, -.38);
  }

  function plume(ctx, stamp, x, y, local, strength, direction, jet) {
    if (strength <= .001) return;
    const state = ctx.globalAlpha;
    const density = jet ? 19 : 23;
    for (let i = density - 1; i >= 0; i--) {
      const n = wrap(local * (jet ? .86 : .26) + i / density);
      const drift = (jet ? 63 : 176) * direction * n ** 1.06 + Math.sin(n * 7.7 + i * .91 + local * 1.21) * (5 + n * 17);
      const rise = (jet ? 105 : 237) * n;
      const size = (jet ? 17 : 32) + n * (jet ? 114 : 243);
      const fade = (1 - n) ** .74 * Math.sin(n ** .49 * Math.PI);
      ctx.globalAlpha = state * strength * fade * (.61 + .16 * Math.sin(i * 3.49));
      ctx.drawImage(stamp, x + drift - size * .49, y - rise - size * .58, size, size * (.81 + n * .07));
    }
    ctx.globalAlpha = state;
  }

  function vaporAcross(ctx, stamp, p, stroke) {
    const strength = Math.sin(Math.PI * stage(p, .20, .85)) ** 1.87;
    if (strength < .003) return;
    const a = ctx.globalAlpha;
    for (let i = 0; i < 11; i++) {
      const flight = clamp((p - .18) / .70);
      const width = 183 + i % 5 * 38 + flight * 121;
      const x = 1253 - flight * 762 + Math.sin(i * 11.41 + stroke * .94) * 133 + (i % 4 - 1) * 78;
      const y = 477 - flight * (65 + i * 6.2) + Math.cos(i * 8.12 - stroke * .75) * 91;
      ctx.globalAlpha = a * strength * (.21 + i % 4 * .055);
      ctx.drawImage(stamp, x - width * .5, y - width * .30, width, width * .63);
    }
    ctx.globalAlpha = a;
  }

  function revealWorkshop(ctx, data, p, t, raftersAlpha) {
    const phase = stage(p, .25, .83);
    if (phase <= .001) return;
    const layer = data.reveal.getContext('2d');
    layer.clearRect(0, 0, W, H);
    layer.drawImage(data.shop, 0, 0);
    for (const [x, y, scale] of [[174, 277, .66], [312, 330, .41], [425, 354, .34]]) {
      layer.save();
      layer.translate(x, y);
      layer.scale(scale, scale);
      plume(layer, data.soot, 0, 0, t * .58 + x * .01, .55, .84, false);
      layer.restore();
    }
    layer.globalAlpha = raftersAlpha;
    layer.drawImage(data.rafters, 0, 0);
    layer.globalAlpha = 1;
    if (phase < .999) {
      const front = mix(1505, -244, phase);
      const mask = data.revealMask.getContext('2d');
      mask.clearRect(0, 0, W, H);
      // Small row offsets follow steam eddies without leaving a hard wipe line.
      for (let y = 0; y < H; y += 16) {
        const shift = Math.sin(y * .009 + t * .38) * 40 + Math.sin(y * .023 - t * .88) * 15;
        mask.fillStyle = gradient(mask, front + shift - 171, 0, front + shift + 193, 0,
          [[0, '#0000'], [.20, '#0002'], [.5, '#0008'], [.80, '#000d'], [1, '#000']]);
        mask.fillRect(0, y, W, 16);
      }
      layer.globalCompositeOperation = 'destination-in';
      layer.drawImage(data.revealMask, 0, 0);
      layer.globalCompositeOperation = 'source-over';
    }
    ctx.drawImage(data.reveal, 0, 0);
  }

  function transientDeck(ctx, p, t, travel, hub, radius, theta) {
    const data = layers();
    const weather = stage(p, .27, .77);
    const wet = 1 - stage(p, .30, .82);
    const metal = stage(p, .28, .83);
    const link = stage(p, .39, .65);
    const a = ctx.globalAlpha;
    ctx.drawImage(data.farm, 0, 0);
    revealWorkshop(ctx, data, p, t, stage(p, .30, .70));
    ctx.drawImage(data.dirt, 0, 0);
    if (weather > .001) {
      ctx.globalAlpha = a * weather;
      ctx.drawImage(data.cobble, 0, 0);
    }
    ctx.globalAlpha = a;
    timber(ctx, hub, radius, wet);
    castBase(ctx, metal);
    pool(ctx, t, radius, wet);
    vaporAcross(ctx, data.smoke, p, t);
    plume(ctx, data.smoke, 539, 252, t, metal * .83, -.66, false);
    boiler(ctx, t, theta, metal);
    waterIn(ctx, hub, radius, t, wet);
    wheel(ctx, hub, radius, p, theta);
    linkage(ctx, hub, radius, theta, link);
    spray(ctx, hub, radius, t, p, theta);
    const pressure = (.53 + .45 * (Math.cos(theta + .6) * .5 + .5) ** 2) * stage(p, .40, .71);
    plume(ctx, data.smoke, hub.x + radius * .67, hub.y - radius * .78, t + .36,
      pressure * .78 * (1 - stage(p, .70, .93)), 1.18, true);
    plume(ctx, data.smoke, 637, 372, t - .13, pressure * .24, -.79, true);
    for (let i = 0; i < 26; i++) {
      const depth = (i % 8) / 8;
      const phase = wrap(i * .217 + travel * .0029 * mix(.33, .91, depth));
      const x = 849 * phase - 62;
      const y = 572 + 131 * depth ** 1.6;
      const length = 4.4 + 23 * depth + i % 6;
      beam(ctx, x, y, x + length, y + 1.6 * depth, color([197, 173, 134], (.07 + depth * .06) * Math.sin(phase * Math.PI)), .97 + depth);
    }
    glow(ctx, 528, 557, 131, 19, [230, 139, 77], metal * .16);
  }

  function draw(ctx, env = {}) {
    const p = clamp(has(env.p) ? env.p : 0);
    const t = has(env.t) ? env.t : p * 5.6;
    const travel = has(env.travel) ? env.travel : p * 490;
    const climb = stage(p, 0, .26);
    const r = mix(114, 139, climb) - stage(p, .70, 1) * 6;
    const hub = { x: pivot.x + 10 * (1 - climb), y: pivot.y + 6 * (1 - climb) };
    const theta = spinAt(p);
    ctx.save();
    transientDeck(ctx, p, t, travel, hub, r, theta);
    ctx.restore();
  }

  window.WheelBridge = { draw };
})();
