import type Phaser from "phaser";
import { LOCATION_IDS } from "../content/locations";
import type { MapThemeId } from "../content/map-layouts";

export const MAP_ASSETS = {
    neighborhood: new URL("../assets/original/neighborhood.png", import.meta.url).href,
    park: new URL("../assets/original/park.png", import.meta.url).href,
    downtown: new URL("../assets/original/downtown.png", import.meta.url).href,
    beach: new URL("../assets/original/beach.png", import.meta.url).href,
    "old-square": new URL("../assets/map-old-square.png", import.meta.url).href,
    "train-station": new URL("../assets/map-train-station.png", import.meta.url).href,
    mall: new URL("../assets/original/mall.png", import.meta.url).href,
    marina: new URL("../assets/map-marina.png", import.meta.url).href,
    stadium: new URL("../assets/map-stadium.png", import.meta.url).href,
    "magic-gardens": new URL("../assets/map-magic-gardens.png", import.meta.url).href,
} as const satisfies Readonly<Record<MapThemeId, string>>;

export function createMapArt(scene: Phaser.Scene): void {
    for (const id of LOCATION_IDS)
        scene.textures.addImage(id, scene.textures.get(`map-source-${id}`).getSourceImage() as HTMLImageElement);
}
