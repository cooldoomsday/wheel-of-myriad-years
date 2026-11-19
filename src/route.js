(() => {
  'use strict';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,t)=>a+(b-a)*t;
  const ease=x=>{const y=clamp(x); return y*y*(3-2*y);};
  const between=(a,b,t)=>ease((t-a)/(b-a));
  const segment=(a,b,c,d,t)=>between(a,b,t)*(1-between(c,d,t));
  const length=150;
  const contactTimes=[7.9,19.3,30.4,41.8,97.5,116.5];
  const speedKeys=[
    [0,98],[2,168],[5,226],[8.5,210],[12.6,290],[16.3,232],[21.1,172],[25.3,260],
    [29,165],[32,190],[37,201],[41,214],[45.5,254],[49.4,170],[54,200],[57.5,249],
    [62.7,279],[67,274],[72,284],[75.7,186],[79,220],[83,247],[87.6,227],[92,263],
    [96.5,258],[103,278],[108.5,242],[113,189],[117.6,259],[122,255],[127,297],
    [131.4,235],[136.6,160],[139.5,55],[141.25,0],[144.55,0],[146,164],[150,180]
  ];
  const earth=(world,t)=>{
    const rough=segment(1.4,5.7,10.7,14.1,t)*.95
      +segment(14.5,17.7,24,27.3,t)*.8
      +segment(35.7,38.8,44.3,47.9,t)*.70
      +segment(119.2,123.9,132.5,137.8,t)*.88;
    return rough*(68*Math.sin(world/412+.3)+34*Math.sin(world/659+1.04)
      +5*Math.sin(world/168-.7));
  };
  const pathSlope=(wx,t)=> (earth(wx+15,t)-earth(wx-15,t))/30;
  function baseSpeed(t) {
    for(let i=1;i<speedKeys.length;i++){
      const [a,low]=speedKeys[i-1], [b,high]=speedKeys[i];
      if(t<=b)return mix(low,high,between(a,b,t));
    }
    return speedKeys.at(-1)[1];
  }
  const step=1/72;
  let odometer=180, crank=.29;
  const drive=[];
  for(let i=0;i<=Math.ceil(length/step);i++){
    const t=i*step;
    const grade=pathSlope(odometer+475,t);
    const attention=Math.max(...contactTimes.map(hit=>1-ease(Math.abs(t-hit)/1.28)));
    const speed=baseSpeed(t)*(1+grade*1.36)*(1-.50*attention);
    const tuck=clamp((grade-.027)*6.75);
    const rail=segment(65.2,67.65,70.2,73.3,t);
    const pedalRate=Math.min(9.6,speed*(1-.92*rail)/28)*(1-.84*tuck)*(1-.68*attention);
    drive.push({travel:odometer,speed,crank,tuck});
    odometer+=speed*step;
    crank+=pedalRate*step;
  }
  function sample(time) {
    const index=Math.max(0,Math.min((drive.length-1)*.999999,time/step));
    const a=drive[Math.floor(index)],b=drive[Math.floor(index)+1], f=index%1;
    return {travel:mix(a.travel,b.travel,f),speed:mix(a.speed,b.speed,f),
      crank:mix(a.crank,b.crank,f),tuck:mix(a.tuck,b.tuck,f)};
  }
  function terrain(t,travel,x){return earth(travel+x,t);}
  function anchor(t,travel,x,scale) {
    const span=151*scale;
    const front=terrain(t,travel,x+77*scale);
    const rear=terrain(t,travel,x-74*scale);
    return {y:576+(rear+front)*.5,slope:Math.atan2(front-rear,span)};
  }
  function warped(c,source,t,travel){
    const rough=t>1.4&&t<14.1||t>14.5&&t<27.3||t>35.7&&t<47.9||t>119.2&&t<137.8;
    if(!rough){ c.drawImage(source,0,0);return; }
    const W=1280,H=720, pivot=456, lower=576;
    c.drawImage(source,0,0,W,pivot,0,0,W,pivot);
    for(let x=0;x<W;x+=5){
      const offset=terrain(t,travel,x+2.5);
      c.drawImage(source,x,pivot,5,lower-pivot,x,pivot,5,lower-pivot+offset);
      c.drawImage(source,x,lower,5,H-lower,x,lower+offset,5,H-lower-offset);
    }
  }
  window.WheelRoute={length,sample,terrain,anchor,warped};
})();