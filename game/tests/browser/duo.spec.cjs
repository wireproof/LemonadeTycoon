const {test,expect}=require('@playwright/test');
for(const profile of [{name:'cover',width:390,height:844},{name:'inner',width:820,height:980}]) {
 test(`${profile.name}: menu, trading, resize and restore`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize(profile);await page.goto('/');
 await expect(page.locator('#menu-continue')).toBeEnabled();
 await page.screenshot({path:`test-results/duo-${profile.name}-menu.png`,fullPage:true});
 await page.locator('#menu-continue').click();
 await expect(page.locator('canvas')).toBeVisible();
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
 await page.locator('#open').click(); await expect(page.locator('#selling')).toBeVisible();
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
 await expect(page.locator('canvas')).toBeVisible();
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
