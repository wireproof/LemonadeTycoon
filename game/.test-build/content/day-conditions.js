"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsForDay = exports.DAILY_NEWS = void 0;
exports.locationConditions = locationConditions;
exports.validConditions = validConditions;
// Product adaptation of the observed weather/news/location relationships.
// Strengths are deliberately explicit tuning, not recovered original constants.
exports.DAILY_NEWS = [
    { id: "ordinary", headline: "An ordinary trading day. Watch the forecast before choosing a pitch.", locations: [], factor: 1 },
    { id: "park-fair", headline: "A family fair brings more visitors to the Park.", locations: ["park"], factor: 1.6 },
    { id: "rail-delays", headline: "Rail disruption reduces foot traffic at the station.", locations: ["train-station"], factor: .45 },
    { id: "match-day", headline: "Match day draws a larger crowd to Hexa-Stad.", locations: ["stadium"], factor: 1.6 },
    { id: "beach-cleanup", headline: "Beach maintenance keeps many visitors away today.", locations: ["beach"], factor: .35 },
    { id: "mall-sale", headline: "A shopping event brings more people to the Mall.", locations: ["mall"], factor: 1.5 },
    { id: "roadworks", headline: "Roadworks reduce visitors in Downtown and Old Square.", locations: ["downtown", "old-square"], factor: .5 },
    { id: "school-break", headline: "A school break brings families to the Park and Magic Gardens.", locations: ["park", "magic-gardens"], factor: 1.35 },
    { id: "marina-show", headline: "A boat show brings more visitors to the Marina.", locations: ["marina"], factor: 1.5 },
];
const newsForDay = (day) => exports.DAILY_NEWS[(Math.imul(day - 1, 7) >>> 0) % exports.DAILY_NEWS.length];
exports.newsForDay = newsForDay;
function locationConditions(day, location, weather) {
    const news = (0, exports.newsForDay)(day);
    const rain = { neighborhood: .45, park: .08, downtown: .65,
        beach: .05, "old-square": .25, "train-station": .8, mall: 1.4, marina: .2, stadium: .85, "magic-gardens": .1 };
    return { model: "weather-news-v1", newsId: news.id, temperature: location === "mall" ? 20 : weather.temperature,
        weatherFactor: weather.label === "Rainy" ? rain[location] : location === "mall" && weather.label === "Sunny" ? .8 : 1,
        newsFactor: news.locations.includes(location) ? news.factor : 1 };
}
function validConditions(value, location, weather) {
    if (typeof value !== "object" || value === null)
        return false;
    const v = value, news = exports.DAILY_NEWS.find(n => n.id === v.newsId);
    if (!news || v.model !== "weather-news-v1")
        return false;
    const expected = locationConditions(1, location, weather);
    return v.temperature === expected.temperature && v.weatherFactor === expected.weatherFactor &&
        v.newsFactor === (news.locations.includes(location) ? news.factor : 1);
}
