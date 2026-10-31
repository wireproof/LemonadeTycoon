"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vectorFacing = vectorFacing;
exports.routeFacing = routeFacing;
exports.customerAppearance = customerAppearance;
const map_layouts_1 = require("./map-layouts");
// Screen-space directions. Keep the previous component on a stationary axis.
function vectorFacing(dx, dy, previous = "se") {
    const left = Math.abs(dx) < 0.01 ? previous.endsWith("w") : dx < 0;
    const rear = Math.abs(dy) < 0.01 ? previous.startsWith("n") : dy < 0;
    return rear ? left ? "nw" : "ne" : left ? "sw" : "se";
}
function routeFacing(id, progress, purpose, travel, previous) {
    const here = (0, map_layouts_1.mapPosition)(id, progress, purpose);
    const next = (0, map_layouts_1.mapPosition)(id, progress + travel, purpose);
    return vectorFacing(next[0] - here[0], next[1] - here[1], previous);
}
function customerAppearance(facing, action, phase, reducedMotion) {
    const selected = reducedMotion && action === "walk" ? "idle" : action;
    const frame = selected === "idle" || selected === "order" ? 0 : reducedMotion ? 4 : ((Math.floor(phase) % 4) + 4) % 4;
    return {
        pose: `${facing.startsWith("n") ? "rear" : "front"}-${selected}-${frame}`,
        flipX: facing.endsWith("w"),
    };
}
