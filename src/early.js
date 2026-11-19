(() => {
  'use strict';

  const W = 1280;
  const H = 720;
  const WORLD = 1712;
  const TAU = 2 * Math.PI;
  const cache = new Map();
  const smokeBrushes = new Map();
  const colors = {
    stone: ['#14293d', '#42677c', '#b9c6ac', '#d9ad79', '#53615f', '#343c3d'],
    farm: ['#5e8d88', '#9bb6a3', '#f2db95', '#f1c987', '#a59558', '#48472f'],
    bronze: ['#335360', '#729393', '#d4ad76', '#d9a66a', '#86775e', '#3d4945'],
    print: ['#29364d', '#544b65', '#b77d72', '#d6aa88', '#7d5d54', '#473943'],
  };

  function seeded(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  const clamp = n => Math.max(0, Math.min(1, n));
  const mix = (a, b, amount) => a + (b - a) * amount;
  const loop = (n, limit) => ((n % limit) + limit) % limit;

  function line(ctx, color, thickness, draw) {
    ctx.beginPath();
    draw(ctx);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function shape(ctx, color, draw) {
    ctx.beginPath();
    draw(ctx);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function poly(ctx, color, ...points) {
    shape(ctx, color, p => {
      p.moveTo(...points[0]);
      for (let i = 1; i < points.length; i++) p.lineTo(...points[i]);
      p.closePath();
    });
  }

  function bar(ctx, x0, y0, x1, y1, color, width = 1) {
    line(ctx, color, width, p => { p.moveTo(x0, y0); p.lineTo(x1, y1); });
  }

  function oval(ctx, x, y, rx, ry, color, angle = 0) {
    shape(ctx, color, p => p.ellipse(x, y, rx, ry, angle, 0, TAU));
  }

  function linear(ctx, x, y, a, b, stops) {
    const g = ctx.createLinearGradient(x, y, a, b);
    for (const [point, color] of stops) g.addColorStop(point, color);
    return g;
  }

  function glow(ctx, x, y, radius, height, color, intensity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, height / radius);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    g.addColorStop(0, `rgba(${color},${intensity})`);
    g.addColorStop(.38, `rgba(${color},${intensity * .46})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.restore();
  }

  function surface(width, paint) {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = H;
    paint(c.getContext('2d'));
    return c;
  }

  function grain(ctx, width, height, top, seed, count, light, dark) {
    const rnd = seeded(seed);
    for (let i = 0; i < count; i++) {
      const x = rnd() * width;
      const y = rnd() * height + top;
      ctx.fillStyle = i % 3 ? dark : light;
      ctx.fillRect(x, y, .45 + rnd() * 2.03, .35 + rnd() * 1.41);
    }
  }

  function hill(ctx, peak, amplitude, freq, color, seed, limit = 523) {
    const rng = seeded(seed);
    const phase = rng() * 12;
    const points = [];
    for (let x = -24; x <= WORLD + 28; x += 11) {
      const bump = Math.sin(x * freq + phase) * .56 + Math.cos(x * freq * 2.12 - phase) * .23;
      const edges = Math.sin(x * freq * 6.55 + phase) * .12 + rng() * .13;
      points.push([x, peak + (bump + edges) * amplitude]);
    }
    poly(ctx, color, ...points, [WORLD + 32, limit], [-30, limit]);
  }

  function ridge(ctx, color, vertices, bottom, noiseSeed) {
    const rand = seeded(noiseSeed);
    const sketch = [];
    for (let i = 0; i < vertices.length - 1; i++) {
      const [x, y] = vertices[i];
      const [nx, ny] = vertices[i + 1];
      for (let j = 0; j < 9; j++) {
        const f = j / 9;
        const texture = Math.sin(f * Math.PI) * (rand() * 16 - 7);
        sketch.push([mix(x, nx, f), mix(y, ny, f) + texture]);
      }
    }
    const last = vertices[vertices.length - 1];
    poly(ctx, color, ...sketch, last, [last[0], bottom], [vertices[0][0], bottom]);
  }

  function bush(ctx, x, y, size, palette, seed) {
    const rnd = seeded(seed);
    const [main, accent] = palette;
    for (let i = 0; i < 15; i++) {
      const shift = (rnd() - .5) * size * 2;
      const reach = size * (.51 + rnd() * .97);
      const angle = (rnd() - .5) * .83;
      oval(ctx, x + shift, y - reach * .25, reach * .52, reach * (.14 + rnd() * .27), i % 4 ? main : accent, angle);
    }
  }

  function stone(ctx, x, y, size, color, shade, seed) {
    const rand = seeded(seed);
    const w = (1.7 + rand() * 1.6) * size;
    const h = (.55 + rand() * .58) * size;
    poly(ctx, shade, [x - w * .55, y + h * .17], [x - w * .42, y - h * .66],
      [x - w * .12, y - h], [x + w * .22, y - h * .91], [x + w * .47, y - h * .48], [x + w * .60, y + h * .09]);
    poly(ctx, color, [x - w * .41, y - h * .62], [x - w * .12, y - h * .97],
      [x + w * .20, y - h * .82], [x + w * .30, y - h * .42], [x + w * .08, y - h * .34], [x - w * .33, y - h * .39]);
    for (let i = 0; i < 5; i++) {
      const px = x - w * .29 + rand() * w * .55;
      const py = y - h * .76 + rand() * h * .72;
      bar(ctx, px, py, px + w * (.07 + rand() * .21), py + (rand() - .43) * h * .33,
        i % 2 ? 'rgba(233,222,180,.17)' : 'rgba(31,39,44,.23)', .55 + size * .023);
    }
  }

  function grasses(ctx, x, y, size, main, tip, seed) {
    const rnd = seeded(seed);
    for (let i = 0; i < 16; i++) {
      const ux = x + (rnd() - .5) * size * .76;
      const reach = size * (.22 + rnd() * .83);
      const lean = (rnd() - .38) * size * .78;
      line(ctx, i % 5 ? main : tip, .7 + rnd() * size * .027, p => {
        p.moveTo(ux, y);
        p.quadraticCurveTo(ux - lean * .09, y - reach * .54, ux + lean, y - reach);
      });
      if (i % 6 === 0) oval(ctx, ux + lean, y - reach, size * .033, size * .098, tip, -lean / reach);
    }
  }

  function tree(ctx, x, floor, size, palette, seed, pine = false) {
    const rnd = seeded(seed);
    const [trunk, leaves, edge] = palette;
    const bend = (rnd() - .48) * size * .51;
    const top = floor - size * 1.42;
    shape(ctx, trunk, p => {
      p.moveTo(x - size * .055, floor);
      p.quadraticCurveTo(x + bend * .27, floor - size * .70, x + bend - 2, top);
      p.lineTo(x + bend + 3, top + 2);
      p.quadraticCurveTo(x + bend * .28 + 6, floor - size * .69, x + size * .080, floor);
      p.closePath();
    });
    for (let i = 0; i < 12; i++) {
      const reach = (.17 + rnd() * .25) * size * (pine ? (.45 + i / 10) : 1);
      const direction = i % 2 ? -1 : 1;
      const y = top + (i / 12) * size * (pine ? 1.08 : .66);
      const pick = x + bend * (1 - ((y - top) / (size * 1.5)));
      const end = pick + direction * reach;
      const high = y - reach * (.09 + rnd() * .31);
      line(ctx, trunk, Math.max(.9, size * (.028 - i * .0011)), p => {
        p.moveTo(pick, y + reach * .17);
        p.quadraticCurveTo(pick + direction * reach * .42, y + 2, end, high);
      });
      for (let j = 0; j < (pine ? 13 : 16); j++) {
        const f = rnd();
        const px = mix(pick, end, f) + (rnd() - .5) * reach * .65;
        const py = mix(y, high, f) + (rnd() - .56) * reach * (pine ? .33 : .66);
        const rx = size * (.011 + rnd() * .034);
        oval(ctx, px, py, rx * (pine ? 1.8 : 1.02), rx * (.40 + rnd() * .57), j % 5 ? leaves : edge, direction * .18);
      }
    }
  }

  function thinCloud(ctx, x, y, width, tall, color, seed) {
    const r = seeded(seed);
    for (let i = 0; i < 17; i++) {
      const u = (i + r() * 1.1) / 17;
      const px = x + u * width;
      const py = y + Math.sin(u * TAU) * tall * .19 + (r() - .5) * tall * .71;
      const radius = width * (.041 + r() * .14);
      oval(ctx, px, py, radius, tall * (.09 + r() * .21), color, (r() - .5) * .08);
    }
  }

  function paintSky(ctx, name) {
    const [top, middle, thin, disc] = colors[name];
    ctx.fillStyle = linear(ctx, 0, 0, 0, 720, [[0, top], [.29, middle], [.56, thin], [1, middle]]);
    ctx.fillRect(0, 0, W, H);
    const x = { stone: 857, farm: 205, bronze: 777, print: 1070 }[name];
    const y = { stone: 158, farm: 126, bronze: 152, print: 143 }[name];
    const rgb = { stone: '252,207,150', farm: '255,220,143', bronze: '249,195,117', print: '244,171,129' }[name];
    glow(ctx, x, y, name === 'print' ? 152 : 280, 205, rgb, name === 'print' ? .23 : .51);
    if (name === 'print') {
      oval(ctx, x, y, 24, 24, '#ebc4aa');
      oval(ctx, x + 6, y - 6, 21, 21, '#615667');
    } else {
      const radius = name === 'stone' ? 26 : name === 'farm' ? 30 : 37;
      oval(ctx, x, y, radius, radius, disc);
      oval(ctx, x, y - 1.7, radius * .91, radius * .87, name === 'stone' ? '#efd0a1' : '#ebc887');
    }
    const r = seeded(name.charCodeAt(0) * 117 + 13);
    for (let i = 0; i < 25; i++) {
      const cloud = name === 'print' ? 'rgba(248,178,127,.065)' : 'rgba(234,221,188,.078)';
      thinCloud(ctx, r() * 1340 - 108, 39 + r() * 300, 135 + r() * 432, 12 + r() * 32, cloud, i + 412);
    }
    if (name === 'stone' || name === 'print') {
      for (let i = 0; i < 123; i++) {
        const y = r() ** 1.5 * 219;
        const radius = r() ** 2 * 1.13 + .24;
        oval(ctx, r() * 1280, y, radius, radius, i % 3 ? 'rgba(242,217,175,.26)' : 'rgba(229,222,200,.48)');
      }
    }
    grain(ctx, W, H, 0, 7529, 19500, 'rgba(246,228,174,.072)', 'rgba(27,31,35,.059)');
  }

  function distant(ctx, name) {
    if (name === 'stone') {
      const points = [[-60, 381], [31, 299], [149, 301], [218, 258], [308, 209], [361, 251], [432, 236], [531, 348], [596, 322], [721, 245], [805, 278], [918, 232], [1005, 251], [1070, 219], [1158, 282], [1306, 278], [1395, 242], [1476, 301], [1730, 244]];
      ridge(ctx, '#7e9697', points, 462, 1983);
      ridge(ctx, '#96a9a2', [[172, 322], [306, 211], [374, 255], [403, 241], [462, 294], [429, 282], [353, 279], [321, 249], [275, 300], [243, 291], [215, 317]], 332, 92);
      ridge(ctx, '#8da29c', [[750, 304], [804, 278], [906, 226], [934, 242], [996, 254], [1059, 224], [1087, 241], [1143, 284], [1085, 265], [1042, 274], [908, 248], [860, 294]], 318, 79);
      hill(ctx, 370, 113, .0074, '#5c777c', 5891, 500);
      hill(ctx, 418, 83, .0083, '#486268', 5015, 534);
      glow(ctx, 947, 367, 584, 75, '210,217,177', .34);
      hill(ctx, 459, 57, .0095, '#4b6462', 1277, 544);
    } else if (name === 'farm') {
      hill(ctx, 303, 102, .008, '#a3b196', 4598, 503);
      hill(ctx, 347, 115, .0051, '#809b80', 7818, 518);
      hill(ctx, 381, 65, .0109, '#74917a', 2987, 523);
      glow(ctx, 420, 366, 623, 81, '244,226,153', .45);
      hill(ctx, 421, 57, .009, '#7a976a', 5878, 538);
      for (let i = 0; i < 33; i++) {
        const x = i * 55 - 12;
        const y = 399 + Math.sin(i * .68) * 23;
        tree(ctx, x, y + 10, 19 + i % 8 * 3, ['#789471', '#849a73', '#a1a975'], 888 + i);
      }
    } else if (name === 'bronze') {
      hill(ctx, 306, 117, .0066, '#84958b', 5532, 492);
      hill(ctx, 368, 105, .0076, '#688381', 5891, 524);
      glow(ctx, 788, 369, 670, 111, '225,187,128', .44);
      hill(ctx, 417, 78, .009, '#637d75', 123, 551);
    } else {
      hill(ctx, 337, 108, .008, '#655e68', 5589, 530);
      hill(ctx, 391, 114, .0057, '#534f62', 7815, 518);
      glow(ctx, 1004, 399, 447, 119, '202,139,119', .39);
      hill(ctx, 433, 67, .0118, '#554b58', 6999, 548);
      for (let i = 0; i < 22; i++) {
        const x = i * 86;
        const y = 421 + Math.sin(i * .72) * 25;
        const size = .35 + i % 4 * .08;
        house(ctx, x, y + 55, size, '#605157', '#4d4858', '#9d6763', i + 11431);
      }
    }
  }

  function cave(ctx) {
    const rock = linear(ctx, 40, 222, 501, 524, [[0, '#455b61'], [.39, '#7f8373'], [.72, '#727865'], [1, '#545c54']]);
    poly(ctx, rock, [-40, 202], [39, 161], [126, 188], [196, 151], [314, 223], [378, 211], [489, 285], [551, 402], [587, 492], [611, 547], [-35, 551]);
    poly(ctx, '#94947a', [40, 177], [128, 195], [200, 169], [311, 232], [351, 231], [310, 284], [178, 268], [162, 270], [106, 245], [65, 269], [-8, 236]);
    poly(ctx, '#5a685f', [38, 288], [107, 255], [162, 278], [219, 274], [286, 303], [232, 327], [110, 348], [56, 336], [-9, 347]);
    poly(ctx, '#637267', [343, 240], [391, 245], [479, 293], [500, 336], [445, 318], [392, 327], [321, 306]);
    poly(ctx, '#515b55', [423, 336], [499, 343], [546, 409], [569, 477], [601, 535], [478, 519], [427, 453]);
    shape(ctx, '#343e44', p => {
      p.moveTo(124, 507);
      p.lineTo(157, 432);
      p.bezierCurveTo(195, 365, 251, 336, 327, 336);
      p.bezierCurveTo(381, 330, 405, 380, 412, 428);
      p.lineTo(442, 506);
      p.closePath();
    });
    shape(ctx, linear(ctx, 282, 339, 331, 530, [[0, '#232b35'], [.6, '#292a2b'], [1, '#393333']]), p => {
      p.moveTo(147, 511);
      p.lineTo(184, 444);
      p.quadraticCurveTo(245, 366, 325, 366);
      p.quadraticCurveTo(384, 367, 391, 434);
      p.lineTo(425, 512);
      p.closePath();
    });
    line(ctx, 'rgba(191,178,138,.38)', 3.2, p => {
      p.moveTo(113, 501);
      p.lineTo(151, 418);
      p.quadraticCurveTo(220, 335, 318, 330);
      p.quadraticCurveTo(384, 326, 414, 407);
    });
    const rand = seeded(517068);
    for (let i = 0; i < 306; i++) {
      const x = rand() * 601;
      const y = 177 + rand() * 360;
      if (x > 140 && x < 432 && y > 365) continue;
      if (x > 501 && y < 353 || x > 354 && y < 252 || x > 276 && y < 224) continue;
      bar(ctx, x, y, x + rand() * 25, y + rand() * 14, i % 4 === 0 ? 'rgba(192,181,150,.25)' : 'rgba(32,48,52,.15)', rand() * 1.7 + .5);
    }
    // Umber hand prints rubbed into the rock beside the opening.
    for (const [x, y, s, tilt] of [[463, 396, 1, -.28], [484, 422, .79, .42], [464, 448, .69, .14], [505, 441, .55, .2]]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);
      ctx.scale(s, s);
      oval(ctx, 0, 0, 7.7, 9.3, 'rgba(149,70,48,.58)');
      for (const [i, length] of [9.4, 11.8, 14.3, 10.9, 6.1].entries()) {
        bar(ctx, -7.2 + 3.3 * i, -3 - (i === 2 ? 2 : 0), -12.4 + 6.6 * i, -7.8 - length,
          'rgba(155,81,55,.61)', 2.35 + (i % 4) * .16);
      }
      ctx.restore();
    }
    for (let i = 0; i < 23; i++) {
      const x = 16 + rand() * 595;
      const y = 500 + rand() * 38;
      stone(ctx, x, y, 7 + rand() * 18, '#7a7864', '#4c5b56', 731 + i);
    }
  }

  function house(ctx, x, y, s, wall, roof, highlight, seed) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const rnd = seeded(seed);
    const w = 91 + rnd() * 41;
    const h = 70 + rnd() * 35;
    const x2 = w + 37;
    poly(ctx, wall, [-5, -h], [w, -h - 3], [w, 0], [-5, 0]);
    poly(ctx, '#6e6954', [w, -h - 3], [x2, -h + 7], [x2, -3], [w, 0]);
    poly(ctx, roof, [-23, -h], [32, -h - 49], [w + 3, -h - 47], [x2 + 11, -h + 6], [w, -h - 4], [-23, -h]);
    poly(ctx, highlight, [-21, -h - 1], [31, -h - 48], [w + 4, -h - 46], [w - 9, -h - 41], [32, -h - 38]);
    line(ctx, highlight, 2.45, p => {
      p.moveTo(-22, -h);
      p.quadraticCurveTo(27, -h + 9, w, -h - 4);
      p.lineTo(x2 + 11, -h + 5);
    });
    for (let i = 0; i < 34; i++) {
      const u = rnd();
      const py = -h - 43 + rnd() * 46;
      const px = 17 + u * w - (py + h) * .04;
      bar(ctx, px, py, px + 2 + rnd() * 10, py + 3 + rnd() * 6, i % 3 ? 'rgba(51,53,47,.22)' : 'rgba(225,197,121,.21)', .9 + rnd() * 1.0);
    }
    const door = w * .39;
    poly(ctx, '#474b47', [door - 13, 0], [door - 13, -45], [door + 14, -45], [door + 14, 0]);
    bar(ctx, door - 11, -43, door - 10, -1, '#a28d63', 2.4);
    poly(ctx, '#5c604f', [w * .72, -53], [w * .87, -53], [w * .87, -31], [w * .72, -31]);
    bar(ctx, w * .70, -29, w * .90, -29, highlight, 1.6);
    for (let i = 0; i < 14; i++) {
      const ax = 4 + rnd() * (w - 9);
      const ay = -h + 9 + rnd() * (h - 13);
      if (ax > door - 15 && ax < door + 16 && ay > -47) continue;
      bar(ctx, ax, ay, ax + 4 + rnd() * 13, ay + rnd() * 1.1, 'rgba(204,169,112,.28)', .8);
    }
    ctx.restore();
  }

  function stoneLand(ctx) {
    hill(ctx, 474, 51, .0117, '#62796f', 7205, 568);
    for (const [x, y, s, id] of [[36, 465, 126, 2], [117, 460, 63, 3], [542, 490, 90, 5], [642, 489, 60, 6], [721, 488, 43, 7], [1113, 498, 97, 10], [1277, 523, 123, 11], [1447, 527, 116, 12]]) {
      tree(ctx, x, y, s, ['#384d52', '#3f5960', '#71847a'], 1030 + id, true);
    }
    cave(ctx);
    const rnd = seeded(45519);
    for (let i = 0; i < 78; i++) {
      const x = rnd() * WORLD;
      const y = mix(467, 553, rnd());
      if (x < 516 && y < 504) continue;
      if (i % 3) grasses(ctx, x, y, 11 + rnd() * 14, '#52685e', '#857d64', 621 + i);
      else stone(ctx, x, y, 3 + rnd() * 12, '#7f8575', '#4c625b', i + 1983);
    }
    for (let i = 0; i < 24; i++) {
      const x = 300 + rnd() * 151;
      const y = 508 + rnd() * 15;
      stone(ctx, x, y, 4 + rnd() * 5, '#847b62', '#504d4b', 19384 + i);
    }
    // Scrapings on the broad shelter surface and split poles tied above the hearth.
    for (const [ax, ay, bx, by] of [[350, 499, 376, 474], [378, 497, 377, 474], [403, 499, 376, 476], [356, 481, 395, 481]]) {
      bar(ctx, ax, ay, bx, by, '#635045', 2.3);
    }
  }

  function farmLand(ctx) {
    const rnd = seeded(5944);
    hill(ctx, 433, 36, .009, '#879761', 7346, 562);
    for (let i = 0; i < 13; i++) {
      const y = 384 + i * (4.8 + i * .41);
      const deep = i / 13;
      for (let j = -1; j < 12; j++) {
        const x = j * (121 + deep * 34) + 16 * Math.sin(i * .41 + j);
        const s = 113 + deep * 34 + rnd() * 14;
        const angle = 41 + Math.sin(i * .46) * 28;
        const shade = ['#829457', '#a4a465', '#a6a65d', '#9f995e', '#918f5d', '#b4aa66'][Math.floor(rnd() * 6)];
        poly(ctx, shade, [x, y], [x + s, y - 2 + rnd() * 5], [x + s + angle, y + 6 + i * .32], [x + angle, y + 8 + i * .32]);
        bar(ctx, x + angle, y + 7 + i * .32, x + s + angle, y + 6 + i * .32, 'rgba(208,189,113,.41)', 1.25 + deep * .6);
        for (let k = 0; k < 4; k++) {
          const ax = x + (k + .7) * s / 4;
          bar(ctx, ax, y + .9, ax + angle * .87, y + 7.2 + i * .30, 'rgba(97,117,71,.39)', .65 + deep * .42);
        }
      }
    }
    const canal = linear(ctx, 920, 378, 1100, 540, [[0, '#8caa9a'], [.50, '#77a69a'], [1, '#578b8c']]);
    shape(ctx, canal, p => {
      p.moveTo(998, 375);
      p.bezierCurveTo(970, 430, 812, 451, 829, 492);
      p.bezierCurveTo(842, 519, 1008, 567, 1158, 565);
      p.lineTo(1248, 555);
      p.bezierCurveTo(1000, 528, 884, 508, 879, 478);
      p.bezierCurveTo(888, 460, 985, 420, 1013, 378);
      p.closePath();
    });
    line(ctx, '#bed1a3', 3, p => {
      p.moveTo(998, 377);
      p.bezierCurveTo(975, 424, 808, 455, 828, 493);
      p.bezierCurveTo(846, 522, 1004, 562, 1143, 571);
    });
    for (const [x, y, s, id] of [[93, 445, .46, 1], [184, 456, .67, 2], [281, 444, .46, 3], [375, 454, .53, 4], [479, 488, .75, 5], [622, 456, .52, 6], [765, 447, .39, 7], [1169, 472, .61, 8], [1332, 464, .51, 9], [1495, 495, .69, 12]]) {
      house(ctx, x, y, s, '#b5a172', '#82734c', '#c3aa6a', id + 81904);
    }
    for (let i = 0; i < 68; i++) {
      const x = rnd() * WORLD;
      const y = 468 + rnd() * 84;
      if (x > 848 && x < 1093) continue;
      grasses(ctx, x, y, 6 + rnd() * 20, '#71824f', '#b6ae70', 816 + i);
    }
    for (const [x, y, size, id] of [[10, 489, 78, 72], [149, 456, 62, 81], [433, 463, 63, 87], [1125, 476, 84, 98], [1275, 508, 97, 103], [1669, 523, 73, 106]]) {
      tree(ctx, x, y, size, ['#77785a', '#718651', '#b0a96c'], id);
    }
    // Wheel shed and its plank bridge stand astride the canal.
    for (const [x, y] of [[955, 478], [998, 465], [1085, 463]]) bar(ctx, x, y, x + 3, 359, '#6a7054', 7.2);
    poly(ctx, '#81724e', [938, 377], [990, 339], [1059, 337], [1110, 378], [1060, 377], [990, 374]);
    line(ctx, '#baa467', 3.2, p => { p.moveTo(941, 375); p.quadraticCurveTo(995, 385, 1108, 377); });
    for (let i = 0; i < 17; i++) bar(ctx, 951 + i * 9, 498 - i * 1.1, 968 + i * 9, 511 - i, '#937d51', 2.7);
    line(ctx, '#77714e', 5, p => { p.moveTo(945, 500); p.lineTo(1096, 481); });
    bar(ctx, 964, 448, 1037, 445, '#625947', 9);
  }

  function towerRoof(ctx, x, top, width, height, tint, trim, seed) {
    const rng = seeded(seed);
    const half = width / 2;
    shape(ctx, tint, p => {
      p.moveTo(x - half, top + height);
      p.quadraticCurveTo(x - half * .56, top + height * .62, x - half * .41, top);
      p.lineTo(x + half * .42, top);
      p.quadraticCurveTo(x + half * .68, top + height * .77, x + half, top + height * .91);
      p.quadraticCurveTo(x + half * .75, top + height * 1.22, x, top + height * 1.09);
      p.quadraticCurveTo(x - half * .57, top + height * 1.20, x - half, top + height);
    });
    for (let i = 0; i <= width / 14; i++) {
      const f = (i + .3) * 14 / width;
      const px = x + (2 * f - 1) * half;
      const roofX = x + (2 * f - 1) * (half * .42);
      line(ctx, i % 3 ? 'rgba(49,52,53,.34)' : trim, i % 3 ? 1.2 : 2.0, p => {
        p.moveTo(roofX, top + 1 + rng() * 4);
        p.quadraticCurveTo(roofX + (px - roofX) * .37, top + height * .59, px, top + height * (1.09 - Math.abs(.5 - f) * .18));
      });
    }
    line(ctx, trim, 4, p => {
      p.moveTo(x - half, top + height);
      p.quadraticCurveTo(x - half * .56, top + height * 1.20, x, top + height * 1.1);
      p.quadraticCurveTo(x + half * .57, top + height * 1.20, x + half, top + height * .91);
    });
  }

  function bronzeLand(ctx) {
    const rnd = seeded(79345);
    hill(ctx, 451, 65, .0101, '#6d7e73', 8436, 549);
    for (let i = 0; i < 23; i++) {
      const x = i * 84 - 52;
      const y = 438 + Math.sin(i * .73) * 27;
      house(ctx, x, y, .39 + rnd() * .36, '#8c8670', '#707d71', '#a19871', 7240 + i);
    }
    const brick = linear(ctx, 70, 356, 1100, 533, [[0, '#99896b'], [.59, '#b29d75'], [1, '#817967']]);
    shape(ctx, brick, p => {
      p.moveTo(-10, 375);
      p.lineTo(604, 374);
      p.lineTo(704, 348);
      p.lineTo(1150, 364);
      p.lineTo(1745, 386);
      p.lineTo(1730, 525);
      p.lineTo(-10, 520);
      p.closePath();
    });
    for (let y = 389, i = 0; y < 521; y += 15 + i++ * .12) {
      bar(ctx, -10, y + 4, WORLD, y - 1 + i * .7, i % 3 ? 'rgba(82,76,64,.32)' : 'rgba(228,195,122,.31)', 1.25);
      for (let j = 0; j < 62; j++) {
        const x = j * 31 + (i % 2) * 15 + rnd() * 7;
        bar(ctx, x, y + 2, x + 1.5, y + 16, 'rgba(87,80,64,.34)', .84);
      }
    }
    for (let j = 0; j < 53; j++) {
      const x = j * 33 - 10;
      const y = (x > 680 && x < 1130 ? 365 : 375) + Math.sin(j * .16) * 6;
      poly(ctx, '#98947a', [x, y + 12], [x - 1, y - 4], [x + 16, y - 4], [x + 18, y + 12]);
    }
    const gateX = 888;
    poly(ctx, '#9b8a69', [gateX - 190, 377], [gateX - 177, 253], [gateX + 183, 253], [gateX + 196, 388]);
    poly(ctx, '#766f59', [gateX - 151, 313], [gateX + 144, 313], [gateX + 143, 363], [gateX - 154, 365]);
    for (let i = 0; i < 15; i++) {
      const x = gateX - 146 + i * 20.9;
      bar(ctx, x, 318, x + .5, 364, i % 2 ? '#4e625f' : '#a38e66', 3.8);
    }
    towerRoof(ctx, gateX, 226, 444, 87, '#738078', '#b5a375', 59237);
    towerRoof(ctx, gateX, 295, 402, 52, '#6a7770', '#a49069', 59238);
    shape(ctx, '#526362', p => {
      p.moveTo(gateX - 101, 523);
      p.lineTo(gateX - 101, 461);
      p.bezierCurveTo(gateX - 94, 410, gateX - 56, 386, gateX, 385);
      p.bezierCurveTo(gateX + 65, 387, gateX + 104, 411, gateX + 110, 461);
      p.lineTo(gateX + 110, 523);
      p.closePath();
    });
    shape(ctx, '#3f5354', p => {
      p.moveTo(gateX - 78, 522);
      p.lineTo(gateX - 78, 467);
      p.bezierCurveTo(gateX - 73, 427, gateX - 33, 404, gateX, 406);
      p.bezierCurveTo(gateX + 46, 404, gateX + 84, 435, gateX + 88, 472);
      p.lineTo(gateX + 88, 524);
      p.closePath();
    });
    for (let i = 0; i < 16; i++) {
      const a = Math.PI + i / 16 * Math.PI;
      const x = gateX + 107 * Math.cos(a);
      const y = 464 + 82 * Math.sin(a);
      bar(ctx, x, y, x - Math.cos(a) * 12, y - Math.sin(a) * 11, 'rgba(186,169,114,.44)', 1.4);
    }
    // Workshop foreground deck, railing and a kiln recessed under the roof.
    poly(ctx, '#887b60', [126, 519], [537, 514], [593, 543], [121, 550]);
    poly(ctx, '#706c5c', [167, 416], [307, 410], [322, 513], [151, 515]);
    poly(ctx, '#615b4f', [165, 431], [268, 415], [316, 427], [312, 508], [164, 510]);
    shape(ctx, '#383f40', p => {
      p.moveTo(190, 503);
      p.lineTo(190, 467);
      p.quadraticCurveTo(194, 435, 236, 432);
      p.quadraticCurveTo(270, 437, 276, 465);
      p.lineTo(277, 503);
      p.closePath();
    });
    for (const x of [146, 325, 486, 559]) bar(ctx, x, 408, x + 5, 536, '#625c4c', 8);
    towerRoof(ctx, 344, 346, 465, 73, '#6c7770', '#aa9469', 107224);
    for (let i = 0; i < 27; i++) bar(ctx, 151 + i * 15, 534, 154 + i * 15, 546, '#68604f', 1.7);
    for (const [x, y, s] of [[347, 513, 1], [374, 524, .74], [410, 514, .87], [457, 519, 1.11], [513, 528, .62]]) {
      metalVessel(ctx, x, y, s, x * 20 + 13);
    }
  }

  function metalVessel(ctx, x, y, s, seed) {
    const rand = seeded(seed);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const tone = linear(ctx, -18, -32, 23, -3, [[0, '#937858'], [.41, '#b69863'], [.67, '#607970'], [1, '#466b66']]);
    shape(ctx, tone, p => {
      p.moveTo(-13, 2);
      p.lineTo(13, 2);
      p.lineTo(14, -3);
      p.bezierCurveTo(22, -7, 23, -17, 17, -24);
      p.quadraticCurveTo(17, -30, 13, -38);
      p.quadraticCurveTo(2, -40, -13, -38);
      p.quadraticCurveTo(-15, -31, -16, -24);
      p.bezierCurveTo(-24, -14, -23, -7, -15, -2);
      p.closePath();
    });
    oval(ctx, 0, -38, 14.1, 3.9, '#626952');
    oval(ctx, 0, -38, 10.6, 1.7, '#434d4a');
    line(ctx, 'rgba(205,181,112,.56)', 1.4, p => {
      p.moveTo(-15, -24);
      p.quadraticCurveTo(0, -18, 18, -24);
      p.moveTo(-18, -11);
      p.quadraticCurveTo(0, -7, 19, -11);
    });
    for (let i = 0; i < 20; i++) {
      const px = (rand() - .5) * 32;
      const py = -31 + rand() * 27;
      oval(ctx, px, py, .6 + rand() * 1.4, .7, i % 2 ? 'rgba(86,145,124,.44)' : 'rgba(193,163,110,.29)');
    }
    ctx.restore();
  }

  function printLand(ctx) {
    const rnd = seeded(41004);
    hill(ctx, 493, 56, .012, '#746064', 8830, 557);
    for (let i = 0; i < 14; i++) {
      const x = i * 134 - 29;
      house(ctx, x, 494 + Math.sin(i * .89) * 24, .48 + rnd() * .32, '#85716e', '#695965', '#987467', 57366 + i);
    }
    const front = linear(ctx, 211, 337, 810, 545, [[0, '#80605a'], [.49, '#947761'], [1, '#574c54']]);
    poly(ctx, front, [170, 335], [740, 333], [806, 362], [810, 531], [740, 553], [173, 548]);
    poly(ctx, '#58444b', [197, 369], [741, 368], [733, 532], [194, 526]);
    const room = linear(ctx, 249, 386, 686, 523, [[0, '#946955'], [.28, '#af7c55'], [.69, '#bd8a58'], [1, '#846159']]);
    poly(ctx, room, [220, 384], [732, 385], [732, 526], [215, 527]);
    for (const p of [[249, 415], [433, 425], [673, 445]]) glow(ctx, ...p, 147, 95, '246,162,91', .34);
    for (let i = 0; i < 18; i++) {
      const x = 222 + i * 28;
      bar(ctx, x, 391, x, 521, 'rgba(91,71,61,.20)', 1.3);
    }
    for (const [x, y] of [[233, 443], [233, 471], [233, 501], [607, 447], [607, 473], [607, 501]]) {
      bar(ctx, x, y, x + 119, y + 1, '#725649', 3.25);
      for (let i = 0; i < 8; i++) {
        const b = 5 + rnd() * 5.6;
        const h = 7 + rnd() * 7.6;
        poly(ctx, i % 3 ? '#b79768' : '#94755c', [x + 2 + i * 14, y - h], [x + 2 + i * 14 + b, y - h],
          [x + 5 + i * 14 + b, y - .8], [x + 2 + i * 14, y - .8]);
        bar(ctx, x + 4 + i * 14, y - h + 2, x + 2 + i * 14 + b, y - h + 2, 'rgba(227,196,141,.50)', .79);
      }
    }
    for (const x of [180, 218, 382, 584, 741, 790]) {
      bar(ctx, x, 352, x + 3, 547, '#704e45', 9.2);
      bar(ctx, x + 3.6, 354, x + 6, 539, '#996b55', 2.4);
    }
    towerRoof(ctx, 464, 278, 674, 83, '#854f49', '#b17e60', 53947);
    towerRoof(ctx, 467, 320, 621, 53, '#905447', '#c08a66', 53948);
    poly(ctx, '#765444', [358, 498], [580, 490], [625, 504], [381, 513]);
    poly(ctx, '#97694e', [380, 511], [624, 504], [620, 518], [381, 525]);
    for (const x of [390, 590]) bar(ctx, x, 516, x + 3, 549, '#674e48', 6.25);
    for (let i = 0; i < 18; i++) {
      const x = 188 + (i * 39) % 621;
      const y = 534 + ((i * 13) % 12);
      bar(ctx, x, y, x + 28, y - 1.2, 'rgba(189,128,91,.36)', 1.8);
    }
    const cloth = linear(ctx, 978, 380, 1148, 492, [[0, '#a4594e'], [.54, '#a86855'], [1, '#744c51']]);
    poly(ctx, cloth, [958, 444], [1009, 400], [1097, 398], [1169, 447], [1082, 451], [959, 451]);
    for (const x of [963, 1160]) bar(ctx, x, 447, x + 1, 538, '#74574e', 6);
    bar(ctx, 980, 510, 1141, 512, '#8f6352', 12);
  }

  function road(ctx, name) {
    const edge = { stone: '#546762', farm: '#88905c', bronze: '#807263', print: '#715b60' }[name];
    const dry = colors[name][4];
    const dirt = linear(ctx, 0, 511, 0, 720, [[0, dry], [.34, dry], [.77, colors[name][5]], [1, '#313237']]);
    shape(ctx, dirt, p => {
      p.moveTo(0, 531);
      for (let x = 0; x <= WORLD + 24; x += 13) {
        p.lineTo(x, 531 + Math.sin(x * .014) * 5.4 + Math.sin(x * .005 - 1) * 4.7);
      }
      p.lineTo(WORLD + 24, 720);
      p.lineTo(0, 720);
      p.closePath();
    });
    const r = seeded(317947);
    line(ctx, 'rgba(226,198,142,.24)', 2, p => {
      p.moveTo(0, 546);
      for (let x = 0; x <= WORLD + 24; x += 29) p.lineTo(x, 547 + Math.sin(x * .014 + .9) * 3.4);
    });
    for (let i = 0; i < 850; i++) {
      const x = r() * WORLD;
      const y = 536 + r() ** .81 * 187;
      const depth = (y - 535) / 185;
      const length = (3 + r() * 18) * (.79 + depth * .84);
      const col = i % 5 < 2 ? `rgba(225,202,150,${.08 + r() * .20})` : `rgba(32,42,44,${.07 + r() * .20})`;
      bar(ctx, x, y, x + length, y + (r() - .42) * 3.3 * (1 + depth), col, .45 + r() * (1.6 + depth));
    }
    for (let i = 0; i < 49; i++) {
      const x = r() * WORLD;
      const y = r() > .31 ? 530 + r() * 1.6 : 632 + r() * 34;
      if (i % 4) grasses(ctx, x, y, 6.7 + r() * 16, edge, dry, 82656 + i);
      else stone(ctx, x, y, 4 + r() * 10, dry, edge, 21242 + i);
    }
    if (name === 'bronze' || name === 'print') {
      for (let row = 0; row < 8; row++) {
        const y = 539 + (row + 1) ** 1.73 * 5.9;
        const step = 47 + row * 3.0;
        for (let x = -20; x < WORLD; x += step) {
          const ax = x + ((row % 2) * step) / 2 + r() * 13;
          if (r() > .67) continue;
          line(ctx, 'rgba(37,40,43,.195)', .82 + row * .07, p => {
            p.moveTo(ax - 3, y + r() * 4);
            p.lineTo(ax + step * .82, y + r() * 2.4);
            p.lineTo(ax + step * .86, y + 8 + r() * 5.5);
          });
        }
      }
    }
    grain(ctx, WORLD, 184, 536, 98145, 10245, 'rgba(232,217,170,.087)', 'rgba(37,41,44,.111)');
  }

  function nearEdge(ctx, name) {
    const paint = { stone: ['#394f50', '#566957'], farm: ['#6c7048', '#a29157'], bronze: ['#63584e', '#998060'], print: ['#533f49', '#8b6159'] }[name];
    const rnd = seeded(459019 + name.charCodeAt(0));
    for (let i = 0; i < 78; i++) {
      const x = i * 23 + (rnd() - .5) * 19;
      const y = 686 + rnd() * 40;
      const h = y < 700 ? 17 + rnd() * 25 : 34 + rnd() * 58;
      if (i % 3 === 0) stone(ctx, x, y, h * .40, paint[1], paint[0], i + 1179);
      else if (i % 4 === 1) bush(ctx, x, y, h * .43, paint, 98279 + i);
      else grasses(ctx, x, y, h, paint[0], paint[1], 89177 + i);
    }
  }

  const landscapes = { stone: stoneLand, farm: farmLand, bronze: bronzeLand, print: printLand };

  function layers(name) {
    if (cache.has(name)) return cache.get(name);
    const sky = surface(W, ctx => paintSky(ctx, name));
    const far = surface(WORLD, ctx => distant(ctx, name));
    const center = surface(WORLD, landscapes[name]);
    const ground = surface(WORLD, ctx => road(ctx, name));
    const edge = surface(WORLD, ctx => nearEdge(ctx, name));
    const result = { sky, far, center, ground, edge };
    cache.set(name, result);
    return result;
  }

  function offset(env, depth) {
    const p = clamp(env.progress ?? 0);
    const flow = Number.isFinite(env.travel) ? env.travel : 0;
    return -5 - (69 + p * 21) * depth * p - 13 * depth * Math.sin(flow * .0041 + .32);
  }

  function animal(ctx, x, y, s, step, ear, coat) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    oval(ctx, 0, 1, 37, 3.4, 'rgba(33,47,47,.16)');
    for (let foot = 0; foot < 4; foot++) {
      const z = foot < 2 ? -21 + foot * 8 : 15 + (foot - 2) * 7;
      const phase = step + (foot % 2) * Math.PI + (foot > 1 ? Math.PI : 0);
      const stride = Math.sin(phase) * 8;
      const lift = Math.max(0, -Math.cos(phase)) * 5;
      line(ctx, foot % 2 ? coat[0] : coat[2], 3.4, p => {
        p.moveTo(z, -24);
        p.lineTo(z + stride * .42, -10 - lift * .27);
        p.lineTo(z + stride, -lift);
      });
    }
    shape(ctx, coat[0], p => {
      p.moveTo(-34, -32);
      p.quadraticCurveTo(-28, -43, -21, -42);
      p.quadraticCurveTo(4, -47, 23, -42);
      p.quadraticCurveTo(39, -35, 30, -24);
      p.bezierCurveTo(24, -16, -15, -19, -31, -22);
      p.quadraticCurveTo(-35, -24, -34, -32);
    });
    poly(ctx, coat[0], [19, -37], [28, -49], [38, -47], [43, -38], [39, -31], [29, -32]);
    oval(ctx, 42, -39, 9.4, 6.7, coat[0], .28);
    oval(ctx, 44, -36, 4.5, 2.8, coat[1], .25);
    if (ear) {
      line(ctx, coat[1], 2.1, p => {
        p.moveTo(39, -44);
        p.quadraticCurveTo(35, -50, 28, -54);
        p.quadraticCurveTo(24, -58, 24, -62);
        p.moveTo(39, -43);
        p.quadraticCurveTo(44, -54, 52, -55);
      });
    }
    line(ctx, coat[2], 1.25, p => {
      p.moveTo(-32, -35);
      p.quadraticCurveTo(-43, -35 + 4 * Math.sin(step), -43, -23 + 6 * Math.sin(step));
    });
    oval(ctx, 43, -42, 1.1, .99, '#333b37');
    ctx.restore();
  }

  function person(ctx, x, y, scale, time, palette, action = 'walk') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const phase = time * 9.8;
    const walking = action === 'walk' ? 1 : .08;
    const [coat, light, shade] = palette;
    const bob = walking * Math.abs(Math.sin(phase)) * .85;
    oval(ctx, 0, 1, 12, 2.7, 'rgba(31,41,43,.19)');
    for (let leg = 0; leg < 2; leg++) {
      const push = (leg ? 1 : -1) * Math.sin(phase) * walking;
      line(ctx, leg ? shade : coat, 3.7, p => {
        p.moveTo((leg - .5) * 8, -19 - bob);
        p.lineTo(push * 4 + (leg - .5) * 5, -10);
        p.lineTo(push * 8 + (leg - .5) * 12, -Math.max(0, push) * 3.5);
      });
    }
    shape(ctx, coat, p => {
      p.moveTo(-7, -43 - bob);
      p.quadraticCurveTo(-14, -37 - bob, -11, -22 - bob);
      p.quadraticCurveTo(-5, -16 - bob, 12, -20 - bob);
      p.quadraticCurveTo(7, -33 - bob, 7, -41 - bob);
      p.quadraticCurveTo(-1, -47 - bob, -7, -43 - bob);
    });
    bar(ctx, -6, -36 - bob, -8, -23 - bob, light, 1.73);
    oval(ctx, -.3, -47 - bob, 6.3, 7.3, light);
    oval(ctx, -2.2, -51 - bob, 6.4, 3.1, shade, -.32);
    const hook = Math.sin(phase) * 5.2 * walking;
    const hammer = 1 - (Math.cos(time * 7.2) * .5 + .5) ** 3;
    const delivery = action === 'forge' ? [25 - hammer * 1.7, -27 - hammer * 23] : action === 'press' ? [25 + 4 * Math.sin(time * 2.8), -19 - 6 * Math.sin(time * 2.8)] : [5 + hook, -21 - bob];
    line(ctx, coat, 4.9, p => {
      p.moveTo(2, -40 - bob);
      p.quadraticCurveTo(8, -30 - bob, delivery[0], delivery[1]);
    });
    oval(ctx, delivery[0] + 1, delivery[1], 2.5, 2.2, light);
    if (action === 'forge') {
      bar(ctx, delivery[0], delivery[1], 29 + hammer * 7, -17 - hammer * 34, '#735b45', 2.5);
      bar(ctx, 27 + hammer * 6, -15 - hammer * 32, 35 + hammer * 7, -22 - hammer * 32, '#4c4b50', 5);
    }
    ctx.restore();
  }

  function flame(ctx, x, y, size, t, beat) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    const magnitude = 1 + .14 * Math.sin(t * 12.5) + .09 * Math.cos(t * 19.4) + .18 * (beat ?? 0);
    glow(ctx, 0, -10, 40, 50, '247,153,76', .36 * magnitude);
    glow(ctx, 0, 6, 52, 14, '226,150,82', .29 * magnitude);
    const tint = linear(ctx, 0, 2, 0, -33, [[0, '#ffd18a'], [.49, '#f8ad62'], [1, 'rgba(242,126,72,.77)']]);
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 7.3;
      const height = (i === 1 ? 32 : 20) * magnitude * (1 + .11 * Math.sin(t * 16 + i));
      const curl = Math.sin(t * (9 + i) + i) * (3.8 + i);
      shape(ctx, i === 1 ? tint : 'rgba(237,131,68,.89)', p => {
        p.moveTo(x - 4.8, 1);
        p.bezierCurveTo(x - 12, -8, x + curl, -height * .54, x + curl + 3, -height);
        p.bezierCurveTo(x + curl + 8, -height * .52, x + 8, -8, x + 5, 2);
        p.closePath();
      });
    }
    shape(ctx, '#fbe3a6', p => {
      p.moveTo(-4, 1);
      p.quadraticCurveTo(-6, -9, 2 + Math.sin(t * 13) * 2.8, -20 * magnitude);
      p.quadraticCurveTo(9, -7, 7, 2);
      p.closePath();
    });
    for (let i = 0; i < 14; i++) {
      const f = loop(t * (.79 + i % 4 * .073) + i * .139, 1);
      const x = Math.sin(i * 6.21 + t * 2.3) * (4 + f * 33);
      oval(ctx, x, -7 - f * (44 + i % 5 * 8), .63 + (1 - f) * 1.47, .72 + f * .4,
        `rgba(250,188,100,${(1 - f) * .82})`);
    }
    ctx.restore();
  }

  function smoke(ctx, x, y, t, color, wind) {
    if (!smokeBrushes.has(color)) {
      const brush = document.createElement('canvas');
      brush.width = 96;
      brush.height = 96;
      const g = brush.getContext('2d');
      glow(g, 49, 48, 46, 38, color, .38);
      glow(g, 37, 52, 31, 29, color, .26);
      glow(g, 57, 40, 27, 24, color, .19);
      smokeBrushes.set(color, brush);
    }
    const keep = ctx.globalAlpha;
    const brush = smokeBrushes.get(color);
    for (let i = 0; i < 17; i++) {
      const age = loop(t * .26 + i / 17, 1);
      const spread = 11 + 49 * age;
      const drift = 7 * Math.sin(age * 8 + t * 1.13) + wind * age ** 1.33;
      ctx.globalAlpha = keep * .28 * Math.sin(age * Math.PI) ** .74;
      ctx.drawImage(brush, x + drift - spread * .5, y - age * 145 - spread * .45, spread, spread);
    }
    ctx.globalAlpha = keep;
  }

  function banner(ctx, x, y, t, scale, tint, seam) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const spill = Math.sin(t * 3.5 + x * .07) * 4.3;
    const lower = Math.sin(t * 3.5 + x * .07 - 1.33) * 9.1;
    bar(ctx, -13, 0, 48, -1.8, '#655b4e', 3.5);
    shape(ctx, tint, p => {
      p.moveTo(-2, .3);
      p.quadraticCurveTo(16, 2.3, 37, -1.5);
      p.bezierCurveTo(40 + spill, 14, 34 + spill, 24, 40 + lower, 34);
      p.lineTo(26 + lower, 29.2);
      p.lineTo(2 + lower, 36);
      p.bezierCurveTo(-2 + spill, 21, 1 + spill, 9, -2, .3);
    });
    line(ctx, seam, 1.1, p => {
      p.moveTo(5, 4.4);
      p.bezierCurveTo(2 + spill, 15, 10 + lower, 25, 7 + lower, 32.8);
      p.moveTo(29, 2.4);
      p.quadraticCurveTo(30 + spill, 18, 32 + lower, 29.6);
    });
    ctx.restore();
  }

  function birds(ctx, x, y, t, hue, size) {
    for (let i = 0; i < 8; i++) {
      const glide = t * 21 + i * 17;
      const px = x + glide;
      const py = y + Math.sin(px * .018 + i * .73) * 9 + i * 3.4;
      const wing = Math.cos(t * 9.3 + i * .54) * (2 + i % 3) - 1.8;
      line(ctx, hue, size + (i % 2) * .12, p => {
        p.moveTo(px - 6 - i % 3, py + wing);
        p.quadraticCurveTo(px - 3.1, py - 2.3, px, py);
        p.quadraticCurveTo(px + 3.8, py - 2.1, px + 7 + i % 3, py + wing);
      });
    }
  }

  function stoneMotion(ctx, t, beat) {
    for (let i = 0; i < 7; i++) {
      const x = 639 + loop(t * (15.4 + i % 3 * 1.73) + i * 48, 764);
      const y = 477 + Math.sin(x * .007 + .9) * 6 - i % 3 * 5.8;
      animal(ctx, x, y, .38 + i % 3 * .075, t * 8.8 + i * 2.46, true, ['#51574f', '#8c8970', '#45534f']);
    }
    smoke(ctx, 367, 488, t, '139,138,118', 68);
    flame(ctx, 366, 506, 1.17, t, beat);
    person(ctx, 314, 506, .71, t, ['#534c47', '#8d7861', '#454448'], 'press');
    person(ctx, 431, 511, .78, t + 1.22, ['#625548', '#a08463', '#4f4a45'], 'press');
  }

  function wheelAt(ctx, x, y, radius, t) {
    ctx.save();
    ctx.translate(x, y);
    const theta = (t * .94) % TAU;
    const rim = ctx.createRadialGradient(0, 0, radius * .72, 0, 0, radius * 1.12);
    rim.addColorStop(0, '#8a785b');
    rim.addColorStop(.51, '#78664e');
    rim.addColorStop(1, '#625a49');
    line(ctx, rim, 7.4, p => p.arc(0, 0, radius, 0, TAU));
    line(ctx, 'rgba(196,173,109,.64)', 1.2, p => p.arc(-.7, -1.6, radius + 2.4, .15, 4.66));
    for (let i = 0; i < 16; i++) {
      const a = theta + i / 16 * TAU;
      ctx.save();
      ctx.rotate(a);
      bar(ctx, 2, 0, radius + 6, 0, i % 2 ? '#74664e' : '#8c7755', i % 4 ? 2.8 : 4.1);
      poly(ctx, '#8c7856', [radius - 4, -6], [radius + 6, -8], [radius + 7, 7], [radius - 5, 8]);
      bar(ctx, radius + 5.5, -7.5, radius + 6, 6.2, '#b19865', 1.15);
      ctx.restore();
    }
    oval(ctx, 0, 0, 8.6, 8.6, '#73624b');
    oval(ctx, 0, 0, 3.3, 3.3, '#ba9a64');
    for (let i = 0; i < 20; i++) {
      const cone = loop(t * 1.3 + i * .143, 1);
      const px = radius * (i % 2 ? -.64 : -.30) - cone * 30 + Math.sin(i * 9.1) * 9;
      const py = radius * .47 + cone * 40;
      oval(ctx, px, py, .6 + (1 - cone) * 1.5, 1.1 + (1 - cone), `rgba(209,231,190,${.64 * (1 - cone)})`);
    }
    ctx.restore();
  }

  function farmMotion(ctx, t) {
    const x = 405 + loop(t * 17.7 + 39, 580);
    animal(ctx, x, 503, .90, t * 7.6, true, ['#82735c', '#b0a26f', '#645e53']);
    person(ctx, x - 60, 506, .79, t, ['#8b7750', '#bc9f70', '#64694f']);
    line(ctx, '#8c7959', 1.0, p => { p.moveTo(x - 42, 478); p.quadraticCurveTo(x - 11, 482, x + 34, 472); });
    const elapsed = Math.max(0,t-19.65);
    const current = t + .65*(elapsed-.8*(1-Math.exp(-elapsed/.8)));
    wheelAt(ctx, 1003, 446, 53, current);
    for (let i = 0; i < 38; i++) {
      const f = loop(current * .71 + i * .0927, 1);
      const px = 840 + Math.sin(f * 2.87 + i * 3.4) * (33 + i % 2 * 30) + 35 * f + i * 4.2;
      const py = 468 + i * 1.9 + f * 7.6;
      bar(ctx, px, py, px + 6 + i % 7 * 2.4, py + .8, `rgba(211,228,181,${.14 + .32 * Math.sin(Math.PI * f)})`, 1.0);
    }
  }

  function bronzeMotion(ctx, t, beat) {
    for (const [x, y, s] of [[674, 363, .97], [1062, 359, .94], [1235, 392, .71], [1501, 390, .75]]) {
      banner(ctx, x, y, t, s, '#9b6b50', 'rgba(208,170,103,.56)');
    }
    smoke(ctx, 235, 469, t + .4, '128,125,110', -36);
    flame(ctx, 232, 501, 1.07, t, beat);
    person(ctx, 361, 509, 1.58, t + .30, ['#795f4a', '#a18156', '#56564d'], 'forge');
    poly(ctx, '#815c4b', [385, 478], [438, 473], [450, 485], [389, 490]);
    poly(ctx, '#595752', [399, 486], [440, 484], [437, 499], [402, 502]);
    poly(ctx, '#a98958', [397, 478], [430, 474], [438, 481], [404, 484]);
    const pulse = loop((t + .30) * 7.2 / TAU, 1);
    const age = loop(pulse + .04, 1);
    if (age < .37) {
      const visibility = 1 - age / .37;
      for (let i = 0; i < 16; i++) {
        const vx = Math.cos(i * 4.32) * (42 + i % 5 * 19);
        const vy = 24 + i % 7 * 16;
        const x = 411 + vx * age;
        const y = 477 - vy * age + 81 * age ** 2;
        bar(ctx, x, y, x + vx * .029, y + 2.8, `rgba(252,189,100,${visibility * .91})`, .72 + i % 3 * .42);
      }
    }
    for (let i = 0; i < 6; i++) {
      const x = 715 + loop(55 * i + t * (13.3 + i % 3 * 9), 609);
      const y = 519 - 12.1 * (i % 3);
      const palette = i % 2 ? ['#697567', '#b08a61', '#535c59'] : ['#94765a', '#b89265', '#5b6058'];
      person(ctx, x, y, .61 + i % 3 * .16, t + i * .86, palette);
    }
  }

  function paper(ctx, x, y, w, h, angle, t, rolled = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const bend = Math.sin(t * 4.6 + x * .036) * (rolled ? 2 : 5.8);
    const paper = linear(ctx, -w * .42, -h * .2, w * .48, h, [[0, '#e0bc85'], [.39, '#d7b17b'], [1, '#a88966']]);
    shape(ctx, paper, p => {
      p.moveTo(-w * .48, -h * .46);
      p.quadraticCurveTo(0, -h * .51, w * .48, -h * .46 + bend * .19);
      p.quadraticCurveTo(w * .46 + bend * .44, h * .05, w * .51 + bend, h * .48);
      p.quadraticCurveTo(w * .13, h * .41 + bend * .24, -w * .51, h * .46);
      p.quadraticCurveTo(-w * .58, 0, -w * .48, -h * .46);
    });
    for (let row = 0; row < (rolled ? 3 : 5); row++) {
      const py = -h * .27 + row * h * .11;
      const col = row % 2 ? 'rgba(77,66,57,.65)' : 'rgba(89,74,58,.74)';
      line(ctx, col, Math.max(.51, w * .027), p => {
        p.moveTo(-w * .34, py);
        p.lineTo(-w * .14 + row % 3, py + .4);
        p.moveTo(-w * .07, py - .7);
        p.quadraticCurveTo(w * .14, py + 1.4, w * (.27 + row % 3 * .03), py);
      });
    }
    line(ctx, 'rgba(244,213,155,.48)', .9, p => {
      p.moveTo(-w * .45, h * .42);
      p.quadraticCurveTo(0, h * .39, w * .49 + bend, h * .44);
    });
    ctx.restore();
  }

  function lamps(ctx, x, y, scale, t) {
    const sway = Math.sin(t * 2.17 + x) * .081;
    const lit = .75 + Math.sin(t * 8.13 + x * .08) * .08 + Math.sin(t * 11.43 + y) * .08;
    glow(ctx, x, y + 6, 96 * scale, 84 * scale, '240,146,88', .41 * lit);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway);
    ctx.scale(scale, scale);
    bar(ctx, 0, -47, 0, 39, '#6b4d48', 2.3);
    const glass = linear(ctx, -17, 5, 16, 6, [[0, '#a8654e'], [.34, '#d7985f'], [.63, '#e7b174'], [1, '#a46850']]);
    shape(ctx, glass, p => {
      p.moveTo(-12, -20);
      p.bezierCurveTo(-26, -8, -19, 12, -10, 17);
      p.quadraticCurveTo(4, 22, 13, 17);
      p.bezierCurveTo(24, 11, 23, -8, 12, -20);
      p.closePath();
    });
    line(ctx, '#815446', 1.65, p => {
      p.moveTo(-7, -20);
      p.quadraticCurveTo(-14, -5, -8, 18);
      p.moveTo(8, -20);
      p.quadraticCurveTo(14, -5, 8, 18);
      p.moveTo(0, -19);
      p.lineTo(0, 18);
    });
    bar(ctx, -13, -20, 13, -20, '#6b4d45', 3.4);
    bar(ctx, -12, 19, 14, 19, '#6b4d45', 3.4);
    bar(ctx, -1, 20, -1, 30, '#a7734c', 2.8);
    ctx.restore();
  }

  function printMotion(ctx, t) {
    for (const [x, y, scale] of [[243, 407, .70], [590, 412, .63], [717, 408, .80], [973, 432, .67], [1138, 432, .69]]) lamps(ctx, x, y, scale, t);
    for (let i = 0; i < 7; i++) {
      const x = 255 + i * 64;
      const y = 438 + Math.sin(i * .67 + t * 1.38) * 1.7;
      bar(ctx, x, 389, x, y - 20, '#87664e', .7);
      paper(ctx, x, y, 23 + i % 3 * 4, 37 + i % 2 * 6, Math.sin(t * 1.9 + .75 * i) * .09, t);
    }
    person(ctx, 459, 509, 1.18, t, ['#946e58', '#c7a075', '#674e4d'], 'press');
    person(ctx, 548, 509, .99, t - 1.1, ['#7e5f55', '#bb916b', '#654f50'], 'press');
    const board = loop(t * .43, 1);
    const bx = 431 + board * 94;
    const by = 500 - Math.sin(board * Math.PI) * 6;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(-.05 + .028 * Math.sin(board * TAU));
    poly(ctx, '#6d4f41', [-33, -3], [30, -3], [41, 7], [-24, 11]);
    poly(ctx, '#9b6b4a', [-35, -7], [28, -8], [40, 4], [-26, 8]);
    for (let i = 0; i < 8; i++) bar(ctx, -26 + i * 7.9, -.9, -21 + i * 7.9, 4.3, '#715044', .83);
    ctx.restore();
    paper(ctx, 531 + Math.sin(t * 2.4) * 9, 501, 46, 15, Math.sin(t * 2.4) * .13, t, true);
    oval(ctx, 551, 509, 14, 3.8, '#624e45');
    oval(ctx, 551, 508.2, 9.4, 2.3, '#4c4748');
    const passer = 825 + loop(t * 39 + 108, 621);
    person(ctx, passer, 536, .96, t, ['#82605e', '#b08a6d', '#664e58']);
    person(ctx, passer + 53, 533, .80, t + 1.1, ['#a07762', '#ce9f70', '#735750']);
  }

  const motion = { stone: stoneMotion, farm: farmMotion, bronze: bronzeMotion, print: printMotion };

  function draw(ctx, name, env = {}) {
    if (!Object.hasOwn(landscapes, name)) name = 'stone';
    const time = env.t ?? 0;
    const cached = layers(name);
    ctx.save();
    ctx.drawImage(cached.sky, 0, 0);
    ctx.drawImage(cached.far, offset(env, .43), 0);
    if (name === 'farm' || name === 'stone') birds(ctx, loop(time * 10 + 448, 1450) - 422, 268, time, '#556966', 1.16);
    const mid = offset(env, 1.58);
    ctx.drawImage(cached.center, mid, 0);
    ctx.save();
    ctx.translate(mid, 0);
    motion[name](ctx, time, env.beat ?? 0);
    ctx.restore();
    ctx.drawImage(cached.ground, offset(env, 2.34), 0);
    if (name === 'stone') glow(ctx, 366 + mid, 542, 140, 28, '222,137,88', .16 + .027 * Math.sin(time * 4.4));
    if (name === 'bronze') glow(ctx, 232 + mid, 544, 102, 23, '219,132,84', .15 + .032 * Math.sin(time * 4.8));
    if (name === 'print') {
      glow(ctx, 372 + mid, 550, 237, 42, '235,154,101', .24 + .026 * Math.sin(time * 2.78));
      glow(ctx, 1095 + mid, 544, 137, 24, '228,140,93', .13);
    }
    ctx.restore();
  }

  function foreground(ctx, name, env = {}) {
    if (!Object.hasOwn(landscapes, name)) return;
    ctx.drawImage(layers(name).edge, offset(env, 3.31), 0);
  }

  window.WheelEarly = { draw, foreground };
})();
