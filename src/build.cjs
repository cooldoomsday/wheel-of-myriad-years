'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.join(__dirname, '..');

async function main() {
  const output = process.argv[2] ?? path.join(root, '车轮上的万年_里程碑版.html');
  const forExport = process.argv.includes('--render');
  const sources = ['early','late','river','costume','hero','story','bridge','route','rail','early-action','film'].map(name => path.join(__dirname,name+'.js'));
  if (!forExport) sources.push(path.join(__dirname,'player.js'));
  const code = await Promise.all(sources.map(file=>fs.readFile(file,'utf8')));
  const music = forExport ? '' : (await fs.readFile(path.join(root,'music','发现版_配乐与音效.mp3'))).toString('base64');
  const scripts = code.map(script => '<script>\n'+script.replace(/<\/script/gi,'<\\/script')+'\n</script>').join('\n');
  const html = '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n'
    +'<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>车轮上的万年 · 里程碑版</title>\n'
    +'<link rel="icon" href="data:,">\n<style>\n'
    +'*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0d1217;color:#fff}'
    +'body{display:grid;place-items:center;font-family:system-ui,sans-serif}'
    +'#stage{position:relative;display:block;border:0;padding:0;width:min(100vw,177.778vh);width:min(100vw,177.778dvh);'
    +'aspect-ratio:16/9;cursor:pointer;outline:0;background:#202834;touch-action:manipulation;overflow:hidden}'
    +'#stage:fullscreen{width:100%;height:100%;display:grid;place-items:center;background:#0d1217}'
    +'canvas{display:block;width:100%;height:auto;max-height:100%;aspect-ratio:16/9;object-fit:contain}'
    +'#stage:focus-visible{outline:2px solid #f8d7ac;outline-offset:-3px}'
    +'.play{position:absolute;top:50%;left:50%;width:clamp(42px,5.9vw,76px);aspect-ratio:1;'
    +'transform:translate(-50%,-50%);display:grid;place-items:center;border:1px solid #fff1db99;border-radius:50%;'
    +'background:#18253275;color:#fff2db;pointer-events:none;transition:opacity .3s;box-shadow:0 6px 26px #15213532}'
    +'.play:after{content:"";margin-left:11%;border-left:.93rem solid currentColor;border-top:.57rem solid transparent;border-bottom:.57rem solid transparent}'
    +'[data-playing="true"] .play{opacity:0}\n</style>\n</head>\n<body>\n'
    +'<button id="stage" type="button" aria-label="播放《车轮上的万年》"><canvas id="film" width="1280" height="720" aria-label="车轮上的万年"></canvas>'
    +(forExport?'':'<span class="play" aria-hidden="true"></span>')+'</button>\n'
    +(forExport?'':'<audio id="music" preload="auto" src="data:audio/mpeg;base64,'+music+'"></audio>\n')
    +scripts+'\n</body>\n</html>\n';
  await fs.writeFile(output,html);
}
main().catch(error=>{console.error(error.message); process.exitCode=1;});