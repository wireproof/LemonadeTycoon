const originalLogo = new URL("../assets/original/logo.png", import.meta.url).href;
import { icon } from "./icons";
import { decodeSave } from "../simulation/save";
import { careerDate } from "../simulation/calendar";
import { LOCATIONS } from "../content/locations";
import type { Company } from "../simulation/company-book";
import "./start-menu.css";

type NewCompany = Company & { mode?: "career" | "challenge" };
interface Hooks {
    companies: () => readonly (Company | null)[];
    active: () => number;
    blocked: () => boolean;
    ready: () => boolean;
    enter: (inspect?: boolean) => void;
    select: (index: number, company: NewCompany | null) => Promise<void>;
    help: () => void;
    options: () => void;
    quit: () => void;
    retry: () => Promise<void>;
    import: () => void;
}
const drawing = (paths: string) => `<svg class="pixel-icon" viewBox="0 0 26 26" aria-hidden="true"><g stroke="#304329" stroke-width=".8" stroke-linejoin="round">${paths}</g></svg>`;
const disk = drawing('<path fill="#7b83b9" d="M3 2h18l3 3v19H3Z"/><path fill="#e8ead7" d="M7 2h12v8H7Zm0 13h13v9H7Z"/><path fill="#707f91" d="M14 3h3v5h-3Z"/><path fill="none" d="M10 18h7m-7 3h7"/>');
const options = drawing('<path fill="#d8d9bd" d="M5 3h13l4 4v17H5Z"/><path fill="#afbfa9" d="m18 3 4 4h-4Z"/><path fill="none" stroke-width="2" d="M8 9h11M8 14h11M8 19h11"/><path fill="#f3ce61" d="M10 7h3v4h-3Zm5 5h3v4h-3Zm-6 5h3v4H9Z"/>');
const help = drawing('<path fill="#477db4" d="m4 5 12-3 6 3v18l-12 2-6-3Z"/><path fill="#e8edcd" d="m16 2 6 3v15l-6 2Z"/><path fill="none" stroke="#fff6cf" stroke-width="1.6" d="M7 10q0-4 4-4 5 0 2 5l-2 2m0 3v1"/>');
const credits = drawing('<path fill="#c6d7c2" d="m2 16 4-3 4 3v8H2Zm14 0 4-3 4 3v8h-8Z"/><path fill="#5a7caa" d="m8 16 5-3 5 3v9H8Z"/><ellipse fill="#c69b74" cx="6" cy="9" rx="3" ry="4"/><ellipse fill="#e5ba91" cx="13" cy="9" rx="3" ry="4"/><ellipse fill="#a97c5b" cx="20" cy="9" rx="3" ry="4"/><path fill="#514738" d="M3 7q1-5 5-1v2H3Zm7-1q3-4 6 0v1h-6Zm7 1q1-4 5-1v2h-5Z"/>');

