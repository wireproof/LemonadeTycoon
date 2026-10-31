"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitorPatienceTicks = exports.DEFAULT_STREET_RULES = void 0;
exports.beginStreetDay = beginStreetDay;
exports.tickStreet = tickStreet;
exports.finishStreetDay = finishStreetDay;
const game_1 = require("./game");
const catalog_1 = require("../content/catalog");
const management_1 = require("../content/management");
exports.DEFAULT_STREET_RULES = { arrivalEvery: 5, serviceTicks: 8, patienceTicks: 18 };
const visitorPatienceTicks = (day, visitor) => {
    if (day.game.business?.customerModel !== "purchase-first-v1")
        return day.rules.patienceTicks;
    const staffPatience = management_1.STAFF[day.game.management.staff].patience;
    const basePatience = Math.max(1, day.rules.patienceTicks - staffPatience);
    return Math.max(1, Math.round(basePatience * catalog_1.CUSTOMERS[visitor.profile].patience) + staffPatience);
};
exports.visitorPatienceTicks = visitorPatienceTicks;
function beginStreetDay(game, rules = game.business ?? exports.DEFAULT_STREET_RULES) {
    if (game.phase !== "selling")
        throw new Error("Open the stand before starting the street.");
    if ([rules.arrivalEvery, rules.serviceTicks, rules.patienceTicks].some(n => !Number.isSafeInteger(n) || n < 1))
        throw new Error("Street timing must use positive whole ticks.");
    return { game, tick: 0, arrived: 0, waiting: [], serving: null, walking: [], rules };
}
/** One fixed 100 ms business tick. Rendering and animation never change its decisions. */
function tickStreet(day) {
    const tick = day.tick + 1;
    let game = day.game;
    let arrived = day.arrived;
    let waiting = [...day.waiting];
    let serving = day.serving;
    const walking = day.walking.filter(person => person.until > tick);
    const events = [];
    const settle = (visitor, outcome) => {
        const result = (0, game_1.settleVisitor)(game, visitor, outcome);
        game = result.state;
        events.push(result.event);
        walking.push({ visitor, kind: result.event.kind, startedAt: tick, until: tick + 22,
            satisfaction: result.event.satisfaction, tasteComplaints: result.event.tasteComplaints });
    };
    if (game.phase === "selling") {
        if (arrived < (0, game_1.dayTraffic)(game) && (tick - 1) % day.rules.arrivalEvery === 0) {
            const draw = (0, game_1.drawVisitor)(game, arrived + 1);
            game = draw.state;
            arrived++;
            if (draw.visitor.intent === "buy" && (0, game_1.capacity)(game) > 0)
                waiting.push({ visitor: draw.visitor, joinedAt: tick });
            else
                settle(draw.visitor);
        }
        const patient = [];
        for (const person of waiting) {
            if ((0, game_1.capacity)(game) === 0)
                settle(person.visitor);
            else if (tick - person.joinedAt >= (0, exports.visitorPatienceTicks)(day, person.visitor))
                settle(person.visitor, "abandoned");
            else
                patient.push(person);
        }
        waiting = patient;
        if (serving && tick >= serving.doneAt) {
            settle(serving.visitor);
            serving = null;
        }
        if ((0, game_1.capacity)(game) === 0 && waiting.length) {
            for (const person of waiting)
                settle(person.visitor);
            waiting = [];
        }
        if (!serving && waiting.length && game.phase === "selling") {
            const first = waiting.shift();
            serving = { visitor: first.visitor, doneAt: tick + day.rules.serviceTicks };
        }
    }
    return { day: { ...day, game, tick, arrived, waiting, serving, walking }, events };
}
function finishStreetDay(day) {
    const events = [];
    let current = day;
    // Bounded by traffic and rule durations; this guard catches a broken close condition.
    const limit = ((0, game_1.dayTraffic)(day.game) + 1) * (day.rules.arrivalEvery + day.rules.serviceTicks + day.rules.patienceTicks + 8);
    for (let i = 0; i < limit && current.game.phase === "selling"; i++) {
        const next = tickStreet(current);
        current = next.day;
        events.push(...next.events);
    }
    if (current.game.phase !== "results")
        throw new Error("The street day did not finish.");
    return { day: { ...current, walking: [] }, events };
}
