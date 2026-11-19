(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const ink = '#27333c';
  const rim = '#b5a592';
  const frame = '#476c69';
  const crank = { x: -5, y: -40 };
  const hub = [{ x: -74, y: -39 }, { x: 77, y: -39 }];

  function shape(c, path, fill, stroke, width = 1) {
    c.fillStyle = fill;
    c.fill(path);
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = width;
      c.stroke(path);
    }
  }
  function line(c, points, color, width) {
    c.beginPath();
    c.moveTo(...points[0]);
    for (const point of points.slice(1)) c.lineTo(...point);
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
  }
  function ellipse(c, x, y, rx, ry, fill, turn = 0) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, turn, 0, TAU);
    c.fillStyle = fill;
    c.fill();
  }
  function tone(c, x0, y0, x1, y1, colors) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    colors.forEach((color, i) => g.addColorStop(i / (colors.length - 1), color));
    return g;
  }
  function circle(c, x, y, r, color, width) {
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
  }
  function wheel(c, { x, y }, angle) {
    circle(c, x, y, 36.9, '#253033', 4.3);
    circle(c, x, y, 34.7, rim, 1.35);
    circle(c, x, y, 33.1, '#4d5354', 1.1);
    c.beginPath();
    for (let i = 0; i < 18; i++) {
      const a = angle + i * TAU / 18;
      c.moveTo(x + 3.2 * Math.cos(a + .7), y + 3.2 * Math.sin(a + .7));
      c.lineTo(x + 33.3 * Math.cos(a), y + 33.3 * Math.sin(a));
    }
    c.strokeStyle = '#bdb3a2a9';
    c.lineWidth = .55;
    c.stroke();
    ellipse(c, x, y, 3.5, 3.5, '#6c6e64');
    ellipse(c, x, y, 1.7, 1.7, '#d5c5a7');
    c.beginPath();
    c.arc(x, y, 37, 3.4, 5.44);
    c.strokeStyle = '#a4987a9b';
    c.lineWidth = .9;
    c.stroke();
  }

  const body = new Path2D('M-96-112C-76-110-72-131-45-137C-27-142-15-134-6-143C8-155 4-176 15-187C27-198 45-186 47-168C48-153 49-143 39-128C32-118 34-108 22-99C6-86-19-87-46-92C-68-95-85-102-96-112Z');
  const hood = new Path2D('M5-163C9-174 7-192 17-200C16-204 12-205 8-207C15-207 20-204 23-205C28-210 38-214 46-211C39-211 37-208 34-205C55-210 67-200 68-190C69-183 63-174 54-168C43-160 22-157 5-163Z');
  const bill = new Path2D('M51-194C61-196 72-195 83-191C101-184 121-183 143-181C149-180 149-176 143-173C128-168 119-160 101-157C84-155 62-159 51-169C47-174 45-181 47-188Z');
  const upperBill = new Path2D('M49-192C62-202 72-195 85-191C107-183 133-183 145-181C152-179 148-174 143-173C116-174 88-176 69-176C58-176 52-176 48-179Z');
  const shoulder = new Path2D('M-57-120C-48-135-26-136-10-131C3-128 15-121 25-118C38-115 47-117 58-120C64-123 69-121 70-117C72-109 58-106 47-106C28-104 17-107 8-109C-11-112-33-104-52-108C-59-109-60-114-57-120Z');
  const wingShadow = new Path2D('M-70-119C-64-130-46-135-30-132C-14-128-11-116-21-111C-37-103-65-104-84-109C-90-111-89-116-70-119Z');
  const billLine = new Path2D('M53-178C71-177 89-176 111-175C127-174 138-176 145-177');
  const pouchLines = [
    new Path2D('M53-176Q68-158 94-160'),
    new Path2D('M61-176Q78-162 104-162'),
    new Path2D('M72-175Q87-164 117-166')
  ];

  function leg(c, phase, lift, near, stand) {
    const ankle = { x: (crank.x + 13.1 * Math.cos(phase) - 5)*(1-stand)+(near?76:54)*stand,
      y: (crank.y + 13.1 * Math.sin(phase) - 4)*(1-stand)-4*stand-Math.sin(stand*Math.PI)*(near?17:9) };
    const hip = { x: (near ? -21 : -29)+stand*71, y: -96 + lift + stand*27 };
    const dx = ankle.x - hip.x;
    const dy = ankle.y - hip.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const thigh = 36;
    const shank = 38;
    const edge = (d * d + thigh * thigh - shank * shank) / (2 * d);
    const bend = Math.sqrt(Math.max(0, thigh * thigh - edge * edge));
    const knee = {
      x: hip.x + (dx * edge + dy * bend) / d,
      y: hip.y + (dy * edge - dx * bend) / d
    };
    const joints = [[hip.x, hip.y], [knee.x, knee.y], [ankle.x, ankle.y]];
    line(c, joints, '#5b3d3d', near ? 9.0 : 7.1);
    line(c, joints, near ? '#d39178' : '#925e56', near ? 7.0 : 5.6);
    line(c, [[hip.x, hip.y], [knee.x, knee.y]], near ? '#e2b59c' : '#b2826d', 1.15);

    c.save();
    c.translate(ankle.x, ankle.y + 2);
    c.rotate((.16 * Math.sin(phase) + .08)*(1-stand));
    shape(c, new Path2D('M-7-3Q-2-5 1-4L11-2Q17-1 16 2Q12 5 1 5L-6 4Q-10 0-7-3Z'),
      near ? '#db9c80' : '#946959', '#5b4645', 1.1);
    line(c, [[1, 1], [10, 2], [14, 1]], near ? '#ac6f5c' : '#6b4c48', .65);
    c.restore();
  }
  function bike(c, angle, phase, light, seed, assist) {
    wheel(c, hub[0], angle);
    wheel(c, hub[1], angle);
    circle(c, hub[0].x, hub[0].y, 7, '#5c554b', 1.8);
    line(c, [[-69,-40], [-5,-50], [4,-37], [-69,-35]], '#8e7e62', 1.65);
    const tubes = [
      [[-74,-39],[-26,-91],[-5,-40],[-74,-39]],
      [[-26,-91],[53,-99],[-5,-40]],
      [[77,-39],[54,-92],[54,-104],[63,-111],[67,-119]]
    ];
    tubes.forEach(p => line(c, p, '#253a3b', 6.9));
    tubes.forEach(p => line(c, p, frame, 4.8));
    line(c, [[-25,-92],[53,-100],[-5,-41]], '#b2b28c', .85);
    line(c, [[-26,-89],[-33,-107]], '#757770', 3);
    shape(c, new Path2D('M-50-109C-44-113-26-110-19-106Q-16-104-25-102L-43-102Q-51-104-50-109Z'), '#5a4440', '#34373a', 1.25);
    line(c, [[53,-98],[62,-120],[72,-120]], '#d1c2a4', 3.1);
    line(c, [[63,-120],[73,-120]], ink, 4.5);
    for (let i = 0; i < 6; i++) {
      const a = phase + i * TAU / 6;
      line(c, [[crank.x,crank.y],[crank.x + 8 * Math.cos(a),crank.y + 8 * Math.sin(a)]], '#b69c78', 1.25);
    }
    circle(c, crank.x, crank.y, 9.2, '#5a5a51', 2);
    circle(c, crank.x, crank.y, 7.4, '#ccb999', .9);
    const p = [crank.x + 13.1 * Math.cos(phase), crank.y + 13.1 * Math.sin(phase)];
    line(c, [[crank.x,crank.y],p], '#d1bea0', 2.6);
    line(c, [[p[0]-6,p[1]+1],[p[0]+6,p[1]+1]], '#414546', 2.75);

    const basket = new Path2D('M74-111L109-112L104-96Q92-93 80-96Z');
    line(c, [[61,-103],[77,-99]], '#8d8978', 2.1);
    shape(c, basket, '#635348', '#423d3c', 1.2);
    c.save();
    c.clip(basket);
    for (let i = 0; i < 5; i++) line(c, [[73,-110+i*3.0],[109,-110+i*3.0]], i % 2 ? '#8b6f57' : '#a18769', 1.1);
    for (let i = 0; i < 7; i++) line(c, [[76+i*5,-112],[80+i*4,-95]], '#b69c778f', .8);
    c.restore();
    line(c, [[75,-111],[109,-112]], '#c0a380', 1.8);
    if (seed > 0) {
      c.save();
      c.globalAlpha = seed;
      ellipse(c, 94,-112,7,3.2,'#f1c376',-.20);
      ellipse(c, 96,-113,5,1.25,'#ffe7aa',-.20);
      c.restore();
    }

    if (assist > 0) {
      c.save();
      c.globalAlpha = assist;
      shape(c, new Path2D('M-1-54L41-89Q45-90 46-86L10-51Q5-49-1-54Z'), '#363f4a', '#83918a', 1);
      line(c, [[4,-55],[42,-86]], '#b7c3a3', .8);
      ellipse(c,38,-82,2.4,1.1,'#b4dfba',-.76);
      c.restore();
    }
    if (light > 0) {
      const beam = c.createRadialGradient(107,-100,3,107,-100,82);
      beam.addColorStop(0,'rgba(255,221,146,' + .39 * light + ')');
      beam.addColorStop(1,'rgba(255,221,146,0)');
      c.fillStyle = beam;
      c.fillRect(100,-162,91,124);
      ellipse(c, 104,-100,6,4.3,'#6d7b74');
      ellipse(c, 109,-100,2.8,3.4,'#ffe4a3');
    }
  }

  function activeWing(c, tip, flight) {
    const x = tip.x;
    const y = tip.y;
    const dx = x - 67;
    const lift = y + 118;
    const arm = new Path2D();
    arm.moveTo(-57,-120);
    arm.bezierCurveTo(-48,-135,-27,-136,-10,-131);
    arm.bezierCurveTo(1+dx*.26,-128+lift*.27,20+dx*.30,-116+lift*.48,38+dx*.63,-116+lift*.66);
    arm.quadraticCurveTo(53+dx*.87,-117+lift*.83,x-6,y-3.7);
    arm.quadraticCurveTo(x+2,y-5,x+3,y);
    arm.quadraticCurveTo(x+3,y+5,x-5,y+7);
    arm.bezierCurveTo(46+dx*.78,-103+lift*.80,27+dx*.45,-105+lift*.56,8+dx*.20,-109+lift*.29);
    arm.bezierCurveTo(-11,-112,-33,-104,-52,-108);
    arm.bezierCurveTo(-59,-109,-60,-114,-57,-120);
    arm.closePath();
    shape(c,arm,flight,'#68706b',1.25);
    for (let i=0;i<4;i++) {
      const xx=-20+i*21+dx*i*.18, yy=-117+lift*(.12+i*.19);
      const feather=new Path2D();
      feather.moveTo(xx,yy);
      feather.quadraticCurveTo(xx+10,yy+4,xx+16,yy+4);
      c.strokeStyle='#899486a3';c.lineWidth=.85;c.stroke(feather);
    }
    ellipse(c,x,y+.8,4.5,2.85,'#d7c1a3',-.20);
  }

  function dress(c, costume, env, layer) {
    if (!costume) return;
    const { from, to, mix }=costume;
    if (from===to || mix<=0) {
      window.WheelCostume.draw(c,from,env,layer);
      return;
    }
    c.save();
    c.globalAlpha*=1-mix;
    window.WheelCostume.draw(c,from,env,layer);
    c.restore();
    c.save();
    c.globalAlpha*=mix;
    window.WheelCostume.draw(c,to,env,layer);
    c.restore();
  }

  function drawnBird(c, t, lift, pitch, dip, wind, coast, stand, costume, hand) {
    const coat = tone(c, -38,-191,-5,-91, ['#f4ead3','#fff5dc','#daccab','#929c93']);
    shape(c, body, coat, '#535857', 1.45);
    const grey = tone(c, -78,-130,-42,-106, ['#65777b','#415565','#364956']);
    shape(c, wingShadow, grey, '#3e535e', 1);
    c.save();
    c.translate(-70,-109);
    c.rotate(.045 * Math.sin(t*4) * wind);
    shape(c, new Path2D('M-29-4Q-9-3 1-15Q11-17 13-11Q6-2-3 0Q-17 4-29-4Z'), '#556674', '#455863', .95);
    for (let i = 0; i < 4; i++) {
      const x = -24 + i * 5.3;
      line(c, [[x,-3],[x+10,-5],[x+16,-9]], '#879797', .7);
    }
    c.restore();

    c.save();
    c.translate(26,-164);
    c.rotate(pitch + dip * .34);
    c.translate(-26 + coast*5,164 + dip * 7 + coast*7);
    shape(c, hood, tone(c, 34,-214,39,-161,['#fff6e4','#f6e9cb','#aeb4a5']), '#5b5c57', 1.15);
    shape(c, bill, tone(c, 70,-189,82,-156,['#d28e64','#e6a371','#e8ba83','#be775f']), '#74554d', 1.1);
    for (const rib of pouchLines) {
      c.strokeStyle = '#f1c48e87';
      c.lineWidth = .85;
      c.stroke(rib);
    }
    shape(c, upperBill, tone(c, 76,-195,72,-174,['#f7d397','#e7ae74','#ce855b']), '#885d50', .95);
    c.strokeStyle = '#735549';
    c.lineWidth = .85;
    c.stroke(billLine);
    ellipse(c, 64,-188,2.4,1.1,'#906651',-.08);
    ellipse(c, 48,-190,7.8,5.3,'#d29b80',.13);
    const blink = Math.pow(Math.max(0,Math.cos((t+1.2)*TAU/4.71)),680);
    ellipse(c, 48,-190,3.9, Math.max(.48, 4.15 * (1-blink)),'#262e34');
    if (blink < .4) {
      ellipse(c, 49.1,-191.5,1.15,1.4,'#fff3d1');
      ellipse(c, 46.5,-188.5,.65,.61,'#b7a76d');
    }
    c.restore();

    const env = {t,wind,stand,pitch,dip,coast};
    dress(c,costume,env,'body');
    c.save();
    c.translate(-45,-121);
    c.rotate(stand*(-.37-.19*Math.sin(t*5)));
    c.scale(1-.26*stand,1);
    c.translate(45,121);
    const flight = tone(c, -29,-135,-21,-105,['#fff1d3','#e4d4b2','#9faa9b']);
    if (hand) activeWing(c,hand,flight);
    else {
      shape(c, shoulder, flight, '#68706b', 1.25);
    for (let i = 0; i < 6; i++) {
      const x = -43+i*13;
      const y = -122+Math.sin(i*.66)*5;
      const feather = new Path2D();
      feather.moveTo(x,y);
      feather.quadraticCurveTo(x+13,y+5,x+19,y+5);
      feather.quadraticCurveTo(x+16,y+9,x+10,y+8);
      c.lineWidth = .72;
      c.strokeStyle = '#848b7d99';
      c.stroke(feather);
    }
    ellipse(c, 67,-119-lift,5.1,3,'#d7c1a3',-.25);
      line(c, [[68,-119-lift],[72,-120-lift]], '#aa9176', .75);
    }
    c.restore();
    dress(c,costume,env,'top');
  }

  function draw(c, opts) {
    const { t, x, y, scale = 1, travel, push = 1, dip = 0, look = 0,
      light = 0, seed = 1, cool = 0, slope = 0, assist = 0, coast = 0, stand = 0, wind = .5,
      costume, target, pedalAngle = travel / 53 + Math.PI / 3, wheelAngle = travel / 37 } = opts;
    const phase = pedalAngle;
    const angle = wheelAngle;
    const lift = Math.sin(phase * 2) * (1.4+2.0*push) * push - 1.6 * Math.max(0,-slope) * push;
    c.save();
    c.translate(x,y);
    c.scale(scale,scale);
    const shade = c.createRadialGradient(-4,2,5,-4,2,126);
    shade.addColorStop(0,'#1b222e77');
    shade.addColorStop(.74,'#1b222e40');
    shade.addColorStop(1,'#1b222e00');
    ellipse(c,-4,2,126,12,shade);
    c.rotate(slope);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    leg(c, phase + Math.PI, lift, false, stand);
    c.save();
    c.translate(-27*stand,0);
    bike(c, angle, phase, light, seed, assist);
    c.restore();
    leg(c, phase, lift, true, stand);
    const reach = target && target.weight;
    let hand = null;
    if (reach > .005) {
      const ax = (target.x-x)/scale;
      const ay = (target.y-y)/scale;
      const cos = Math.cos(slope), sin = Math.sin(slope);
      const localX = ax*cos + ay*sin - 70*stand;
      const localY = ay*cos - ax*sin - lift - 27*stand;
      hand = {x:67+(Math.max(48,Math.min(137,localX))-67)*reach,
        y:-119-lift+(Math.max(-154,Math.min(-80,localY))+119+lift)*reach};
    }
    c.translate(70*stand,lift+27*stand);
    drawnBird(c,t,lift,look + .032*Math.sin(phase+.8)*push,dip,.28 + .72 * wind,coast,stand,costume,hand);
    if (cool > 0) {
      c.strokeStyle = 'rgba(154,215,227,' + .5*cool + ')';
      c.lineWidth = .9;
      c.stroke(new Path2D('M-93-111Q-80-113-71-122M-40-137Q-20-138-7-144'));
    }
    c.restore();
  }
  window.WheelHero = { draw };
})();