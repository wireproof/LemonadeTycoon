"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeSaveAsync = writeSaveAsync;
exports.readSaveAsync = readSaveAsync;
const save_1 = require("./save");
async function writeSaveAsync(storage, raw) {
    (0, save_1.decodeSave)(raw);
    const previous = await storage.getItem(save_1.SAVE_KEY);
    if (previous !== null) {
        let valid = false;
        try {
            (0, save_1.decodeSave)(previous);
            valid = true;
        }
        catch { /* Keep the last valid backup. */ }
        if (valid)
            await storage.setItem(save_1.BACKUP_KEY, previous);
    }
    await storage.setItem(save_1.SAVE_KEY, raw);
}
async function readSaveAsync(storage) {
    const primary = await storage.getItem(save_1.SAVE_KEY);
    if (primary === null) {
        const backup = await storage.getItem(save_1.BACKUP_KEY);
        return backup === null ? { document: null, recovered: false }
            : { document: (0, save_1.decodeSave)(backup), recovered: true };
    }
    try {
        return { document: (0, save_1.decodeSave)(primary), recovered: false };
    }
    catch (error) {
        if (error instanceof save_1.UnsupportedSaveVersionError)
            throw error;
        const backup = await storage.getItem(save_1.BACKUP_KEY);
        if (backup !== null) {
            try {
                return { document: (0, save_1.decodeSave)(backup), recovered: true };
            }
            catch { /* Report the primary failure. */ }
        }
        throw error;
    }
}
