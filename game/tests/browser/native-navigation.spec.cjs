const {test,expect}=require('@playwright/test');
const action=(page,name)=>page.evaluate(name=>document.dispatchEvent(new CustomEvent('lemonade:navigate',{detail:name})),name);
for(const viewport of [{width:382,height:600},{width:640,height:800},{width:875,height:600},{width:834,height:1050}])test(`native navigation bridge ${viewport.width}`,async({page})=>{
 await page.addInitScript(()=>{window.webkit={messageHandlers:{nativeState:{postMessage:s=>window.nativeState=s}}};});await page.setViewportSize(viewport);await page.goto('/');await expect(page.locator('#menu-continue')).toBeEnabled();
 await expect(page.locator('html')).toHaveAttribute('data-native-navigation','true');
 await action(page,'settings');await expect(page.locator('#settings-dialog')).toBeVisible();await action(page,'back');await expect(page.locator('#settings-dialog')).toBeHidden();await expect(page.locator('#start-menu')).toBeVisible();
 await action(page,'play');await expect(page.locator('#start-menu')).toBeHidden();
 await expect(page.locator('#app > .toolbar button[data-page]:visible')).toHaveCount(4);
 for(const tab of ['recipe','supplies','marketing','staff','upgrades']){
  await action(page,'page:'+tab);await expect(page.locator('#app')).toHaveAttribute('data-view',tab);
  await page.waitForTimeout(300);
  const bounds=await page.locator('.panel-scroll').evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight}));expect(bounds.scroll,tab+' content must fit').toBeLessThanOrEqual(bounds.height+1);
  await expect(page.locator('.workspace-pages')).toBeHidden();
  await page.screenshot({path:`test-results/native-${tab}-${viewport.width}.png`});
 }
 await action(page,'back');await expect(page.locator('#app')).toHaveAttribute('data-view','recipe');
 await page.screenshot({path:`test-results/native-bottom-${viewport.width}.png`});
 await action(page,'home');await expect(page.locator('#start-menu')).toBeVisible();await action(page,'help');await expect(page.locator('#help-dialog')).toBeVisible();await action(page,'back');await expect(page.locator('#help-dialog')).toBeHidden();
 await action(page,'play');await expect(page.locator('#start-menu')).toBeHidden();await expect(page.locator('#cash')).toHaveText('$40.00');
 await action(page,'play');await expect(page.locator('.stand-dashboard')).toBeVisible();await expect(page.locator('[data-live-source="sold"]')).toHaveText('0');
 const dashboard=await page.locator('.stand-dashboard').boundingBox();const world=await page.locator('.world-frame').boundingBox();expect(dashboard.y+dashboard.height).toBeLessThanOrEqual(world.y+world.height);const scene=await page.locator('.scene-window').boundingBox();expect(scene.y).toBeGreaterThanOrEqual(world.y);expect(scene.y+scene.height).toBeLessThanOrEqual(world.y+world.height);expect(scene.x+scene.width<=dashboard.x+1||scene.y+scene.height<=dashboard.y+1).toBeTruthy();
 await page.screenshot({path:`test-results/native-stand-${viewport.width}.png`});
 await action(page,'home');const footer=await page.locator('#start-menu .lobby-footer').boundingBox();expect(footer.y+footer.height).toBeLessThanOrEqual(viewport.height+1);
 await page.screenshot({path:`test-results/native-welcome-${viewport.width}.png`});
});
