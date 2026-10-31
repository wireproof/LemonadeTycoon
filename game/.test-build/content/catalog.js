"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUSTOMERS = exports.WEATHER = exports.ITEM_KEYS = exports.ITEMS = void 0;
// Money is always integer cents. Recipe ingredients are small serving units.
exports.ITEMS = {
    lemon: { name: "Lemon units", cost: 8, bundle: 40 },
    sugar: { name: "Sugar scoops", cost: 4, bundle: 20 },
    ice: { name: "Ice cubes", cost: 2, bundle: 60 },
    cup: { name: "Paper cups", cost: 6, bundle: 20 },
};
exports.ITEM_KEYS = Object.keys(exports.ITEMS);
exports.WEATHER = [
    { label: "Sunny", temperature: 32, traffic: 48 },
    { label: "Cloudy", temperature: 23, traffic: 40 },
    { label: "Rainy", temperature: 18, traffic: 32 },
    { label: "Sunny", temperature: 28, traffic: 44 },
];
exports.CUSTOMERS = [
    { name: "Neighbor", budget: 0.95, patience: 1 },
    { name: "Office worker", budget: 1.15, patience: 0.5 },
    { name: "Student", budget: 0.8, patience: 1.25 },
];
