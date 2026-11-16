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
    more.className = 'duo-more'; more.textContent = 'Settings'; more.setAttribute('aria-expanded', 'false');
    app.querySelector('.masthead')!.append(more);
    const stand = document.createElement('button'); stand.className = 'stand-toggle'; stand.textContent = 'Stand'; stand.setAttribute('aria-pressed', 'false');
    app.querySelector('.masthead')!.append(stand);
    stand.onclick = () => { const open = app.dataset.overview !== 'true'; app.dataset.overview = String(open); stand.setAttribute('aria-pressed', String(open)); };
    app.querySelector('.world-frame')!.append(app.querySelector('#forecast-news')!);
    const orderDock = document.createElement('div'); orderDock.className = 'order-dock';
    for (const selector of ['.order-total', '.purchase-actions']) orderDock.append(app.querySelector('#supplies-page ' + selector)!);
    content.after(orderDock);
    more.onclick = () => { const open = app.querySelector('footer')!.classList.toggle('expanded'); more.setAttribute('aria-expanded', String(open)); };
    app.querySelector('.toolbar')!.addEventListener('click', () => {
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
        if (profile === 'cover') app.insertBefore(toolbar, app.querySelector('footer'));
        else app.querySelector('.control-row')!.prepend(toolbar);
        controls.querySelector('#duo-profile')!.textContent = `${profile === 'inner' ? 'Inner · side by side' : 'Cover · stacked'}`;
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
    update();
    fitScene();
}
