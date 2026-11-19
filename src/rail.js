(() => {
  'use strict';
  const TAU=Math.PI*2;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,t)=>a+(b-a)*t;
  function ease(a,b,t) {
    const f=clamp((t-a)/(b-a));
    return f*f*(3-2*f);
  }
  function path(c,points,fill,stroke,width=.9){
    c.beginPath(); c.moveTo(...points[0]);
    for(const point of points.slice(1))c.lineTo(...point);
    if(fill){c.closePath();c.fillStyle=fill;c.fill();}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  }
  function ellipse(c,x,y,rx,ry,fill,outline,width=1){
    c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);
    c.fillStyle=fill;c.fill();
    if(outline){c.strokeStyle=outline;c.lineWidth=width;c.stroke();}
  }
  function color(c,y0,y1,a,b,d){
    const g=c.createLinearGradient(0,y0,0,y1);
    g.addColorStop(0,a);g.addColorStop(.38,b);g.addColorStop(1,d);
    return g;
  }
  const leftRamp=178, width=329, rightRamp=196, platform=535;
  function field(x) {
    if(x<0) return mix(576,platform,ease(-leftRamp,4,x));
    return mix(platform,576,ease(width-2,width+rightRamp,x));
  }
  function plan(t,normalX,scale,travel) {
    const opacity=ease(62,63.3,t)*(1-ease(73.7,75,t));
    if(opacity<=0)return null;
    const x=1290-735*ease(62.02,66.12,t)-350*ease(66.05,73.25,t);
    const entrance=ease(64.75,67.5,t);
    const exit=ease(70.1,73.52,t);
    const localX=mix(-leftRamp,147,entrance)+(width+rightRamp-77)*exit;
    const aboard=ease(67.07,67.8,t)*(1-ease(70.8,72.45,t));
    const follow=ease(63.93,64.75,t)*(1-ease(73.28,74.9,t));
    const actorX=mix(normalX,x+localX,follow);
    const fore=field(actorX-x+77*scale);
    const aft=field(actorX-x-74*scale);
    const y=mix(576,(fore+aft)*.5,follow);
    const slope=follow*Math.atan2(fore-aft,151*scale);
    const stand=ease(67.5,68.38,t)*(1-ease(69.76,70.74,t));
    return {x,actorX,y,slope,t,aboard,stand,opacity,follow,travel,
      entry:1-ease(67.6,68.45,t),exit:ease(70.2,70.85,t)};
  }
  function wheel(c,x,y,r,spin) {
    ellipse(c,x,y,r,r,'#2e2729','#b19776',2);
    ellipse(c,x,y,r*.81,r*.81,'#4b3835','#1f1b20',2);
    c.beginPath();
    for(let i=0;i<10;i++){
      const a=spin+i*TAU/10;
      c.moveTo(x+Math.cos(a)*5,y+Math.sin(a)*5);
      c.lineTo(x+Math.cos(a)*(r-3),y+Math.sin(a)*(r-3));
    }
    c.strokeStyle='#ad7061';c.lineWidth=2.3;c.stroke();
    ellipse(c,x,y,r*.24,r*.24,'#9a7a62','#ba9a72',.8);
    ellipse(c,x,y,r*.10,r*.10,'#393032');
  }
  function steam(c,x,y,t,level) {
    for(let i=0;i<24;i++){
      const p=(t*(.39+(i%5)*.04)+i*.107)%1;
      const dx=x-p*(111+i*5)+Math.sin(p*6+i)*10;
      const dy=y-p*(42+i*1.6)-Math.sin(p*7+i)*4;
      const r=4+p*23+(i%5)*1.5;
      const a=Math.sin(Math.PI*p)**1.4*(.018+(i%4)*.011)*level;
      const g=c.createRadialGradient(dx,dy,1,dx,dy,r);
      g.addColorStop(0,'rgba(243,219,184,'+a*2.7+')');
      g.addColorStop(1,'rgba(223,195,167,0)');
      c.fillStyle=g;c.fillRect(dx-r,dy-r,r*2,r*2);
    }
  }
  function locomotive(c,x,t,travel) {
    c.save(); c.translate(x,522); c.scale(.92,.92);
    c.fillStyle='#382b2b'; c.fillRect(-20,-3,320,9);
    c.fillStyle='#694335'; c.fillRect(0,-12,272,13);
    c.fillStyle='#baa081'; c.fillRect(0,-13,273,1.8);
    const spin=travel/26;
    [21,95,166,239].forEach((at,i)=>wheel(c,at,15,i===3?18:25,spin+i*.03));
    path(c,[[12,-10],[11,-72],[83,-72],[86,-11]],
      color(c,-72,0,'#7a5943','#59443d','#392e30'),'#29282b',2);
    path(c,[[3,-72],[12,-82],[81,-82],[94,-73]],
      '#3d3638','#b59977',1.3);
    path(c,[[24,-64],[42,-64],[42,-36],[24,-36]],'#d9a967','#9c7658',1.4);
    path(c,[[53,-64],[73,-64],[73,-36],[53,-36]],'#b98c58','#9c7658',1.4);
    c.fillStyle=color(c,-75,-6,'#a68163','#746151','#463639');
    c.beginPath();c.roundRect(83,-64,165,49,15);c.fill();
    c.strokeStyle='#3b302f';c.lineWidth=2;c.stroke();
    [97,135,175,221,244].forEach((x,i)=>{
      c.fillStyle=i===4?'#b59165':'#96806b';c.fillRect(x,-61,3,44);
      c.fillStyle='#372b2b77'; c.fillRect(x+3,-61,2,44);
    });
    ellipse(c,248,-40,16,23,'#443c3d','#a7896c',2);
    ellipse(c,258,-40,7,11,'#a08562','#342c30',1);
    ellipse(c,263,-43,6,4,'#edc580','#4e3c39',1);
    path(c,[[213,-60],[215,-89],[229,-90],[228,-60]],'#4c3c3c','#ae8f6b',1.4);
    path(c,[[209,-89],[210,-95],[234,-95],[232,-89]],'#554643','#ad8e6b',1.2);
    ellipse(c,151,-66,12,8,'#aa835f','#514445',1);
    path(c,[[268,-10],[292,-9],[304,5],[266,4]],'#704f44','#372d2f',1.4);
    c.save();
    c.translate(0,2);
    const y=Math.sin(spin)*9;
    const dx=Math.cos(spin)*9;
    path(c,[[21+dx,13+y],[95+dx,13+y],[166+dx,13+y],[201,-1]],null,'#291f26',5);
    path(c,[[21+dx,13+y],[95+dx,13+y],[166+dx,13+y],[201,-1]],null,'#b1a188',2.8);
    c.restore();
    steam(c,220,-96,t,1.34);
    steam(c,250,8,t+.7,.6);
    c.restore();
  }
  function ramp(c,start,end,entry,op) {
    if(op<=0)return;
    const from=entry?576:platform, until=entry?platform:576;
    c.save();
    c.globalAlpha*=op;
    const pts=[];
    for(let k=0;k<=16;k++){
      const p=k/16;
      pts.push([mix(start,end,p),mix(from,until,ease(0,1,p))]);
    }
    path(c,[...pts,...pts.slice().reverse().map(([x,y])=>[x,y+7])],
      color(c,platform,582,'#b08d62','#8d6d55','#54463e'),'#413a36',1.5);
    path(c,pts,null,'#d2a875',1.25);
    for(let i=1;i<pts.length;i+=2){
      const [x,y]=pts[i];
      path(c,[[x,y+2],[x-3,y+6]],null,'#715c4b',.95);
    }
    c.restore();
  }
  function behind(c,r){
    if(!r)return;
    const {x,t,opacity,travel}=r;
    c.save();c.globalAlpha*=opacity;
    const shadow=c.createLinearGradient(0,553,0,598);
    shadow.addColorStop(0,'#1b1a1a00'); shadow.addColorStop(.31,'#17181f62'); shadow.addColorStop(1,'#17181f00');
    c.fillStyle=shadow;c.fillRect(x-20,553,width+49,45);
    const railFloor=c.createLinearGradient(x-280,0,x+width+368,0);
    railFloor.addColorStop(0,'#d0a28100');railFloor.addColorStop(.2,'#7e736a');railFloor.addColorStop(.69,'#86716a');railFloor.addColorStop(1,'#d0a28100');
    path(c,[[x-280,571],[x+width+367,571]],null,railFloor,2.7);
    path(c,[[x-280,577],[x+width+367,577]],null,railFloor,1.2);
    for(let i=0;i<17;i++){
      const p=i/16, xx=mix(x-226,x+width+166,p);
      path(c,[[xx,568],[xx+12,581]],null,'#362e2c',2.7*Math.sin(Math.PI*p));
    }
    locomotive(c,x+364,t,travel);
    path(c,[[x+322,541],[x+362,535],[x+371,526]],null,'#30292b',8);
    c.fillStyle='#332933';c.fillRect(x,535,width,9);
    c.fillStyle='#694435';c.fillRect(x+14,539,width-25,12);
    c.fillStyle='#9a7959';c.fillRect(x+10,540,width-20,1.8);
    [38,85,width-86,width-39].forEach((at,i)=>wheel(c,x+at,553,18,travel/19+i*.4));
    for(let j=0;j<4;j++){
      const xa=x+18+j*82;
      path(c,[[xa,535],[xa,495],[xa+61,495],[xa+61,535]],
        color(c,495,535,'#8f7156','#766047','#48413d'),'#3d3532',1.2);
      c.fillStyle='#cc9b6d';
      c.fillRect(xa+1,495,59,1.7);
      for(let row=0;row<4;row++)
        path(c,[[xa+3,504+row*8],[xa+54,504+row*8]],null,'#473831aa',.8);
    }
    path(c,[[x-6,535],[x+width+3,535]],null,'#d3ad7c',2.7);
    for(let i=0;i<14;i++){
      const xx=x+14+i*23;
      path(c,[[xx,530],[xx-3,535]],null,'#4b403950',.7);
    }
    ramp(c,x-leftRamp,x,true,r.entry);
    ramp(c,x+width,x+width+rightRamp,false,r.exit);
    c.restore();
  }
  function inFront(c,r) {
    if(!r)return;
    const { x,opacity,t }=r;
    c.save();
    c.globalAlpha=opacity;
    path(c,[[x+3,530],[x+width-1,530],[x+width-1,541],[x+3,541]],
      color(c,530,542,'#b58a62','#876451','#43363a'),'#4a3b37',.9);
    c.fillStyle='#b9946b';c.fillRect(x+4,529,width-8,2.1);
    for(let j=0;j<5;j++){
      const xx=x+4+j*80.0;
      c.fillStyle='#4b4343';c.fillRect(xx,516,5,25);
      c.fillStyle='#ab8972';c.fillRect(xx+1,518,1.3,16);
      ellipse(c,xx+2.5,520,1.7,1.7,'#dbc08c');
      ellipse(c,xx+2.5,536,1.3,1.3,'#bd976d');
    }
    const cross=(Math.sin(t*11)+1)*.5;
    c.save();c.globalAlpha*=.55;
    ellipse(c,x+12,531,5.6,3.1,cross>.44?'#e88957':'#8b4641');
    c.restore();
    steam(c,x+width+14,564,t+1.25,.56);
    c.restore();
  }
  window.WheelRail={plan,behind,inFront};
})();