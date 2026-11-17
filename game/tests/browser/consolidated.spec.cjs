const {test,expect}=require('@playwright/test');
const action=(page,name)=>page.evaluate(name=>document.dispatchEvent(new CustomEvent('lemonade:navigate',{detail:name})),name);
for(const viewport of [{width:382,height:620},{width:640,height:800},{width:875,height:600},{width:834,height:1047}])test(`five destinations ${viewport.width}`,async({page})=>{
 await page.addInitScript(()=>{window.webkit={messageHandlers:{nativeState:{postMessage:s=>window.nativeState=s}}};});await page.setViewportSize(viewport);await page.goto('/');await expect(page.locator('#menu-continue')).toBeEnabled();
 await page.screenshot({path:`test-results/menu-${viewport.width}.png`});
 for(const button of await page.locator('.lobby-footer button:visible').all()){const rect=await button.boundingBox();expect(rect.y+rect.height).toBeLessThanOrEqual(viewport.height);}
 await page.locator('#menu-saves').click();await expect(page.locator('#menu-library')).toBeVisible();await page.locator('.library-close').click();
 for(const [group,parts] of [['recipe',['recipe','marketing']],['business',['rent','staff']],['shop',['supplies','upgrades']]]){
  await action(page,'workspace:'+group);await expect(page.locator('#app')).toHaveAttribute('data-workspace',group);
  await expect(page.locator('#app > .toolbar')).toBeHidden();await expect(page.locator('.world-column')).toBeHidden();
  for(const part of parts)await expect(page.locator('#'+part+'-page')).toBeVisible();
  await page.waitForTimeout(200);await page.screenshot({path:`test-results/${group}-${viewport.width}.png`});
  const overflow=await page.locator('.panel-scroll').evaluate(e=>({actual:e.scrollHeight,available:e.clientHeight}));expect(overflow.actual,group+' overflow').toBeLessThanOrEqual(overflow.available+1);
 }
 await action(page,'workspace:stand');await expect(page.locator('.world-column')).toBeVisible();
 const start=await page.locator('.stand-start').boundingBox();expect(start.y+start.height).toBeLessThan(viewport.height-5);const frame=await page.locator('.world-frame').boundingBox();expect(frame.y+frame.height).toBeLessThanOrEqual(start.y);
 await page.screenshot({path:`test-results/stand-${viewport.width}.png`});
 await page.locator('[data-stand="results"]').click();await expect(page.locator('.stand-reports')).toBeVisible();await page.screenshot({path:`test-results/reports-${viewport.width}.png`});
 await page.locator('[data-stand="live"]').click();await expect(page.locator('.world-frame')).toBeVisible();
});

test('combined pages trade, report, navigate and retain a company',async({page})=>{
 await page.addInitScript(()=>{window.webkit={messageHandlers:{nativeState:{postMessage:s=>window.nativeState=s}}};});
 await page.setViewportSize({width:382,height:620});await page.goto('/');await expect(page.locator('#menu-continue')).toBeEnabled();
 await page.locator('#menu-options').click();await expect(page.locator('#settings-dialog')).toBeVisible();await action(page,'back');await expect(page.locator('#settings-dialog')).toBeHidden();
 await page.locator('#menu-help').click();await expect(page.locator('#help-dialog')).toBeVisible();await action(page,'back');
 await action(page,'workspace:shop');await expect(page.locator('#app')).toHaveAttribute('data-workspace','shop');
 for(const item of ['lemon','sugar','ice','cup']){await page.locator(`[data-supply="${item}"]`).click();await page.locator('[data-bundle="0"][data-delta="1"]').click();}
 await page.locator('#buy-order').click();await expect(page.locator('#cash')).not.toHaveText('$40.00');
 await action(page,'workspace:recipe');await page.locator('#price').fill('1.50');await page.locator('#price').blur();
 await action(page,'workspace:business');await page.locator('[data-staff="none"]').click();
 await action(page,'back');await expect(page.locator('#app')).toHaveAttribute('data-workspace','stand');
 await page.locator('.stand-start').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','selling');await page.locator('#skip').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','preparation');
 await expect(page.locator('.stand-reports')).toBeVisible();await expect(page.locator('.stand-next')).toBeVisible();
 for(const report of ['daily','ledger','graph','balance']){
  await page.locator(`[data-report="${report}"]`).click();await page.screenshot({path:`test-results/completed-${report}.png`});
  const bounds=await page.locator('#results').evaluate(e=>({bottom:e.getBoundingClientRect().bottom,footer:document.querySelector('.stand-actions').getBoundingClientRect().top}));expect(bounds.bottom,report+' overlaps next day').toBeLessThanOrEqual(bounds.footer);
 }
 const cash=await page.locator('#cash').textContent();await page.locator('.stand-next').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','preparation');
 await action(page,'home');await expect(page.locator('#start-menu')).toBeVisible();await page.locator('#menu-continue').click();await expect(page.locator('#start-menu')).toBeHidden();await expect(page.locator('#cash')).toHaveText(cash);
 await page.reload();await expect(page.locator('#menu-continue')).toBeEnabled();await page.locator('#menu-continue').click();await expect(page.locator('#cash')).toHaveText(cash);
});
