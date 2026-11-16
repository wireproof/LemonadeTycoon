/** Layout is based on usable app geometry; no unverified hardware-name detection. */
export function setupDuo(app: HTMLElement): void {
    document.documentElement.classList.add('duo');
    // Scroll the content, not the primary action or the screen navigation.
    const panel = app.querySelector<HTMLElement>('.panel')!;
    const content = document.createElement('div');
    content.className = 'panel-scroll';
    panel.querySelector('#panel-title')!.after(content);
    for (const id of ['preparation', 'selling', 'results']) content.append(panel.querySelector('#' + id)!);
    const controls = document.createElement('div');
    controls.className = 'duo-controls';
    controls.innerHTML = '<label>Display <select id="duo-display" aria-label="Display layout"><option value="auto">Automatic</option><option value="cover">Cover</option><option value="inner">Inner</option></select></label><span id="duo-profile"></span>';
    app.querySelector('footer')!.prepend(controls);
    const more = document.createElement('button');
    more.className = 'duo-more'; more.innerHTML = '<span class="rail-symbol" aria-hidden="true">⚙</span>Settings'; more.setAttribute('aria-expanded', 'false');
    app.querySelector('.toolbar')!.append(more);
    const stand = document.createElement('button'); stand.className = 'stand-toggle'; stand.innerHTML = '<span class="rail-symbol" aria-hidden="true">⌂</span>Stand'; stand.setAttribute('aria-pressed', 'false');
    app.querySelector('.toolbar')!.append(stand);
    stand.onclick = () => { const open = app.dataset.overview !== 'true'; app.dataset.overview = String(open); stand.setAttribute('aria-pressed', String(open)); };
    app.querySelector('.world-frame')!.append(app.querySelector('#forecast-news')!);
    const orderDock = document.createElement('div'); orderDock.className = 'order-dock';
    for (const selector of ['.order-total', '.purchase-actions']) orderDock.append(app.querySelector('#supplies-page ' + selector)!);
    content.after(orderDock);
    const settings = document.createElement('dialog'); settings.id = 'settings-dialog';
    settings.innerHTML = `<header><h2>Settings</h2><button class="settings-close" aria-label="Close settings">Done</button></header><nav class="settings-tabs"><button data-settings="game" aria-pressed="true">Game</button><button data-settings="audio" aria-pressed="false">Sound</button><button data-settings="display" aria-pressed="false">Display</button></nav><section data-settings-panel="game"></section><section data-settings-panel="audio" hidden></section><section data-settings-panel="display" hidden></section>`;
    app.append(settings);
    settings.querySelector('[data-settings-panel="game"]')!.append(app.querySelector('footer')!);
    settings.querySelector('[data-settings-panel="display"]')!.append(controls);
    for (const id of ['music-volume', 'effects-volume', 'mute-audio']) settings.querySelector('[data-settings-panel="audio"]')!.append(app.querySelector('#' + id)!.closest('label')!);
    more.onclick = () => { settings.showModal(); more.setAttribute('aria-expanded','true'); };
    settings.addEventListener('close', () => more.setAttribute('aria-expanded','false'));
    settings.querySelector('.settings-close')!.addEventListener('click', () => settings.close());
    settings.addEventListener('click', event => {
        const target = (event.target as HTMLElement).closest<HTMLElement>('button');
        if (target?.dataset.settings) {
            for (const panel of settings.querySelectorAll<HTMLElement>('[data-settings-panel]')) panel.hidden = panel.dataset.settingsPanel !== target.dataset.settings;
            for (const button of settings.querySelectorAll<HTMLElement>('[data-settings]')) button.setAttribute('aria-pressed',String(button === target));
        }
        if (target?.id === 'main-menu' || target?.id === 'help-open') settings.close();
    });
    // Long reports use explicit pages; direct touch/wheel scrolling is disabled.
    const pager = document.createElement('nav'); pager.className = 'workspace-pages'; pager.setAttribute('aria-label','Content pages');
    pager.innerHTML = '<button aria-label="Previous content page">◀</button><span aria-live="polite"></span><button aria-label="Next content page">▶</button>';
    content.after(pager);
    let pageIndex = 0;
    const paginate = () => {
        const fullHeight = content.clientHeight + (pager.hidden ? 0 : pager.offsetHeight);
        if (content.scrollHeight <= fullHeight + 1) { pager.hidden = true; pageIndex = 0; content.scrollTop = 0; return; }
        pager.hidden = false;
        const step = Math.max(64,content.clientHeight - 32);
        const count = Math.max(1,Math.ceil((content.scrollHeight - content.clientHeight) / step) + 1);
        pageIndex = Math.min(pageIndex,count - 1);
        pager.hidden = count === 1;
        pager.querySelector('span')!.textContent = `${pageIndex + 1} / ${count}`;
        const buttons = pager.querySelectorAll<HTMLButtonElement>('button'); buttons[0].disabled = pageIndex === 0; buttons[1].disabled = pageIndex === count - 1;
        content.scrollTop = pageIndex * step;
    };
    pager.querySelectorAll('button').forEach((button,i) => button.addEventListener('click', () => { pageIndex += i ? 1 : -1; paginate(); }));
    new ResizeObserver(paginate).observe(content);
    new MutationObserver(() => requestAnimationFrame(paginate)).observe(content,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    const help = app.querySelector('#help-dialog')!;
    const helpPages = Array.from(help.querySelectorAll<HTMLElement>(':scope > p'));
    const helpNav = document.createElement('nav'); helpNav.className = 'help-pages'; helpNav.innerHTML = '<button aria-label="Previous help page">◀</button><span></span><button aria-label="Next help page">▶</button>'; help.append(helpNav);
    let helpIndex = 0;
    const showHelp = () => { helpPages.forEach((p,i) => p.hidden = i !== helpIndex); helpNav.querySelector('span')!.textContent = `${helpIndex + 1} / ${helpPages.length}`; const b = helpNav.querySelectorAll<HTMLButtonElement>('button'); b[0].disabled = helpIndex === 0; b[1].disabled = helpIndex === helpPages.length - 1; };
    helpNav.querySelectorAll('button').forEach((b,i) => b.addEventListener('click', () => { helpIndex += i ? 1 : -1; showHelp(); })); showHelp();
    app.querySelector('.toolbar')!.addEventListener('click', event => {
        if (!(event.target as HTMLElement).closest('[data-page]')) return;
        pageIndex = 0;
        app.dataset.overview = 'false'; stand.setAttribute('aria-pressed', 'false');
        content.scrollTop = 0;
        app.querySelector('.layout')!.scrollTop = 0;
    });
    const select = controls.querySelector('select')!;
    const saved = localStorage.getItem('wireproof.display');
    select.value = saved === 'cover' || saved === 'inner' ? saved : 'auto';
    const update = () => {
        const width = document.documentElement.clientWidth;
        // Width reflects the native safe-area constrained WKWebView, including hosted layouts.
        const profile = select.value === 'auto' ? (width >= 680 ? 'inner' : 'cover') : select.value;
        document.documentElement.dataset.display = profile;
        document.documentElement.dataset.orientation = window.innerHeight > width ? 'portrait' : 'landscape';
        const toolbar = app.querySelector<HTMLElement>('.toolbar')!;
        app.append(toolbar);
        controls.querySelector('#duo-profile')!.textContent = `${profile === 'inner' ? 'Inner display' : 'Cover display'}`;
    };
    const fitScene = () => {
        const world = app.querySelector<HTMLElement>('.world-column')!;
        const available = app.querySelector<HTMLElement>('.layout')!.clientHeight;
        app.style.setProperty('--work-height', `${available}px`);
        const portrait = document.documentElement.dataset.display === 'inner' && document.documentElement.dataset.orientation === 'portrait';
        const width = portrait ? Math.min(world.clientWidth * .58 - 24, Math.max(120, world.clientHeight - 24) * 1.25) : document.documentElement.dataset.display === 'inner'
            ? Math.min(world.clientWidth - 24, Math.max(120, available - 150) * 1.25)
            : Math.min(world.clientWidth - 24, 310);
        app.style.setProperty('--street-width', `${Math.max(120, width)}px`);
    };
    new ResizeObserver(fitScene).observe(app.querySelector('.layout')!);
    new ResizeObserver(fitScene).observe(app.querySelector('.world-column')!);
    let timer: ReturnType<typeof setTimeout>;
    window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(update, 160); });
    select.addEventListener('change', () => { localStorage.setItem('wireproof.display', select.value); update(); });
    const nativeHandler = (window as unknown as {webkit?: {messageHandlers?: {nativeState?: {postMessage(value: unknown): void}}}}).webkit?.messageHandlers?.nativeState;
    if (nativeHandler) {
        document.documentElement.dataset.nativeNavigation = 'true';
        let priorState = '', timer: ReturnType<typeof setTimeout> | undefined;
        const publish = () => {
            timer = undefined;
            const lobby = document.querySelector<HTMLElement>('#start-menu');
            const menu = Boolean(lobby && !lobby.hidden);
            const creating = document.querySelector<HTMLElement>('#menu-create');
            const state = {menu, cash:app.querySelector('#cash')!.textContent, canBack:!menu || Boolean(document.querySelector('dialog[open]')) || Boolean(creating && !creating.hidden)};
            const json = JSON.stringify(state); if (json !== priorState) { priorState = json; nativeHandler.postMessage(state); }
        };
        new MutationObserver(() => { if (!timer) timer = setTimeout(publish,200); }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open','data-overview']});
        const openDialog = (dialog: HTMLDialogElement) => {
            const wasHidden = app.hidden, wasInert = app.inert;
            app.hidden = false; app.inert = false;
            if (!dialog.open) dialog.showModal();
            dialog.addEventListener('close',() => { const lobby=document.querySelector<HTMLElement>('#start-menu'); if(lobby && !lobby.hidden){app.hidden=wasHidden;app.inert=wasInert;} },{once:true});
        };
        document.addEventListener('lemonade:navigate', event => {
            const action=(event as CustomEvent<string>).detail;
            const lobby=document.querySelector<HTMLElement>('#start-menu');const menu=Boolean(lobby && !lobby.hidden);
            const click=(selector:string)=>document.querySelector<HTMLButtonElement>(selector)?.click();
            if(action==='back'){
                const dialog=document.querySelector<HTMLDialogElement>('dialog[open]');
                if(dialog)dialog.close();
                else if(menu)click('#menu-cancel');
                else if(app.dataset.overview==='true')stand.click();
                else if(app.dataset.view!=='recipe')click('[data-page="recipe"]');
                else click('#main-menu');
            }else{
                for(const dialog of document.querySelectorAll<HTMLDialogElement>('dialog[open]'))dialog.close();
                if(action==='settings')openDialog(settings);
                if(action==='help')openDialog(app.querySelector<HTMLDialogElement>('#help-dialog')!);
                if(action==='home' && !menu)click('#main-menu');
                if(action==='play'){if(menu)click('#menu-continue');else stand.click();}
            }
            setTimeout(publish,0);
        });
        publish();
    }
    update();
    fitScene();
}
