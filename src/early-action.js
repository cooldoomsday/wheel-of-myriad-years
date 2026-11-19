(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const beats = {
    stone: { start: 5.7, hit: 7.9, end: 11.25, near: 102, departure: 91 },
    farm: { start: 15.8, hit: 19.3, end: 23.8, near: 133, departure: 59 },
    bronze: { start: 27.25, hit: 30.4, end: 34.8, near: 109, departure: 48 },
    print: { start: 38.3, hit: 41.8, end: 46.6, near: 104, departure: 48 },
  };
  const clamp = n => Math.max(0, Math.min(1, n));
  const mix = (a, b, p) => a + (b - a) * p;
  const unit = n => n - Math.floor(n);
  function ease(a, b, n) {
    const p = clamp((n - a) / (b - a));
    return p * p * (3 - 2 * p);
  }
  const pressDepth = dt => ease(-.04, .54, dt) * (1 - ease(.68, 1.45, dt));
  const gateLift = dt => ease(.01, .55, dt);
  const latch = dt => ease(-.04, .42, dt);
  const seedLaunch = 19.97;
  const seedLanding = 20.43;
  const feederAngle = t => -.10 - .69 * ease(19.79, seedLaunch, t);

  function tip(key, dt) {
    if (key === 'stone') {
      const pendulum = 24 * ease(-.45, 0, dt) *
        (dt < 0 ? 1 : Math.exp(-dt * 2.35) * Math.cos(dt * 12.1));
      return { x: -17 + pendulum, y: -122 - Math.abs(pendulum) * .06 };
    }
    if (key === 'farm') {
      const angle = -2.35 - .36 * latch(dt);
      return { x: 50 + Math.cos(angle) * 96, y: -65 + Math.sin(angle) * 96 };
    }
    if (key === 'bronze') {
      return { x: 3 + 22 * ease(-.16, .13, dt) * (1 - ease(.31, .67, dt)), y: -122 + 6 * ease(-.13, .15, dt) };
    }
    const pull = pressDepth(dt);
    return { x: 8 + pull * 10, y: -128 + pull * 34 };
  }

  function plan(key, env) {
    const scene = beats[key];
    if (!scene || !env?.hero || !Number.isFinite(env.t) || env.t < scene.start || env.t >= scene.end) return null;
    const dt = env.t - scene.hit;
    const slide = dt < 0 ? -dt * 49 + dt * dt * 77 :
      -dt * 49 - Math.max(0, dt - .85) ** 2 * scene.departure;
    const x = env.hero.x + scene.near + slide;
    const ground = typeof env.groundAt === 'function' ? env.groundAt(x) : env.hero.y;
    const y = Number.isFinite(ground) ? ground : env.hero.y;
    const grip = tip(key, dt);
    const weight = ease(-.64, -.12, dt) * (1 - ease(.22, .67, dt));
    const state = {
      key, x, y, dt, t: env.t, grip,
      alpha: ease(scene.start, scene.start + .61, env.t) * (1 - ease(scene.end - .61, scene.end, env.t)),
      target: { x: x + grip.x, y: y + grip.y, weight },
    };
    if (key === 'farm' && env.t < seedLanding) {
      const angle = env.hero.slope ?? 0;
      const scale = env.hero.scale ?? 1;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      state.basket = {
        x: env.hero.x - x + scale * (94 * cos + 112 * sin),
        y: env.hero.y - y + scale * (94 * sin - 112 * cos),
      };
    }
    return state;
  }

  function fill(ctx, color, path) {
    ctx.beginPath();
    path(ctx);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function line(ctx, color, width, path) {
    ctx.beginPath();
    path(ctx);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function bar(ctx, x1, y1, x2, y2, color, width = 1) {
    line(ctx, color, width, p => { p.moveTo(x1, y1); p.lineTo(x2, y2); });
  }

  function oval(ctx, x, y, w, h, color, angle = 0) {
    fill(ctx, color, p => p.ellipse(x, y, w, h, angle, 0, TAU));
  }

  function rect(ctx, x, y, w, h, r, color) {
    fill(ctx, color, p => p.roundRect(x, y, w, h, r));
  }

  function poly(ctx, color, ...points) {
    fill(ctx, color, p => {
      p.moveTo(...points[0]);
      points.slice(1).forEach(point => p.lineTo(...point));
      p.closePath();
    });
  }

  function tint(ctx, ax, ay, bx, by, stops) {
    const gradient = ctx.createLinearGradient(ax, ay, bx, by);
    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    return gradient;
  }

  function glow(ctx, x, y, w, h, rgb, strength) {
    if (strength < .002) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, h / w);
    const light = ctx.createRadialGradient(0, 0, 0, 0, 0, w);
    light.addColorStop(0, `rgba(${rgb},${strength})`);
    light.addColorStop(.40, `rgba(${rgb},${strength * .52})`);
    light.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = light;
    ctx.fillRect(-w, -w, w * 2, w * 2);
    ctx.restore();
  }

  function wood(ctx, x1, y1, x2, y2, w, palette) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const length = Math.hypot(x2 - x1, y2 - y1);
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    rect(ctx, -1, -w * .53, length + 2, w * 1.06, 2.6, palette[0]);
    poly(ctx, palette[1], [2, -w * .48], [length - 3, -w * .46], [length, w * .08], [1, w * .24]);
    bar(ctx, 3, -w * .39, length - 5, -w * .33, palette[2], Math.min(w * .15, 2.5));
    for (let i = 0; i < 6; i++) {
      const x = unit(i * .719 + w * .039) * (length - 6);
      const end = Math.min(length - 1, x + length * (.22 + i % 3 * .11));
      bar(ctx, x, (i % 4 - 1.7) * w * .15, end, (i % 4 - 1.45) * w * .14, palette[0], .75 + i % 2 * .5);
    }
    ctx.restore();
  }

  function rock(ctx, x, y, w, h, base, top) {
    poly(ctx, base, [x-w, y], [x-w*.83, y-h*.63], [x-w*.24, y-h*.98],
      [x+w*.51, y-h], [x+w*.91, y-h*.53], [x+w, y-h*.13], [x+w*.63, y]);
    poly(ctx, top, [x-w*.83, y-h*.63], [x-w*.24, y-h*.98], [x+w*.51, y-h],
      [x+w*.91, y-h*.53], [x+w*.47, y-h*.52], [x-w*.22, y-h*.63], [x-w*.60, y-h*.32]);
    bar(ctx, x-w*.25, y-h*.63, x-w*.16, y-h*.22, 'rgba(30,42,41,.45)', 1);
    bar(ctx, x+w*.43, y-h*.52, x+w*.59, y-h*.21, 'rgba(222,203,159,.19)', 1.2);
  }

  const stoneWood = ['#3b4949', '#716357', '#a38a69'];
  const farmWood = ['#594f38', '#897144', '#bd9a55'];
  const forgeWood = ['#393f3c', '#665645', '#9b7656'];
  const printWood = ['#412e31', '#78514b', '#c28b65'];
  function hearth(ctx, x, y, t, strength) {
    oval(ctx, x, y + 5, 68, 12, 'rgba(31,39,41,.33)');
    rock(ctx, x - 34, y, 24, 22, '#404b4c', '#758176');
    rock(ctx, x + 42, y - 3, 31, 32, '#3e4b50', '#778781');
    rock(ctx, x - 8, y + 4, 26, 23, '#474d4b', '#717366');
    for (let i=0; i<5; i++) {
      const dx = (i - 2) * 9;
      bar(ctx, x - dx * .7, y - 8, x + dx, y - 21, '#6a5647', 5.8);
      bar(ctx, x - dx * .7, y - 10, x + dx, y - 23, '#8d6c4f', 2.3);
    }
    if (strength < .003) return;
    glow(ctx, x, y - 21, 112, 78, '245,128,67', .42 * strength);
    ctx.save();
    ctx.globalAlpha *= strength;
    for (let i = 0; i < 9; i++) {
      const pulse = .54 + .46 * Math.sin(t * (7 + i * .14) + i * 2.39);
      const h = (20 + pulse * 29 + i % 4 * 10) * strength;
      const dx = (i - 4) * 5.4;
      const stem = x + dx;
      const sway = Math.sin(t * 8 + i) * 14;
      const flame = tint(ctx, 0, y - 12, 0, y - h - 19,
        [[0, '#fff0b2'], [.29, '#ffc074ed'], [.68, '#f0773acb'], [1, '#e45d2932']]);
      fill(ctx, flame, p => {
        p.moveTo(stem - 9, y - 9);
        p.bezierCurveTo(stem - 25, y - 24, stem + sway + 12, y - h * .75, stem + sway, y - h - 12);
        p.bezierCurveTo(stem + sway + 1, y - h * .68, stem + 19, y - 22, stem + 7, y - 9);
        p.closePath();
      });
    }
    ctx.restore();
    for (let i = 0; i < 22; i++) {
      const age = unit(t * (.69 + i % 4 * .141) + i * .317);
      const x1 = x + Math.sin(i * 8.21 + age * 5) * (6 + age * 48) + age * 19;
      const y1 = y - 24 - age * (68 + i % 5 * 10);
      oval(ctx, x1, y1, 1.1 + (1 - age) * 1.35, 1.0 + age, `rgba(255,182,99,${strength * (1 - age) ** 1.55 * .75})`);
    }
    rock(ctx, x + 10, y + 8, 31, 18, '#454848', '#77796e');
  }

  function stone(ctx, state) {
    const { t, dt, grip } = state;
    const flame = ease(.27, .77, dt);
    oval(ctx, 81, -8, 146, 25, 'rgba(35,50,54,.24)');
    rock(ctx, 82, -11, 101, 132, '#48595d', '#788785');
    rock(ctx, 133, -6, 60, 93, '#43555b', '#6f8280');
    rock(ctx, -50, -3, 31, 54, '#48595a', '#7c847a');
    wood(ctx, -31, -171, -47, -6, 13, stoneWood);
    wood(ctx, 77, -162, 98, -10, 14, stoneWood);
    wood(ctx, -39, -174, 86, -165, 14, stoneWood);
    for (let i = 0; i < 5; i++) {
      bar(ctx, -38 + i * 2.9, -181, -30 + i * 2.6, -165, '#b4a279', 1.55);
      bar(ctx, 67 + i * 2.7, -175, 76 + i * 2.3, -160, '#b4a279', 1.55);
    }
    const ember = Math.exp(-Math.max(0, dt) * 5.2) * ease(-.01, .014, dt);
    glow(ctx, 29, -115, 72, 48, '251,158,95', ember * .56);
    for (const [x, y, size] of [[78,-104,1], [112,-86,.74], [142,-56,.58]]) {
      const color = `rgba(208,127,85,${.21 + .62 * flame})`;
      oval(ctx, x, y, 5.6 * size, 7.6 * size, color, .43);
      for (let i = 0; i < 5; i++) {
        const a = -2.98 + i * .46;
        bar(ctx, x + Math.cos(a) * 4 * size, y + Math.sin(a) * 4 * size, x + Math.cos(a) * (i === 1 ? 14 : 11) * size, y + Math.sin(a) * 14 * size, color, 2.9 * size);
      }
    }
    rock(ctx, 40, -97, 24, 24, '#4b5757', '#a09c85');
    line(ctx, '#c2ad82', 2.9, p => { p.moveTo(-12, -174); p.quadraticCurveTo(-8, -145, grip.x, grip.y - 14); });
    poly(ctx, '#303f43', [grip.x-17,grip.y-6], [grip.x-7,grip.y-15], [grip.x+9,grip.y-10], [grip.x+18,grip.y+4], [grip.x-5,grip.y+11]);
    poly(ctx, '#a0a293', [grip.x-17,grip.y-6], [grip.x-7,grip.y-14], [grip.x+8,grip.y-9], [grip.x+10,grip.y-1], [grip.x-5,grip.y+3]);
    if (dt >= 0 && dt < 1.22) {
      for (let i = 0; i < 31; i++) {
        const launch = i % 7 * .017;
        const age = Math.max(0, dt - launch);
        const alive = ease(launch, launch + .02, dt) * (1 - ease(.30, 1.15, age));
        const vx = 87 + unit(i * .364) * 203;
        const vy = -37 - unit(i * .473) * 193;
        const x1 = 21 + vx * age;
        const y1 = -114 + vy * age + age * age * 309;
        if (y1 > -10) continue;
        bar(ctx, x1 - vx * .043, y1 - (vy + age * 618) * .031, x1, y1, `rgba(255,177,96,${alive * .83})`, 1 + i % 3 * .66);
        oval(ctx, x1, y1, 1.1 + i % 3 * .35, 1.15, `rgba(255,230,157,${alive})`);
      }
    }
    hearth(ctx, 181, -19, t, flame);
  }

  function channel(ctx, state, wet) {
    const { t, dt } = state;
    fill(ctx, '#807b4e', p => {
      p.moveTo(75, -23);
      p.bezierCurveTo(174, -44, 222, -37, 271, -39);
      p.quadraticCurveTo(337, -53, 395, -60);
      p.lineTo(419, -39);
      p.bezierCurveTo(365, -21, 286, -2, 223, 1);
      p.quadraticCurveTo(156, 7, 79, -5);
      p.closePath();
    });
    const water = tint(ctx, 0, -62, 0, 6, [[0, '#9cad89'], [.54, '#699592'], [1, '#57807b']]);
    ctx.save();
    ctx.globalAlpha *= .47 + wet * .53;
    fill(ctx, water, p => {
      p.moveTo(78, -22);
      p.bezierCurveTo(174, -37, 215, -31, 271, -33);
      p.quadraticCurveTo(331, -43, 398, -56);
      p.lineTo(416, -43);
      p.bezierCurveTo(350, -27, 287, -7, 226, -5);
      p.quadraticCurveTo(150, 1, 81, -8);
      p.closePath();
    });
    for (let i = 0; i < 38; i++) {
      const age = unit(t * (.095 + wet * (.31 + i % 5 * .05)) + i * .3283);
      const x = 104 + age * 297;
      const y = -15 - Math.max(0, x - 220) * .151 + (i % 9 - 4) * 2.38;
      const length = (3 + i % 7 * 5) * (.52 + wet * .48);
      bar(ctx, x, y, x + length, y - 1 - length * .12, `rgba(204,239,210,${(.18+.46*wet) * Math.sin(Math.PI * age)})`, .95 + i % 4 * .34);
    }
    ctx.restore();
    if (wet < .002) return;
    const width = 8 + wet * 22;
    const crest = tint(ctx, 148, -71, 226, -29, [[0, '#6b9991da'], [.33, '#acd1b4ed'], [.68, '#89bdb2c9'], [1, '#b6e0c834']]);
    fill(ctx, crest, p => {
      p.moveTo(139,-66-width*.32);
      p.bezierCurveTo(177,-76-width*.62, 214,-101, 233,-73);
      p.quadraticCurveTo(250,-48, 259,-15);
      p.bezierCurveTo(237,-32, 224,-45, 208,-61);
      p.quadraticCurveTo(181,-77, 139,-66+width*.62);
      p.closePath();
    });
    for (let i = 0; i < 42; i++) {
      const a = unit(dt * (1.24 + i % 4 * .22) + i * .1397);
      const x = 143 + a * (100 + i % 5 * 10);
      const y = -63 - 38 * a + 82 * a ** 3 + (i % 9 - 4) * (1.3 + 5 * a);
      bar(ctx, x, y, x + 4 + a * 7, y + a * a * 7 - 1, `rgba(231,246,217,${Math.sin(a * Math.PI) * wet * (.23 + i % 4 * .17)})`, 1.25 + i % 3 * .6);
    }
  }

  function farmWheel(ctx, state) {
    const { t, dt } = state;
    const x = 256, y = -66, radius = 56;
    const swell = Math.max(0, dt - .35);
    const angle = t * .48 + 4.28 * (swell + .41 * Math.exp(-swell / .41) - .41);
    wood(ctx, x - 9, y, x + 35, -7, 12, farmWood);
    wood(ctx, x - 10, -5, x - 30, y + 4, 14, farmWood);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    line(ctx, '#5a553d', 11.5, p => p.arc(0,0,radius,0,TAU));
    line(ctx, '#aa935f', 4.1, p => p.arc(-.8,-.8,radius-1.1,0,TAU));
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      ctx.save();
      ctx.rotate(a);
      wood(ctx, 3, 0, radius - 4, 1, 4.7, farmWood);
      poly(ctx, '#796d49', [radius-2,-7], [radius+11,-8.4], [radius+14,-1.2], [radius+1,2.3]);
      bar(ctx, radius+1, -6.1, radius+9, -6.8, '#c2a871', 2.1);
      ctx.restore();
    }
    ctx.restore();
    oval(ctx,x,y,10,10,'#5b5640');
    oval(ctx,x-1,y-1,5.8,5.6,'#c3a568');
    const wet = ease(.03,.61,dt);
    for (let i = 0; i < 13; i++) {
      const age = unit(t * (.91 + wet*.85) + i * .139);
      const dx = age * (36 + i % 4 * 13);
      oval(ctx, x + dx, -10 - Math.sin(age*Math.PI) * (5+i%5*5), 1.7 + i%3, 1 + age, `rgba(213,239,210,${wet * (1-age) * .65})`);
    }
  }

  function kernel(ctx, x, y, angle) {
    glow(ctx,x,y,19,17,'245,197,104',.31);
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(angle);
    fill(ctx,'#714c38',p=>{
      p.moveTo(-1,-8);
      p.bezierCurveTo(7,-4,7,4,2,8);
      p.bezierCurveTo(-6,8,-8,1,-1,-8);
    });
    fill(ctx,'#dca35e',p=>{
      p.moveTo(-1,-7);
      p.bezierCurveTo(6,-3,6,3,1,7);
      p.bezierCurveTo(-5,6,-6,1,-1,-7);
    });
    line(ctx,'#ffe3a9',1.4,p=>{p.moveTo(-1.6,-5.1);p.quadraticCurveTo(-3.7,-.3,-1.7,3);});
    ctx.restore();
  }

  function seedFeeder(ctx, state) {
    const { t, basket } = state;
    const pivotX = 67, pivotY = -161;
    const angle = feederAngle(t);
    const hookY = mix(-112,-123,latch(state.dt));
    wood(ctx,pivotX,-153,pivotX-6,-93,8.7,farmWood);
    line(ctx,'#bf9a64',2.7,p=>{p.moveTo(pivotX+1,pivotY+5);p.lineTo(79,-137);p.lineTo(97,hookY);});
    ctx.save();
    ctx.translate(pivotX,pivotY);
    ctx.rotate(angle);
    poly(ctx,'#745538',[-23,-9],[25,-9],[18,2],[-13,4]);
    bar(ctx,-22,-9,24,-9,'#bc9761',3.9);
    bar(ctx,-12,2,17,1,'#a37a4d',1.63);
    ctx.restore();
    oval(ctx,pivotX,pivotY+1,5.2,5.2,'#765a3f');
    oval(ctx,pivotX-1,pivotY,2.3,2.3,'#c2a267');
    if (!basket) return;
    const launchX = pivotX - 19 * Math.cos(angle) + 13 * Math.sin(angle);
    const launchY = pivotY - 19 * Math.sin(angle) - 13 * Math.cos(angle);
    const p = clamp((t - seedLaunch) / (seedLanding - seedLaunch));
    const arc = Math.sin(Math.PI * p);
    const x = mix(launchX,basket.x,p)-arc*7;
    const y = mix(launchY,basket.y,p**1.65)-arc*4;
    kernel(ctx,x,y,angle*.68+p*TAU*.71);
  }

  function farm(ctx, state) {
    const { dt, grip, t } = state;
    const wet = ease(.17, .72, dt);
    const lift = 48 * gateLift(dt);
    oval(ctx, 113, -12, 127, 19, '#393b293a');
    channel(ctx, state, wet);
    farmWheel(ctx, state);
    rock(ctx, 136, -4, 25, 35, '#676847', '#918a5c');
    rock(ctx, 80, -6, 29, 31, '#706f4d', '#a09864');
    wood(ctx, 74,-157,75,-16,15,farmWood);
    wood(ctx, 159,-157,164,-18,16,farmWood);
    wood(ctx, 61,-153,171,-150,19,farmWood);
    rect(ctx, 83,-128,70,90,3,'#5f5438');
    rect(ctx, 88,-125,62,85,2,'#3e4b43');
    const bottom = -55 - lift;
    rect(ctx, 84, bottom - 78, 70, 76, 1.7, '#625234');
    for (let i=0; i < 6; i++) {
      const x=90+i*10.8;
      wood(ctx, x,bottom-76,x+1,bottom-5,8.6,farmWood);
    }
    wood(ctx,82,bottom-51,157,bottom-49,8.6,farmWood);
    wood(ctx,84,bottom-11,154,bottom-7,10.9,farmWood);
    ctx.save();
    ctx.globalAlpha *= wet * .88;
    fill(ctx, '#b1dacaac', p => {
      p.moveTo(84,-57);
      p.bezierCurveTo(111,-79,140,-75,169,-68);
      p.lineTo(172,-54);
      p.quadraticCurveTo(135,-53,112,-41);
      p.lineTo(87,-41);
      p.closePath();
    });
    for(let i=0;i<16;i++) {
      const age=unit(t*1.62+i*.163);
      bar(ctx,87+age*79,-48-(i%7)*2.3-age*9,99+age*79,-48-(i%7)*2.3-age*9,'#eaf2cb8c',1.05);
    }
    ctx.restore();
    wood(ctx, 46, -61, 52, -13, 14.2, farmWood);
    const rearX = 108 - latch(dt) * 7;
    const rearY = -16 - lift;
    bar(ctx, rearX, rearY, 120, bottom - 53, '#635f46', 4.7);
    bar(ctx, rearX+1.4, rearY, 121, bottom - 53, '#bc9b61', 1.4);
    wood(ctx, grip.x,grip.y,rearX,rearY,10.8,farmWood);
    oval(ctx, 50,-65,8.7,8.7,'#4c4e40');
    oval(ctx, 49.5,-65.5,4.4,4.4,'#dbc181');
    bar(ctx,grip.x-8,grip.y+2,grip.x+9,grip.y-1,'#6a4b37',10.4);
    bar(ctx,grip.x-8,grip.y,grip.x+9,grip.y-4,'#d39d5f',2.5);
    seedFeeder(ctx,state);
    const sprigs = 1 - .4 * Math.sin(t * 2.9);
    for (let i = 0; i < 11; i++) {
      const x = 326 + i * 4.7;
      const h = 16 + i % 4 * 4;
      const y = -7 - i%3 * 3;
      line(ctx, i%4 ? '#7d8750' : '#c6aa5c', 1.9, p => {
        p.moveTo(x,y);
        p.quadraticCurveTo(x+4,y-h*.64,x+(i%3-1)*11*sprigs,y-h);
      });
    }
  }

  function bellBody(ctx, swing, flare) {
    ctx.save();
    ctx.translate(147, -208);
    ctx.rotate(swing);
    oval(ctx, 0, 0, 12, 15, '#8f9b7a');
    oval(ctx, 0, 0, 6, 9, '#48594f');
    const bronze = tint(ctx, -49, 0, 51, 29, [[0, '#3f5752'], [.25, '#74836b'], [.48, '#a89c70'], [.65, '#7d8e73'], [1, '#415c55']]);
    fill(ctx, bronze, p => {
      p.moveTo(-21, 7);
      p.bezierCurveTo(-33,20,-32,67,-39,85);
      p.quadraticCurveTo(-54,109,-48,118);
      p.quadraticCurveTo(3,134,50,114);
      p.quadraticCurveTo(43,101,38,84);
      p.bezierCurveTo(30,60,34,20,20,7);
      p.quadraticCurveTo(0,1,-21,7);
    });
    oval(ctx, .8, 117, 48, 13, '#354c48');
    oval(ctx, .8, 118, 41, 9.2, '#273f3c');
    for (const [y, x, ry] of [[17,27,6],[44,34,7],[87,42,9],[106,48,11]]) {
      line(ctx, '#b1a373bd', 2.8, p => p.ellipse(1,y,x,ry,0,.08,Math.PI-.1));
      line(ctx, '#4e6a5ded', 1.95, p => p.ellipse(1,y+2.6,x,ry,0,.08,Math.PI-.1));
    }
    for (let i=0;i<5;i++) {
      const x=(i-2)*13.5;
      const y=59+(2-Math.abs(i-2))*2.2;
      oval(ctx,x-1.1,y,4.4,5.3,'#647b65');
      oval(ctx,x,y+.7,2.9,3.1,'#b4a875');
      line(ctx,'#a29c71b8',1.56,p=>{p.moveTo(x-4,y+13);p.lineTo(x,y+17);p.lineTo(x+4,y+12);});
    }
    if (flare > .003) {
      glow(ctx, -34, 88, 52, 53, '244,174,92', flare * .41);
      line(ctx, `rgba(251,210,133,${flare * .62})`, 3.6, p => p.ellipse(1,106,48,11,0,.05,2.87));
    }
    bar(ctx, .9, 120, 1.5 + swing*75, 133, '#4b5042', 3.6);
    oval(ctx, 1.5+swing*75, 132, 6.5,5,'#8e8064');
    ctx.restore();
  }

  function bronze(ctx, state) {
    const { dt, grip, t } = state;
    const age = Math.max(0, dt);
    const flare = Math.exp(-age * 1.37) * ease(-.02, .075, dt);
    const swing = dt < 0 ? .008 * Math.sin(t * 2) : Math.exp(-age * .89) * Math.sin(age * 11.7) * .174;
    oval(ctx, 105, -12, 172, 24, '#343b37a1');
    rock(ctx, -16, -7, 34, 27, '#5e5f50', '#8e8173');
    rock(ctx, 234, -4, 62, 37, '#5b6257', '#959582');
    wood(ctx, 42,-231,28,-12,20,forgeWood);
    wood(ctx, 242,-232,249,-12,21,forgeWood);
    wood(ctx, 30,-225,259,-225,20,forgeWood);
    wood(ctx, 41,-217,85,-178,10.5,forgeWood);
    wood(ctx, 239,-216,206,-167,10.5,forgeWood);
    for(let i=0;i<4;i++) {
      bar(ctx,39+i*4,-234,44+i*4,-213,'#bc9c71',2.1);
      bar(ctx,230+i*4,-234,235+i*4,-213,'#b79a70',2.1);
    }
    bar(ctx,147,-228,147,-202,'#c1a77c',4.7);
    bellBody(ctx, swing, flare);
    const head = 90 + (grip.x-3)*.64;
    const hY = -116 + (grip.y+122)*.38;
    wood(ctx,grip.x,grip.y,head,hY,9.3,forgeWood);
    oval(ctx,grip.x,grip.y,10,6.5,'#9a7661',.16);
    oval(ctx,head,hY,13,9.5,'#826b58',.16);
    oval(ctx,head-2,hY-2.7,9,4.5,'#b19774',.16);
    line(ctx,'#bd9d72',2.7,p=>{p.moveTo(52,-222);p.quadraticCurveTo(67,-164,63,-118);});
    if (dt<0 || age>2.6) return;
    for (let i=0;i<4;i++) {
      const a=clamp((age-i*.155)/1.54);
      const visible=ease(0,.09,a)*(1-a)**1.8;
      const x=156-i*3;
      const radius=45 + a*151;
      line(ctx,`rgba(237,200,136,${visible*.58})`,3.1-i*.38,p=>p.ellipse(x,-111,radius,13+a*32,-.07,-.83,.64));
      line(ctx,`rgba(239,200,139,${visible*.42})`,2.6-i*.33,p=>p.ellipse(x,-111,radius,11+a*25,-.07,2.38,3.67));
    }
    glow(ctx,111,-115,54,53,'255,191,105',flare*.27);
  }

  function sheet(ctx, x, y, marked, w = 79, h = 27) {
    poly(ctx,'#a58a70',[x,y+2],[x+w,y+3],[x+w-6,y+h],[x-10,y+h-1]);
    poly(ctx,'#efdbab',[x,y],[x+w,y+1],[x+w-8,y+h-3],[x-9,y+h-4]);
    bar(ctx,x-6,y+h-7,x+w-11,y+h-6,'#fff2c9ac',1.42);
    for (let i=0;i<4;i++) {
      const x1=x+10+i*13.2;
      bar(ctx,x1,y+4,x1-4,y+h-7,marked ? '#83564bd1' : '#bba18376',marked ? 1.3 : .65);
      if (!marked) continue;
      for (let j=0;j<4;j++) {
        const yy=y+5+j*3.47;
        const xx=x1-(yy-y)*.20;
        bar(ctx,xx-1.2,yy,xx+4.2+unit(i*.89+j*.723)*6,yy+.56,j%3 ? '#654443cb' : '#925d4ddb',.91);
      }
    }
    if (marked) poly(ctx,'#ad563bd9',[x+w-17,y+7],[x+w-10,y+7],[x+w-12,y+14],[x+w-19,y+14]);
  }

  function press(ctx, state) {
    const { t, dt, grip } = state;
    const depth=pressDepth(dt);
    const slide=ease(1.12,1.79,dt);
    const mark=dt>.50;
    oval(ctx,137,-9,164,26,'#352c338e');
    glow(ctx,173,-125,151,110,'219,126,79',.20+.057*Math.sin(t*4.36));
    wood(ctx,37,-63,31,-10,15.7,printWood);
    wood(ctx,213,-69,220,-12,16.1,printWood);
    wood(ctx,55,-226,55,-27,19,printWood);
    wood(ctx,210,-225,209,-36,19,printWood);
    wood(ctx,40,-209,225,-209,24,printWood);
    wood(ctx,46,-197,113,-170,8.5,printWood);
    wood(ctx,216,-197,177,-169,8.5,printWood);
    rect(ctx,117,-200,41,25,4,'#5b4840');
    rect(ctx,119,-198,36,4.7,1,'#c68d66b3');
    poly(ctx,'#a56d58',[34,-64],[223,-65],[237,-49],[20,-48]);
    wood(ctx,20,-48,236,-48,16,printWood);
    bar(ctx, 47,-18,205,-21,'#795144',8.4);
    for (const x of [45,67,207,229]) {
      oval(ctx,x,-48,2.7,2.7,'#4e3635');
      oval(ctx,x-.7,-49,1.2,1.2,'#c2906b');
    }
    const bedX=83+slide*74;
    poly(ctx,'#483634',[bedX-9,-73],[bedX+105,-74],[bedX+95,-45],[bedX-20,-45]);
    poly(ctx,'#946455',[bedX-6,-76],[bedX+105,-75],[bedX+97,-52],[bedX-19,-53]);
    bar(ctx,bedX-16,-53,bedX+97,-53,'#c68d65',2.03);
    sheet(ctx,bedX+12,-73,mark);
    const boxY=-112+depth*32;
    rect(ctx,129,-201,17,boxY+201,4,'#52433c');
    for (let i=0;i<13;i++) {
      const y=-192+i*7;
      if (y>=boxY-4) break;
      const wiggle=Math.sin(i*.42-depth*TAU)*1.55;
      bar(ctx,128,y+2.8+wiggle,148,y-2.6+wiggle,'#9f7a59',2.8);
      bar(ctx,130,y+1.85+wiggle,144,y-1.7+wiggle,'#be9575',1.04);
    }
    wood(ctx,94,boxY,185,boxY,24.9,printWood);
    poly(ctx,'#523c37',[83,boxY+8],[181,boxY+8],[177,boxY+15],[87,boxY+15]);
    oval(ctx,137,-144+depth*26,11,11,'#5c4238');
    wood(ctx,grip.x,grip.y,157,-147+depth*27,13.8,printWood);
    rect(ctx,grip.x-8,grip.y-5,23,10,4,'#a67656');
    bar(ctx,grip.x-5,grip.y-3,grip.x+11,grip.y-3,'#dbab80',1.65);
    if (slide > .18) {
      const light=ease(.92,1.22,dt)*(1-ease(2.46,3.37,dt));
      glow(ctx,bedX+40,-62,61,26,'255,206,131',.33*light);
      bar(ctx,bedX+8,-60,bedX+24,-59,`rgba(255,233,173,${light*.63})`,1.4);
    }
    const tray = 257;
    wood(ctx,tray-15,-39,tray-17,-9,12,printWood);
    wood(ctx,tray+55,-41,tray+54,-10,11,printWood);
    wood(ctx,tray-21,-42,tray+63,-43,13,printWood);
    sheet(ctx,tray-12,-72,false,57,20);
    sheet(ctx,tray-8,-76,false,58,20);
    sheet(ctx,tray-11,-79,dt>1.6,56,18);
  }

  const renderers = { stone, farm, bronze, print: press };
  function draw(ctx, state) {
    if (!state || state.alpha <= .001 || state.x < -440 || state.x > 1400) return;
    ctx.save();
    ctx.globalAlpha *= state.alpha;
    ctx.translate(state.x, state.y);
    renderers[state.key](ctx, state);
    ctx.restore();
  }

  window.WheelEarlyAction = { plan, draw };
})();
