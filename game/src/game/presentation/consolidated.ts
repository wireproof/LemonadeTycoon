import './consolidated.css';
/** Five destinations share the existing simulation controls and save format. */
export function setupConsolidated(app: HTMLElement): void {
 if(!document.documentElement.dataset.nativeNavigation)return;
 const q=<T extends HTMLElement=HTMLElement>(s:string)=>app.querySelector<T>(s)!;
 const click=(s:string)=>document.querySelector<HTMLButtonElement>(s)?.click();
 app.dataset.workspace='stand'; app.dataset.overview='true';
 const heading=document.createElement('h2');heading.className='workspace-title';q('.panel').prepend(heading);
 const groups:Record<string,string[]>={recipe:['recipe','marketing'],business:['rent','staff'],shop:['supplies','upgrades']};
 for(const [group,pages] of Object.entries(groups))for(const page of pages){const node=q('#'+page+'-page');node.dataset.group=group;const title=document.createElement('h3');title.className='section-heading';title.textContent={rent:'Location & rent',staff:'Your team',supplies:'Restock',upgrades:'Equipment',recipe:'Mix your recipe',marketing:'Price & promotion'}[page]||page;node.prepend(title);}
 q('#supplies-page').append(q('.order-dock'));
 const world=q('.world-column'), frame=q('.world-frame');
 const summary=document.createElement('section');summary.className='stand-summary';
 for(const selector of ['.location-heading','.location-description','.location-ratings','#forecast-news','.stand-dashboard'])summary.append(q(selector));frame.append(summary);
 const header=document.createElement('nav');header.className='stand-tabs';header.setAttribute('aria-label','Stand information');header.innerHTML='<button data-stand="live" aria-pressed="true">Live stand</button><button data-stand="results" aria-pressed="false">Results & reports</button>';world.prepend(header);
 const reports=document.createElement('section');reports.className='stand-reports';reports.append(q('#results'));world.append(reports);
 const footer=document.createElement('footer');footer.className='stand-actions';footer.innerHTML='<span class="stand-action-status"></span>';const start=q<HTMLButtonElement>('.stand-start');footer.append(start);world.append(footer);
 const next=document.createElement('button');next.className='stand-next primary';next.textContent='Prepare next day';next.onclick=()=>{if(app.dataset.phase==='preparation')showReport(false);else click('#next');};footer.append(next);
 const showReport=(report:boolean)=>{app.dataset.standReport=String(report);header.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.stand==='results')===report)));if(report && app.dataset.phase==='preparation')click('[data-page="results"]');};
 header.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-stand]');if(b)showReport(b.dataset.stand==='results');});
 let opening=false;
 const route=async(group:string)=>{
  if(!(group==='stand'||group in groups))return;
  const menu=document.querySelector<HTMLElement>('#start-menu');
  if(menu&&!menu.hidden){const enter=document.querySelector<HTMLButtonElement>('#menu-continue');if(!enter||enter.disabled)return;opening=true;enter.click();for(let n=0;n<100&&!menu.hidden;n++)await new Promise(r=>setTimeout(r,50));opening=false;if(!menu.hidden)return;}
  if(app.dataset.phase==='selling'||app.dataset.phase==='results')group='stand';
  app.dataset.workspace=group;app.dataset.overview=String(group==='stand');
  if(group!=='stand')click(`[data-page="${groups[group][0]}"]`);
  app.dataset.overview=String(group==='stand');heading.textContent={recipe:'Recipe & Marketing',business:'Business',shop:'Supplies & Upgrades',stand:'Stand'}[group]||'';
  if(group==='stand')showReport(app.dataset.phase==='results');
  q('.panel-scroll').scrollTop=0;
 };
 let closingDialog=false,fromMenu=false;
 document.addEventListener('lemonade:navigate',()=>{closingDialog=Boolean(document.querySelector('dialog[open]'));fromMenu=!document.querySelector<HTMLElement>('#start-menu')?.hidden;},{capture:true});
 document.addEventListener('lemonade:navigate',e=>{const action=(e as CustomEvent<string>).detail;if(action.startsWith('workspace:'))void route(action.slice(10));if(action==='play')void route('stand');if(action==='back'&&!closingDialog&&!fromMenu){if(app.dataset.workspace==='stand')click('#main-menu');else void route('stand');}});
 document.addEventListener('click',e=>{if(!opening&&(e.target as HTMLElement).closest('#menu-continue'))setTimeout(()=>void route('stand'),0);});
 let phase='';
 const sync=()=>{
  const current=app.dataset.phase||'preparation';
  if(current!==phase){const finished=phase==='selling'&&current==='preparation';phase=current;if(current!=='preparation'||finished){app.dataset.workspace='stand';app.dataset.overview='true';showReport(current==='results'||finished);}else showReport(false);}
  const reviewing=app.dataset.standReport==='true';
  const hideStart=current!=='preparation'||reviewing,hideNext=current!=='results'&&!(current==='preparation'&&reviewing);
  if(start.hidden!==hideStart)start.hidden=hideStart;if(next.hidden!==hideNext)next.hidden=hideNext;
  const label=current==='preparation'?'Live stand':q('#next-day-label').textContent||'Prepare next day';if(next.textContent!==label)next.textContent=label;
  const status=current==='preparation'?(q('#supply-warning').hidden?'Ready for business':q('#supply-warning').textContent):q('#world-status').textContent;const statusLabel=footer.querySelector('.stand-action-status')!;if(statusLabel.textContent!==status)statusLabel.textContent=status;
 };
 new MutationObserver(sync).observe(app,{subtree:true,attributes:true,attributeFilter:['data-phase','data-stand-report','hidden'],childList:true,characterData:true});
 const fit=()=>{
  const portrait=frame.clientWidth<650;const visibleHeight=frame.clientHeight-20;
  const height=portrait?visibleHeight-summary.offsetHeight-10:visibleHeight;
  const width=portrait?frame.clientWidth-20:(frame.clientWidth-32)*.57;
  frame.style.setProperty('--scene-fit',Math.max(40,Math.min(width,height*1.25))+'px');
 };
 new ResizeObserver(fit).observe(frame);new ResizeObserver(fit).observe(summary);sync();fit();
}
