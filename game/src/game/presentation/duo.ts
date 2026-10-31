/** Layout is based on usable app geometry; no unverified hardware-name detection. */
export function setupDuo(app: HTMLElement): void {
    document.documentElement.classList.add('duo');
    const controls = document.createElement('div');
    controls.className = 'duo-controls';
    controls.innerHTML = '<label>Display <select id="duo-display" aria-label="Display layout"><option value="auto">Automatic</option><option value="cover">Cover</option><option value="inner">Inner</option></select></label><span id="duo-profile"></span>';
    app.querySelector('footer')!.prepend(controls);
    const more = document.createElement('button');
    more.className = 'duo-more'; more.textContent = 'Menu / Settings'; more.setAttribute('aria-expanded', 'false');
    app.querySelector('footer')!.prepend(more);
    more.onclick = () => { const open = app.querySelector('footer')!.classList.toggle('expanded'); more.setAttribute('aria-expanded', String(open)); };
    app.querySelector('.toolbar')!.addEventListener('click', () => requestAnimationFrame(() => {
        if (document.documentElement.dataset.display === 'cover') app.querySelector('.management-column')!.scrollIntoView({block:'start'});
    }));
    app.querySelector('#open')!.addEventListener('click', () => requestAnimationFrame(() => {
        if (document.documentElement.dataset.display === 'cover' && !app.querySelector<HTMLElement>('#selling')!.hidden) app.querySelector('.world-column')!.scrollIntoView({block:'start'});
    }));
    const select = controls.querySelector('select')!;
    const saved = localStorage.getItem('wireproof.display');
    select.value = saved === 'cover' || saved === 'inner' ? saved : 'auto';
    const update = () => {
        const width = document.documentElement.clientWidth;
        // Width reflects the native safe-area constrained WKWebView, including hosted layouts.
        const profile = select.value === 'auto' ? (width >= 680 ? 'inner' : 'cover') : select.value;
        document.documentElement.dataset.display = profile;
        const toolbar = app.querySelector<HTMLElement>('.toolbar')!;
        if (profile === 'cover') app.insertBefore(toolbar, app.querySelector('footer'));
        else app.querySelector('.control-row')!.prepend(toolbar);
        controls.querySelector('#duo-profile')!.textContent = `${profile === 'inner' ? 'Inner · side by side' : 'Cover · stacked'}`;
    };
    let timer: ReturnType<typeof setTimeout>;
    window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(update, 160); });
    select.addEventListener('change', () => { localStorage.setItem('wireproof.display', select.value); update(); });
    update();
}
