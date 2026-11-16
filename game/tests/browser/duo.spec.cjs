const {test,expect}=require('@playwright/test');
for(const profile of [{name:'cover',width:390,height:844},{name:'inner',width:820,height:980}]) {
 test(`${profile.name}: menu, trading, resize and restore`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize(profile);await page.goto('/');
 await expect(page.locator('#menu-continue')).toBeEnabled();
 await page.screenshot({path:`test-results/duo-${profile.name}-menu.png`,fullPage:true});
 await page.locator('#menu-continue').click();
 await expect(page.locator('canvas')).toBeAttached();
 await expect(page.locator('html')).toHaveAttribute('data-display',profile.name);
 await expect(page.locator('button[data-location]')).toHaveCount(5);
 for(const id of ['recipe','supplies','marketing','rent','upgrades','staff','results']) {
  await page.locator(`[data-page="${id}"]`).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
 }
 await page.locator('[data-page="supplies"]').click();
 for(const item of ['lemon','sugar','ice','cup']){await page.locator(`[data-supply="${item}"]`).click();await page.locator('[data-bundle="0"][data-delta="1"]').click();}
 await page.locator('#buy-order').click();
 await expect(page.locator('#cash')).not.toHaveText('$40.00');
 await page.locator('[data-page="recipe"]').click();
 for(const b of await page.locator('.spinner button:visible').all()){const rect=await b.boundingBox();expect(rect.width).toBeGreaterThanOrEqual(44);expect(rect.height).toBeGreaterThanOrEqual(44);}
 await page.screenshot({path:`test-results/duo-${profile.name}-game.png`,fullPage:true});
 await page.locator('#open').click(); await expect(page.locator('#app')).toHaveAttribute('data-phase','selling');
 await page.locator('#skip').click();await expect(page.locator('#results')).toBeVisible();
 const cash=await page.locator('#cash').innerText(); const day=await page.locator('#day').innerText();
 await page.setViewportSize({width:profile.name==='cover'?820:390,height:900});
 await expect(page.locator('html')).toHaveAttribute('data-display',profile.name==='cover'?'inner':'cover');
 await expect(page.locator('#cash')).toHaveText(cash);await expect(page.locator('#day')).toHaveText(day);
 await page.reload();await page.locator('#menu-continue').click();
 await expect(page.locator('#cash')).toHaveText(cash);await expect(page.locator('#day')).toHaveText(day);
 expect(errors).toEqual([]);
 });
}
test('new challenge with touch menu',async({page})=>{
 await page.setViewportSize({width:375,height:812});await page.goto('/');
 await page.locator('#menu-challenge').click();await page.locator('#menu-name').fill('Duo Challenge');
 await page.locator('#menu-create button[type="submit"]').click();await expect(page.locator('#start-menu')).toBeHidden();
 await expect(page.locator('canvas')).toBeAttached();
});
test('compact Duo menu keeps primary actions visible and saves accessible',async({page})=>{
 await page.setViewportSize({width:382,height:644});await page.goto('/');
 await expect(page.locator('#menu-continue')).toBeEnabled();
 for(const id of ['menu-continue','menu-new','menu-challenge']) {
  const box=await page.locator('#'+id).boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);expect(box.y+box.height).toBeLessThanOrEqual(644);
 }
 await page.locator('.lobby-saves summary').click();await expect(page.locator('[data-company]')).toHaveCount(8);
 await expect(page.locator('[data-company]').last()).toBeVisible();
 expect(await page.locator('#start-menu').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBeTruthy();
});
for (const viewport of [{width:382,height:644},{width:1194,height:790}]) {
 test(`artwork and controls survive resize ${viewport.width}`,async({page})=>{
  await page.setViewportSize(viewport);await page.goto('/');await page.locator('#menu-continue').click();
  const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-assets-ready','true');
  expect(Number(await canvas.getAttribute('data-map-source-width'))).toBeGreaterThan(100);
  for(const size of [viewport,{width:820,height:980},viewport]){
   await page.setViewportSize(size);await page.waitForTimeout(250);
   if(await page.locator('.stand-toggle').getAttribute('aria-pressed')!=='true')await page.locator('.stand-toggle').click();
   const box=await canvas.boundingBox();expect(box.width/box.height).toBeCloseTo(1.25,1);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  }
  await page.screenshot({path:`test-results/fixed-game-${viewport.width}.png`,fullPage:true});
 });
}
test('failed artwork shows recovery message instead of silently broken scenery',async({page})=>{
 await page.route('**/*neighborhood*.png',r=>r.abort());await page.goto('/');await page.locator('#menu-continue').click();
 await expect(page.locator('.scene-load-error')).toBeVisible();await expect(page.getByRole('button',{name:'Reload artwork'})).toBeVisible();
});
for(const size of [{width:1280,height:832},{width:1194,height:790},{width:820,height:980}]) {
 test(`primary actions and full scene stay inside viewport ${size.width}`,async({page})=>{
  await page.setViewportSize(size);await page.goto('/');await page.locator('#menu-continue').click();
  for(const tab of ['recipe','supplies','marketing','rent','upgrades','staff','results']) {
   await page.locator(`[data-page="${tab}"]`).click();
   for(const selector of ['#open','.duo-more']) {
    const box=await page.locator(selector).boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(size.height+1);
   }
  }
  await page.locator('[data-page="recipe"]').click();
  for(const b of await page.locator('.spinner button:visible').all())expect(await b.evaluate(e=>getComputedStyle(e).clipPath)).toBe('none');
  await page.screenshot({path:`test-results/refined-${size.width}.png`});
 });
}

