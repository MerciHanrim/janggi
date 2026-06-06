# Assets License

This document applies to the **assets** under the `assets/` folder.
The repository's code (`index.html`, `style.css`, `script.js`, `engine.js`)
is licensed separately under the GPLv3 ([`LICENSE`](LICENSE)) and does **not**
extend to the assets below.

The assets fall into two categories: **(1) visual assets created by Hanrim**
(All Rights Reserved) and **(2) sound assets obtained from a third party**
(governed by an external license, attributed below).

## 1. Visual Assets Created by Hanrim (All Rights Reserved)

### Scope

- `assets/board/` — ink-wash (Sansuhwa) board background images (upright / 180°)
- `assets/pieces/` — Baekja-theme piece images (7 each for the teal and red sides)
- `assets/screenshots/` — screenshots used in documentation (e.g. the README), which depict the assets above
- any theme / background / UI images added later

### Rights

These assets are original works created by Hanrim, who reserves all rights
(**All Rights Reserved**). Even though the code is released under the GPLv3,
the assets are **not** covered by that license.

- If you fork or redistribute the code in this repository, **the assets may
  not be redistributed or used with it.**
- Copying, modifying, distributing, or using these assets commercially
  requires prior written permission.
- Personal study and viewing are permitted.

## 2. Sound Assets (Third Party, Attributed)

The sound effects under `assets/sound/` are **not** created by Hanrim; they come
from Pixabay (Pixabay Content License) and are attributed below. They fall into
two groups by source:

**(a)** `janggi_sfx_move` / `capture` / `pick` / `checkmate` were derived from the
Pixabay sound pack "Board Game Pieces" by editing and splitting it.

**(b)** `janggi_sfx_win` / `janggi_sfx_lose` are separate Pixabay sound effects by
different authors (used for the win/lose result cue at the end of a game).

### (a) Board Game Pieces — move / capture / pick / checkmate

- Title: Board Game Pieces
- Original author: taure (Freesound)
- Distributed via: Pixabay (Pixabay Content License); uploader: freesound_community
- Source: https://pixabay.com/sound-effects/board-game-pieces-59039/
- Processing: the original sound pack was edited and split into four sound effects

> Sound Effect by [freesound_community](https://pixabay.com/users/freesound_community-46691455/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=59039) from [Pixabay](https://pixabay.com/sound-effects/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=59039)

The Pixabay Content License permits free use, modification, and adaptation into
new works, and does not require attribution — though credit is given here out of
respect for the original author and for transparency. (The license prohibits
selling or distributing content on a *standalone* basis with no creative effort
applied; this project edited and split the sound pack and integrated it into the
game, so that prohibition does not apply.) These sound assets are **not** subject
to the All Rights Reserved terms of the visual assets above.

### (b) Win / Lose result cues

Two additional sound effects play once at the end of a game, from the human
player's point of view (win when the player wins, lose when the AI wins; no cue
on a draw). They are separate Pixabay sound effects, not part of the pack above.

- `janggi_sfx_win.mp3` — by Sarah H, via Pixabay (Pixabay Content License)
- `janggi_sfx_lose.mp3` — by Universfield, via Pixabay (Pixabay Content License)

> Victory — Sound Effect by [Sarah H](https://pixabay.com/users/astralsynthesizer-50776509/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=358765) from [Pixabay](https://pixabay.com/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=358765)

> Defeat — Sound Effect by [Universfield](https://pixabay.com/users/universfield-28281460/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=250960) from [Pixabay](https://pixabay.com/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=250960)

The Pixabay Content License permits free use without requiring attribution;
credit is given here for transparency. These cues are **not** subject to the All
Rights Reserved terms of the visual assets above.

## Note

The code and assets are licensed separately so that integrating Fairy-Stockfish
(GPLv3) — which subjects the code to GPLv3 obligations — does not pull the
self-created visual assets into copyleft. The sound assets are third-party
(Pixabay) from the start, so they are attributed separately from the visual assets.
