(() => {
  'use strict';
  const W=1280,H=720,G=576,TAU=2*Math.PI;
  const duration=131.232;
  const serif='"Songti SC","Noto Serif CJK SC","STSong","SimSun",serif';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,t)=>a+(b-a)*t;
  const wrap=(a,n)=>((a%n)+n)%n;
  function ease(a,b,t){const p=clamp((t-a)/(b-a));return p*p*(3-2*p);}
  function windowAt(a,b,c,d,t){return ease(a,b,t)*(1-ease(c,d,t));}
  function bell(t,at,span){
    const p=(t-at)/span;
    return Math.abs(p)<1?(1+Math.cos(Math.PI*p))*.5:0;
  }
  const chapters=[
    {key:'stone',name:'石头敲出了火星',note:"约 40 万年前，古人已经能自己点火",caption:[8.06,12.04],t:0,pan:416,depth:1.025,span:2.2,tone:[203,169,128]},
    {key:'farm',name:'水轮转了起来',note:"约公元前 6000 年，两河流域已有灌溉渠",caption:[19.67,24.13],t:13,pan:461,depth:1.055,span:2.7,tone:[230,206,128]},
    {key:'bronze',name:'青铜钟响了',note:"公元前 433 年前后，曾侯乙编钟已能一钟奏两音",caption:[30.45,34.9],t:26,pan:490,depth:1.075,span:2.45,tone:[221,169,114]},
    {key:'print',name:'纸上印出了一行字',note:"868 年，雕版印出一卷《金刚经》",caption:[42.17,46.69],t:36,pan:469,depth:1.04,span:2.32,tone:[226,180,146]},
    {key:'bridge',name:'',t:48,pan:368,depth:1.027,span:2.3,tone:[215,169,125]},
    {key:'steam',name:'蒸汽推着飞轮转',note:"1712 年，首台实用活塞式蒸汽机投入使用",caption:[52.34,57.52],t:55,pan:431,depth:1.06,span:2.43,tone:[204,164,121]},
    {key:'electric',name:'街灯一盏盏亮起',note:"1882 年，纽约珍珠街电站开始供电",caption:[77.42,84.25],t:73,pan:447,depth:1.038,span:2.37,tone:[171,199,219]},
    {key:'digital',name:'电脑把消息传到了远方',note:"1971 年，第一封网络电子邮件发出",caption:[98.63,104.84],t:92,pan:494,depth:1.06,span:2.64,tone:[135,216,229]},
    {key:'ai',name:'AI 给出了几条路',note:"2022 年，ChatGPT 发布，大语言模型走进日常对话",caption:[116.61,123.17],t:106,pan:448,depth:1.035,span:2.66,tone:[165,218,200]},
    {key:'river',name:'',t:129,pan:507,depth:1.034,span:3.68,tone:[235,173,135]},
  ];
  const timeMap=[
    [0,0],[6.95,7.5],[10.58,13],[20.52,26],[30.21,36],
    [48.47,48],[57.26,55],[61.99,61],[66.15,68],[70.51,73],
    [80.21,92],[88.67,106],[94.38,115],[105.01,129],
    [115.64,141],[121.2,145],[duration,150],
  ];
  function localTime(now){
    let i=1;
    while(i<timeMap.length-1&&now>timeMap[i][0])i++;
    const [a,s]=timeMap[i-1],[b,f]=timeMap[i];
    return mix(s,f,clamp((now-a)/(b-a)));
  }
  function state(t) {
    let current=0;
    for(let i=1;i<chapters.length;i++)if(chapters[i].t<=t)current=i;
    for(let i=1;i<chapters.length;i++){
      const {t:center,span}=chapters[i];
      const lo=center-span/2,hi=center+span/2;
      if(t>=lo&&t<hi)return {a:i-1,b:i,p:ease(lo,hi,t),current};
    }
    return {a:current,b:current,p:0,current};
  }

  function layer(w=W,h=H){
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;
    return cv.getContext('2d');
  }
  const blendCtx=layer(), mask=layer(), terrainCtx=layer(), film=layer();
  const grain=layer(201,197);
  let seed=9171;
  function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  const particles=Array.from({length:108},()=>[rnd(),rnd(),rnd(),rnd()]);
  {
    const pixels=grain.createImageData(201,197);
    for(let k=0;k<pixels.data.length;k+=4){
      const value=rnd()<.48?32:234;
      pixels.data[k]=pixels.data[k+1]=pixels.data[k+2]=value;
      pixels.data[k+3]=2+22*rnd();
    }
    grain.putImageData(pixels,0,0);
  }
  const grainBrush=film.createPattern(grain.canvas,'repeat');
  const edge=film.createRadialGradient(657,374,245,645,386,782);
  edge.addColorStop(0,'#19213100');edge.addColorStop(.77,'#19213112');edge.addColorStop(1,'#14202b64');

  function drawScene(c,index,t,real,travel,beat,fg,actor){
    const section=chapters[index];
    const start=section.t, end=chapters[index+1]?.t??150;
    const p=clamp((t-start)/(end-start));
    const e={t,travel,progress:p,beat,width:W,height:H,phase:real*136/60,...actor};
    const key=section.key;
    c.save();
    if(index<4){
      const handler=fg?window.WheelEarly.foreground:window.WheelEarly.draw;
      handler(c,key,e);
    } else if(key==='bridge'){
      if(!fg)window.WheelBridge.draw(c,{...e,p:ease(47.95,54.90,t)});
    } else if(key==='river'){
      if(fg)window.WheelRiver.foreground(c,e);
      else window.WheelRiver.draw(c,e);
    } else {
      const handler=fg?window.WheelLate.foreground:window.WheelLate.draw;
      handler?.(c,key,e);
    }
    c.restore();
  }
  function transition(c,p,t){
    const x=mix(W+268,-268,p);
    mask.clearRect(0,0,W,H);
    for(let y=0;y<H;y+=5) {
      const center=x+22*Math.sin(y*.016-.9*p)+38*Math.sin(y*.006+t*.27)+13*Math.sin(y*.029+t);
      const band=114+22*Math.sin(y*.018);
      const g=mask.createLinearGradient(center-band,y,center+band,y);
      g.addColorStop(0,'#0000');g.addColorStop(.27,'#0001');
      g.addColorStop(.66,'#000d');g.addColorStop(1,'#000');
      mask.fillStyle=g;mask.fillRect(0,y,W,5);
    }
    c.globalCompositeOperation='destination-in';
    c.drawImage(mask.canvas,0,0);
    c.globalCompositeOperation='source-over';
  }
  function composite(c,ss,t,real,travel,beat,fg,actor){
    drawScene(c,ss.a,t,real,travel,beat,fg,actor);
    if(ss.a===ss.b)return;
    blendCtx.clearRect(0,0,W,H);
    drawScene(blendCtx,ss.b,t,real,travel,beat,fg,actor);
    transition(blendCtx,ss.p,t);
    c.drawImage(blendCtx.canvas,0,0);
  }

  function atmosphere(c,t,real,travel,state){
    const a=chapters[state.a].tone, b=chapters[state.b].tone;
    const color=a.map((x,i)=>Math.round(mix(x,b[i],state.p))).join(',');
    c.save();
    for(const [r,y,h,k] of particles) {
      const x=wrap(r*1460-travel*(.16+.32*h) + t*(9+16*k),1460)-90;
      const yy=wrap(y*663-t*(1.5+4.2*k),665)+11*Math.sin(t*.44+r*13);
      const flicker=.29+.71*Math.sin(real*(1+h)+k*13)**2;
      c.fillStyle='rgba('+color+','+(.055+h*.16)*flicker+')';
      c.beginPath();
      c.ellipse(x,yy,.35+h*1.26,.28+h*.58,k-.5,0,TAU);
      c.fill();
    }
    c.restore();
  }
  function wheelTrace(c,t,anchor,drive,stage,rail) {
    if(drive.speed<45||rail?.aboard>.24||stage>5)return;
    for(let i=0;i<21;i++){
      const [r,b,k,d]=particles[i];
      const age=wrap(t*(1.27+.76*r)+b,1);
      const vx=anchor.x-70-age*(29+d*51)*(drive.speed/121);
      const vy=anchor.y-2-age*(7+18*k)-anchor.slope*(anchor.x-vx);
      const radius=2.4+age*9;
      const glow=c.createRadialGradient(vx,vy,.25,vx,vy,radius);
      glow.addColorStop(0,'rgba(227,185,151,'+(1-age)*.171+')');
      glow.addColorStop(1,'#e8b17600');
      c.fillStyle=glow;
      c.fillRect(vx-radius,vy-radius,radius*2,radius*2);
    }
  }
  function nearBank(c,t,travel,stage) {
    if(stage===4||stage===5||stage===6||stage===8)return;
    const natural=stage<4||stage===9;
    const track=(travel-130)*1.29;
    const base=Math.floor(track/164)-2;
    for(let j=base;j<=base+11;j++){
      const a=particles[wrap(j,particles.length)];
      const x=j*164-track+48*a[0];
      const y=669+50*a[1]+window.WheelRoute.terrain(t,travel,x)*.41;
      const age=a[2];
      if(natural){
        c.fillStyle=stage===9?'#292f39b8':stage===1?'#615d38dc':'#343d3eab';
        c.beginPath();c.moveTo(x-56,y+16);c.bezierCurveTo(x-49,y+3,x-36,y-8,x-20,y-7);
        c.lineTo(x+1,y-3);c.bezierCurveTo(x+16,y-3,x+30,y+10,x+35,y+21);
        c.lineTo(x+24,y+70);c.lineTo(x-63,y+69);c.closePath();c.fill();
        c.lineCap='round';
        for(let k=0;k<12;k++){
          const z=particles[wrap(j*17+k,particles.length)];
          const xx=x-49+91*z[0], yy=y+7+29*z[1], h=9+52*z[2], sway=(z[3]+.34)*17;
          c.strokeStyle=k%3===0?'#8d7e59ba':'#47504aa8'; c.lineWidth=1+z[2]*1.6;
          c.beginPath();c.moveTo(xx,yy);c.quadraticCurveTo(xx+sway*.2,yy-h*.62,xx+sway,yy-h);c.stroke();
        }
      } else {
        c.fillStyle=stage===7?'#253842bc':'#3c3434be';
        c.fillRect(x-17,y,40+age*42,11);
        c.fillStyle=stage===7?'#829bab78':'#b6986a57';
        c.fillRect(x-17,y-1,40+age*42,2.2);
      }
    }
  }

  function plant(c,t,x,y,travel,scale){
    const toss=140.2;
    const dest=752-(travel-window.WheelRoute.sample(toss).travel);
    if(t>=toss){
      window.WheelRiver.sprout(c,dest,598,t-toss);
      if(t<toss+.85){
        c.save();c.globalAlpha=1-ease(toss+.35,toss+.85,t);
        c.fillStyle='#ffd698';c.beginPath();c.ellipse(dest,598,4,2,.06,0,TAU);c.fill();c.restore();
      }
    } else if(t>toss-.78){
      const p=ease(toss-.78,toss,t);
      c.save();
      c.translate(mix(x+94*scale,dest,p),mix(y-113*scale,598,p*p));
      c.rotate(p*5);
      c.beginPath();c.ellipse(0,0,4.8,2.15,-.2,0,TAU);
      c.fillStyle='#ffda94';c.fill();
      c.restore();
    }
  }
  function typography(c,t,real){
    const cue=chapters.find(({caption})=>caption && t>=caption[0] && t<caption[1]);
    const inTitle=1-ease(3.8,5.45,real);
    const labelOpacity=cue?windowAt(cue.caption[0],cue.caption[0]+.40,cue.caption[1]-.72,cue.caption[1],t):0;
    c.save();
    c.textAlign='left';c.textBaseline='alphabetic';c.fillStyle='#fff2d9';
    c.shadowColor='#101823c9';c.shadowBlur=15;c.shadowOffsetY=3;
    if(inTitle>0){
      c.globalAlpha=inTitle;
      c.font='600 73px '+serif;c.letterSpacing='4px';
      c.fillText('车轮上的万年',85,197);
      c.font='500 20px '+serif;c.letterSpacing='5px';
      c.fillText('一只鹈鹕的骑行记',90,242);
    } else if(cue && labelOpacity>0){
      c.globalAlpha=labelOpacity;
      c.font='600 39px '+serif;c.letterSpacing='2.5px';
      c.fillText(cue.name,88,147);
      c.save();
      c.globalAlpha*=ease(cue.caption[0]+.12,cue.caption[0]+.48,t);
      c.strokeStyle='#f1dec0';
      c.lineWidth=1.65;
      c.lineCap='round';
      c.beginPath();
      c.moveTo(89,180);
      c.lineTo(109,180);
      c.stroke();
      c.fillStyle='#fff0d7';
      c.font='500 25px '+serif;
      c.letterSpacing='.65px';
      c.fillText(cue.note,122,187);
      c.restore();
    }
    const ending=windowAt(146.4,147.35,149.1,149.7,t);
    if(ending>0){
      c.globalAlpha=ending;c.textAlign='center';
      c.font='600 40px '+serif;c.letterSpacing='4px';
      c.fillText('风一吹，我就出发',640,178);
    }
    c.restore();
  }

  function render(c,w,h,time){
    const real=Math.min(duration,Math.max(0,Number(time)||0));
    const t=localTime(real), ss=state(t), drive=window.WheelRoute.sample(t), travel=drive.travel;
    const beat=Math.pow(.5+.5*Math.cos((real-.066)*TAU*136/60),2.3);
    const a=chapters[ss.a], b=chapters[ss.b];
    const delay=Math.sin(t*.22)*26+Math.sin(travel*.0015)*25;
    const typical=mix(a.pan,b.pan,ss.p)+delay;
    let x=mix(270,typical,ease(.6,4.6,t));
    x+=ease(134.8,139.6,t)*138+ease(144.6,150,t)*845;
    const zoomBeat=.096*bell(t,8.9,5.1)+.083*bell(t,21,4.6)+.08*bell(t,30,3.05)
      +.089*bell(t,51.9,4.1)+.11*bell(t,67.1,5)+.125*bell(t,111.8,6.5)
      +.141*bell(t,141,6.2);
    const branch=windowAt(118.85,122.1,126.5,129.1,t);
    x+=83*branch;
    const scale=(1.08+.072*Math.sin(t*.077-.1))*(1-.044*branch);
    const rail=window.WheelRail.plan(t,x,scale,travel);
    if(rail)x=rail.actorX;
    const wheels=window.WheelRoute.anchor(t,travel,x,scale);
    const y=rail?.follow>0?rail.y:wheels.y-19*branch*(1+(wheels.y-G)/120);
    const slope=rail?.follow>0?rail.slope:wheels.slope;
    const hero={x,y,scale,slope};
    const groundAt=screenX=>G+window.WheelRoute.terrain(t,travel,screenX);
    const actor={hero,groundAt};
    const stage=chapters[ss.current].key;
    const cue={t,travel,beat,width:W,height:H,progress:clamp((t-chapters[ss.current].t)/((chapters[ss.current+1]?.t??150)-chapters[ss.current].t)),...actor};
    const sceneAction=ss.current<4?window.WheelEarlyAction.plan(stage,cue):null;
    const target=sceneAction?.target??window.WheelLate.actionPlan?.(stage,cue);
    const touch=target?.weight??0;
    const costume={from:a.key,to:b.key,mix:ease(.23,.77,ss.p)};
    const actionZoom=[7.9,19.3,30.4,41.8,97.5,116.5].reduce((sum,hit)=>sum+.045*bell(t,hit+.45,2.3),0);
    const crop=mix(a.depth,b.depth,ss.p)+zoomBeat+actionZoom+.011*Math.sin(t*.17);

    film.clearRect(0,0,W,H);
    terrainCtx.clearRect(0,0,W,H);
    terrainCtx.fillStyle='#26313e';terrainCtx.fillRect(0,0,W,H);
    composite(terrainCtx,ss,t,real,travel,beat,false,actor);
    window.WheelRoute.warped(film,terrainCtx.canvas,t,travel);
    atmosphere(film,t,real,travel,ss);
    window.WheelStory.paper(film,t+22.1);
    if(sceneAction)window.WheelEarlyAction.draw(film,sceneAction);
    window.WheelRail.behind(film,rail);
    wheelTrace(film,t,{x,y,slope},drive,ss.current,rail);
    const fast=clamp((drive.speed-40)/276);
    const coast=Math.max(drive.tuck,rail?.aboard??0,.68*touch);
    const press=clamp(fast*(1-.86*coast)+Math.max(0,-slope)*2.5);
    const look=.068*touch+windowAt(48.2,49.35,53.55,54.4,t)*(-.12)
      +windowAt(63.3,64.6,67.7,69,t)*(-.10)+windowAt(119,121,126,128.8,t)*.16;
    const lamp=ease(76.9,79.3,t)*(1-.63*ease(130,133,t));
    const dip=windowAt(138.9,139.8,140.3,141.4,t)*.86;
    const stand=rail?.stand??0;
    const rollingAngle=(travel+x-270)/37;
    const parkedAngle=(window.WheelRoute.sample(67.55).travel+551-270)/37;
    window.WheelHero.draw(film,{t:real,x,y,scale,travel,
      slope,look,dip,coast,stand,wind:fast,push:press,costume,target,
      pedalAngle:drive.crank,wheelAngle:mix(rollingAngle,parkedAngle,stand),
      seed:ease(20.40,20.46,t)*(1-windowAt(115.58,115.68,118.0,118.10,t))*(1-ease(139.4,139.45,t)),
      light:lamp,cool:windowAt(88,96,129,132,t),assist:ease(111,115,t)});
    if(sceneAction)window.WheelEarlyAction.foreground?.(film,sceneAction);
    if(ss.current===9)plant(film,t,x,y,travel,scale);
    window.WheelRail.inFront(film,rail);
    terrainCtx.clearRect(0,0,W,H);
    composite(terrainCtx,ss,t,real,travel,beat,true,actor);
    window.WheelRoute.warped(film,terrainCtx.canvas,t,travel);
    nearBank(film,t,travel,ss.current);

    film.fillStyle=edge;film.fillRect(0,0,W,H);
    film.save();
    film.globalAlpha=.23;
    film.fillStyle=grainBrush;
    const grainX=Math.floor(real*24)%19;
    film.translate(grainX,.3*grainX);
    film.fillRect(-21,-10,W+25,H+12);
    film.restore();

    const cx=620+64*Math.sin(t*.065)-264*zoomBeat+180*actionZoom, cy=362+220*zoomBeat+(y-G)*.37;
    c.save();
    c.scale(w/W,h/H);
    c.fillStyle='#202930';c.fillRect(0,0,W,H);
    c.drawImage(film.canvas,(1-crop)*cx,(1-crop)*cy,W*crop,H*crop);
    typography(c,t,real);
    const fade=ease(duration-2.4,duration-.048,real);
    if(fade>0){
      c.fillStyle='rgba(13,18,23,'+fade*.99+')';c.fillRect(0,0,W,H);
    }
    c.restore();
  }
  window.WheelFilm={render,duration,chapters,localTime};
})();