test('cover primary action remains reachable without scrolling the shell',async({page})=>{
 for(const viewport of [{width:382,height:644},{width:390,height:844}]) {
  await page.setViewportSize(viewport);await page.goto('/');await page.locator('#menu-continue').click();await page.locator('[data-page="recipe"]').click();
  const action=await page.locator('#open').boundingBox();const nav=await page.locator('#app > .toolbar').boundingBox();
  expect(action.y).toBeGreaterThan(0);expect(action.y+action.height).toBeLessThanOrEqual(viewport.height);expect(action.x+action.width).toBeLessThanOrEqual(nav.x);
  await page.screenshot({path:`test-results/refined-cover-${viewport.height}.png`});
 }
});
for(const viewport of [{width:875,height:600},{width:640,height:800},{width:834,height:1158},{width:390,height:844},{width:382,height:644},{width:1194,height:790}]) {
 test(`workspace keeps purchase controls reachable ${viewport.width}x${viewport.height}`,async({page})=>{
  await page.setViewportSize(viewport);await page.goto('/');await page.locator('#menu-continue').click();
  for(const tab of ['recipe','supplies','upgrades','staff','marketing','rent','results']) {
   await page.locator(`[data-page="${tab}"]`).click();
   const controls=tab==='supplies'?['#buy-order','#cancel-order','#open']:['#open'];
   for(const selector of controls){const r=await page.locator(selector).boundingBox();expect(r.y).toBeGreaterThanOrEqual(0);expect(r.y+r.height).toBeLessThanOrEqual(viewport.height);}
   expect(await page.locator('.layout').evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBeTruthy();
   if(['recipe','supplies','upgrades'].includes(tab) && viewport.width>=600 && viewport.height>=600) {
    const fits=await page.locator('.panel-scroll').evaluate(e=>e.scrollHeight<=e.clientHeight+1);expect(fits).toBeTruthy();
   }
   if(['recipe','supplies','upgrades'].includes(tab))await page.screenshot({path:`test-results/workspace-${viewport.width}-${tab}.png`});
  }
  await page.locator('.stand-toggle').click();await expect(page.locator('canvas')).toBeVisible();
  await page.locator('[data-page="recipe"]').click();
  expect(await page.locator('.panel-scroll').evaluate(e=>e.scrollTop)).toBe(0);
 });
}
test('customer walk poses have distinct planted and passing frames',async({page})=>{
 const fs=require('node:fs'),ts=require('typescript');
 const source=fs.readFileSync('src/game/presentation/classic-customer-art.ts','utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 await page.goto('/');await page.evaluate(()=>{document.body.innerHTML='<canvas id="poses" width="768" height="384"></canvas>';document.body.style.background='#ddd9bb';});
 await page.addScriptTag({content:'var exports={};'+js+';window.paintCustomer=exports.paintClassicCustomer;'});
 const hashes=await page.evaluate(()=>{
  const c=document.querySelector('#poses'),ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;const hashes=[];
  for(const [row,kind] of ['neighbor','office','student'].entries())for(let frame=0;frame<4;frame++){
   const tile=document.createElement('canvas');tile.width=64;tile.height=96;window.paintCustomer(tile.getContext('2d'),kind,false,'walk',frame);hashes.push(tile.toDataURL());ctx.drawImage(tile,frame*192,row*128,85,128);
  }return hashes;
 });
 expect(new Set(hashes.slice(0,4)).size).toBe(4);
 await page.locator('#poses').screenshot({path:'test-results/customer-walk-poses.png'});
});

test('right rail, independent settings and bounded upgrade artwork',async({page})=>{
 for(const viewport of [{width:875,height:600},{width:640,height:800},{width:382,height:644},{width:1194,height:790}]) {
  await page.setViewportSize(viewport);await page.goto('/');await page.locator('#menu-continue').click();
  const nav=await page.locator('#app > .toolbar').boundingBox();const work=await page.locator('.layout').boundingBox();expect(nav.x).toBeGreaterThanOrEqual(work.x+work.width);
  for(const button of await page.locator('#app > .toolbar button').all()){const b=await button.boundingBox();expect(b.y).toBeGreaterThanOrEqual(0);expect(b.y+b.height).toBeLessThanOrEqual(viewport.height);expect(b.height).toBeGreaterThanOrEqual(44);}
  await page.locator('[data-page="upgrades"]').click();
  for(const card of await page.locator('#upgrades-catalog .management-card').all()){
   const picture=await card.locator('.catalog-picture').boundingBox();const art=await card.locator('.catalog-picture > *').boundingBox();const title=await card.locator('h3').boundingBox();expect(art.y+art.height).toBeLessThanOrEqual(picture.y+picture.height+1);expect(picture.y+picture.height<=title.y+1 || picture.x+picture.width<=title.x+1).toBeTruthy();
  }
  await page.locator('.duo-more').click();await expect(page.locator('#settings-dialog')).toBeVisible();await page.screenshot({path:`test-results/settings-game-${viewport.width}.png`});expect(await page.locator('.layout').boundingBox()).toEqual(work);
  for(const tab of ['game','audio','display']){await page.locator(`[data-settings="${tab}"]`).click();expect(await page.locator('#settings-dialog').evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBeTruthy();}
  await page.screenshot({path:`test-results/settings-${viewport.width}.png`});await page.locator('.settings-close').click();
  await page.screenshot({path:`test-results/rail-${viewport.width}.png`});
 }
});
test('compact reports use page controls and settings preserves the workspace',async({page})=>{
 await page.setViewportSize({width:382,height:644});await page.goto('/');await page.locator('#menu-continue').click();await page.locator('[data-page="supplies"]').click();
 for(const item of ['lemon','sugar','ice','cup']){await page.locator(`[data-supply="${item}"]`).click();await page.locator('[data-bundle="0"][data-delta="1"]').click();}
 await page.locator('#buy-order').click();await page.locator('#open').click();await page.locator('#skip').click();await expect(page.locator('#results')).toBeVisible();
 const pager=page.locator('.workspace-pages');await expect(pager).toBeVisible();
 expect(await page.locator('.panel-scroll').evaluate(e=>getComputedStyle(e).overflowY)).toBe('hidden');
 await page.getByRole('button',{name:'Next content page',exact:true}).click();expect(await page.locator('.panel-scroll').evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Previous content page',exact:true}).click();expect(await page.locator('.panel-scroll').evaluate(e=>e.scrollTop)).toBe(0);
 await page.locator('.duo-more').click();await page.locator('[data-settings="audio"]').click();await page.locator('#mute-audio').check();await page.locator('.settings-close').click();await expect(page.locator('#results')).toBeVisible();
});
