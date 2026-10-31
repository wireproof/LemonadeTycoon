"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dayTraffic = exports.INITIAL_CAPITAL = exports.pitcherCost = exports.cupsPerPitcher = void 0;
exports.newGame = newGame;
exports.setPlan = setPlan;
exports.buy = buy;
exports.buyOrder = buyOrder;
exports.unitCost = unitCost;
exports.capacity = capacity;
exports.recipeTaste = recipeTaste;
exports.quality = quality;
exports.demand = demand;
exports.openingCosts = openingCosts;
exports.openingReadiness = openingReadiness;
exports.openDay = openDay;
exports.reserveLocation = reserveLocation;
exports.expectedTraffic = expectedTraffic;
exports.effectiveWeather = effectiveWeather;
exports.unlockLocations = unlockLocations;
exports.isBankrupt = isBankrupt;
exports.drawVisitor = drawVisitor;
exports.settleVisitor = settleVisitor;
exports.stepCustomer = stepCustomer;
exports.nextDay = nextDay;
exports.results = results;
exports.satisfactionCustomers = satisfactionCustomers;
exports.purchaseUpgrade = purchaseUpgrade;
exports.hireStaff = hireStaff;
exports.selectAdvertising = selectAdvertising;
const management_1 = require("../content/management");
const catalog_1 = require("../content/catalog");
const locations_1 = require("../content/locations");
const day_conditions_1 = require("../content/day-conditions");
const emptyDaily = (meltedIce = 0) => ({ freeIceUsed: 0, capital: 0, wages: 0, advertising: 0, model: "pitcher", pitchersMade: 0, meltedIce,
    visitors: 0, sold: 0, rejected: 0, priceRejected: 0, passed: 0, soldOut: 0, abandoned: 0,
    revenue: 0, cost: 0, purchases: 0, rent: 0, moveFee: 0, satisfactionTotal: 0 });
const PITCHER_CUPS = [10, 11, 12, 14, 16, 20, 25, 33];
const cupsPerPitcher = (recipe) => PITCHER_CUPS[recipe.ice];
exports.cupsPerPitcher = cupsPerPitcher;
const pitcherCost = (recipe) => recipe.lemon * catalog_1.ITEMS.lemon.cost + recipe.sugar * catalog_1.ITEMS.sugar.cost +
    recipe.ice * (0, exports.cupsPerPitcher)(recipe) * catalog_1.ITEMS.ice.cost;
