(() => {
  'use strict';
  const movie=window.WheelFilm;
  const stage=document.querySelector('#stage');
  const canvas=document.querySelector('#film');
  const context=canvas.getContext('2d',{alpha:false});
  const audio=document.querySelector('#music');
  let pending=0;
  let paintedAt=-1;
  let unavailable=false;
  let localTime=0;
  let localStart=0;
  let localPlaying=false;
  let clickDelay=0;

  const clock=()=>unavailable ? localTime+(localPlaying?(performance.now()-localStart)/1000:0) : audio.currentTime;
  const playing=()=>unavailable ? localPlaying : !audio.paused && !audio.ended;
  function draw(time=clock(),force=false){
    if(!force && Math.abs(time-paintedAt)<1/180) return;
    movie.render(context,canvas.width,canvas.height,time);
    paintedAt=time;
  }
  function sync(){
    const on=playing();
    stage.dataset.playing=String(on);
    stage.setAttribute('aria-label',on?'暂停《车轮上的万年》':'播放《车轮上的万年》');
  }
  function tick(){
    pending=0;
    const t=clock();
    draw(t);
    if(unavailable && t>=movie.duration){
      localTime=movie.duration;
      localPlaying=false;
      sync();
    }
    if(playing()) pending=requestAnimationFrame(tick);
  }
  function update(){
    if(!pending) pending=requestAnimationFrame(tick);
    sync();
  }
  function resize(){
    const bounds=stage.getBoundingClientRect();
    const width=Math.max(320,Math.min(1920,Math.round(bounds.width*(devicePixelRatio||1))));
    if(canvas.width!==width){
      canvas.width=width;
      canvas.height=Math.round(width*9/16);
      draw(paintedAt>=0?paintedAt:.82,true);
    }
  }
  function jump(time){
    const at=Math.max(0,Math.min(movie.duration,time));
    if(unavailable){
      localTime=at;
      localStart=performance.now();
    } else {
      audio.currentTime=at;
    }
    draw(at,true);
  }
  async function toggle(){
    if (unavailable) {
      if(localPlaying) localTime=clock();
      else if(localTime>=movie.duration) localTime=0;
      localStart=performance.now();
      localPlaying=!localPlaying;
      update();
      return;
    }
    if(playing()){
      audio.pause();
      return;
    }
    if(audio.ended || audio.currentTime>=movie.duration-.035) jump(0);
    try {
      await audio.play();
    } catch (error) {
      if(error.name!=='NotSupportedError')return;
      unavailable=true;
      await toggle();
    }
  }
  async function fullscreen(){
    if(document.fullscreenElement) await document.exitFullscreen?.();
    else await stage.requestFullscreen?.();
  }
  stage.addEventListener('click',()=>{
    clearTimeout(clickDelay);
    clickDelay=setTimeout(()=>void toggle(),205);
  });
  stage.addEventListener('dblclick',()=>{
    clearTimeout(clickDelay);
    void fullscreen().catch(()=>{});
  });
  window.addEventListener('keydown',ev=>{
    const key=ev.key.toLowerCase();
    if(key===' '||key==='enter'){
      ev.preventDefault();
      if(!ev.repeat)void toggle();
    } else if(key==='arrowleft'||key==='arrowright'){
      ev.preventDefault();
      jump(clock()+(key==='arrowleft'?-5:5));
    } else if(key==='r'){
      jump(0);
    } else if(key==='m'){
      audio.muted=!audio.muted;
    } else if(key==='f'){
      void fullscreen().catch(()=>{});
    }
  });
  for(const type of ['playing','pause','ended','seeked'])audio.addEventListener(type,update);
  new ResizeObserver(resize).observe(stage);
  draw(.82,true);
  sync();
})();