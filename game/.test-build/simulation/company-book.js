"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyBook = exports.COMPANY_KEY = void 0;
const save_1 = require("./save");
exports.COMPANY_KEY = "lemonade-tycoon.reboot.companies";
const slot = (n) => Number.isInteger(n) && Number(n) >= 0 && Number(n) < 8;
function company(value) {
    if (!value || typeof value.name !== "string" || !value.name.trim() || value.name.length > 40 || typeof value.raw !== "string")
        throw Error("Invalid company record.");
    (0, save_1.decodeSave)(value.raw);
}
function decode(raw, limit) {
    if (new TextEncoder().encode(raw).length > limit)
        throw Error("Company list is too large. Export your current business.");
    const b = JSON.parse(raw);
    if (b?.version !== 1 || !slot(b.active) || !Array.isArray(b.companies) || b.companies.length !== 8)
        throw Error("Company list could not be read. Keep the file as a backup.");
    const identities = new Set();
    for (const c of b.companies)
        if (c !== null) {
            company(c);
            const id = (0, save_1.decodeSave)(c.raw).companyId;
            if (identities.has(id))
                throw Error("Company identities are duplicated.");
            identities.add(id);
        }
    if (!b.companies[b.active])
        throw Error("Active company is missing.");
    if (b.pending) {
        const p = b.pending;
        if (!slot(p.from) || !slot(p.to) || !b.companies[p.from] || !b.companies[p.to] ||
            typeof p.previous !== "string" || typeof p.next !== "string")
            throw Error("Invalid company transfer.");
        (0, save_1.decodeSave)(p.previous);
        (0, save_1.decodeSave)(p.next);
        if (p.target !== null)
            company(p.target);
        if (b.companies[p.to].raw !== p.next ||
            (p.from === p.to ? p.target?.raw !== p.previous : b.companies[p.from].raw !== p.previous))
            throw Error("Invalid company transfer contents.");
    }
    return b;
}
/** The existing autosave stays authoritative. A journal covers company switches;
 * ordinary game writes retain their existing primary/backup format and ordering. */
class CompanyBook {
    constructor(storage, maxBytes) {
        this.storage = storage;
        this.maxBytes = maxBytes;
        this.needsRecovery = false;
    }
    get companies() { return this.book?.companies ?? Array(8).fill(null); }
    get active() { return this.book?.active ?? 0; }
    get blocked() { return !this.book || this.needsRecovery; }
    async write(book) {
        const raw = JSON.stringify(book);
        if (new TextEncoder().encode(raw).length > this.maxBytes)
            throw Error("Company list is full. Export a backup before continuing.");
        decode(raw, this.maxBytes);
        await this.storage.setItem(exports.COMPANY_KEY, raw);
    }
    async load(current, recovered = false) {
        (0, save_1.decodeSave)(current);
        this.needsRecovery = true;
        const raw = await this.storage.getItem(exports.COMPANY_KEY);
        const book = raw === null ? { version: 1, active: 0,
            companies: [{ name: "Company 1", raw: current }, ...Array(7).fill(null)] } : decode(raw, this.maxBytes);
        if (book.pending) {
            if (current === book.pending.next)
                book.active = book.pending.to;
            else if (current === book.pending.previous) {
                book.active = book.pending.from;
                book.companies[book.pending.to] = book.pending.target;
            }
            else
                throw Error("Company transfer needs recovery. Keep both save files as backups.");
            delete book.pending;
            book.companies[book.active].raw = current;
            await this.write(book);
        }
        else if (recovered && (0, save_1.decodeSave)(current).companyId !== (0, save_1.decodeSave)(book.companies[book.active].raw).companyId) {
            // The generic backup may belong to the company we switched away
            // from. Recover this company's durable snapshot instead.
            current = book.companies[book.active].raw;
        }
        else if (!(0, save_1.decodeSave)(current).companyId && (0, save_1.decodeSave)(book.companies[book.active].raw).companyId) {
            const doc = (0, save_1.decodeSave)(current);
            const owner = (0, save_1.decodeSave)(book.companies[book.active].raw);
            current = (0, save_1.encodeSave)(doc.state, doc.history, owner.companyId, owner.mode);
        }
        book.companies[book.active].raw = current;
        this.book = book;
        this.needsRecovery = false;
        return current;
    }
    async select(index, current, company, writeCurrent, apply) {
        if (this.blocked || !slot(index))
            throw Error("Company list is unavailable. Restart to retry recovery.");
        (0, save_1.decodeSave)(current);
        const b = JSON.parse(JSON.stringify(this.book));
        b.companies[b.active].raw = current;
        const target = b.companies[index];
        if (company) {
            if (!company.name.trim() || company.name.trim().length > 40)
                throw Error("Use a company name of1–40 characters.");
            (0, save_1.decodeSave)(company.raw);
            b.companies[index] = { ...company, name: company.name.trim() };
        }
        const next = b.companies[index];
        if (!next)
            throw Error("Choose a saved company.");
        b.pending = { from: b.active, to: index, previous: current, next: next.raw, target };
        this.needsRecovery = true;
        await this.write(b);
        await writeCurrent(next.raw);
        // Update the in-memory game before journal cleanup, so a close cannot
        // accidentally write the old company's state over the new primary.
        apply(next.raw);
        b.active = index;
        delete b.pending;
        await this.write(b);
        this.book = b;
        this.needsRecovery = false;
    }
}
exports.CompanyBook = CompanyBook;
