const {test,expect}=require('@playwright/test');
const action=(page,name)=>page.evaluate(name=>document.dispatchEvent(new CustomEvent('lemonade:navigate',{detail:name})),name);
for(const viewport of [{width:382,height:600},{width:640,height:800},{width:875,height:600},{width:834,height:1050}])test(`native navigation bridge ${viewport.width}`,async({page})=>{
 await page.addInitScript(()=>{window.webkit={messageHandlers:{nativeState:{postMessage:s=>window.nativeState=s}}};});await page.setViewportSize(viewport);await page.goto('/');await expect(page.locator('#menu-continue')).toBeEnabled();
 await expect(page.locator('html')).toHaveAttribute('data-native-navigation','true');
 await action(page,'settings');await expect(page.locator('#settings-dialog')).toBeVisible();await action(page,'back');await expect(page.locator('#settings-dialog')).toBeHidden();await expect(page.locator('#start-menu')).toBeVisible();
 await action(page,'play');await expect(page.locator('#start-menu')).toBeHidden();
 const nav=await page.locator('#app > .toolbar').boundingBox();const work=await page.locator('.layout').boundingBox();expect(nav.y).toBeGreaterThanOrEqual(work.y+work.height);expect(nav.y+nav.height).toBeLessThanOrEqual(viewport.height+1);
 await expect(page.locator('.duo-more')).toBeHidden();await expect(page.locator('.stand-toggle')).toBeHidden();
 for(const tab of ['recipe','supplies','upgrades']){await page.locator(`[data-page="${tab}"]`).click();const box=await page.locator('#open').boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(nav.y);}
 await action(page,'back');await expect(page.locator('#app')).toHaveAttribute('data-view','recipe');
 await page.screenshot({path:`test-results/native-bottom-${viewport.width}.png`});
 await action(page,'home');await expect(page.locator('#start-menu')).toBeVisible();await action(page,'help');await expect(page.locator('#help-dialog')).toBeVisible();await action(page,'back');await expect(page.locator('#help-dialog')).toBeHidden();
 await action(page,'play');await expect(page.locator('#start-menu')).toBeHidden();await expect(page.locator('#cash')).toHaveText('$40.00');
});
