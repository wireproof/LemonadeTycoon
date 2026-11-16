# Lemonade Tycoon Remastered — iPhone and iPad

Version 0.2.3, playable development build. An unofficial reconstruction of the first Lemonade Tycoon, guided by the user's original Palm game and community research into the first PC game. This is not recovered original source and is not an official Hexacto release.

Build 6 fixes native scenery loading through the bundled URL scheme, preserves scene proportions on resize, restores cover navigation order, and adds an artwork-recovery message. The approved icon, Lemonade Home Screen label and existing save format are unchanged.

## Included

Offline career and 30-day challenge, recipe and price controls, supplies, animated selling and queues, forecasts and news, equipment and staff, daily/cumulative reports, eight company slots, autosave and save import/export. The playable location selection is the original Palm roster: Suburbs, Park, Beach, Downtown and Mall.

Cover presentation keeps management tabs at the bottom, with a scrollable play area and expandable Menu / Settings. Inner presentation places management and the complete street scene side by side. Layout follows available width and safe areas, with a brief settling delay and an explicit Auto / Cover / Inner override. The same running game and save continue across layout changes. There is no verified private fold-state API or hardware-specific geometry claim.

The native UIKit/WKWebView shell serves all resources through an in-process local URL handler; no website, server, login or Internet connection is required. Rendering uses a capped 20 fps canvas. Export uses the native share sheet and writes a JSON backup to the app's Documents directory.

## Delivery

The v0.2.3 prerelease includes `LemonadeTycoon-0.2.3-build6-unsigned.ipa` for iPhone and iPad (iOS 16 or later). It requires your own signing before installation. Bundle ID: `com.wireproof.lemonadetycoon`; Home Screen name: Lemonade. The source includes all game graphics, audio, fonts and native icon assets.

## Build

Node and npm: in `game`, run `npm ci --ignore-scripts`, `npm run typecheck`, `npm test`, `npm run build-nolog`.

Then at repository root: `python3 ios/build.py device` (or `simulator`). Requires Xcode's iOS SDK. `npx playwright test --config playwright.duo.config.cjs` in `game` runs the WebKit Duo regression tests. Simulator-only `--smoke-test` launches an actual offline trading day and writes `Documents/native-smoke.json`; this hook is compiled out of device builds.

## Verification

98 simulation/save tests and seven WebKit tests passed. A native regression reproduced the old 32-pixel missing texture, then verified real 300-pixel map assets and a complete saved trading day in both Duo and iPad simulators. The corrected iPad simulator scene was visually inspected. Physical installs are verified separately without launching the apps; physical runtime and visual confirmation remain pending.

## Fidelity status

This build adapts Gamez0 / Willow Lane Lemonade's MIT-licensed simulation, with five original PC scenery backgrounds and the original logo extracted from the supplied media. The menu is rebuilt responsively and the app icon is newly generated.  Upstream commit: fee1153e4733d5a95a19e0b7c643b15b523ae9fe.

Known differences requiring further original-game work:

- The five location rents and recipe taste formula are recovered from original evidence. Other prices, unlock rules, traffic and equipment effects still include reconstruction tuning.
- The Palm original ages lemons and sugar and uses its refrigerator to preserve lemons. This base currently carries those ingredients indefinitely and uses refrigeration to retain ice. Full batch-age inventory is not implemented.
- The Palm original's six equipment items, four save slots and exact staff choices are not replicated exactly. This build retains the community equipment/staff system and eight slots.
- Original scenery and logo are integrated; character animations and foreground layers still use the community recreation. The responsive menu is a new implementation.
- Extra first-PC-version location definitions remain for upstream save compatibility, but only the five Palm locations are selectable. Some inherited news references mention other first-PC-version venues.
- Device cover/inner transitions, touch comfort and performance still require physical Duo acceptance. Simulator and browser evidence cannot establish those.

This is a playable foundation for the requested remaster, not a claim of complete original-game parity.

## Credits

Original Lemonade Tycoon: Hexacto. Reconstruction base: https://github.com/Gamez0/lemonade-tycoon (MIT; retained in `game/LICENSE`). WIREPROOF iPhone adaptation. Phaser: MIT. Oswald font: SIL Open Font License (bundled notice).

## Screenshots

These captures are from development verification; appearance may differ on other devices.

| Duo cover | Duo inner |
| --- | --- |
| ![Duo cover menu](docs/screenshots/duo-cover-menu.png) | ![Duo inner menu](docs/screenshots/duo-inner-menu.png) |

The release IPA is unsigned and requires your own Apple signing and provisioning. This repository is private because it includes original game resources.
