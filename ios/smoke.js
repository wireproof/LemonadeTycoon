(async()=>{
 const wait=async(fn)=>{for(let i=0;i<200;i++){if(fn())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout');};
 const $=s=>document.querySelector(s), click=s=>{if(!$(s))throw Error('Missing '+s);$(s).click();};
 try{
 await wait(()=>$('#menu-continue')&&!$('#menu-continue').disabled);
 const native=action=>window.webkit.messageHandlers.nativeTest.postMessage({action});
 native('settings');await wait(()=>$('#settings-dialog').open);native('back');await wait(()=>!$('#settings-dialog').open);
 native('play');await wait(()=>$('#start-menu').hidden);await wait(()=>$('canvas'));
 const canvas=$('canvas');await wait(()=>canvas.dataset.mapSourceWidth);
 if(canvas.dataset.assetsReady==='false')throw Error('Missing artwork: '+canvas.dataset.missingAssets);
 if(Number(canvas.dataset.mapSourceWidth)<100)throw Error('Missing map texture: source width '+canvas.dataset.mapSourceWidth);
 const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
 if(!pixels.some((v,i)=>i%4!==3&&v>0))throw Error('Blank canvas');
 click('[data-page="supplies"]');
 for(const item of ['lemon','sugar','ice','cup']){click(`[data-supply="${item}"]`);click('[data-bundle="0"][data-delta="1"]');}
 click('#buy-order');click('[data-page="recipe"]');click('#open');
 await wait(()=>!$('#selling').hidden);click('#skip');await wait(()=>!$('#results').hidden);
 await new Promise(r=>setTimeout(r,250));
 const action=$('#open').getBoundingClientRect();
 if(action.bottom>innerHeight+1||action.top<0)throw Error('Primary action clipped: '+JSON.stringify({top:action.top,bottom:action.bottom,height:innerHeight}));
 const savedCash=$('#cash').textContent;native('home');await wait(()=>!$('#start-menu').hidden);native('play');await wait(()=>$('#start-menu').hidden);if($('#cash').textContent!==savedCash)throw Error('Cash changed across native navigation');
 const result={nativeSettingsBackAndResume:true,nativeNavigation:document.documentElement.dataset.nativeNavigation,actionBottom:action.bottom,viewportHeight:innerHeight,passed:true,cash:$('#cash').textContent,day:$('#day').textContent,profile:document.documentElement.dataset.display,canvas:[canvas.width,canvas.height],assetsReady:canvas.dataset.assetsReady,mapWidth:canvas.dataset.mapSourceWidth,savedKeys:Object.keys(localStorage)};
 sessionStorage.setItem('native-smoke',JSON.stringify(result));
 window.webkit.messageHandlers.smoke.postMessage(result);
 }catch(e){window.webkit.messageHandlers.smoke.postMessage({passed:false,error:String(e),text:document.body.innerText.slice(0,1500)});}
})();
