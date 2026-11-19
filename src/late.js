(() => {
  'use strict';

  const W = 1280;
  const H = 720;
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const mix = (a, b, f) => a + (b - a) * f;
  const wrap = (v, n) => (v % n + n) % n;
  const ease = v => { const f = clamp(v); return f * f * (3 - 2 * f); };
  const fadeHex = (hex, alpha) => {
    const c = Number.parseInt(hex.slice(1), 16);
    return 'rgba(' + [c >> 16, c >> 8 & 255, c & 255, clamp(alpha)].join(',') + ')';
  };
  const rand = seed => {
    const product = Math.sin(seed * 73.1381 + 19.8) * 18719.816;
    return product - Math.floor(product);
  };
  const linear = (ctx, x, y, xx, yy, colors) => {
    const g = ctx.createLinearGradient(x, y, xx, yy);
    for (const [stop, color] of colors) g.addColorStop(stop, color);
    return g;
  };
  const fillRect = (ctx, x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const ell = (ctx, x, y, rx, ry, color, radians = 0) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, radians, 0, TAU);
    ctx.fillStyle = color;
    ctx.fill();
  };
  function lines(ctx, pts, color, width = 1) {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  function poly(ctx, pts, color, edge = null, width = 1) {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (edge) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }
  function glow(ctx, x, y, radius, color, clear = 'rgba(0,0,0,0)', stretch = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, stretch);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, clear);
    fillRect(ctx, -radius, -radius, radius * 2, radius * 2, gradient);
    ctx.restore();
  }
  function arch(ctx, x, y, w, h, fill, trim = null) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + w * .51);
    ctx.quadraticCurveTo(x + w / 2, y - w * .48, x + w, y + w * .51);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (trim) {
      ctx.strokeStyle = trim;
      ctx.lineWidth = 2.3;
      ctx.stroke();
    }
  }
  function bands(ctx, seed, horizon, drift, colors) {
    colors.forEach((color, i) => {
      const base = horizon + i * 37;
      const step = 157 - i * 11;
      const slide = drift * (.20 + i * .16);
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = -step - wrap(slide, step); x < W + step; x += step) {
        const chunk = Math.floor((x + slide + 2) / step);
        const y = base - rand(seed + i * 129 + chunk) * (92 - i * 6);
        ctx.quadraticCurveTo(x - step * .32, y + 33 * rand(chunk * 12 + 3), x, y);
      }
      ctx.lineTo(W, H);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  let texture = null;
  function grain(ctx, intensity) {
    if (!texture) {
      const tile = document.createElement('canvas');
      tile.width = tile.height = 256;
      const c = tile.getContext('2d');
      const image = c.createImageData(tile.width, tile.height);
      for (let i = 0; i < 256 * 256; i++) {
        const p = i * 4;
        const dust = rand(i + 185) > .47 ? 255 : 1;
        image.data[p] = dust;
        image.data[p + 1] = dust;
        image.data[p + 2] = dust;
        image.data[p + 3] = Math.round(rand(i + 94) * 60);
      }
      c.putImageData(image, 0, 0);
      texture = tile;
    }
    ctx.save();
    ctx.globalAlpha *= intensity;
    fillRect(ctx, 0, 0, W, H, ctx.createPattern(texture, 'repeat'));
    ctx.restore();
  }

  const roads = {
    steam: ['#69544b', '#4d3c36', '#2a2427', '#c39461', '#311f25', '#dda261'],
    electric: ['#53536a', '#393b50', '#212035', '#b38b79', '#171c30', '#f5be79'],
    digital: ['#50636d', '#3d4f5d', '#263647', '#84a3a4', '#23333d', '#62b5a5'],
    ai: ['#aaaf90', '#8a9b86', '#4b706d', '#c3cca7', '#436b5d', '#f0e4ae'],
  };
  function road(ctx, era, t, slide) {
    const [rim, upper, lower, mark, dark, glint] = roads[era];
    fillRect(ctx, 0, 513, W, 207, linear(ctx, 0, 513, 0, 720, [[0, rim], [.21, upper], [1, lower]]));
    if (era === 'steam' || era === 'electric') {
      const trackY = era === 'steam' ? 527 : 534;
      for (let i = -1; i < 48; i++) {
        const x = i * 31 - wrap(slide, 31);
        poly(ctx, [x, trackY - 9, x + 7, trackY - 9, x + 13, trackY + 21, x + 4, trackY + 21], dark);
      }
      for (const dy of [0, 11]) {
        lines(ctx, [0, trackY + dy + 1, W, trackY + dy + 5], dark, 3.4);
        lines(ctx, [0, trackY + dy - 1, W, trackY + dy + 3], mark, 1.2);
      }
    }
    // Three layers of worn road markings maintain the rider's ground contact.
    ctx.save();
    ctx.globalAlpha = .30;
    for (let row = 0; row < 6; row++) {
      const y = [561, 573, 591, 620, 654, 699][row];
      const length = 32 + row * row * 1.6;
      const step = length + 6;
      const offset = slide * (.78 + row * .06) + row * 37.6;
      for (let col = -1; col <= 2 + W / step; col++) {
        const chunk = Math.floor(offset / step) + col;
        const x = col * step - wrap(offset, step);
        const n = rand(chunk * 7 + row * 271);
        lines(ctx, [x, y + n * 2, x + length * (.82 + n * .17), y + 1 + n * 1.2], n > .67 ? mark : dark, n > .76 ? 1.2 : .75);
        if (row > 1 && n > .44) lines(ctx, [x - 1, y, x + 2, y + 5 + row], dark, 1);
      }
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = era === 'ai' ? .16 : .24;
    for (let i = 0; i < 28; i++) {
      const lane = 548 + rand(i * 9 + 12) * 155;
      const x = wrap(rand(i * 12 + 5) * (W + 190) - slide * (lane - 460) * .0068, W + 190) - 95;
      const width = 5 + rand(i * 23 + 1) * (lane - 475) * .55;
      ell(ctx, x, lane, width, .72 + (lane - 540) * .014, i % 5 ? mark : glint, -.012);
    }
    ctx.restore();
    if (era === 'digital' || era === 'ai') {
      fillRect(ctx, 0, 552, W, 1.5, mark);
      fillRect(ctx, 0, 551, W, .7, dark);
    }
  }

  function tower(ctx, x, bottom, w, height, colors, seed, light = .25, power = 1) {
    const [front, side, cornice, glass] = colors;
    const top = bottom - height;
    const lip = w * .13;
    fillRect(ctx, x, top, w, height, front);
    poly(ctx, [x + w, top, x + w + lip, top + lip * .45, x + w + lip, bottom, x + w, bottom], side);
    fillRect(ctx, x - 3, top - 4, w + 5, 4, cornice);
    fillRect(ctx, x + 2, top + 20, 2, height - 20, cornice);
    const columns = Math.max(1, Math.floor((w - 11) / 19));
    const rows = Math.max(1, Math.floor((height - 21) / 24));
    const space = (w - 12) / columns;
    for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
      const i = rand(seed + r * 97 + c * 31);
      const left = x + 6 + c * space, y = top + 10 + r * 24;
      fillRect(ctx, left - .8, y - 1, space * .48 + 1.7, 14, side);
      const active = i < light ? ease((power - .28 * (i / light)) / .72) : 0;
      fillRect(ctx, left, y, space * .46, 11, 'rgba(12,27,38,.49)');
      if (active > .01) {
        fillRect(ctx, left, y, space * .46, 11, fadeHex(glass, active));
        if (i < light * .72) fillRect(ctx, left, y + 9, space * .46, 1.2, 'rgba(250,215,159,' + .31 * active + ')');
      }
    }
  }
  function city(ctx, scroll, bottom, palette, sky, density, light, powerAt = null) {
    const unit = 71;
    const offset = wrap(scroll, unit);
    for (let i = -1; i < 21; i++) {
      const j = i + Math.floor(scroll / unit);
      const x = i * unit - offset;
      const h = 47 + rand(j * 17) * 132 * density;
      const w = 34 + rand(j * 9 + 50) * 39;
      tower(ctx, x, bottom, w, h, palette, j * 11, light, powerAt ? powerAt(x) : 1);
      if (rand(j * 9 + 38) > .65) {
        const roof = x + w * .58;
        lines(ctx, [roof, bottom - h, roof, bottom - h - 19], sky, 1.5);
        lines(ctx, [roof - 6, bottom - h - 13, roof + 7, bottom - h - 13], sky, 1);
      }
    }
  }

  function smoke(ctx, x, y, t, scale, tone = '60,45,45', flow = -1, phase = 0) {
    ctx.save();
    for (let i = 0; i < 15; i++) {
      const q = wrap(i / 15 + t * .145 + phase, 1);
      const swell = (12 + q * 66) * scale;
      const X = x + flow * q ** 1.49 * 260 * scale + Math.sin(q * 8 + t * .75) * 17 * q * scale;
      const Y = y - (q * 103 + Math.sin(q * 2.8) * 24) * scale;
      const alpha = .27 * (1 - q) * clamp(q * 13, .25, 1);
      glow(ctx, X, Y, swell, 'rgba(' + tone + ',' + alpha + ')', 'rgba(' + tone + ',0)', .63 + q * .055);
      if (i % 3 === 0) ell(ctx, X - swell * .3, Y - swell * .09, swell * .49, swell * .28,
        'rgba(' + tone + ',' + alpha * .39 + ')', -.1);
    }
    ctx.restore();
  }
  function mill(ctx, x, y, w, seed) {
    const brick = linear(ctx, 0, y - 161, 0, y, [[0, '#815846'], [.26, '#795143'], [1, '#4c3b39']]);
    fillRect(ctx, x, y - 166, w, 166, brick);
    poly(ctx, [x - 15, y - 166, x + 26, y - 199, x + w - 40, y - 197, x + w + 15, y - 164], '#4f3b3a');
    poly(ctx, [x + w - 39, y - 197, x + w + 15, y - 164, x + w + 16, y, x + w - 19, y], '#46353a');
    lines(ctx, [x - 12, y - 165, x + w + 13, y - 163], 'rgba(208,140,87,.46)', 2);
    for (let r = 0; r < 16; r++) {
      const yy = y - 156 + r * 10;
      const tint = r % 3 === 0 ? 'rgba(33,27,35,.19)' : 'rgba(177,121,90,.21)';
      lines(ctx, [x + 2, yy, x + w - 19, yy + .8], tint, 1);
      for (let i = 0; i < w / 21; i++) {
        const xx = x + 4 + i * 21 + (r % 2) * 10;
        lines(ctx, [xx, yy, xx + .8, yy + 5 + rand(seed + r * 71 + i * 83) * 3], tint, .75);
      }
    }
    const step = 51;
    for (let row = 0; row < 2; row++) for (let i = 0; i < (w - 24) / step; i++) {
      const wx = x + 14 + i * step, wy = y - 143 + row * 72;
      const bright = rand(seed + i * 31 + row * 37) > .37;
      arch(ctx, wx, wy, 26, 51, bright
        ? linear(ctx, wx, wy, wx, wy + 50, [[0, '#a56540'], [.63, '#dc9c59'], [1, '#7a4d3f']])
        : '#413839', '#9d6c52');
      lines(ctx, [wx + 13, wy + 5, wx + 13, wy + 51], '#493535', 1.8);
      lines(ctx, [wx, wy + 27, wx + 26, wy + 27], '#493535', 1.7);
      fillRect(ctx, wx - 3, wy + 50, 32, 3, '#b27b55');
    }
    fillRect(ctx, x - 3, y - 7, w + 8, 7, '#51433d');
  }
  function chimney(ctx, x, y, tall, width, color) {
    const top = y - tall;
    const front = linear(ctx, x - width, top, x + width, top, [[0, '#513f3d'], [.50, color], [1, '#4a3738']]);
    poly(ctx, [x - width * .60, top, x + width * .63, top, x + width, y, x - width, y], front);
    fillRect(ctx, x - width * .72, top - 4, width * 1.45, 8, '#4e3738');
    for (let j = 1; j < tall / 11; j++) {
      const yy = top + j * 11, chip = mix(.60, 1, (yy - top) / tall);
      lines(ctx, [x - width * chip, yy, x + width * chip, yy + 1], 'rgba(230,166,116,.16)', .8);
    }
  }
  function gear(ctx, x, y, radius, spokes, angle, metal, edge, thick = 3) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.strokeStyle = metal;
    ctx.lineWidth = thick + 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, radius + thick * .43, -1.82, .44);
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    for (let i = 0; i < spokes; i++) {
      const a = i / spokes * TAU + angle;
      const c = Math.cos(a), s = Math.sin(a);
      lines(ctx, [x + radius * .25 * c, y + radius * .26 * s, x + (radius - 2) * c, y + (radius - 2) * s], metal, thick);
      lines(ctx, [x + radius * .41 * c + 1, y + radius * .41 * s, x + (radius - 3) * c + 1, y + (radius - 3) * s], edge, .9);
    }
    ell(ctx, x, y, radius * .17, radius * .17, metal);
    ell(ctx, x - radius * .035, y - radius * .035, radius * .07, radius * .07, edge);
  }
  function beamEngine(ctx, x, y, t, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    // The shed's front and open engine bay are distinct planes.
    poly(ctx, [-250, -185, -209, -224, 176, -224, 223, -188], '#493038', '#a56b50', 1.65);
    poly(ctx, [176, -224, 223, -188, 223, -2, 176, -21], '#51333d');
    fillRect(ctx, -226, -186, 404, 187, linear(ctx, 0, -186, 0, 0,
      [[0, '#462f34'], [.48, '#51413e'], [.91, '#8c542f'], [1, '#502f32']]));
    for (let row = 0; row < 13; row++) {
      const yy = -179 + row * 13;
      lines(ctx, [-225, yy, 177, yy], 'rgba(200,143,100,.14)', .8);
      for (let i = 0; i <= 19; i++) {
        const xx = -225 + i * 21 + (row % 2) * 10;
        lines(ctx, [xx, yy, xx, yy + 11], 'rgba(224,139,90,.10)', .65);
      }
    }
    for (const xx of [-171, -102, 40, 111]) {
      arch(ctx, xx, -173, 36, 74, '#64453b', '#806050');
      arch(ctx, xx + 4, -167, 28, 65, linear(ctx, 0, -169, 0, -106,
        [[0, '#9a6246'], [.7, '#c37c4a'], [1, '#6e443b']]), '#3d3037');
      lines(ctx, [xx + 18, -164, xx + 18, -102], '#76503e', 2.1);
    }
    glow(ctx, 15, -85, 242, 'rgba(241,137,65,.37)', 'rgba(241,137,65,0)', .70);
    for (const xx of [-207, 171]) {
      fillRect(ctx, xx - 8, -204, 17, 204, '#382d34');
      fillRect(ctx, xx + 8, -194, 3, 185, '#93705b');
      for (let k = -191; k < -3; k += 25) ell(ctx, xx + .9, k, 2.2, 2.2, '#aa8061');
    }
    lines(ctx, [-197, -190, -104, -145, 84, -189, 169, -153], '#443137', 6);
    lines(ctx, [-196, -193, -104, -148, 84, -192, 169, -156], '#856354', 1.3);
    fillRect(ctx, -201, -7, 374, 10, '#33222b');
    poly(ctx, [-22, -5, -16, -121, -8, -142, 8, -142, 17, -121, 22, -5], '#3e2d31', '#9d734c', 2);
    fillRect(ctx, -141, -14, 295, 13, '#311f28');
    // Solve the fixed-length coupler against the rocker pivot on each turn.
    // Both pins remain attached to the same iron link across the full cycle.
    const phase = t * 3.38;
    const wheelX = -99, wheelY = -48, pivotY = -147;
    const pinX = wheelX + Math.cos(phase) * 20;
    const pinY = wheelY + Math.sin(phase) * 20;
    const dx = pinX, dy = pinY - pivotY;
    const distance = Math.hypot(dx, dy);
    const pivotArm = 117, connector = 105;
    const projection = (pivotArm ** 2 - connector ** 2 + distance ** 2) / (2 * distance);
    const offset = Math.sqrt(Math.max(0, pivotArm ** 2 - projection ** 2));
    const armLX = (dx * projection - dy * offset) / distance;
    const armLY = pivotY + (dy * projection + dx * offset) / distance;
    const tilt = Math.atan2(pivotY - armLY, -armLX);
    const armRX = 117 * Math.cos(tilt), armRY = pivotY + 117 * Math.sin(tilt);
    const weightedX = 145 * Math.cos(tilt), weightedY = pivotY + 145 * Math.sin(tilt);
    const pistonHead = -102 + Math.sin(tilt) * 79;
    gear(ctx, wheelX, wheelY, 43, 9, phase, '#332a2f', '#c68750', 6);
    ctx.beginPath();
    ctx.arc(wheelX, wheelY, 32, phase + .40, phase + 1.37);
    ctx.strokeStyle = '#63504a';
    ctx.lineWidth = 12;
    ctx.stroke();
    lines(ctx, [armLX, armLY, pinX, pinY], '#27222a', 10);
    lines(ctx, [armLX + 1.4, armLY, pinX + 1.4, pinY], '#be8c58', 2.15);
    ell(ctx, pinX, pinY, 5.8, 5.8, '#aa7952');
    ell(ctx, pinX, pinY, 2.5, 2.5, '#362b32');
    fillRect(ctx, 86, -60, 47, 51, '#35262a');
    fillRect(ctx, 91, -56, 38, 47, linear(ctx, 86, -56, 129, -56,
      [[0, '#51413c'], [.43, '#a67651'], [1, '#644536']]));
    ell(ctx, 109.6, -56, 22.2, 6, '#a27149');
    lines(ctx, [armRX, armRY, 110, pistonHead, 110, -57], '#30272d', 7.5);
    lines(ctx, [armRX + 1, armRY, 111, pistonHead, 111, -58], '#d1a269', 2.7);
    fillRect(ctx, 107, pistonHead - 3, 8, 8, '#584234');
    lines(ctx, [weightedX, weightedY, 149, weightedY + 51], '#a78263', 2.8);
    for (let k = 0; k < 6; k++) ell(ctx, mix(weightedX, 149, k / 6), weightedY + k * 8.5, 2.2, 4, '#7d6253');
    poly(ctx, [136, weightedY + 49, 162, weightedY + 49, 165, weightedY + 71, 133, weightedY + 71],
      '#3b3239', '#ad8060', 1.8);
    fillRect(ctx, 137, weightedY + 60, 24, 2, '#704c42');
    ctx.save();
    ctx.translate(0, pivotY);
    ctx.rotate(tilt);
    poly(ctx, [-123, -5, -73, -1, -38, -12, 1, -15, 55, -7, 149, -4, 148, 4, 65, 8, -75, 12, -123, 7],
      '#3b2c30', '#c28850', 2.3);
    lines(ctx, [-117, -1, -71, 4, -32, -7, 0, -9, 60, -3, 144, 0], '#64453d', 1.7);
    for (const k of [-117, -59, 0, 60, 117, 145]) ell(ctx, k, 1, k ? 3.1 : 8.2, k ? 3.1 : 7.5, '#a4754e');
    ell(ctx, 0, 0, 3.2, 3.1, '#3d2d39');
    ctx.restore();
    lines(ctx, [-192, -16, -142, -17, -142, -29, -84, -28], '#261d2a', 5.2);
    lines(ctx, [-191, -18, -143, -19, -142, -31, -85, -30], '#b77247', 1.4);
    lines(ctx, [129, -23, 155, -23, 155, -77, 173, -77], '#402a31', 6);
    lines(ctx, [128, -25, 153, -25, 153, -78, 173, -78], '#9d6646', 1.7);
    ctx.restore();
  }
  function steamTrain(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    // A small side-lit freight train moves on the track behind the rider.
    smoke(ctx, 83, -83, t * 1.85, .67, '119,104,93', -1, .09);
    for (let i = 0; i < 2; i++) {
      const xx = -162 - i * 126;
      fillRect(ctx, xx, -45, 114, 32, '#4a302d');
      fillRect(ctx, xx, -44, 114, 4, '#7f5a47');
      for (let j = 0; j < 10; j++) lines(ctx, [xx + 4 + j * 11, -40, xx + 3.5 + j * 11, -15], '#694538', .9);
      for (const k of [17, 83]) gear(ctx, xx + k, -7, 9, 5, t * 3.5, '#28262c', '#6a574d', 2.2);
      lines(ctx, [xx + 114, -17, xx + 127, -17], '#34313a', 3.2);
    }
    fillRect(ctx, -44, -28, 136, 14, '#27262b');
    poly(ctx, [84, -24, 113, -19, 122, -7, 86, -9], '#3f2f35', '#977256', 1.2);
    fillRect(ctx, -43, -67, 37, 47, '#4d3935');
    fillRect(ctx, -34, -62, 17, 18, '#edb971');
    lines(ctx, [-25, -62, -25, -44], '#554047', 2);
    poly(ctx, [-47, -68, -39, -74, -5, -72, 1, -67], '#3c3238', '#8b6046');
    fillRect(ctx, -8, -53, 96, 28, linear(ctx, 0, -53, 0, -23, [[0, '#56443c'], [.39, '#282930'], [1, '#372e33']]));
    ell(ctx, 86, -38, 15, 15, '#323034');
    for (const k of [15, 48, 68]) lines(ctx, [k, -53, k, -28], '#9e754e', 1.65);
    poly(ctx, [75, -54, 77, -77, 71, -79, 71, -85, 91, -85, 91, -79, 86, -77, 88, -53], '#312c30', '#8f6750', 1.25);
    glow(ctx, 92, -48, 27, 'rgba(238,157,63,.52)', 'rgba(238,157,63,0)', .79);
    ell(ctx, 94, -46, 3.8, 4, '#f7c47d');
    for (const k of [-30, 11, 51]) gear(ctx, k, -10, 14, 8, t * 3.9, '#33252a', '#9e6b4d', 3.4);
    lines(ctx, [-30, -10 + Math.sin(t * 3.9) * 6, 53, -10 + Math.sin(t * 3.9) * 6], '#956147', 3);
    gear(ctx, 86, -9, 8, 5, t * 3.9, '#30262c', '#865c45', 2);
    ctx.restore();
  }

  function steam(ctx, env) {
    const { t, progress, far, near } = env;
    fillRect(ctx, 0, 0, W, H, linear(ctx, 0, 0, 469, 548, [[0, '#4e353d'], [.38, '#915947'], [.78, '#d29458'], [1, '#b38261']]));
    const sun = 549 - 238 * progress;
    glow(ctx, sun, 163, 339, 'rgba(255,193,103,.63)', 'rgba(255,196,110,0)', .82);
    ell(ctx, sun, 178, 45, 44, 'rgba(247,183,104,.84)');
    for (let i = 0; i < 11; i++) {
      const x = wrap(i * 197 + t * 7, W + 350) - 180;
      glow(ctx, x, 115 + rand(i * 3 + 5) * 166, 137 + rand(i * 5 + 17) * 140, 'rgba(78,48,58,.36)', 'rgba(91,58,65,0)', .22);
    }
    bands(ctx, 80, 397, far, ['#ad7a60', '#927258', '#806151']);
    city(ctx, far * .26, 506, ['#72574d', '#67504a', '#886356', '#d6a56f'], '#624f49', .57, .27);
    for (const [x, tall, width, shift] of [[184, 257, 21, .3], [390, 184, 18, .6], [1139, 216, 20, .2]]) {
      const xx = x - 107 * progress;
      smoke(ctx, xx, 490 - tall, t, 1.17, '69,52,54', -.95, shift);
      chimney(ctx, xx, 490, tall, width, '#8d6251');
    }
    mill(ctx, -31 - 132 * progress, 511, 509, 125);
    mill(ctx, 447 - 218 * progress, 511, 207, 300);
    beamEngine(ctx, 1130 - 430 * progress, 519, t, 1.20 + .28 * Math.sin(Math.PI * progress));
    road(ctx, 'steam', t, near);
    const railX = -332 + progress * 1970;
    ctx.save();
    ctx.globalAlpha = .80;
    ctx.translate(railX, 527);
    ctx.scale(.82, .82);
    steamTrain(ctx, 0, 0, t);
    ctx.restore();
    // Diffuse steam settles just behind the rider's rear wheel.
    for (let i = 0; i < 4; i++) {
      const x = wrap(t * 24 + i * 392, W + 300) - 150;
      glow(ctx, x, 537 + Math.sin(t + i) * 3, 140, 'rgba(220,178,135,.18)', 'rgba(220,178,135,0)', .12);
    }
    grain(ctx, .20);
  }

  function hangingWire(ctx, left, right, a, b, sag, color, width = 1.1) {
    ctx.beginPath();
    ctx.moveTo(left, a);
    ctx.quadraticCurveTo((left + right) / 2, (a + b) / 2 + sag, right, b);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  function electricPoles(ctx, offset, t) {
    const space = 320;
    const start = -wrap(offset, space) - space;
    const y = x => 180 + Math.sin((x + offset) * .0044) * 18;
    for (let x = start; x < W + space; x += space) {
      const yy = y(x);
      for (const h of [0, 10, 19]) hangingWire(ctx, x, x + space, yy + h, y(x + space) + h, 31, '#292b3f', 1.25);
      poly(ctx, [x - 4, yy - 3, x + 4, yy - 3, x + 7, 545, x - 7, 545], '#353040', '#544651', .85);
      lines(ctx, [x - 17, yy + 7, x + 18, yy + 7], '#333142', 3.9);
      for (const dx of [-12, 0, 12]) ell(ctx, x + dx, yy + 1, 2.7, 4.4, '#8b7070');
    }
  }
  function lamp(ctx, x, y, t, tint = '244,178,91', power = 1) {
    const flicker = (.97 + Math.sin(t * 15 + x * .08) * .03) * power;
    ctx.beginPath();
    ctx.moveTo(x, 543);
    ctx.lineTo(x - 2, y + 15);
    ctx.quadraticCurveTo(x, y - 8, x + 22, y - 10);
    ctx.quadraticCurveTo(x + 40, y - 7, x + 44, y + 3);
    ctx.strokeStyle = '#32303c';
    ctx.lineWidth = 4.4;
    ctx.stroke();
    lines(ctx, [x + 1, 543, x, y + 18], 'rgba(168,130,109,.5)', 1);
    fillRect(ctx, x - 5, 536, 11, 6, '#423745');
    if (flicker > .01) {
      glow(ctx, x + 44, y + 8, 114, 'rgba(' + tint + ',' + .55 * flicker + ')', 'rgba(' + tint + ',0)', .67);
      glow(ctx, x + 25, 553, 133, 'rgba(' + tint + ',' + .28 * flicker + ')', 'rgba(' + tint + ',0)', .104);
    }
    poly(ctx, [x + 33, y + 3, x + 51, y + 3, x + 55, y + 8, x + 34, y + 9], '#4a3c42');
    ell(ctx, x + 44, y + 9, 8, 4.5, '#61566a');
    if (flicker > .01) {
      ell(ctx, x + 44, y + 9, 8, 4.5, fadeHex('#fae1ac', flicker));
      ell(ctx, x + 43, y + 8, 4.8, 2, fadeHex('#fff2cd', flicker));
    }
  }
  function steelWorks(ctx, x, base, t) {
    ctx.save();
    ctx.translate(x, base);
    poly(ctx, [-50, -165, 63, -205, 322, -179, 405, -143, 405, 0, -50, 0], '#323343', '#685652', 1.2);
    poly(ctx, [-30, -147, 64, -190, 317, -164, 381, -136, 381, -4, -30, -4], '#222632');
    glow(ctx, 199, -67, 164, 'rgba(227,106,49,.75)', 'rgba(227,106,49,0)', .74);
    glow(ctx, 206, -34, 118, 'rgba(253,169,79,.59)', 'rgba(253,169,79,0)', .63);
    const chamber = linear(ctx, 145, -72, 261, -61, [[0, '#8f4434'], [.61, '#e69b55'], [1, '#74423c']]);
    poly(ctx, [154, -1, 155, -44, 167, -95, 254, -94, 263, -44, 264, 0], chamber, '#392b35', 4);
    arch(ctx, 185, -59, 49, 54, '#ffc778', '#5e3a38');
    ell(ctx, 211, -27, 17, 17, '#ffe9a8');
    for (let i = 0; i < 26; i++) {
      const f = wrap(t * .48 + i / 26, 1);
      const sx = 213 + (f ** 1.39) * (rand(i * 19) - .42) * 370;
      const sy = -24 - f * (56 + rand(i * 51) * 98) - 14 * Math.sin(f * Math.PI);
      ell(ctx, sx, sy, 1.1 + (1 - f) * 1.33, .6 + (1 - f), 'rgba(255,202,114,' + (1 - f) * .83 + ')', .4);
    }
    for (const xx of [-33, 55, 132, 265, 333, 386]) {
      fillRect(ctx, xx - 3, -146, 7, 147, '#373342');
      fillRect(ctx, xx + 3, -144, 1.3, 143, '#8c6660');
      lines(ctx, [xx, -143, xx + 52, -112, xx + 52, -141, xx, -107], '#3a3442', 2.4);
    }
    for (const yy of [-146, -106, -6]) lines(ctx, [-34, yy, 382, yy + 6], '#4d3d47', yy === -146 ? 6 : 3.4);
    ctx.restore();
  }
  function transformer(ctx, x, y, t, beat) {
    ctx.save();
    ctx.translate(x, y);
    fillRect(ctx, -9, -2, 164, 8, '#343745');
    fillRect(ctx, 9, -52, 126, 50, linear(ctx, 15, -51, 113, -2,
      [[0, '#696274'], [.25, '#575769'], [1, '#3c4158']]));
    fillRect(ctx, 4, -55, 136, 5, '#494855');
    for (let i = 0; i < 16; i++) {
      const q = i * 6.8;
      fillRect(ctx, 17 + q, -44, 3.25, 36, i % 3 ? '#393c4f' : '#636076');
      lines(ctx, [18 + q, -42, 18 + q, -11], '#77717a', .75);
    }
    for (const [index, xx] of [26, 65, 103].entries()) {
      const top = -91 + index % 2 * 12;
      lines(ctx, [xx, -56, xx, top], '#3b3a4f', 4);
      for (let yy = top + 4; yy < -56; yy += 5) {
        ell(ctx, xx, yy, 7.1, 2.5, yy % 2 ? '#a17e6a' : '#856d68');
        ell(ctx, xx - .6, yy - 1, 4.4, .7, '#c8a17d');
      }
      hangingWire(ctx, xx, xx + 57, top + 1, -112 - index * 4, 17, '#373549', 1);
    }
    const pulse = .32 + beat * .20 + Math.sin(t * 11) * .10;
    glow(ctx, 122, -45, 17, 'rgba(243,176,111,' + pulse + ')', 'rgba(243,176,111,0)');
    ell(ctx, 121, -45, 2.2, 2.2, '#e9bb86');
    ctx.restore();
  }
  function streetCar(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ell(ctx, 86, -1, 101, 6.5, 'rgba(19,22,33,.44)');
    poly(ctx, [0, -54, 7, -67, 28, -70, 155, -69, 175, -60, 183, -51, 178, -21, 164, -13, 12, -14, 0, -24],
      '#6b4548', '#a78a72', 1.4);
    poly(ctx, [6, -62, 22, -72, 151, -73, 177, -62, 171, -59, 8, -59], '#373644', '#887174', 1.5);
    fillRect(ctx, 9, -53, 159, 22, '#543f44');
    for (let i = 0; i < 7; i++) {
      fillRect(ctx, 13 + 21.8 * i, -52, 16, 17, i % 3 ? '#daa56e' : '#936358');
      if (i % 2) ell(ctx, 20 + 21.8 * i, -46, 4.1, 4.9, '#66504e');
      lines(ctx, [14 + 21.8 * i, -36, 29 + 21.8 * i, -36], '#d8b584', .8);
    }
    for (const xx of [25, 145]) gear(ctx, xx, -8, 8, 5, t * 4.5, '#30303b', '#9d7368', 2.2);
    lines(ctx, [86, -74, 119, -135 + Math.sin(t * 4) * 1.2, 135, -138], '#403744', 2.4);
    glow(ctx, 176, -31, 25, 'rgba(237,189,101,.8)', 'rgba(237,189,101,0)');
    ell(ctx, 177, -31, 3.8, 3.8, '#ffdf9f');
    ctx.restore();
  }
  function blockFront(ctx, x, y, w, h, seed, power) {
    const top = y - h;
    tower(ctx, x, y, w, h, ['#454755', '#2e3348', '#72606a', '#efb67c'], seed, .69, power);
    poly(ctx, [x - 8, top + 1, x + w + 3, top + 1, x + w + 15, top + 7, x - 4, top + 8], '#665969');
    fillRect(ctx, x, top + 5, w, 2, '#a1817b');
    lines(ctx, [x + 5, top + 14, x + 5, y - 8], '#7e6371', 1.7);
    lines(ctx, [x + w - 5, top + 14, x + w - 5, y - 8], '#3e3546', 2);
    for (const dy of [64, 119]) {
      if (dy > h - 30) continue;
      lines(ctx, [x - 3, top + dy, x + w + 6, top + dy], '#8c6a71', 1.35);
      fillRect(ctx, x - 2, top + dy + 1, w + 8, 2.8, '#303245');
    }
    const bays = Math.max(2, Math.floor(w / 38));
    for (let i = 0; i < bays; i++) {
      const xx = x + 11 + i * (w - 13) / bays;
      arch(ctx, xx, y - 56, 27, 56, '#35384a', '#785867');
      if (power > .025) {
        const light = ease(power * 1.14 - (i % 3) * .081);
        arch(ctx, xx + 3, y - 52, 21, 48, fadeHex('#e29c65', light * .85));
        lines(ctx, [xx + 13, y - 46, xx + 13, y - 4], fadeHex('#513641', light * .93), 1.6);
        lines(ctx, [xx + 4, y - 26, xx + 23, y - 26], fadeHex('#593842', light * .84), 1.1);
        glow(ctx, xx + 11, y - 4, 29, fadeHex('#ed9c55', .17 * light), 'rgba(237,156,85,0)', .52);
      }
      fillRect(ctx, xx - 3, y - 8, 32, 4, '#5c4d60');
    }
  }
  function transmission(ctx, progress, t, near) {
    const travel = clamp((progress - .115) / .605);
    if (travel <= 0 || travel >= 1) return;
    const x = travel * (W + 130) - 60;
    const offset = near * .33;
    const station = Math.floor((x + wrap(offset, 320)) / 320) * 320 - wrap(offset, 320);
    const u = clamp((x - station) / 320);
    const first = 180 + Math.sin((station + offset) * .0044) * 18;
    const next = 180 + Math.sin((station + 320 + offset) * .0044) * 18;
    const y = mix(first, next, u) + 62 * u * (1 - u) + 10;
    const pulse = .72 + Math.sin(t * 19) * .19;
    glow(ctx, x, y, 67, fadeHex('#ffbd68', .29 * pulse), 'rgba(255,189,104,0)', .55);
    lines(ctx, [x - 47, y - 1, x - 5, y], fadeHex('#f0bc7e', .46 * pulse), 1.4);
    ell(ctx, x, y, 2.9, 2.1, '#ffe5ac');
  }
  function electric(ctx, env) {
    const { t, progress, far, near, beat } = env;
    const powerAt = x => ease((progress - .12 - clamp(x / W) * .46) / .14);
    const grid = ease((progress - .12) / .60);
    fillRect(ctx, 0, 0, W, H, linear(ctx, 0, 0, 0, 572, [[0, '#20283e'], [.42, '#363e57'], [.77, '#74606d'], [1, '#a77774']]));
    glow(ctx, 596 - grid * 156, 389, 516, fadeHex('#ed9a69', .16 + grid * .31), 'rgba(237,154,105,0)', .51);
    glow(ctx, 1049 - progress * 209, 287, 300, fadeHex('#e3a575', .11 + grid * .18), 'rgba(227,165,117,0)', .76);
    for (let i = 0; i < 30; i++) {
      const x = wrap(rand(i * 19 + 14) * W - far * .07, W);
      const y = 18 + rand(i * 39) * 166;
      const p = .32 + Math.sin(t * 1.8 + i) * .10;
      ell(ctx, x, y, .55 + rand(i) * .68, .57, 'rgba(232,206,173,' + p + ')');
    }
    bands(ctx, 144, 386, far, ['#785b6b', '#625568', '#504c62']);
    city(ctx, far * .28, 507, ['#4a4257', '#363b50', '#6d576e', '#dda773'], '#484052', .99, .50, powerAt);
    const drift = 329 * progress;
    const masses = [
      [411, 118, 282, 64], [531, 148, 231, 214], [697, 152, 288, 409],
      [854, 159, 208, 670], [1024, 141, 312, 1009], [1171, 155, 250, 1243], [1321, 150, 286, 1266],
    ];
    for (const [x, w, h, seed] of masses) blockFront(ctx, x - drift, 516, w, h, seed, powerAt(x - 250));
    smoke(ctx, 172 - drift * .65, 254, t * .65, 1.05, '45,40,54', -1, .36);
    chimney(ctx, 172 - drift * .65, 510, 256, 16, '#61516b');
    smoke(ctx, 311 - drift * .36, 257, t * .73, .91, '58,46,57', -1, .64);
    chimney(ctx, 311 - drift * .36, 509, 252, 17, '#746068');
    steelWorks(ctx, 62 - drift * 1.02, 520, t);
    transformer(ctx, 382 - drift * .89, 520, t, beat * grid);
    electricPoles(ctx, near * .33, t);
    transmission(ctx, progress, t, near);
    road(ctx, 'electric', t, near);
    if (progress > .37) streetCar(ctx, -210 + (progress - .37) * 2491, 542, t);
    for (const x of [101, 405, 710, 1015, 1320, 1615]) {
      const active = powerAt(x - 101);
      const xx = x - drift;
      lamp(ctx, xx, 306 - x % 900 * .021, t, '241,171,91', active);
      if (active > .01) {
        glow(ctx, xx + 51, 581, 174, fadeHex('#eea35c', active * .38), 'rgba(238,163,92,0)', .23);
        for (let i = 0; i < 11; i++) {
          const yy = 542 + i * 8 + rand(i * 37 + x) * 5;
          const narrow = 6 + rand(i * 7 + x) * 25;
          const shimmer = .53 + .47 * Math.sin(i * 2 + t * 6.1);
          lines(ctx, [xx + 23 - narrow, yy, xx + 23 + narrow * .70, yy],
            fadeHex('#efb77b', active * shimmer * (.21 - i * .014)), 1.05);
        }
      }
    }
    grain(ctx, .18);
  }

  function dish(ctx, x, y, t, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    lines(ctx, [-16, 1, 0, -37, 18, 0], '#454960', 3.8);
    lines(ctx, [-10, -10, 12, -10], '#76808d', 1.6);
    ctx.translate(0, -39);
    ctx.rotate(-.51 + Math.sin(t * .54) * .12);
    ctx.beginPath();
    ctx.moveTo(-39, -18);
    ctx.quadraticCurveTo(-24, 37, 34, 28);
    ctx.quadraticCurveTo(30, -11, -39, -18);
    const alloy = linear(ctx, -20, -21, 21, 25, [[0, '#bdc7c2'], [.7, '#677e88'], [1, '#475866']]);
    ctx.fillStyle = alloy;
    ctx.fill();
    ctx.lineWidth = 1.7;
    ctx.strokeStyle = '#b2bfb6';
    ctx.stroke();
    lines(ctx, [-38, -18, 34, 27], '#d0d4c0', 2.3);
    lines(ctx, [-4, 4, 16, -15, 25, -14], '#8d9a9f', 2.6);
    ell(ctx, 24, -15, 4, 2.5, '#e0d1a6');
    ctx.restore();
  }
  function circuitLab(ctx, x, base, t) {
    ctx.save();
    ctx.translate(x, base);
    fillRect(ctx, 0, -237, 515, 237, linear(ctx, 0, -230, 0, 2, [[0, '#55616f'], [.65, '#555b67'], [1, '#343a50']]));
    poly(ctx, [515, -237, 588, -219, 587, -11, 515, 0], '#454958');
    fillRect(ctx, -8, -240, 524, 9, '#82868a');
    lines(ctx, [0, -230, 515, -230, 586, -216], '#aaa694', 1.4);
    for (let row = 0; row < 3; row++) {
      const yy = -215 + row * 71;
      fillRect(ctx, 8, yy, 493, 53, linear(ctx, 0, yy, 0, yy + 53,
        [[0, '#2e3b4b'], [.75, '#365557'], [1, '#40575a']]));
      for (let i = 0; i < 9; i++) {
        const xx = 13 + i * 54.3;
        const n = rand(i * 71 + row * 67);
        fillRect(ctx, xx + 3, yy + 39, 45, 3, n < .42 ? '#9e7e69' : '#699190');
        if (n > .13) {
          const green = i % 4 !== 0;
          glow(ctx, xx + 22, yy + 30, 24,
            green ? 'rgba(135,217,164,.65)' : 'rgba(242,183,120,.4)',
            green ? 'rgba(135,217,164,0)' : 'rgba(242,183,120,0)', .76);
          fillRect(ctx, xx + 12, yy + 24, 18, 13, '#79898a');
          fillRect(ctx, xx + 14, yy + 25, 13, 9, green ? '#a2d5a4' : '#d7aa6d');
          fillRect(ctx, xx + 16, yy + 26 + wrap(t * 6 + i, 6), 8, .8, '#ebf5c3');
          fillRect(ctx, xx + 17, yy + 37, 9, 2, '#6d716f');
        }
        if (n > .51) {
          ell(ctx, xx + 37, yy + 25, 4, 5.5, '#323f49');
          poly(ctx, [xx + 33, yy + 30, xx + 41, yy + 29, xx + 45, yy + 41, xx + 32, yy + 41], '#334650');
        }
        poly(ctx, [xx + 3, yy + 10, xx + 43, yy + 5, xx + 43, yy + 9, xx + 3, yy + 15], 'rgba(209,219,185,.13)');
        fillRect(ctx, xx + 51, yy, 3.5, 51, '#57666f');
      }
      fillRect(ctx, 8, yy + 52, 493, 4, '#777a7f');
      lines(ctx, [8, yy, 501, yy], '#909899', 1);
    }
    dish(ctx, 238, -238, t, 1.12);
    dish(ctx, 376, -240, t + 4.3, .69);
    const relayY = -275;
    lines(ctx, [468, -238, 468, relayY, 454, relayY, 486, relayY], '#697683', 2.5);
    ell(ctx, 468, relayY - 2, 1.7, 1.7, 'rgba(241,149,127,' + (.4 + .4 * Math.sin(t * 2.7)) + ')');
    ctx.restore();
  }
  function terminalHall(ctx, x, y, t, beat) {
    ctx.save();
    ctx.translate(x, y);
    poly(ctx, [-3, -153, 40, -182, 336, -183, 396, -144, 394, 0, -3, 0],
      '#576776', '#879499', 1.5);
    fillRect(ctx, 8, -137, 367, 137, '#465460');
    fillRect(ctx, 15, -130, 354, 101, linear(ctx, 0, -128, 0, -29,
      [[0, '#596d71'], [.62, '#53646b'], [1, '#344a55']]));
    glow(ctx, 211, -91, 172, 'rgba(244,191,131,.35)', 'rgba(244,191,131,0)', .41);
    fillRect(ctx, 21, -69, 344, 9, '#7f7f7a');
    for (let i = 0; i < 4; i++) {
      const xx = 34 + i * 82;
      const wave = Math.sin(t * 4.5 + i * .88);
      fillRect(ctx, xx + 12, -102, 31, 26, '#899996');
      fillRect(ctx, xx + 14, -98, 25, 18, '#a9c9a2');
      for (let r = 0; r < 3; r++) {
        lines(ctx, [xx + 17, -94 + r * 4, xx + 24 + rand(r * 44 + i * 15) * 12, -94 + r * 4], '#5f826f', .8);
      }
      fillRect(ctx, xx + 15, -96 + wrap(t * 8 + i, 14), 24, .70, 'rgba(225,238,187,' + (.5 + .28 * beat) + ')');
      fillRect(ctx, xx + 25, -76, 8, 7, '#617071');
      const occupied = i !== 1;
      if (occupied) {
        ell(ctx, xx + 62, -89, 7.5, 9.3, '#a99178');
        ell(ctx, xx + 64, -92, 6.9, 6.3, '#444d51');
        poly(ctx, [xx + 54, -82, xx + 68, -83, xx + 76, -58, xx + 55, -53], '#3f5261');
        lines(ctx, [xx + 55, -77, xx + 48, -67, xx + 32 + wave * 2, -67 + wave], '#546573', 4);
        lines(ctx, [xx + 57, -53, xx + 60, -36, xx + 52, -28], '#394954', 4);
      }
      fillRect(ctx, xx + 50, -67, 11, 2.6, '#9b9e92');
      lines(ctx, [xx - 7, -132, xx - 7, -28], '#a2aaa5', 2.2);
      poly(ctx, [xx - 5, -129, xx + 26, -129, xx + 5, -30, xx - 7, -30], 'rgba(202,213,199,.11)');
    }
    fillRect(ctx, 12, -29, 361, 5.5, '#8b9c9c');
    fillRect(ctx, 7, -14, 367, 14, '#445567');
    dish(ctx, 278, -182, t + 9, .80);
    ctx.restore();
  }
  function dataCables(ctx, x, y, t, distance, light) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + distance * .30, y + 12, x + distance * .66, y - 25, x + distance, y - 4);
    ctx.strokeStyle = 'rgba(32,52,63,.58)';
    ctx.lineWidth = 4;
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const f = wrap(t * .26 + i / 7, 1);
      const yy = y + 36 * (1 - f) ** 2 * f - 75 * (1 - f) * f ** 2 - 4 * f ** 3;
      const xx = x + distance * f;
      const shine = .35 + Math.sin(Math.PI * f) * .35;
      glow(ctx, xx, yy, 9, 'rgba(' + light + ',' + shine + ')', 'rgba(' + light + ',0)', .71);
      ell(ctx, xx, yy, 1.48, .87, 'rgba(' + light + ',.95)');
    }
  }
  const encounters = {
    digital: { start: 93.8, contact: 97.5, end: 103.8, offsetX: 104, y: 452, arrive: 182, depart: 158 },
    ai: { start: 110.6, contact: 116.5, end: 125.4, offsetX: 111, y: 449, arrive: 173, depart: 151 },
  };
  function since(time, first, last) { return ease((time - first) / (last - first)); }
  function encounter(name, env) {
    const config = encounters[name];
    if (!config || !Number.isFinite(env.t) || env.t < config.start || env.t >= config.end) return null;
    const { contact, offsetX, y, arrive, depart } = config;
    const heroX = Number.isFinite(env.hero?.x) ? env.hero.x : 468;
    const age = env.t - contact;
    const push = since(age, -.13, .04) * (1 - since(age, .19, .52));
    return {
      x: heroX + offsetX - age * mix(arrive, depart, since(age, -.35, .35)),
      y: y + push * 2.65,
      baseY: y,
      age,
      push,
      weight: since(age, -.71, -.07) * (1 - since(age, .08, .62)),
    };
  }
  function actionPlan(name, env) {
    const marker = encounter(name, env || {});
    return marker && { x: marker.x, y: marker.y, weight: marker.weight };
  }
  function rounded(ctx, x, y, w, h, radius, fill, edge = null, weight = 1) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    if (edge) {
      ctx.lineWidth = weight;
      ctx.strokeStyle = edge;
      ctx.stroke();
    }
  }
  function signalEnvelope(ctx, x, y, w, color, alpha = 1) {
    const h = w * .61;
    ctx.save();
    ctx.globalAlpha *= alpha;
    rounded(ctx, x - w / 2, y - h / 2, w, h, w * .05, 'rgba(145,223,171,.12)', color, Math.max(.9, w / 21));
    lines(ctx, [x - w / 2, y - h / 2, x, y + h * .17, x + w / 2, y - h / 2], color, Math.max(.8, w / 25));
    lines(ctx, [x - w * .39, y + h * .37, x - w * .12, y + h * .03], color, Math.max(.5, w / 32));
    ctx.restore();
  }
  function crtGlass(ctx, x, y, w, h, t, age) {
    rounded(ctx, x, y, w, h, h * .115, linear(ctx, x, y, x + w, y + h,
      [[0, '#203f43'], [.35, '#345d55'], [.65, '#214b49'], [1, '#16313b']]), '#172b31', 2.5);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, h * .105);
    ctx.clip();
    const pulse = since(age, .04, .20) * (1 - since(age, .37, 1.07));
    glow(ctx, x + w * .42, y + h * .43, w * .66, fadeHex('#8cd5a5', .15 + pulse * .42), 'rgba(140,213,165,0)', .79);
    for (let yy = y + 3; yy < y + h; yy += 3.55) {
      lines(ctx, [x, yy, x + w, yy], 'rgba(22,47,50,.32)', .73);
    }
    for (let i = 0; i < 6; i++) {
      const yy = y + h * .17 + i * h * .10;
      lines(ctx, [x + 12, yy, x + 16 + rand(i * 17) * w * .22, yy], 'rgba(163,223,164,.41)', 1.95);
    }
    const scan = wrap(t * 39, h);
    glow(ctx, x + w * .51, y + scan, w * .66, fadeHex('#c3f8bb', .12 + .16 * pulse), 'rgba(195,248,187,0)', .065);
    const queued = 1 - since(age, .06, .78);
    const depart = since(age, .08, .80);
    if (queued > .01) signalEnvelope(ctx, x + w * .65 + depart * w * .27, y + h * .53 - depart * h * .1,
      w * .32, '#bdebb3', queued);
    if (age > .26) {
      ctx.beginPath();
      ctx.moveTo(x + w * .58, y + h * .60);
      ctx.lineTo(x + w * .65, y + h * .71);
      ctx.lineTo(x + w * .81, y + h * .40);
      ctx.lineWidth = 3.1;
      ctx.strokeStyle = fadeHex('#c0e8b4', since(age, .49, .88) * (.75 + .16 * Math.sin(t * 3.2)));
      ctx.stroke();
    }
    poly(ctx, [x + 4, y + 4, x + w * .76, y + 4, x + w * .58, y + h * .25, x + 5, y + h * .34], 'rgba(228,237,190,.09)');
    ctx.restore();
  }
  function messageStation(ctx, marker, t) {
    if (!marker || marker.x < -348 || marker.x > W + 66) return;
    const { x, age, push } = marker;
    const y = marker.baseY;
    ctx.save();
    ctx.translate(x, y);
    const footing = 576 - y;
    ell(ctx, 97, footing - 1, 139, 9, 'rgba(20,36,44,.39)');
    poly(ctx, [44, 9, 187, 7, 205, footing - 8, 33, footing - 8], linear(ctx, 30, 8, 212, footing,
      [[0, '#525f61'], [.51, '#716f66'], [1, '#3a4650']]), '#313f49', 2);
    poly(ctx, [184, 7, 205, -12, 218, footing - 13, 202, footing - 7], '#364650');
    fillRect(ctx, 31, footing - 10, 183, 10, '#4c5558');
    lines(ctx, [34, footing - 11, 212, footing - 11], '#958878', 2);
    fillRect(ctx, 73, 47, 72, 45, '#46545a');
    for (let j = 0; j < 7; j++) lines(ctx, [77, 51 + j * 5, 141, 51 + j * 5], '#7d7d71', 1.12);
    // Splayed back panel and vents lend the chunky monitor some reflected light.
    poly(ctx, [17, -163, 193, -164, 227, -149, 228, -24, 191, -21, 16, -22],
      linear(ctx, 0, -165, 191, -22, [[0, '#b6a68c'], [.51, '#a7987e'], [1, '#7d7e70']]), '#4a5457', 2.1);
    poly(ctx, [191, -164, 227, -149, 228, -24, 198, -23], '#6b7067');
    lines(ctx, [20, -160, 191, -160, 224, -146], '#e2cc9f', 2.5);
    for (let k = 0; k < 7; k++) lines(ctx, [200, -136 + k * 11, 219, -132 + k * 11], '#4e595d', 1.6);
    rounded(ctx, 30, -151, 151, 107, 13, '#4d5d59', '#8a8675', 2.1);
    crtGlass(ctx, 36, -146, 137, 96, t, age);
    ell(ctx, 178, -38, 2.8, 2.8, '#d6b88c');
    fillRect(ctx, 40, -41, 64, 4, '#bbb08f');
    lines(ctx, [45, -39, 69, -39], '#7f816e', 1.2);
    poly(ctx, [17, -22, 197, -20, 220, 8, 181, 23, -22, 22, -31, 4], linear(ctx, 0, -19, 0, 23,
      [[0, '#8b8d7c'], [.40, '#969380'], [1, '#71786d']]), '#4c5a59', 2.1);
    lines(ctx, [-28, 5, -11, 18, 180, 18, 214, 8], '#afa68c', 1.7);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 11; i++) {
      const kx = 39 + i * 12 - j * 3;
      const ky = -12 + j * 8;
      rounded(ctx, kx, ky, 8.2, 4.7, .9, i % 3 ? '#a9a18d' : '#858777', '#666f66', .5);
    }
    rounded(ctx, -20, -9, 39, 19, 4, '#4b5a56', '#b4a78c', 1.5);
    glow(ctx, 0, 0, 28, fadeHex('#ffcf82', .16 + push * .38), 'rgba(255,207,130,0)', .64);
    rounded(ctx, -14, -6 + push * 2.65, 28, 11, 3,
      linear(ctx, 0, -7, 0, 6, [[0, '#e6be83'], [1, '#a78262']]), '#635d50', .9);
    lines(ctx, [-5, -1 + push * 2.65, 5, -1 + push * 2.65], '#efe3b2', 1.05);
    lines(ctx, [190, -21, 218, -17, 238, 28, 235, 93], '#2f4852', 5);
    lines(ctx, [194, -22, 218, -18, 239, 28, 236, 91], '#71837b', 1);
    ctx.restore();
  }
  function cubicPoint(a, b, c, d, q) {
    const k = 1 - q;
    return [
      a[0] * k ** 3 + 3 * b[0] * k * k * q + 3 * c[0] * k * q * q + d[0] * q ** 3,
      a[1] * k ** 3 + 3 * b[1] * k * k * q + 3 * c[1] * k * q * q + d[1] * q ** 3,
    ];
  }
  function traceCable(ctx, control, color, thickness) {
    const [a, b, c, d] = control;
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.bezierCurveTo(...b, ...c, ...d);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  function packetTrace(ctx, points, f, warm, size) {
    if (f < 0 || f > 1) return;
    for (let i = 8; i >= 0; i--) {
      const q = clamp(f - i * .014);
      const [x, y] = cubicPoint(...points, q);
      const power = (9 - i) / 9;
      glow(ctx, x, y, size * (1 + .13 * i), fadeHex(warm, power * .40), 'rgba(144,231,180,0)', .66);
      ell(ctx, x, y, 1.8 + power * .77, 1.1 + power * .59, fadeHex('#d8f4c2', power));
    }
  }
  function networkRelay(ctx, x, y, scale, t, age) {
    const active = since(age, .16, .52);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    lines(ctx, [0, 0, 0, -124], '#434e5d', 5.2);
    lines(ctx, [-17, -16, 17, -16], '#6c7175', 2);
    poly(ctx, [-35, -77, 28, -77, 29, -34, -34, -34], '#566a6b', '#879794', 1.65);
    rounded(ctx, -27, -70, 43, 27, 4, '#354e53', '#a19d81', 1.15);
    if (active > .01) {
      glow(ctx, -3, -56, 38, fadeHex('#a5e3ab', active * .65), 'rgba(165,227,171,0)', .66);
      signalEnvelope(ctx, -6, -57, 25, '#b7e2b1', active);
    }
    for (let j = 0; j < 3; j++) ell(ctx, 21, -64 + j * 8, 1.6, 1.65,
      j % 2 ? '#d0a476' : fadeHex('#c4e8ad', .48 + active * .52));
    dish(ctx, 1, -123, t + (active - 1) * 8.2, .49);
    ctx.restore();
  }
  function messageNetwork(ctx, p, t, marker) {
    const age = t - encounters.digital.contact;
    const groundRelay = [820 - p * 191, 519];
    const distant = [1142 - p * 135, 410];
    const head = marker ? [marker.x + 233, marker.baseY + 86] : [290 - 385 * p, 538];
    const mid = [groundRelay[0], 466];
    const far = [distant[0], distant[1] - 63];
    const pipe = [head, [head[0] + 118, 556], [mid[0] - 137, 530], mid];
    const lead = [mid, [mid[0] + 97, 331], [far[0] - 83, far[1] + 38], far];
    traceCable(ctx, pipe, '#374b52', 4.1);
    traceCable(ctx, pipe, '#71847b', 1.40);
    traceCable(ctx, lead, '#364b57', 2.35);
    traceCable(ctx, lead, '#6b8383', .75);
    networkRelay(ctx, groundRelay[0], groundRelay[1], 1.17, t, age - 1.08);
    networkRelay(ctx, distant[0], distant[1], .84, t + 3.3, age - 2.45);
    packetTrace(ctx, pipe, age / 1.21, '#a2eca8', 13);
    packetTrace(ctx, lead, (age - 1.21) / 1.20, '#a2eca8', 13);
    const relayRing = since(age, 2.39, 2.71) * (1 - since(age, 2.83, 4.55));
    if (relayRing > .01) {
      for (let j = 0; j < 3; j++) {
        const d = (age - 2.38) * 63 + j * 37;
        ctx.beginPath();
        ctx.ellipse(far[0] + 19, far[1] - 80, 39 + d, 16 + d * .26, -.39, -1.38, .44);
        ctx.strokeStyle = fadeHex('#b3dec2', relayRing * (1 - j * .19) * .5);
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }
  }
  function digital(ctx, env) {
    const { t, progress, far, near, beat } = env;
    fillRect(ctx, 0, 0, W, H, linear(ctx, 0, 0, 0, 580,
      [[0, '#273f59'], [.39, '#446879'], [.76, '#778e8b'], [1, '#9eaaa0']]));
    glow(ctx, 1049 - progress * 167, 259, 375, 'rgba(219,204,167,.47)', 'rgba(219,204,167,0)', .62);
    for (let i = 0; i < 9; i++) {
      const x = wrap(t * 6 + i * 170, W + 285) - 150;
      glow(ctx, x, 97 + rand(i * 31) * 185, 151, 'rgba(173,183,193,.20)', 'rgba(173,183,193,0)', .19);
    }
    bands(ctx, 271, 427, far, ['#728798', '#5e808b', '#466a7a']);
    city(ctx, far * .31, 514, ['#496675', '#43596c', '#6b8791', '#d4be9b'], '#536a7a', 1.05, .29);
    circuitLab(ctx, 13 - progress * 372, 513, t);
    tower(ctx, 939 - progress * 205, 517, 147, 170, ['#566677', '#465b69', '#7a8e8c', '#d1b49c'], 762, .48);
    tower(ctx, 1102 - progress * 183, 513, 177, 201, ['#516b77', '#455b69', '#72908f', '#c6a999'], 861, .44);
    terminalHall(ctx, 1250 - 417 * progress, 514, t, beat);
    for (let i = 0; i < 16; i++) {
      const x = wrap(i * 96 + 539 - near * .16, W + 94) - 40;
      fillRect(ctx, x, 487, 3, 44, '#4a5868');
      lines(ctx, [x - 23, 495, x + 26, 495], '#819093', 1.35);
    }
    road(ctx, 'digital', t, near);
    const marker = encounter('digital', env);
    messageNetwork(ctx, progress, t, marker);
    lamp(ctx, 302 - progress * 127, 369, t, '198,220,177');
    messageStation(ctx, marker, t);
    grain(ctx, .17);
  }

  function vent(ctx, x, y, radius, t, seed) {
    ell(ctx, x, y, radius + 3, radius + 3, '#485d65');
    ell(ctx, x, y, radius, radius, '#253d49');
    ell(ctx, x, y, radius - 2, radius - 2, '#344b56');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * (5 + seed * .36) + seed);
    for (let i = 0; i < 6; i++) {
      ctx.rotate(TAU / 6);
      ctx.beginPath();
      ctx.moveTo(-4, -1);
      ctx.bezierCurveTo(-4, -radius * .34, -6, -radius * .74, -.8, -radius + 3);
      ctx.quadraticCurveTo(radius * .70, -radius + 7, 3.4, -2);
      ctx.closePath();
      ctx.fillStyle = '#597778';
      ctx.fill();
    }
    ctx.restore();
    ell(ctx, x, y, 4.5, 4.5, '#748e89');
    ell(ctx, x - .4, y - .6, 1.9, 1.9, '#b4bfad');
    for (const dx of [-8, -4, 0, 4, 8]) lines(ctx, [x + dx, y - radius * .9, x + dx, y + radius * .88], 'rgba(183,206,185,.21)', .65);
  }
  function dataCenter(ctx, x, base, t) {
    ctx.save();
    ctx.translate(x, base);
    const face = linear(ctx, 0, -235, 550, 0, [[0, '#659192'], [.53, '#64828b'], [1, '#4a6876']]);
    poly(ctx, [-2, -211, 80, -251, 600, -242, 643, -211, 644, 0, 0, 0], face, '#93acaa', 1.6);
    poly(ctx, [4, -205, 76, -230, 600, -228, 642, -209], '#a3b9b3', '#b9c7bd', 1.45);
    poly(ctx, [6, -201, 606, -201, 606, -72, 6, -72], linear(ctx, 0, -204, 0, -68,
      [[0, '#5e8290'], [.32, '#385969'], [1, '#354c5e']]));
    for (let i = 0; i < 17; i++) {
      const xx = 18 + i * 32;
      const rack = '#253d49';
      fillRect(ctx, xx, -167, 21, 84, rack);
      fillRect(ctx, xx, -166, 3, 79, '#5c7982');
      for (let j = 0; j < 11; j++) {
        const yy = -159 + j * 6.3;
        fillRect(ctx, xx + 6, yy, 12, 1.6, (i + j) % 4 ? '#5c7b82' : '#75a89a');
        const active = (i + j) % 4 && Math.sin(t * 1.3 + i * .91 + j * .63) > -.53;
        if (active) fillRect(ctx, xx + 6 + j % 4 * 2, yy, 1.15, 1.15, j % 3 ? '#9be1ac' : '#e9c777');
      }
      if (i % 3 === 0) {
        fillRect(ctx, xx - 10, -204, 1.65, 199, '#97adb0');
        poly(ctx, [xx - 9, -201, xx + 38, -201, xx + 19, -73, xx + 4, -73], 'rgba(218,227,195,.11)');
      }
    }
    fillRect(ctx, 6, -73, 603, 8, '#889ca1');
    fillRect(ctx, 6, -63, 603, 65, '#557280');
    for (let i = 0; i < 7; i++) {
      const xx = 40 + i * 85;
      fillRect(ctx, xx - 31, -58, 70, 52, '#4c6872');
      fillRect(ctx, xx - 31, -58, 70, 2, '#9cb5ae');
      vent(ctx, xx, -32, 18, t, i);
      for (let j = 0; j < 6; j++) fillRect(ctx, xx + 28, -46 + j * 5, 5, 1, '#738f94');
    }
    ctx.restore();
  }
  function coolingPipes(ctx, x, y, t, beat) {
    ctx.save();
    ctx.translate(x, y);
    const pipeColors = ['#66999b', '#7b9b99', '#84999f'];
    for (let pipe = 0; pipe < 3; pipe++) {
      const yy = -153 + pipe * 22;
      const height = 24 + pipe * 3;
      for (const [width, color, inset] of [[19, '#456778', 1.4], [14, pipeColors[pipe], 0], [3.8, '#a9bab1', -4.1]]) {
        ctx.beginPath();
        ctx.moveTo(-12, -6 + inset);
        ctx.lineTo(-12, yy + height + 5 + inset);
        ctx.quadraticCurveTo(-12, yy + inset, 19, yy + inset);
        ctx.lineTo(352 + pipe * 18, yy + inset);
        ctx.quadraticCurveTo(398 + pipe * 18, yy + inset, 401 + pipe * 18, yy + height + inset);
        ctx.lineTo(401 + pipe * 18, -19 + inset);
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.stroke();
      }
      for (const xx of [68, 181, 297, 348]) {
        fillRect(ctx, xx - 4.5, yy - 10, 8.5, 20, '#486571');
        fillRect(ctx, xx - 1.75, yy - 10, 1.6, 20, '#9cb0aa');
        ell(ctx, xx + 1, yy - 7, 1.5, 1.5, '#d3c8ac');
      }
      ell(ctx, 241 - pipe * 18, yy, 11, 11, '#435a68');
      ell(ctx, 241 - pipe * 18, yy, 6.6, 6.6, '#7da6a0');
      ell(ctx, 240 - pipe * 18, yy - 1, 2.8, 2.8, fadeHex('#d2e3ae', .70 + beat * .30));
      for (let i = 0; i < 5; i++) {
        const q = wrap(i / 5 + t * .26 + pipe * .23, 1);
        ell(ctx, 288 + pipe * 34 + Math.sin(i * 19) * q * 18,
          yy + 8 + q * 21, .6 + (1 - q) * .56, 1.4 + (1 - q) * 1.84,
          fadeHex('#a6cdc6', (1 - q) * .62), -.08);
      }
    }
    for (const xx of [14, 170, 319, 441]) {
      fillRect(ctx, xx - 4, -139, 11, 139, '#567580');
      fillRect(ctx, xx + 4, -139, 3.4, 139, '#9aafab');
      fillRect(ctx, xx - 14, -9, 30, 8, '#657e86');
      lines(ctx, [xx, -41, xx - 17, -65, xx, -87], '#657d84', 2.7);
    }
    ctx.restore();
  }
  function canopy(ctx, x, y, t) {
    poly(ctx, [x - 31, y - 161, x + 27, y - 203, x + 236, y - 198, x + 300, y - 158, x + 291, y - 112, x - 26, y - 116],
      linear(ctx, x, y - 203, x + 280, y - 112, [[0, '#b9c9b4'], [.46, '#9cbbb5'], [1, '#628c91']]), '#b8c6bf', 1.4);
    for (let i = 0; i <= 6; i++) {
      const xx = x + i * 45;
      lines(ctx, [xx, y - 155, xx + (3 - i) * 7, y - 199], '#9fb7ae', 1.3);
      lines(ctx, [xx, y, xx, y - 153], '#789490', 3);
    }
    lines(ctx, [x - 30, y - 160, x + 295, y - 158], '#c3ccbd', 2.3);
    fillRect(ctx, x - 24, y - 119, 314, 8, '#829b97');
    for (let i = 0; i < 8; i++) {
      const xx = x + i * 42;
      const ht = 19 + rand(i * 51) * 23;
      ell(ctx, xx, y - 12, 23, ht * .52, i % 2 ? '#668f81' : '#537d75', -.09);
      for (let branch = 0; branch < 3; branch++) {
        const d = Math.sin(t * 1.8 + i + branch) * 2.1;
        lines(ctx, [xx, y - 10, xx + 1 + d, y - ht - branch * 2], '#80a38e', .95);
        ell(ctx, xx - 4 + d + branch * 4, y - ht + branch % 2 * 7, 6, 2.7, '#8bad92', -.74 + branch * .5);
      }
    }
  }
  function pedestrian(ctx, x, y, scale, t, color, lean, seated = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const wave = Math.sin(t * 3.1 + lean);
    ell(ctx, 0, seated ? -46 : -62, 6, 7.5, '#c3a489');
    poly(ctx, [-8, seated ? -40 : -56, 7, seated ? -40 : -54, 13 + lean, -21, -7 + lean, -22], color);
    if (seated) {
      lines(ctx, [-1, -24, 16, -22, 21, -9], '#526878', 5);
      lines(ctx, [13, -27, -1, -27, -4, -12, 15, -8], '#657985', 2.6);
      gear(ctx, -5, -13, 11.3, 6, t * .28, '#496274', '#a3ae9d', 1.9);
      gear(ctx, 16, -6, 4.2, 4, t * .44, '#52697a', '#9bafa3', 1.15);
    } else {
      lines(ctx, [-1, -23, -5 + lean, -8, -8 + lean, 0], '#3c5366', 4);
      lines(ctx, [7, -23, 7 + lean, -10, 13 + lean, 0], '#3c5366', 4);
    }
    lines(ctx, [4, seated ? -37 : -50, 13 + lean, seated ? -32 : -42, 24 + wave * 2, -42 + wave * 2], color, 4.7);
    ell(ctx, 24 + wave * 2, -42 + wave * 2, 3, 3, '#ba9d87');
    ctx.restore();
  }
  function parkTree(ctx, x, base, scale, t, seed) {
    ctx.save();
    ctx.translate(x, base);
    ctx.scale(scale, scale);
    lines(ctx, [0, 0, -7, -57, -4, -84, -15, -120], '#5a7173', 6.2);
    lines(ctx, [-7, -49, 22, -81, 27, -107], '#6e877d', 4.3);
    lines(ctx, [-5, -71, -36, -91, -41, -111], '#607e75', 3.2);
    for (let i = 0; i < 39; i++) {
      const xx = (rand(seed + i * 45) - .48) * 126 + Math.sin(t * 2.2 + i) * 2.6;
      const yy = -93 - rand(seed + i * 71) * 48 + Math.abs(xx) * .29;
      const radius = 8 + rand(seed + i * 91) * 14;
      ell(ctx, xx, yy, radius, radius * .54, i % 4 === 0 ? '#9bb4a1' : i % 3 ? '#72998a' : '#86a993',
        Math.sin(i * 12.3) * .67);
    }
    ctx.restore();
  }
  function communityLab(ctx, x, y, t, beat) {
    ctx.save();
    ctx.translate(x, y);
    const stems = [-10, 108, 306, 493];
    // A street-facing greenhouse, workshop table, and shaded public terrace.
    poly(ctx, [-25, -140, 50, -226, 456, -212, 514, -135, 491, -66, -24, -75],
      linear(ctx, 0, -211, 317, -70, [[0, '#c0c8ab'], [.42, '#aec1a8'], [1, '#7c9c99']]), '#ced7be', 1.6);
    poly(ctx, [50, -222, 454, -208, 488, -165, 31, -173], '#829f99');
    for (let i = 0; i < 9; i++) {
      const xx = 51 + i * 45;
      poly(ctx, [xx, -216 + i * 1.5, xx + 40, -215 + i * 1.5, xx + 56, -173, xx + 9, -175],
        i % 2 ? '#678d91' : '#759e9d', '#b0c3b0', 1);
    }
    lines(ctx, [-24, -139, 511, -135], '#d0d5c1', 3);
    for (const xx of stems) {
      lines(ctx, [xx, 0, xx + 2, -136], '#768f8d', 4.6);
      lines(ctx, [xx + 2, -121, xx + 2, -4], 'rgba(209,217,193,.71)', .9);
    }
    fillRect(ctx, -16, -75, 517, 6, '#93aaa0');
    glow(ctx, 250, -41, 155, 'rgba(246,202,149,.26)', 'rgba(246,202,149,0)', .58);
    for (const xx of [136, 338]) {
      fillRect(ctx, xx, -43, 98, 5, '#b7aa8c');
      lines(ctx, [xx + 6, -37, xx + 9, -2, xx + 89, -2, xx + 95, -38], '#708682', 2.2);
      fillRect(ctx, xx + 49, -57, 23, 13, '#526f77');
      fillRect(ctx, xx + 51, -55, 18, 9, 'rgba(166,218,181,' + (.72 + beat * .18) + ')');
      fillRect(ctx, xx + 38, -44, 22, 1.5, '#889a8d');
    }
    pedestrian(ctx, 137, 4, 1.05, t + 2.5, '#6e8492', -2);
    pedestrian(ctx, 202, 4, .92, t + .9, '#bd8d81', -7, true);
    pedestrian(ctx, 371, 3, .92, t + 4.2, '#738e7f', 1);
    for (let i = 0; i < 5; i++) {
      const xx = 37 + i * 104;
      fillRect(ctx, xx - 26, -16, 53, 17, '#8d9f94');
      fillRect(ctx, xx - 27, -17, 55, 3, '#babba3');
      for (let j = 0; j < 8; j++) {
        const angle = (rand(i * 45 + j * 4) - .5) * 1.98;
        const bend = Math.sin(t * 2.1 + j * 1.9) * 2.7;
        const lineX = xx + (j - 3.5) * 4.6;
        lines(ctx, [lineX, -16, lineX + angle * 11 + bend, -30 - rand(i * 89 + j) * 14], '#719b79', 1.43);
        ell(ctx, lineX + angle * 12 + bend, -32 - rand(i * 89 + j) * 13, 6, 2.5,
          j % 3 ? '#84a487' : '#b1bb91', angle);
      }
    }
    ctx.restore();
  }
  function waterPath(ctx, route, amount, color, width) {
    ctx.beginPath();
    ctx.moveTo(...route[0]);
    for (let i = 1; i <= 24; i++) ctx.lineTo(...cubicPoint(...route, amount * i / 24));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function gardenRoutes(ctx, env) {
    const { t, progress, near } = env;
    const start = [704 - progress * 278, 530];
    const good = [start, [672, 562], [1047, 548], [1320, 555]];
    const beds = [
      [start, [630, 511], [817, 487], [1150, 493]],
      [start, [703, 543], [870, 521], [1310, 522]],
      good,
    ];
    poly(ctx, [0, 520, 1154, 473, W, 482, W, 564, 0, 551],
      linear(ctx, 0, 480, 0, 563, [[0, '#90a786'], [.62, '#a5b38e'], [1, '#b8ba94']]));
    ctx.save();
    ctx.lineCap = 'round';
    for (const [i, bed] of beds.entries()) {
      traceCable(ctx, bed, i === 2 ? '#d3cba6' : '#acb796', i === 2 ? 29 : 20);
      traceCable(ctx, bed, '#788a6e', i === 2 ? 19 : 13);
      traceCable(ctx, bed, i === 2 ? '#a0a486' : '#88987a', i === 2 ? 13 : 7);
      for (let j = 1; j <= 25; j++) {
        const p = j / 26;
        const [x, y] = cubicPoint(...bed, p);
        const lift = rand(i * 370 + j * 38);
        lines(ctx, [x - 5, y - 9, x - 1, y - 15 - lift * 5], '#668669', 1.3);
        ell(ctx, x + 5, y - 10, 2.9 + lift, 1.1, ['#bfd39b', '#85a375', '#e2cc9d'][j % 3]);
      }
    }
    ell(ctx, start[0], start[1], 19, 10.1, '#83987a', '#b8c195', 4.1);
    const flow = since(t, 118.05, 125.46);
    if (flow > 0) {
      waterPath(ctx, good, flow, '#d9dcb1', 22);
      waterPath(ctx, good, flow, '#3e8b85', 16);
      waterPath(ctx, good, flow, '#76bda4', 11);
      waterPath(ctx, good, flow, '#a6d2ad', 2.1);
      const [headX, headY] = cubicPoint(...good, flow);
      glow(ctx, headX, headY, 45, 'rgba(229,248,164,.57)', 'rgba(229,248,164,0)', .48);
      ell(ctx, headX, headY, 6, 3.1, '#f5e8a1');
      for (let i = 0; i < 27; i++) {
        const f = wrap(t * .095 + i * .073, 1);
        if (f > flow) continue;
        const [x, y] = cubicPoint(...good, f);
        const flare = 1.3 + 5.6 * rand(i * 91);
        lines(ctx, [x - flare, y + 3.2 * Math.sin(i), x + flare, y + 3.2 * Math.sin(i)],
          i % 4 ? 'rgba(202,232,191,.55)' : 'rgba(247,237,174,.75)', 1);
      }
      if (flow > .78) {
        const bend = [[1134, 553], [1183, 559], [1246, 574], [1324, 582]];
        const inlet = since(t, 123.54, 128.22);
        waterPath(ctx, bend, inlet, '#abc4a1', 21);
        waterPath(ctx, bend, inlet, '#78ad9b', 13);
        waterPath(ctx, bend, inlet, '#d4daa7', 2.1);
      }
    }
    ctx.restore();
    for (let j = 0; j < 19; j++) {
      const x = wrap(j * 71 - near * .14, W + 65) - 25;
      const y = 528 - 44 * (x / W) + rand(j * 73) * 7;
      for (let n = 0; n < 3; n++) {
        const top = 6 + rand(j * 93 + n * 47) * 11;
        lines(ctx, [x, y, x + Math.sin(t * 2.2 + n + j) * 7, y - top],
          n === 1 ? '#728b68' : '#7d9c72', 1.6);
      }
    }
    return start;
  }

  function seedKernel(ctx, x, y, size, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-.44 + .18 * Math.sin(t * 3.2));
    glow(ctx, 0, 0, size * 2.9, 'rgba(251,220,132,.38)', 'rgba(251,220,132,0)', .78);
    ell(ctx, 0, 0, size, size * .62, '#b48149', '#65573e', .7);
    ell(ctx, -size * .19, -size * .20, size * .72, size * .38, '#e4bf78');
    lines(ctx, [-size * .43, size * .12, size * .47, -size * .09], '#f6d99a', .72);
    ctx.restore();
  }

  function seedStation(ctx, marker, env, branch) {
    if (!marker) return;
    const { t, hero } = env;
    const { age, x, baseY, push } = marker;
    if (x < -373 || x > W + 165) return;
    const bottom = 575 - baseY;
    const check = since(age, -.11, .43);
    const selected = since(age, .44, 1.05);
    const green = [[14, -14], [97, -64], [116, -60], [225, -29]];
    const routes = [
      [[14, -14], [56, -69], [91, -117], [179, -106]],
      [[14, -14], [83, -14], [90, -101], [213, -70]],
      green,
    ];
    ctx.save();
    ctx.translate(x, baseY);
    ell(ctx, 118, bottom + 1, 104, 13, 'rgba(62,72,60,.24)');
    poly(ctx, [44, 6, 185, 7, 168, bottom - 7, 66, bottom - 4],
      linear(ctx, 40, 0, 190, 93, [[0, '#7c9c87'], [.17, '#c4c7a4'], [.7, '#a1b49a'], [1, '#597c72']]), '#527668', 2.1);
    poly(ctx, [59, 99, 173, 101, 195, bottom + 3, 42, bottom + 3], '#879d86', '#657f71', 1.4);
    poly(ctx, [163, 11, 185, 7, 168, bottom - 7, 146, bottom - 7], '#709488');
    lines(ctx, [63, 24, 74, 91, 142, 93], '#d7d4b0', 1.2);
    rounded(ctx, 100, 38, 37, 15, 5, '#54796f', '#698f81', 1.5);
    glow(ctx, 119, 45, 22, 'rgba(232,221,150,.34)', 'rgba(232,221,150,0)', .56);
    ell(ctx, 119, 45, 5.4, 3.1, '#d6d990');
    poly(ctx, [-30, -9, 96, -135, 237, -101, 242, -73, 264, -32, 145, 23, -9, 21],
      linear(ctx, 10, -92, 155, 39, [[0, '#c6d6ad'], [.5, '#a9bb9d'], [1, '#6e9686']]), '#56796a', 2.45);
    poly(ctx, [-33, -10, 94, -137, 237, -102, 242, -75, 259, -35, 143, 14, -10, 13],
      linear(ctx, 16, -104, 207, -11, [[0, '#dbdbb2'], [.27, '#bfcda9'], [.55, '#acc7a9'], [1, '#c8d2ae']]), '#e5dfb8', 2);
    poly(ctx, [-19, -7, 96, -128, 231, -94, 236, -72, 249, -36, 140, 8, -5, 8],
      'rgba(116,161,139,.32)', '#6e9a87', 1.4);
    ctx.save();
    ctx.lineCap = 'round';
    for (const [i, route] of routes.entries()) {
      const active = i === 2 ? selected : check * (1 - selected);
      traceCable(ctx, route, '#d3d6ae', 12.3);
      traceCable(ctx, route, '#81967d', 8.5);
      traceCable(ctx, route, fadeHex(i === 2 ? '#d9ed9d' : '#e4be76', .15 + active * .81), 4.3);
      const [endX, endY] = route[3];
      ell(ctx, endX, endY, 9.8, 5.8, '#608777', '#bad2a7', 1.3);
      ell(ctx, endX, endY, 6.2, 3.4, fadeHex(i === 2 ? '#eff5ac' : '#c6b486', .2 + active * .8));
      if (i < 2 && selected > 0) {
        lines(ctx, [endX - 4, endY - 2, endX + 4, endY + 2], fadeHex('#7c7561', selected), 1.9);
        lines(ctx, [endX - 4, endY + 2, endX + 4, endY - 2], fadeHex('#7c7561', selected), 1.9);
      }
    }
    packetTrace(ctx, green, (age - .54) / .84, '#d8ef9e', 12);
    ctx.restore();
    for (const [bx, by] of [[-12, 6], [97, -121], [227, -93], [245, -37], [143, 3]]) {
      ell(ctx, bx, by, 2.4, 1.3, '#668c7b');
    }
    // The scanner and seed cradle sit inside the reach of the rider's wing.
    poly(ctx, [-17, -21, -10, -63, 22, -80, 40, -76, 45, -61, 14, -51, 7, -20],
      linear(ctx, -17, -73, 46, -38, [[0, '#b5c7a3'], [.52, '#edf0c3'], [1, '#729b85']]), '#688f7a', 1.7);
    ell(ctx, 21, -58, 11, 4.4, '#6d9c86');
    ell(ctx, 20, -59.3, 7, 2.4, check ? '#e9e4a0' : '#aec7a0');
    if (check > 0 && age < .92) {
      const scan = check * (1 - since(age, .49, .92));
      poly(ctx, [15, -58, 26, -58, 31, -15, 2, -15], fadeHex('#fcf2b3', scan * .28));
      const y = mix(-55, -16, since(age, -.03, .69));
      lines(ctx, [13 - (y + 54) * .23, y, 27 + (y + 54) * .15, y],
        fadeHex('#f7f4b6', scan * .77), 1.5);
    }
    ell(ctx, 15, -14, 16, 6.2, '#688d77', '#c9d5a7', 1.1);
    ell(ctx, 16, -15.5, 9.5, 3.2, '#a4bda0');
    ell(ctx, 0, 1 + 2 * push, 17, 8.6, '#587d71', '#d3cfaa', 1.6);
    ell(ctx, 0, 2.65 * push, 10.4, 5.9, selected ? '#dce8a2' : '#ebc181', '#9d8860', 1.2);
    ctx.restore();

    const send = since(age, 1.03, 1.55);
    if (send > 0 && send < 1) {
      const feeder = [[x + 225, baseY - 29], [x + 208, baseY + 47],
        [branch[0] + 43, branch[1] - 18], branch];
      waterPath(ctx, feeder, send, 'rgba(221,236,172,.78)', 3.2);
      packetTrace(ctx, feeder, send, '#e2ebad', 17);
    }
    if (age >= -.88 && age < 1.55) {
      const basket = [(hero?.x ?? 468) + 94 * (hero?.scale ?? 1.12),
        (hero?.y ?? 576) - 112 * (hero?.scale ?? 1.12)];
      const cradle = [x + 15, baseY - 19.6];
      const going = age < .46;
      const from = going ? basket : cradle;
      const to = going ? cradle : basket;
      const f = going ? since(age, -.88, -.35) : since(age, .46, 1.55);
      seedKernel(ctx, mix(from[0], to[0], f), mix(from[1], to[1], f) - 24 * Math.sin(Math.PI * f),
        mix(4.4, 8.6, going ? f : 1 - f), t);
    }
  }

  function ai(ctx, env) {
    const { t, progress, far, near, beat } = env;
    fillRect(ctx, 0, 0, W, H, linear(ctx, 0, 0, 0, 583,
      [[0, '#67949b'], [.27, '#8caaa7'], [.58, '#bdd3af'], [.91, '#e3dab3'], [1, '#c7d0a5']]));
    const sun = 1055 - progress * 177;
    glow(ctx, sun, 205, 358, 'rgba(255,237,173,.75)', 'rgba(255,237,173,0)', .83);
    glow(ctx, sun, 205, 111, 'rgba(251,240,206,.78)', 'rgba(251,240,206,0)');
    ell(ctx, sun, 205, 23, 23, 'rgba(255,248,207,.96)');
    glow(ctx, sun, 371, 522, 'rgba(245,217,172,' + (.14 + progress * .22) + ')', 'rgba(245,217,172,0)', .49);
    for (let i = 0; i < 10; i++) {
      const x = wrap(i * 184 - t * 5 + 220, W + 340) - 150;
      glow(ctx, x, 74 + rand(i * 55) * 205, 170 + rand(i * 36) * 108, 'rgba(236,232,194,.33)', 'rgba(236,232,194,0)', .19);
    }
    bands(ctx, 432, 413, far, ['#aac2a3', '#86ab92', '#719783']);
    city(ctx, far * .21, 503, ['#7b9a8d', '#6a8e84', '#a0b096', '#c7d4bd'], '#769588', .82, .19);
    for (let i = 0; i < 4; i++) {
      const x = 117 + i * 151 - 98 * progress;
      const y = 392 + rand(i * 21) * 22;
      lines(ctx, [x, 503, x, y], '#90a7af', 2.2);
      for (let b = 0; b < 3; b++) {
        const a = t * 1.48 + b * TAU / 3 + i;
        lines(ctx, [x, y, x + Math.cos(a) * 22, y + Math.sin(a) * 22], '#b5c4c3', 1.6);
      }
    }
    dataCenter(ctx, 345 - 1409 * progress, 517, t);
    coolingPipes(ctx, 491 - 1502 * progress, 520, t, beat);
    const greenhouseX = 1160 - 1355 * progress;
    ctx.save();
    ctx.translate(greenhouseX, 519);
    ctx.scale(1.44, 1.40);
    communityLab(ctx, 0, 0, t, beat);
    for (let i = 0; i < 4; i++) {
      const x = 19 + i * 151;
      const y = -113 + rand(i * 158) * 20;
      ctx.beginPath();
      ctx.moveTo(x, y - 39);
      ctx.bezierCurveTo(x - 12, y - 22, x + 20, y - 8, x + 6, y + 27);
      ctx.strokeStyle = '#778d6a';
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let j = 0; j < 11; j++) {
        const dy = j * 4;
        const dx = Math.sin(j * .43 + i) * 7 + 2;
        const swing = Math.sin(t * 1.5 + j * .53 + i) * 1.5;
        ell(ctx, x + dx + swing, y - 13 + dy, 4.6 + rand(j * 41 + i) * 3,
          2 + rand(j * 14 + i), j % 3 ? '#85a176' : '#b7bf81');
      }
    }
    ctx.restore();
    canopy(ctx, 211 - 1210 * progress, 517, t);
    if (progress > .14) {
      parkTree(ctx, 1510 - progress * 874, 518, 1.50, t, 83);
      parkTree(ctx, 1607 - progress * 463, 520, 1.20, t + 1, 287);
    }
    if (progress < .21) dataCables(ctx, 314 - 1100 * progress, 496, t, 285, '156,221,190');
    road(ctx, 'ai', t, near);
    const branch = gardenRoutes(ctx, env);
    for (let i = 0; i < 4; i++) {
      const x = 195 + i * 211 - progress * 225;
      const y = 510 - i * 8;
      ell(ctx, x, y + 17, 35, 4.3, 'rgba(69,95,65,.25)');
      poly(ctx, [x - 23, y, x + 25, y, x + 22, y + 15, x - 20, y + 17], '#8b9b74', '#75896d', 1);
      fillRect(ctx, x - 25, y - 2, 52, 3.5, '#c1bf96');
      for (let j = 0; j < 13; j++) {
        const xx = x - 24 + j * 4;
        const ht = 7 + rand(i * 29 + j * 12) * 12;
        lines(ctx, [xx, y, xx + Math.sin(t * 2 + j) * 3, y - ht], j % 2 ? '#759d74' : '#b1c993', 1.45);
      }
    }
    const helpX = 916 - 1286 * progress;
    pedestrian(ctx, helpX, 525, .82, t, '#5e8476', -3);
    pedestrian(ctx, helpX + 31, 525, .81, t + 1.2, '#a78779', 2, true);
    const helmetX = 852 - 1471 * progress;
    pedestrian(ctx, helmetX, 527, .78, t + 3.8, '#aa896d', -4);
    ell(ctx, helmetX, 477, 5.3, 2.9, '#d8be87');
    seedStation(ctx, encounter('ai', env), env, branch);
    glow(ctx, sun, 561, 356, 'rgba(252,222,169,' + (.09 + progress * .16) + ')', 'rgba(252,222,169,0)', .12);
    grain(ctx, .17);
  }

  const scenes = { steam, electric, digital, ai };
  function normalized(env = {}) {
    const t = Number.isFinite(env.t) ? env.t : 0;
    const travel = Number.isFinite(env.travel) ? env.travel : t * 70;
    return {
      t,
      progress: Number.isFinite(env.progress) ? clamp(env.progress) : .5,
      far: Number.isFinite(env.far) ? env.far : travel * .39,
      near: Number.isFinite(env.near) ? env.near : travel,
      beat: Number.isFinite(env.beat) ? clamp(env.beat) : 0,
      hero: env.hero,
      groundAt: env.groundAt,
    };
  }
  function draw(ctx, name, env) {
    const scene = scenes[name];
    if (!scene) return false;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    scene(ctx, normalized(env));
    ctx.restore();
    return true;
  }
  function closeFrame(ctx, x, theme, t, lit) {
    if (x < -210 || x > W + 120) return;
    ctx.save();
    ctx.translate(x, 0);
    const palette = theme === 'steam' ? ['#31212d', '#634339', '#987050', '#b6885e']
      : theme === 'electric' ? ['#25263b', '#414055', '#6e5d6a', '#a18a80']
        : ['#314d63', '#597e89', '#a9b4ac', '#d1daca'];
    const [shadow, steel, glint, spec] = palette;
    const tall = theme === 'ai' ? 658 : theme === 'electric' ? 736 : 689;
    const top = theme === 'electric' ? 30 : -45;
    const w = theme === 'electric' ? 48 : theme === 'ai' ? 72 : 79;
    poly(ctx, [-17, top, w, top, w - 6, tall, -25, tall],
      linear(ctx, -17, 0, w, 0, [[0, shadow], [.28, steel], [.44, steel], [.93, shadow]]), shadow, 2.2);
    poly(ctx, [w - 4, top, w + 13, top + 5, w + 11, tall - 7, w - 6, tall], shadow);
    lines(ctx, [-10, top + 4, -18, tall], glint, theme === 'ai' ? 3.8 : 2.2);
    if (theme !== 'electric') {
      for (let y = 50; y < tall - 9; y += 118) {
        fillRect(ctx, -21, y, w + 31, 9.8, shadow);
        fillRect(ctx, -20, y, w + 28, 2.2, glint);
        for (const dx of [-13, w - 4]) ell(ctx, dx, y + 5, 3.8, 3.6, spec);
      }
      lines(ctx, [-12, 390, w - 13, 450, w - 14, 443, -16, 488], steel, 5.2);
      if (theme === 'steam') {
        glow(ctx, 160, 448, 128, 'rgba(229,172,110,.10)', 'rgba(229,172,110,0)', .62);
        for (let i = 0; i < 5; i++) {
          const q = wrap(i * .20 + t * .43, 1);
          glow(ctx, w - 6 + 118 * q, 614 - 46 * q, 20 + q * 43,
            fadeHex('#d6b798', .13 * (1 - q)), 'rgba(214,183,152,0)', .40);
        }
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(w - 4, top + 25);
      ctx.bezierCurveTo(w + 104, top + 20, w + 113, top + 52, w + 130, top + 90);
      ctx.strokeStyle = shadow;
      ctx.lineWidth = 11;
      ctx.stroke();
      poly(ctx, [w + 115, top + 91, w + 150, top + 91, w + 160, top + 107, w + 111, top + 106], shadow);
      ell(ctx, w + 137, top + 105, 14.6, 7, '#817477');
      if (lit > .02) {
        glow(ctx, w + 137, top + 109, 156, fadeHex('#f2b268', lit * .40), 'rgba(242,178,104,0)', .66);
        ell(ctx, w + 137, top + 106, 13.3, 5.9, fadeHex('#fff0c4', lit));
      }
    }
    poly(ctx, [-36, tall - 31, w + 27, tall - 31, w + 29, H, -39, H],
      linear(ctx, 0, tall - 25, 0, H, [[0, steel], [1, shadow]]), shadow, 7);
    fillRect(ctx, -34, tall - 34, w + 58, 7, shadow);
    fillRect(ctx, -27, tall - 36, w + 48, 2.45, glint);
    ctx.restore();
  }
  function passer(progress, start, end, motion = 0) {
    return mix(W + 175, -204, clamp((progress - start) / (end - start))) - motion;
  }
  function foreground(ctx, name, env) {
    if (!scenes[name]) return false;
    const { t, progress, near } = normalized(env);
    const old = name === 'steam' || name === 'electric';
    const [rim, upper, lower, mark, dark, glint] = roads[name];
    ctx.save();
    fillRect(ctx, 0, 682, W, 38, linear(ctx, 0, 682, 0, 720,
      [[0, 'rgba(21,25,38,0)'], [1, name === 'ai' ? 'rgba(44,67,82,.55)' : 'rgba(21,25,38,.67)']]));
    if (old) {
      const space = 332;
      let last;
      for (let x = -wrap(near * .74, space) - space; x < W + space; x += space) {
        const y = 703 + Math.sin(x * .007) * 8;
        if (last) hangingWire(ctx, last[0], x, last[1], y - 4, 12, dark, 2.2);
        last = [x, y - 4];
        poly(ctx, [x - 5, y - 17, x + 9, y - 17, x + 10, H, x - 7, H], dark, rim, .8);
        ell(ctx, x + 1.5, y - 17, 7.5, 4, mark);
      }
    } else {
      for (let i = 0; i < 9; i++) {
        const x = wrap(i * 151 - near * .74, W + 150) - 80;
        const y = 704 + rand(i * 21) * 19;
        fillRect(ctx, x, y, 108, H - y, dark);
        fillRect(ctx, x, y + 1, 108, 2.2, mark);
        if (name === 'ai') {
          for (let j = 0; j < 9; j++) {
            const stem = x + 6 + j * 11;
            const dx = Math.sin(t * 3.1 + i * 9 + j * .4) * 4.5;
            const top = y - 7 - rand(i * 25 + j * 13) * 13;
            lines(ctx, [stem, y, stem + dx, top], j % 3 ? '#688a80' : '#a6be9b', 1.6);
          }
        }
      }
    }
    if (name === 'steam') {
      // No near blocking during the rider-to-flatcar transfer.
      if (progress <= .345) closeFrame(ctx, passer(progress, .013, .345), 'steam', t, 0);
      if (progress >= .905) closeFrame(ctx, passer(progress, .905, 1.07), 'steam', t, 0);
    } else if (name === 'electric') {
      const lit = ease((progress - .24) / .29);
      if (progress < .56) closeFrame(ctx, passer(progress, .07, .56, Math.sin(near * .0018) * 24),
        'electric', t, lit);
      if (progress > .68) closeFrame(ctx, passer(progress, .69, .995, Math.sin(near * .0018) * 24),
        'electric', t, lit);
    } else if (name === 'ai' && t < 114.25) {
      const x = mix(W + 175, -239, ease((t - 107.2) / 7.05)) - Math.sin(near * .0012) * 22;
      const xBack = x + 655;
      if (x < W && xBack + 210 > 0) {
        poly(ctx, [x - 22, -19, xBack + 267, -37, xBack + 267, 47, x + 18, 92],
          linear(ctx, x, 0, x, 100, [[0, '#466c78'], [.43, '#6f979d'], [.67, '#587985'], [1, '#37596c']]));
        lines(ctx, [x + 6, 75, xBack + 262, 33], '#acc5bd', 4.3);
        lines(ctx, [x + 8, 83, xBack + 262, 42], '#577784', 8.4);
        for (let j = 0; j < 13; j++) {
          const xx = x + 23 + j * 68;
          const y = 79 - j * 3.33;
          ell(ctx, xx, y, 2.1, 2.1, '#bac3b0');
        }
      }
      closeFrame(ctx, x, 'ai', t, 0);
    }
    ctx.restore();
    return true;
  }

  window.WheelLate = { draw, foreground, actionPlan };
})();
