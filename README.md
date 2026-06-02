# Janggi · Korean Chess

A browser-based Korean Janggi game with AI opponents, interactive tutorials, multilingual support, and traditional Korean board themes.

[![License: GPL v3](https://img.shields.io/badge/Code%20License-GPLv3-blue.svg)](LICENSE)
[![Assets: All Rights Reserved](https://img.shields.io/badge/Assets-All%20Rights%20Reserved-lightgrey.svg)](ASSETS_LICENSE.md)

**[▶ Play Online](https://korea-janggi.pages.dev)**

---

## Features

- **Play against AI opponents** — powered by Fairy-Stockfish (WebAssembly), with selectable difficulty
- **Interactive piece tutorials** — learn how each piece moves, step by step
- **Rules reference for beginners** — check, checkmate, and how to win, explained in plain language
- **Traditional Korean board themes**
  - Sansuhwa (Ink Wash Landscape)
  - Wood
  - Sipjangsaeng
  - Hanji
- **Multiple languages**
  - English
  - 한국어 (Korean)
  - 日本語 (Japanese)
  - 简体中文 (Simplified Chinese)
  - 繁體中文 (Traditional Chinese)
  - Deutsch (German)
  - Français (French)
- **Mobile and desktop support** — responsive layout for both

---

## What is Janggi?

Janggi is a traditional Korean strategy board game, often described as Korean Chess. While it shares some roots with Xiangqi and similarities with Chess, it has unique rules and tactics of its own — including the diagonal palace lines, the cannon (包) that leaps over a single piece, and the option to pass a turn.

The two sides, **Cho (楚)** and **Han (漢)**, take their names from the historic rivalry between the kingdoms of Chu and Han in ancient China.

---

## Play Online

Play instantly in your browser:

**https://korea-janggi.pages.dev**

No installation required — it runs entirely in the browser.

---

## Tech

- Vanilla JavaScript, HTML, and CSS (no framework)
- AI opponent via [Fairy-Stockfish](https://github.com/fairy-stockfish/Fairy-Stockfish) (GPLv3) compiled to WebAssembly
- Requires cross-origin isolation (`COOP`/`COEP`) for the WASM engine

---

## License

The code and the visual assets are licensed separately.

- **Code** (`index.html`, `style.css`, `script.js`, `engine.js`, etc.) — [GNU General Public License v3.0](LICENSE). This follows from integrating Fairy-Stockfish, which is GPLv3.
- **Visual assets** (board backgrounds, piece artwork, and other theme/UI images under `assets/`) — **All Rights Reserved** by Hanrim. They are *not* covered by the GPLv3 and may not be redistributed or reused when forking the code. See [ASSETS_LICENSE.md](ASSETS_LICENSE.md) for details.

If you fork or redistribute this project, the GPLv3 applies to the code only; the visual assets must not be redistributed with it.
