(() => {
  'use strict';
  const W=1280, H=720, TAU=Math.PI*2, TILE=2120;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const wrap=(x,m)=>((x%m)+m)%m;
  function random(seed) {
    return () => {
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      return seed / 4294967296;
    };
  }
  function surface(w=W,h=H) {
    const result=document.createElement('canvas');
    result.width=w;
    result.height=h;
    return result;
  }
  function gradient(c,a,b,stops) {
    const g=c.createLinearGradient(0,a,0,b);
    stops.forEach(([at,color])=>g.addColorStop(at,color));
    return g;
  }
  function eta(c,x,y,rx,ry,fill,angle=0) {
    c.beginPath();
    c.ellipse(x,y,rx,ry,angle,0,TAU);
    c.fillStyle=fill;
    c.fill();
  }
  function band(c,points,close,fill,stroke,width) {
    c.beginPath();
    c.moveTo(points[0][0],points[0][1]);
    for (const [x,y] of points.slice(1)) c.lineTo(x,y);
    if(close)c.closePath();
    if(fill){c.fillStyle=fill;c.fill();}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  }

  const sky=surface();
  {
    const c=sky.getContext('2d');
    c.fillStyle=gradient(c,0,467,[[0,'#243849'],[.35,'#53626b'],[.72,'#d0927d'],[1,'#f8bd87']]);
    c.fillRect(0,0,W,H);
    const light=c.createRadialGradient(962,294,15,962,294,430);
    light.addColorStop(0,'#ffdc9be1');
    light.addColorStop(.29,'#f6a66e81');
    light.addColorStop(1,'#f6ae6e00');
    c.fillStyle=light;
    c.fillRect(340,0,940,475);
    eta(c,962,297,48,47,'#ffe7b2');
    const rnd=random(419);
    for(let i=0;i<310;i++) {
      const p=i%8, x=rnd()*1120+160, y=85+p*28+rnd()*10+17*Math.sin(x/161+p);
      const a=.026+rnd()*.04;
      eta(c,x,y,10+65*rnd(),.4+1.7*rnd(),i%4?'rgba(245,186,142,'+a+')':'rgba(56,54,71,'+a+')',-.037);
    }
    const ranges=[
      [331,94, '#987987','#d3938d', 1.2, .5], [365,73,'#756e80','#b48387',1.33,2.7],
      [393,43,'#666777','#85808a',1.8,4.2], [414,29,'#565d6b','#7b737a',.8,7.1]
    ];
    ranges.forEach(([y,h,top,bottom,scale,p],i)=>{
      const pts=[];
      for(let x=-16;x<=W+16;x+=8) {
        const xx=x*scale;
        const a=Math.pow(Math.abs(Math.sin(xx/385+p)),1.65);
        const b=Math.abs(Math.sin(xx/132+p*.85)*Math.sin(xx/41+p));
        pts.push([x,y-h*(a*.8+b*.22)-6*Math.sin(xx/76+2*p)]);
      }
      band(c,[...pts,[W+16,454],[-16,454]],true,gradient(c,y-h,y+43,[[0,top],[1,bottom]]));
      for(let j=1;j<pts.length;j++){
        const [x,a]=pts[j];
        if(j%3!==0) continue;
        const len=20+rnd()*39;
        band(c,[[x,a+3],[x+len*.4,a+len*.6],[x+len,a+len*.9]],false,null,i<2?'#f8c2a134':'#dfad9a2b',.75);
      }
    });
    const haze=gradient(c,392,452,[[0,'#eeab8e00'],[.42,'#f4b79854'],[1,'#f4b79800']]);
    c.fillStyle=haze;
    c.fillRect(0,392,W,60);
  }

  const bank=surface(TILE,H);
  const ground=surface(TILE,H);
  const foreground=surface(TILE,H);
  const rnd=random(2901);
  {
    const c=bank.getContext('2d');
    const ridge=x=>420+12*Math.sin(x*TAU/TILE*3+.23)+6*Math.sin(x*TAU/TILE*9);
    const pts=Array.from({length:266},(_,i)=>[i*8,ridge(i*8)]);
    band(c,[...pts,[TILE,461],[0,462]],true,gradient(c,402,461,[[0,'#575861'],[.6,'#606467'],[1,'#807271']]));
    for(let i=0;i<420;i++){
      const x=rnd()*TILE, y=ridge(x), k=rnd()*14+1;
      band(c,[[x-2,y+9],[x+1,y-k],[x+3,y+10]],true,i%2?'#514e59c4':'#57545edb');
    }
    for(let i=0;i<160;i++){
      const x=rnd()*TILE,y=433+rnd()*20;
      eta(c,x,y,5+rnd()*15,.4+rnd(),i%2?'#ad89844f':'#504e5e66');
    }
  }
  {
    const c=ground.getContext('2d');
    c.fillStyle=gradient(c,511,H,[[0,'#655c54'],[.25,'#403f3c'],[.49,'#81726a'],[.67,'#5d5551'],[1,'#30373b']]);
    c.fillRect(0,538,TILE,H);
    const edge=[];
    for(let x=0;x<=TILE;x+=10)edge.push([x,541-5*Math.sin(x*TAU/TILE*7)-4*Math.cos(x*TAU/TILE*11)]);
    band(c,[...edge,[TILE,594],[0,594]],true,gradient(c,528,597,[[0,'#5b5150'],[.17,'#5a5448'],[.28,'#6b5f50'],[1,'#6e655b00']]));
    for(let i=0;i<2200;i++){
      const x=rnd()*TILE,y=544+rnd()*160;
      eta(c,x,y,rnd()*7+.5,rnd()*1.25+.21,i%2?'#d7b48d38':'#1e303b70',rnd()*.3);
    }
    for(let i=0;i<420;i++){
      const x=rnd()*TILE,y=524+rnd()*26,d=rnd()*21+4, k=rnd()*6+1;
      band(c,[[x-d/2,y],[x-d*.3,y-k],[x+d*.31,y-k*.6],[x+d/2,y],[x+d*.2,y+1]],true,i%2?'#494947':'#59544c','#9b7a6558',.65);
    }
    c.fillStyle=gradient(c,591,H,[[0,'#523e4600'],[.7,'#2f3d456b'],[1,'#283746ca']]);
    c.fillRect(0,591,TILE,H);
  }
  {
    const c=foreground.getContext('2d');
    for(let i=0;i<2090;i++){
      const x=rnd()*TILE,y=615+Math.pow(rnd(),.86)*125,k=10+rnd()*50+(y-615)*.42;
      const sway=-6+rnd()*28;
      const tone=['#374446','#56584c','#343e3d','#8b765b','#6d6953'][i%5];
      c.beginPath();
      c.moveTo(x,y);
      c.quadraticCurveTo(x+sway*.29,y-k*.56,x+sway,y-k);
      c.strokeStyle=tone;
      c.lineWidth=.55+(y-610)*.006+rnd();
      c.stroke();
      if(i%3===0) {
        eta(c,x+sway,y-k,1.25+1.7*rnd(),2.3+k*.032,i%7?'#a78a60':'#c29a6f',sway/k);
        eta(c,x+sway-.6,y-k-1,.7,1.5,'#d1ad7b91',sway/k);
      }
    }
  }

  const waveRng=random(831);
  const waves=Array.from({length:530},()=>[waveRng(),waveRng(),waveRng(),waveRng()]);
  function tile(c,layer,offset) {
    const x=-wrap(offset,TILE);
    c.drawImage(layer,x,0);
    if(x+TILE<W)c.drawImage(layer,x+TILE,0);
  }
  function draw(c,e) {
    const { t, travel }=e;
    c.drawImage(sky,0,0);
    const water=gradient(c,429,550,[[0,'#786c74'],[.43,'#bd8986'],[1,'#62646a']]);
    c.fillStyle=water;
    c.fillRect(0,428,W,129);
    tile(c,bank,travel*.073);
    c.lineCap='round';
    for(const [rx,ry,w,s] of waves){
      const y=450+Math.pow(ry,1.6)*108, spread=y-435;
      const x=wrap(rx*(W+180)-travel*(.13+ry*.07)+Math.sin(t*(.4+.66*s)+rx*76)*(1+ry*7),W+180)-90;
      const glare=Math.exp(-Math.pow((x-954)/(spread*1.7+13),2));
      const a=(.12+.29*s)*(.46+.54*Math.sin(t*(.64+s*.38)+w*28)**2);
      c.strokeStyle=glare>.27?'rgba(255,213,151,'+a*(.5+.9*glare)+')':'rgba(220,179,168,'+a+')';
      c.lineWidth=.38+ry*.78;
      c.beginPath();
      c.moveTo(x,y);
      c.lineTo(x+(1+w*spread*.37),y);
      c.stroke();
    }
    for(let i=0;i<7;i++){
      const x=908-i*25+Math.sin(t*.37+i)*13, y=201+i*8+Math.sin(t*.45+i*.6)*10;
      const flap=Math.sin(t*3+i*.52);
      c.beginPath();c.moveTo(x-4,y+flap*3);c.quadraticCurveTo(x-1,y-2,x,y+1);
      c.quadraticCurveTo(x+2,y-2,x+5,y+flap*2);
      c.strokeStyle='#604f58bb';c.lineWidth=1;c.stroke();
    }
    tile(c,ground,travel);
  }
  function front(c,e) { tile(c,foreground,e.travel*1.22); }
  function sprout(c,x,y,t) {
    const a=clamp(t*.7);
    if(a<=0)return;
    const h=9*a+31*a*a;
    const swing=Math.sin(t*3)*a*2.3;
    c.save();
    c.translate(x,y);
    eta(c,1,1,11+a*3.4,2.6,'#202a2b59');
    const g=gradient(c,-h,3,[[0,'#e3cb8e'],[.31,'#a5af75'],[1,'#63734c']]);
    c.beginPath();
    c.moveTo(0,0);
    c.bezierCurveTo(-3,-h*.44,swing+6,-h*.71,swing,-h);
    c.strokeStyle=g;c.lineWidth=1.5+a*.85;c.stroke();
    for(let i=0;i<4;i++){
      const q=clamp((a-i*.16)*1.85);
      const side=i%2?-1:1, yy=-h*(.38+i*.18);
      const xx=swing*i/4, reach=(15-i*1.25)*q;
      c.beginPath();
      c.moveTo(xx,yy);
      c.quadraticCurveTo(xx+side*reach*.12,yy-9*q,xx+side*reach,yy-9*q);
      c.quadraticCurveTo(xx+side*reach*.72,yy-1*q,xx,yy);
      c.fillStyle=i%2?'#a6ad72':'#c3bd7e';c.fill();
    }
    c.restore();
  }
  window.WheelRiver={draw,foreground:front,sprout};
})();