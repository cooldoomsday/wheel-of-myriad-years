(() => {
  'use strict';
  const TAU=Math.PI*2;
  const clamp=x=>Math.min(1,Math.max(0,x));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(lo,hi,t)=>{
    const a=clamp((t-lo)/(hi-lo));
    return a*a*(3-2*a);
  };

  function ellipse(c,x,y,w,h,color,turn=0) {
    c.beginPath(); c.ellipse(x,y,w,h,turn,0,TAU);
    c.fillStyle=color; c.fill();
  }
  function seed(c,t,riderX,scale,ground=576) {
    if(t<28.5||t>=31.2)return;
    const p=smooth(28.5,31.2,t);
    const x=mix(939,riderX+94*scale,p)+Math.sin(p*Math.PI)*Math.sin(t*4.8)*23;
    const y=mix(475,ground-112*scale,p)-Math.sin(p*Math.PI)*123+Math.sin(t*5)*4*(1-p);
    const angle=mix(-1.3,TAU*1.6,p);
    c.save();
    const a=smooth(28.5,28.95,t);
    c.globalAlpha=a;
    for(let i=12;i>=0;i--){
      const offset=i*3;
      const fade=(1-i/13)**2*(1-p*.7);
      const glow=c.createRadialGradient(x+offset,y+Math.sin(i*.31)*6,0,x+offset,y+Math.sin(i*.31)*6,3.2);
      glow.addColorStop(0,'rgba(255,229,159,'+fade*.64+')');
      glow.addColorStop(1,'#f7d89b00');
      c.fillStyle=glow;
      c.fillRect(x+offset-4,y-10,8,18);
    }
    ellipse(c,x,y,6.4,3.2,'#674e31',angle);
    ellipse(c,x,y-1,5.7,2.5,'#f7d687',angle);
    ellipse(c,x-1,y-2,3.9,.92,'#fff2b6',angle);
    c.restore();
  }

  function paper(c,t) {
    const alpha=smooth(64.3,66.4,t)*(1-smooth(78,80.5,t));
    if(alpha<=0)return;
    c.save();
    c.globalAlpha=alpha;
    for(let i=0;i<21;i++){
      const delay=i*.61;
      const age=(t-63.1-delay+60)%6.7;
      if(age>6.3)continue;
      const depth=.28+(i*13%19)/23;
      const x=1160-age*(114+depth*75)+60*Math.sin(i*11);
      const y=453-age*(20+depth*23)+31*Math.sin(t*1.6+i);
      const roll=age*(1.6+depth)+i;
      c.save();
      c.translate(x,y); c.rotate(.48*Math.sin(roll*.6)+.08);
      c.scale((.25+.75*Math.abs(Math.sin(roll)))*depth,depth);
      c.globalAlpha=alpha*Math.min(1,age*.99,(6.35-age)*1.28)*.88;
      c.beginPath(); c.moveTo(-13,-17); c.quadraticCurveTo(-1,-19,13,-15);
      c.quadraticCurveTo(11,0,15,14); c.quadraticCurveTo(0,17,-12,13); c.closePath();
      c.fillStyle=i%3?'#e9ce9f':'#cfb28b';c.fill();
      c.strokeStyle='#9c7e6477';c.lineWidth=.8;c.stroke();
      for(let r=0;r<5;r++){
        c.fillStyle='#7961537d';c.fillRect(-8,-9+r*4,15-r%3*2,.75);
      }
      c.restore();
    }
    c.restore();
  }

  function data(c,t) {
    const alpha=smooth(102.9,105.3,t)*(1-smooth(111.1,113.8,t));
    if(alpha<=0)return;
    c.save();
    c.lineCap='round';
    for(let j=0;j<4;j++){
      const y=298+j*13;
      const begin=104.3+j*.11;
      for(let i=0;i<9;i++){
        const f=clamp((t-begin-i*.19)/5.6);
        if(f<=0||f>=1)continue;
        const x=mix(-10,1290,f);
        const curve=x=>y-95*Math.sin(x/1290*Math.PI)+Math.sin(x/190+j*.56)*8;
        const n=smooth(0,.09,f)*(1-smooth(.83,1,f));
        c.beginPath();c.moveTo(x-99,curve(x-99));
        for(let d=-88;d<=0;d+=11)c.lineTo(x+d,curve(x+d));
        const g=c.createLinearGradient(x-99,0,x,0);
        g.addColorStop(0,'#8cdfe500');
        g.addColorStop(1,'rgba(139,229,229,'+.67*n*alpha+')');
        c.strokeStyle=g;c.lineWidth=.9+j*.19;c.stroke();
        ellipse(c,x,curve(x),2.1,1.4,'rgba(208,253,242,'+n*alpha*.82+')');
      }
    }
    c.restore();
  }

  function choice(c,t) {
    const a=smooth(131.5,134.2,t)*(1-smooth(141.8,144.0,t));
    if(a<=0)return;
    const shift=(t-133)*33;
    const x=686-shift;
    c.save();
    c.globalAlpha=a;
    c.beginPath();
    c.moveTo(x-540,621);
    c.bezierCurveTo(x-87,623,x+64,570,x+241,540);
    c.bezierCurveTo(x+374,519,x+505,529,x+638,518);
    c.bezierCurveTo(x+514,534,x+456,542,x+309,557);
    c.bezierCurveTo(x+111,573,x-9,628,x-540,631);
    c.closePath();
    const g=c.createLinearGradient(0,518,0,631);
    g.addColorStop(0,'#d7bb8b26');
    g.addColorStop(.45,'#b7a98277');
    g.addColorStop(1,'#a1906f7a');
    c.fillStyle=g;c.fill();
    c.beginPath();
    c.moveTo(x-405,622);
    c.bezierCurveTo(x-42,618,x+73,566,x+246,541);
    c.bezierCurveTo(x+374,521,x+512,528,x+614,520);
    c.strokeStyle='#e3c79180';
    c.lineWidth=1.7;
    c.stroke();
    c.restore();
  }

  window.WheelStory={seed,paper,data,choice};
})();