/** Company lobby with eight save cards and a selected-save preview. */
export class StartMenu {
    readonly root = document.createElement("section");
    private selected = 0;
    private busy = false;
    private creating = false;
    private creatingMode: "career" | "challenge" = "career";
    private error = "";
    private summaries: ({ raw: string; mode: string; day: number; date: string; cash: string; location: string } | undefined)[] = [];
    private summary(index: number, company: Company) {
        const cached = this.summaries[index];
        if (cached?.raw === company.raw) return cached;
        const doc = decodeSave(company.raw), date = careerDate(doc.state.day);
        return this.summaries[index] = { raw: company.raw, mode: doc.mode === "challenge" ? "Challenge" : "Career",
            day: doc.state.day, date: `Year ${date.year} / Month ${date.month} / Day ${date.day}`,
            cash: `$${(doc.state.cash / 100).toFixed(2)}`, location: LOCATIONS[doc.state.location].name };
    }
    constructor(private hooks: Hooks) {
        this.root.id = "start-menu";
        this.root.setAttribute("aria-label", "Main menu");
        this.root.innerHTML = `<div class="start-frame">
          <header class="lobby-header"><img class="original-logo" src="${originalLogo}" alt="Lemonade Tycoon"><p>THE ORIGINAL BUSINESS · REMASTERED</p></header>
          <main class="lobby-main">
            <section class="lobby-resume" aria-labelledby="menu-heading">
              <p class="menu-selection-label">YOUR COMPANY</p><h2 id="menu-heading">Welcome back</h2>
              <div id="menu-company-info" class="menu-summary"></div>
              <button id="menu-continue" class="lobby-continue">${icon("lemon")}<span>Continue game</span><b aria-hidden="true">→</b></button>
              <form id="menu-create" aria-label="New company" hidden>
                <h2>New career</h2><label for="menu-name">Company name</label><input id="menu-name" maxlength="40" required>
                <label id="menu-replace-label"><input id="menu-replace" type="checkbox"> Replace this company's saved game</label>
                <p>Your other companies will be kept.</p><div class="create-actions"><button type="submit">Start business</button><button id="menu-cancel" type="button">Cancel</button></div>
              </form>
              <p id="menu-status" role="status">Reading saved companies…</p>
              <button id="menu-retry" hidden>Retry save recovery</button><button id="menu-inspect" hidden>Review / export backup</button>
            </section>
            <section class="lobby-start" aria-label="Start a new business">
              <button id="menu-new" class="mode-card">${icon("lemon")}<span><strong>New career</strong><small>Build your lemonade business</small></span><b aria-hidden="true">+</b></button>
              <button id="menu-challenge" class="mode-card">${icon("clock")}<span><strong>30-day challenge</strong><small>One month. Make it count.</small></span><b aria-hidden="true">+</b></button>
            </section>
            <details class="lobby-saves"><summary>Saved companies <span>8 slots</span></summary><div class="company-list" aria-label="Saved companies">${Array.from({length:8},(_,i)=>`<button data-company="${i}" aria-pressed="false">Empty slot</button>`).join("")}</div></details>
          </main>
          <footer class="lobby-footer"><nav aria-label="Menu tools"><button id="menu-options">${options}<span>Options</span></button><button id="menu-help">${help}<span>Help</span></button><button id="menu-import">${disk}<span>Import save</span></button><button id="menu-credits">${credits}<span>Credits</span></button><button id="menu-quit" hidden>Quit</button></nav><p>WIREPROOF · v0.2.1</p></footer>
          <dialog id="menu-credits-dialog"><h2>Lemonade Tycoon Remastered</h2><p>Original game and scenery: Hexacto / Broderbund. iPhone adaptation: WIREPROOF. Community simulation, character art and music: Gamez0 / Willow Lane Lemonade (MIT).</p><p>Original artwork extracted from your supplied game disc for this private build. Phaser: MIT. Oswald: SIL Open Font License.</p><form method="dialog"><button>Close</button></form></dialog>
        </div>`;
        document.body.append(this.root);
        this.el("menu-challenge").title = "Earn as much as you can in 30 trading days.";
        this.el("menu-help").onclick = hooks.help;
        this.el("menu-options").onclick = hooks.options;
        this.el("menu-quit").onclick = hooks.quit;
        this.el("menu-import").onclick = hooks.import;
        this.el("menu-inspect").onclick = () => hooks.enter(true);
        this.el("menu-credits").onclick = () => this.el<HTMLDialogElement>("menu-credits-dialog").showModal();
        this.el("menu-continue").onclick = () => {
            if (this.selected === hooks.active()) hooks.enter();
            else void this.transfer(null);
        };
        const start = (mode: "career" | "challenge") => {
            const empty = hooks.companies().findIndex(c => !c);
            if (hooks.companies()[this.selected] && empty >= 0) this.selected = empty;
            this.creating = true;
            this.creatingMode = mode;
            this.el<HTMLInputElement>("menu-name").value = `Company ${this.selected + 1}`;
            this.el<HTMLInputElement>("menu-replace").checked = false;
            this.render(); this.el("menu-name").focus(); this.el("menu-create").scrollIntoView({block:"nearest"});
        };
        this.el("menu-new").onclick = () => start("career");
        this.el("menu-challenge").onclick = () => start("challenge");
        this.root.querySelectorAll<HTMLButtonElement>("[data-company]").forEach(button => {
            button.onclick = () => { this.selected = Number(button.dataset.company); this.creating = false; this.render(); };
            button.onkeydown = event => {
                const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -2, ArrowDown: 2 }[event.key];
                if (step === undefined && event.key !== "Home" && event.key !== "End") return;
                event.preventDefault();
                if (this.busy || this.hooks.blocked()) return;
                this.selected = event.key === "Home" ? 0 : event.key === "End" ? 7 : Math.max(0, Math.min(7, this.selected + step!));
                this.creating = false; this.render();
                this.root.querySelector<HTMLButtonElement>(`[data-company="${this.selected}"]`)!.focus();
            };
        });
        this.el("menu-cancel").onclick = () => { this.creating = false; this.render(); };
        this.el<HTMLFormElement>("menu-create").onsubmit = event => {
            event.preventDefault();
            if (hooks.companies()[this.selected] && !this.el<HTMLInputElement>("menu-replace").checked) {
                this.error = "Confirm replacement, or select an empty company."; this.render(); return;
            }
            void this.transfer({ name: this.el<HTMLInputElement>("menu-name").value.trim(), raw: "", mode: this.creatingMode });
        };
        this.el("menu-retry").onclick = () => {
            this.busy = true; this.render();
            void hooks.retry().then(() => { this.error = ""; }).catch(error => { this.error = String(error.message ?? error); })
                .finally(() => { this.busy = false; this.render(); });
        };
        this.render();
    }
    private el<T extends HTMLElement = HTMLElement>(id: string): T { return this.root.querySelector<T>(`#${id}`)!; }
    show(error = ""): void { this.error = error; this.selected = this.hooks.active(); this.root.hidden = false; this.render(); }
    hide(): void { this.root.hidden = true; }
    private async transfer(company: NewCompany | null): Promise<void> {
        this.busy = true; this.error = ""; this.render();
        try { await this.hooks.select(this.selected, company); this.creating = false; this.hooks.enter(); }
        catch (error) { this.error = error instanceof Error ? error.message : "Company could not be loaded."; }
        finally { this.busy = false; this.render(); }
    }
    render(): void {
        const companies = this.hooks.companies(), chosen = companies[this.selected];
        const recovering = Boolean(this.error && this.hooks.blocked());
        this.root.querySelectorAll<HTMLButtonElement>("[data-company]").forEach((button, index) => {
            const company = companies[index], summary = company ? this.summary(index, company) : null;
            if (!company) this.summaries[index] = undefined;
            const slot = document.createElement("span"), name = document.createElement("strong"), detail = document.createElement("span");
            slot.className = "company-slot"; slot.textContent = String(index + 1);
            name.className = "company-name"; name.textContent = company?.name ?? "Empty slot";
            detail.className = "company-summary"; detail.textContent = recovering ? "Unavailable during recovery"
                : summary ? `${summary.mode} / Day ${summary.day} / ${summary.cash}` : "Available for a new company";
            button.replaceChildren(slot, name, detail);
            button.title = company?.name ?? `Empty slot ${index + 1}`;
            button.dataset.empty = String(!company);
            button.disabled = this.busy || this.hooks.blocked();
            button.setAttribute("aria-pressed", String(this.selected === index));
        });
        this.el<HTMLButtonElement>("menu-new").disabled = this.busy || this.hooks.blocked() || !this.hooks.ready();
        this.el<HTMLButtonElement>("menu-challenge").disabled = this.busy || this.hooks.blocked() || !this.hooks.ready();
        this.el<HTMLButtonElement>("menu-continue").disabled = this.busy || !chosen || this.hooks.blocked() || !this.hooks.ready();
        this.el<HTMLButtonElement>("menu-import").disabled = this.busy;
        this.el<HTMLButtonElement>("menu-retry").disabled = this.busy;
        this.el<HTMLButtonElement>("menu-inspect").disabled = this.busy || !this.hooks.ready();
        this.el("menu-create").hidden = !this.creating;
        this.el("menu-company-info").hidden = this.creating;
        this.el("menu-continue").hidden = this.creating;
        this.el("menu-create").querySelector("h2")!.textContent = this.creatingMode === "challenge" ? "New challenge · 30 days" : "New career";
        this.el<HTMLFieldSetElement>("menu-create").querySelectorAll<HTMLButtonElement | HTMLInputElement>("input,button")
            .forEach(control => { control.disabled = this.busy; });
        this.el("menu-replace-label").hidden = !chosen;
        this.el("menu-heading").textContent = recovering ? "Saved game needs recovery" : this.creating ? `New company ${this.selected + 1}` : "Welcome back";
        this.root.querySelector<HTMLElement>(".menu-selection-label")!.textContent = recovering ? "SAVE RECOVERY" : this.creating ? "NEW COMPANY" : "YOUR COMPANY";
        this.el("menu-company-info").textContent = "";
        if (recovering) {
            this.el("menu-company-info").textContent = "Your existing save is protected.\n\nRetry recovery or import a compatible backup. The existing file will be kept.";
        } else if (chosen) {
            const summary = this.summary(this.selected, chosen);
            const name = document.createElement("strong"), detail = document.createElement("span");
            name.className = "menu-company-name"; name.textContent = chosen.name; name.title = chosen.name;
            detail.className = "menu-save-details";
            detail.textContent = `Slot ${this.selected + 1} / ${summary.mode}${this.selected === this.hooks.active() ? " / Current" : ""}\n${summary.date}\n${summary.cash} cash\n${summary.location}`;
            this.el("menu-company-info").replaceChildren(name, detail);
        } else {
            this.el("menu-company-info").textContent = `Slot ${this.selected + 1} is empty.\n\nChoose New career or 30-day challenge to start a company here.`;
        }
        this.el("menu-new").hidden = recovering; this.el("menu-challenge").hidden = recovering;
        this.el("menu-status").textContent = this.busy ? "Saving company…" : this.error ||
            (this.hooks.blocked() || !this.hooks.ready() ? "Loading game…" : "Your progress saves automatically.");
        this.el("menu-retry").hidden = !this.error || !this.hooks.blocked();
        this.el("menu-inspect").hidden = !this.error || !this.hooks.blocked();
    }
}