exports.pitcherCost = pitcherCost;
const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
function integer(n, min, max, label) {
    if (!Number.isSafeInteger(n) || n < min || n > max)
        throw new Error(`${label} must be ${min}–${max}.`);
}
function phase(state, expected) {
    if (state.phase !== expected)
        throw new Error(`This action requires ${expected}.`);
}
function random(seed) {
    const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return { seed: next, value: next / 4294967296 };
}
function forecast(seed) {
    const roll = random(seed);
    return { seed: roll.seed, weather: catalog_1.WEATHER[Math.floor(roll.value * catalog_1.WEATHER.length)] };
}
exports.INITIAL_CAPITAL = 4000;
function newGame(seed = 2026) {
    integer(seed, 0, 4294967295, "Seed");
    return { management: (0, management_1.defaultManagement)(), phase: "preparation", day: 1, cash: exports.INITIAL_CAPITAL, openingCash: exports.INITIAL_CAPITAL,
        stock: { lemon: 0, sugar: 0, ice: 0, cup: 0 }, freeIce: 0, pitcherCups: 0,
        plan: { recipe: { lemon: 6, sugar: 3, ice: 2 }, price: 150 },
        location: "neighborhood", pendingLocation: null, unlocked: ["neighborhood"],
        locationStats: (0, locations_1.defaultLocationStats)(),
        lifetimeRevenue: 0, business: null,
        reputation: 0.5, daily: emptyDaily(), ...forecast(seed) };
}
function setPlan(state, plan) {
    phase(state, "preparation");
    integer(plan.price, 25, 500, "Price (cents)");
    integer(plan.recipe.lemon, 0, 20, "Lemon");
    integer(plan.recipe.sugar, 0, 10, "Sugar");
    integer(plan.recipe.ice, 0, 7, "Ice");
    if (state.business && (plan.price !== state.plan.price ||
        ["lemon", "sugar", "ice"].some(item => plan.recipe[item] !== state.plan.recipe[item])))
        throw new Error("Today's recipe and price are fixed for this paid opening. Change them tomorrow.");
    return { ...state, plan: { price: plan.price, recipe: { ...plan.recipe } } };
}
function buy(state, item, quantity) {
    phase(state, "preparation");
    if (!catalog_1.ITEM_KEYS.includes(item))
        throw new Error("Unknown supply.");
    integer(quantity, 1, 999, "Quantity");
    if (state.stock[item] + quantity > 999)
        throw new Error("Storage limit is 999 per ingredient.");
    const cost = catalog_1.ITEMS[item].cost * quantity;
    if (cost > state.cash)
        throw new Error("Not enough cash for these supplies.");
    return { ...state, cash: state.cash - cost, stock: { ...state.stock, [item]: state.stock[item] + quantity },
        daily: { ...state.daily, purchases: state.daily.purchases + cost } };
}
/** Checkout is all-or-nothing: immutable intermediate states never escape on failure. */
function buyOrder(state, order) {
    phase(state, "preparation");
    for (const item of catalog_1.ITEM_KEYS)
        integer(order[item], 0, 999, "Order quantity");
    if (catalog_1.ITEM_KEYS.every(item => order[item] === 0))
        throw new Error("Choose supplies before buying.");
    return catalog_1.ITEM_KEYS.reduce((next, item) => order[item] === 0 ? next : buy(next, item, order[item]), state);
}
function unitCost(recipe, freeIce = 0) {
    const free = Math.min(freeIce, recipe.ice * (0, exports.cupsPerPitcher)(recipe));
    return ((0, exports.pitcherCost)(recipe) - free * catalog_1.ITEMS.ice.cost) / (0, exports.cupsPerPitcher)(recipe) + catalog_1.ITEMS.cup.cost;
}
function capacity(state) {
    const { stock, plan: { recipe } } = state;
    const legacy = state.business !== null && state.business.customerModel !== "purchase-first-v1";
    const newPitchers = Math.min(recipe.lemon === 0 ? Infinity : Math.floor(stock.lemon / recipe.lemon), recipe.sugar === 0 ? Infinity : Math.floor(stock.sugar / recipe.sugar), !legacy || recipe.ice === 0 ? Infinity : Math.floor(stock.ice / (recipe.ice * (0, exports.cupsPerPitcher)(recipe))));
    const iceCups = legacy || recipe.ice === 0 ? Infinity : Math.floor(stock.ice / recipe.ice);
    return Math.min(stock.cup, iceCups, state.pitcherCups + newPitchers * (0, exports.cupsPerPitcher)(recipe));
}
/** Also verified against supplied 2002 original executable: REA function 0x40b260. */
function recipeTaste(recipe, temperature) {
    const preferredIce = clamp(Math.ceil((temperature - 25) / 5), 0, 7);
    const complaints = [];
    let score = 100;
    if (temperature > 5 * (recipe.ice + 4) + 5) {
        score = 50;
        complaints.push("too-warm");
    }
    const dilution = Math.trunc(10000 / (100 - 10 * recipe.ice));
    const concentration = Math.trunc(4 * dilution / 10) + 2 * Math.trunc(2 * dilution / 10);
    if (concentration - 10 * (2 * recipe.sugar + recipe.lemon) > 20) {
        score -= 60;
        complaints.push("too-weak");
    }
    else if (2 * recipe.sugar - recipe.lemon > 1) {
        score -= 40;
        complaints.push("too-sweet");
    }
    else if (2 * recipe.sugar - recipe.lemon < -1) {
        score -= 50;
        complaints.push("too-sour");
    }
    return { quality: clamp(score / 100), score, preferredIce, complaints };
}
function quality(recipe, temperature) {
    return recipeTaste(recipe, temperature).quality;
}
/** Frozen alpha13 rule for paid openings created before the new customer model. */
function legacyQuality(recipe, temperature) {
    const balance = Math.abs(recipe.lemon / recipe.sugar - 2) * 0.2;
    const ice = temperature >= 30 ? 4 : temperature >= 25 ? 3 : temperature >= 21 ? 2 : 1;
    return clamp(1 - balance - Math.abs(recipe.ice - ice) * 0.12);
}
function demand(plan, weather, reputation, profile, variation, legacyTaste = false) {
    // Customers cannot know today's recipe before tasting it. Existing paid
    // openings retain the old model so replacing the game never rewrites their day.
    const taste = legacyTaste ? legacyQuality(plan.recipe, weather.temperature) : 1;
    const willingness = Math.round((115 + (weather.temperature - 18) * 5 + taste * 75 + reputation * 40)
        * catalog_1.CUSTOMERS[profile].budget * (0.85 + variation * 0.3));
    const probability = clamp(0.25 + taste * 0.35 + reputation * 0.2 + (weather.temperature - 18) * 0.008
        - plan.price / 1000 - (weather.label === "Rainy" ? 0.08 : 0), 0.03, 0.95);
    return { willingness, probability };
}
/** Purchased ice makers produce free ice, bounded by output and storage space. */
function openingCosts(state) {
    if (state.business)
        return { fees: 0, ice: 0 };
    const id = state.pendingLocation ?? state.location;
    const location = locations_1.LOCATIONS[id];
    const fees = location.rent + (id === state.location ? 0 : location.moveFee) +
        management_1.STAFF[state.management.staff].wage + management_1.ADS[state.management.advertising].cost;
    const ice = Math.min(999 - state.stock.ice, state.management.upgrades.iceMaker * 60);
    return { fees, ice };
}
/** Preview the same opening stock used by openDay, including free ice production. */
function openingReadiness(state) {
    const stock = { ...state.stock, ice: state.stock.ice + openingCosts(state).ice };
    const recipe = state.plan.recipe;
    const needsPitcher = state.pitcherCups === 0;
    return { cups: capacity({ ...state, stock }), missing: {
            lemon: Math.max(0, (needsPitcher ? recipe.lemon : 0) - stock.lemon),
            sugar: Math.max(0, (needsPitcher ? recipe.sugar : 0) - stock.sugar),
            ice: Math.max(0, (state.business && state.business.customerModel !== "purchase-first-v1"
                ? needsPitcher ? recipe.ice * (0, exports.cupsPerPitcher)(recipe) : 0 : recipe.ice) - stock.ice),
            cup: Math.max(0, 1 - stock.cup),
        } };
}
/** Lemons/sugar are prepared by pitcher; new days add ice when a cup sells. */
function makePitcher(state) {
    const recipe = state.plan.recipe;
    const ice = state.business?.customerModel === "purchase-first-v1" ? 0 : recipe.ice * (0, exports.cupsPerPitcher)(recipe);
    const freeIceUsed = Math.min(state.freeIce, ice);
    return { ...state, pitcherCups: (0, exports.cupsPerPitcher)(recipe),
        stock: { ...state.stock, lemon: state.stock.lemon - recipe.lemon,
            sugar: state.stock.sugar - recipe.sugar, ice: state.stock.ice - ice },
        freeIce: state.freeIce - freeIceUsed,
        daily: { ...state.daily, pitchersMade: state.daily.pitchersMade + 1,
            freeIceUsed: state.daily.freeIceUsed + freeIceUsed,
            cost: state.daily.cost + recipe.lemon * catalog_1.ITEMS.lemon.cost + recipe.sugar * catalog_1.ITEMS.sugar.cost
                + (ice - freeIceUsed) * catalog_1.ITEMS.ice.cost } };
}
function openDay(state) {
    phase(state, "preparation");
    // A restored, already-paid opening checkpoint replays the same day without another fee.
    if (state.business) {
        if (capacity(state) === 0)
            throw new Error("Buy enough supplies for one pitcher and a cup before opening.");
        return { ...(state.pitcherCups === 0 ? makePitcher(state) : state), phase: "selling" };
    }
    const id = state.pendingLocation ?? state.location;
    const location = locations_1.LOCATIONS[id], rating = state.locationStats[id];
    const moveFee = id === state.location ? 0 : location.moveFee;
    const staff = management_1.STAFF[state.management.staff], advertising = management_1.ADS[state.management.advertising];
    const { fees, ice } = openingCosts(state);
    if (openingReadiness(state).cups === 0)
        throw new Error("Buy enough supplies for one pitcher and a cup before opening.");
    if (state.cash < fees)
        throw new Error("Not enough cash for opening costs. Reduce advertising, dismiss staff or return to the free Neighborhood.");
    const business = { customerModel: "purchase-first-v1", conditions: (0, day_conditions_1.locationConditions)(state.day, id, state.weather), location: id, from: state.location,
        traffic: expectedTraffic(state, id),
        budget: location.budget, weights: [...location.weights], patienceTicks: location.patience + staff.patience,
        arrivalEvery: Math.max(1, Math.round(location.arrival / advertising.traffic)), serviceTicks: 8 - state.management.upgrades.blender - staff.speed, satisfaction: rating.satisfaction,
        popularity: rating.popularity, rent: location.rent, moveFee, paid: true };
    return makePitcher({ ...state, phase: "selling", location: id, pendingLocation: null, business,
        reputation: rating.satisfaction, cash: state.cash - fees, stock: { ...state.stock, ice: state.stock.ice + ice }, freeIce: state.freeIce + ice,
        daily: { ...state.daily, rent: location.rent, moveFee, wages: staff.wage, advertising: advertising.cost } });
}
function reserveLocation(state, id) {
    phase(state, "preparation");
    if (state.business)
        throw new Error("Today's location is already paid. Change locations after this day.");
    if (id !== null && (!(0, locations_1.isLocation)(id) || !state.unlocked.includes(id)))
        throw new Error("This location is locked.");
    return { ...state, pendingLocation: id === state.location ? null : id };
}
function expectedTraffic(state, id = state.pendingLocation ?? state.location) {
    if (state.business)
        return state.business.traffic;
    const conditions = (0, day_conditions_1.locationConditions)(state.day, id, state.weather);
    const base = id === "mall" ? 40 : state.weather.traffic;
    return Math.max(1, Math.round(base * locations_1.LOCATIONS[id].traffic * conditions.weatherFactor * conditions.newsFactor *
        (0.8 + 0.4 * state.locationStats[id].popularity) * management_1.ADS[state.management.advertising].traffic));
}
function effectiveWeather(state) {
    const temperature = state.business ? state.business.conditions?.temperature ?? state.weather.temperature
        : (0, day_conditions_1.locationConditions)(state.day, state.pendingLocation ?? state.location, state.weather).temperature;
    return { ...state.weather, temperature };
}
const dayTraffic = (state) => state.business?.traffic ?? state.weather.traffic;
exports.dayTraffic = dayTraffic;
function unlockLocations(unlocked, days, revenue, satisfaction) {
    return locations_1.LOCATION_IDS.filter(id => unlocked.includes(id) || (days >= locations_1.LOCATIONS[id].days &&
        revenue >= locations_1.LOCATIONS[id].revenue && satisfaction >= locations_1.LOCATIONS[id].satisfaction));
}
/** Minimum legal one-pitcher purchase; no automatic reset or sale of leftover inventory. */
function isBankrupt(state) {
    if (state.phase !== "preparation")
        return false;
    if (state.pitcherCups > 0 && capacity(state) > 0)
        return false;
    // A paid recipe is fixed; an unpaid day can still sell a weak, zero-ingredient drink.
    const missing = state.business ? openingReadiness(state).missing
        : { lemon: 0, sugar: 0, ice: 0, cup: Math.max(0, 1 - state.stock.cup) };
    const needed = catalog_1.ITEM_KEYS.reduce((total, item) => total + missing[item] * catalog_1.ITEMS[item].cost, 0);
    return state.cash < needed;
}
function drawVisitor(state, id) {
    phase(state, "selling");
    const a = random(state.seed), b = random(a.seed), c = random(b.seed);
    const weights = state.business.weights;
    let profile = 0, roll = a.value * weights.reduce((total, weight) => total + weight, 0);
    while (profile < weights.length - 1 && roll >= weights[profile])
        roll -= weights[profile++];
    const decision = demand(state.plan, effectiveWeather(state), state.business.satisfaction, profile, b.value, state.business.customerModel !== "purchase-first-v1");
    const willingness = Math.round(decision.willingness * state.business.budget);
    const intent = state.plan.price > willingness ? "price"
        : c.value >= decision.probability ? "passed" : "buy";
    return { state: { ...state, seed: c.seed }, visitor: { id, profile, intent, willingness } };
}
function settleVisitor(state, visitor, outcome) {
    phase(state, "selling");
    const kind = outcome ?? (visitor.intent !== "buy" ? visitor.intent
        : capacity(state) === 0 ? "sold-out" : "bought");
    const sold = kind === "bought";
    if (sold && state.pitcherCups === 0)
        state = makePitcher(state);
    const currentModel = state.business.customerModel === "purchase-first-v1";
    const taste = recipeTaste(state.plan.recipe, effectiveWeather(state).temperature);
    // Derive a reproducible taste draw without consuming arrival randomness.
    // Every buyer samples the same draw regardless of the chosen recipe.
    const tasteDraw = Math.floor(random((state.seed ^ Math.imul(visitor.id, 0x9e3779b1)) >>> 0).value * 101);
    const satisfaction = !sold ? null : currentModel ? (tasteDraw <= taste.score ? 100 : 0)
        : Math.round(clamp(legacyQuality(state.plan.recipe, state.weather.temperature) * 0.8
            + clamp(1 - state.plan.price / (visitor.willingness * 1.4)) * 0.2) * 100);
    const usedIce = sold && currentModel ? state.plan.recipe.ice : 0;
    const freeIceUsed = Math.min(state.freeIce, usedIce);
    const stock = sold ? { ...state.stock, cup: state.stock.cup - 1, ice: state.stock.ice - usedIce } : state.stock;
    const daily = { ...state.daily, visitors: state.daily.visitors + 1,
        sold: state.daily.sold + Number(sold), rejected: state.daily.rejected + Number(kind === "price" || kind === "passed"),
        priceRejected: state.daily.priceRejected + Number(kind === "price"),
        passed: state.daily.passed + Number(kind === "passed"),
        soldOut: state.daily.soldOut + Number(kind === "sold-out"),
        abandoned: state.daily.abandoned + Number(kind === "abandoned"),
        revenue: state.daily.revenue + (sold ? state.plan.price : 0),
        cost: state.daily.cost + (sold ? catalog_1.ITEMS.cup.cost + (usedIce - freeIceUsed) * catalog_1.ITEMS.ice.cost : 0),
        freeIceUsed: state.daily.freeIceUsed + freeIceUsed,
        satisfactionTotal: state.daily.satisfactionTotal + (satisfaction ?? 0) };
    const finished = daily.visitors >= (0, exports.dayTraffic)(state);
    const oldRating = state.locationStats[state.location];
    const satisfactionCount = daily.sold + (currentModel ? daily.priceRejected + daily.soldOut + daily.abandoned : 0);
    const satisfactionRating = finished && daily.sold > 0 ?
        clamp(oldRating.satisfaction * 0.65 + daily.satisfactionTotal / satisfactionCount / 100 * 0.35) : oldRating.satisfaction;
    const locationStats = finished && daily.sold > 0 ? { ...state.locationStats,
        [state.location]: { satisfaction: satisfactionRating, popularity: oldRating.popularity * 0.8 + satisfactionRating * 0.2 } } : state.locationStats;
    const lifetimeRevenue = state.lifetimeRevenue + (finished ? daily.revenue : 0);
    const served = { ...state, stock, daily, freeIce: state.freeIce - freeIceUsed, cash: state.cash + (sold ? state.plan.price : 0),
        pitcherCups: finished ? 0 : state.pitcherCups - Number(sold),
        phase: finished ? "results" : "selling",
        reputation: satisfactionRating, locationStats, lifetimeRevenue,
        unlocked: finished ? unlockLocations(state.unlocked, state.day, lifetimeRevenue, satisfactionRating) : state.unlocked };
    return { state: sold && !finished && served.pitcherCups === 0 && capacity(served) > 0 ? makePitcher(served) : served,
        event: { id: visitor.id, kind, profile: visitor.profile, satisfaction,
            tasteComplaints: sold && currentModel && satisfaction === 0 ? taste.complaints : [] } };
}
function stepCustomer(state) {
    const draw = drawVisitor(state, state.daily.visitors + 1);
    return settleVisitor(draw.state, draw.visitor);
}
function nextDay(state) {
    phase(state, "results");
    return { ...state, phase: "preparation", day: state.day + 1, openingCash: state.cash,
        stock: { ...state.stock, ice: Math.floor(state.stock.ice * state.management.upgrades.refrigerator / 2) },
        freeIce: Math.floor(state.freeIce * state.management.upgrades.refrigerator / 2), pitcherCups: 0,
        business: null, pendingLocation: null,
        daily: emptyDaily(state.stock.ice - Math.floor(state.stock.ice * state.management.upgrades.refrigerator / 2)), ...forecast(state.seed) };
}
function results(state) {
    return { profit: state.daily.revenue - state.daily.cost - state.daily.rent - state.daily.moveFee - state.daily.wages - state.daily.advertising,
        cashChange: state.cash - state.openingCash,
        satisfaction: state.daily.sold === 0 ? null :
            Math[state.business?.customerModel === "purchase-first-v1" ? "floor" : "round"](state.daily.satisfactionTotal / satisfactionCustomers(state)) };
}
function satisfactionCustomers(state) {
    return state.daily.sold + (state.business?.customerModel === "purchase-first-v1"
        ? state.daily.priceRejected + state.daily.soldOut + state.daily.abandoned : 0);
}
function editableManagement(state) {
    phase(state, "preparation");
    if (state.business)
        throw new Error("Management is fixed for this paid opening. Change it tomorrow.");
}
function purchaseUpgrade(state, id) {
    editableManagement(state);
    const item = management_1.UPGRADES[id];
    if (!Object.prototype.hasOwnProperty.call(management_1.UPGRADES, id))
        throw new Error("Unknown upgrade.");
    const level = state.management.upgrades[id];
    if (level >= item.prices.length)
        throw new Error("This equipment is fully upgraded.");
    const price = item.prices[level];
    if (state.cash < price)
        throw new Error("Not enough cash for this upgrade.");
    return { ...state, cash: state.cash - price,
        daily: { ...state.daily, capital: state.daily.capital + price },
        management: { ...state.management, upgrades: { ...state.management.upgrades, [id]: level + 1 } } };
}
function hireStaff(state, id) {
    editableManagement(state);
    if (!Object.prototype.hasOwnProperty.call(management_1.STAFF, id))
        throw new Error("Unknown staff candidate.");
    return { ...state, management: { ...state.management, staff: id } };
}
function selectAdvertising(state, id) {
    editableManagement(state);
    if (!Object.prototype.hasOwnProperty.call(management_1.ADS, id))
        throw new Error("Unknown advertising.");
    return { ...state, management: { ...state.management, advertising: id } };
}
