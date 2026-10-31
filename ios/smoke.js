(async()=>{
 const wait=async(fn)=>{for(let i=0;i<200;i++){if(fn())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout');};
 const $=s=>document.querySelector(s), click=s=>{if(!$(s))throw Error('Missing '+s);$(s).click();};
 try{
 await wait(()=>$('#menu-continue')&&!$('#menu-continue').disabled);
 click('#menu-continue');await wait(()=>$('canvas'));
 const canvas=$('canvas');const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
 if(!pixels.some((v,i)=>i%4!==3&&v>0))throw Error('Blank canvas');
 click('[data-page="supplies"]');
 for(const item of ['lemon','sugar','ice','cup']){click(`[data-supply="${item}"]`);click('[data-bundle="0"][data-delta="1"]');}
 click('#buy-order');click('[data-page="recipe"]');click('#open');
 await wait(()=>!$('#selling').hidden);click('#skip');await wait(()=>!$('#results').hidden);
 const result={passed:true,cash:$('#cash').textContent,day:$('#day').textContent,profile:document.documentElement.dataset.display,canvas:[canvas.width,canvas.height],savedKeys:Object.keys(localStorage)};
 sessionStorage.setItem('native-smoke',JSON.stringify(result));
 window.webkit.messageHandlers.smoke.postMessage(result);
 }catch(e){window.webkit.messageHandlers.smoke.postMessage({passed:false,error:String(e),text:document.body.innerText.slice(0,1500)});}
})();
