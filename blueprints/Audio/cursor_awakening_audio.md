# Cursor Prompt — Awakening Audio Sequence
# Touch index.html only
# Audio files are already in /audio/awakening/ and served as static assets

---

## OVERVIEW

Six audio files, one cinematic sequence. The awakening runs automatically
after character creation completes — no Wake Up button. The voice clip
IS the transition trigger.

Files:
  /audio/awakening/a_nightmare.mp3      — char creation background (2 min)
  /audio/awakening/abyssal.mp3          — awakening drone (2.5 min)
  /audio/awakening/name_reveal.mp3      — name hit sting (8.7s)
  /audio/awakening/name_settle.mp3      — name shimmer (7.3s)
  /audio/awakening/dark_strings_swell.mp3 — emotional swell post-reveal (10.4s)
  /audio/awakening/wakeup.mp3           — voice shout trigger (0.85s)

---

## STEP 1 — Audio utility functions

Add this block in the <script> section, near the top with other
utility functions, before any game logic:

```javascript
// ── Audio ─────────────────────────────────────────────────────────

function playOnce(src, volume = 0.8) {
  const el = new Audio(src);
  el.volume = volume;
  el.play().catch(() => {});
  return el;
}

function playLoop(src, volume = 0.3) {
  const el = new Audio(src);
  el.loop   = true;
  el.volume = volume;
  el.play().catch(() => {});
  return el;
}

function fadeOutAudio(el, ms, cb) {
  if (!el) return;
  const steps    = 20;
  const delta    = el.volume / steps;
  const interval = ms / steps;
  const t = setInterval(() => {
    el.volume = Math.max(0, el.volume - delta);
    if (el.volume <= 0) {
      clearInterval(t);
      el.pause();
      cb?.();
    }
  }, interval);
}

function fadeInAudio(el, targetVolume, ms) {
  if (!el) return;
  el.volume = 0;
  const steps    = 20;
  const delta    = targetVolume / steps;
  const interval = ms / steps;
  const t = setInterval(() => {
    el.volume = Math.min(targetVolume, el.volume + delta);
    if (el.volume >= targetVolume) clearInterval(t);
  }, interval);
}

// Track currently playing background so we can fade it out on transition
let _bgAudio = null;

function startBackground(src, volume = 0.25) {
  if (_bgAudio) fadeOutAudio(_bgAudio, 1500);
  _bgAudio = playLoop(src, 0);
  fadeInAudio(_bgAudio, volume, 2000);
  return _bgAudio;
}
```

---

## STEP 2 — Start a_nightmare during character creation

Find the function that shows the character creation overlay —
`showOverlay()` or `startTrueWelcomeFromCharacter()`. At the point
where the overlay becomes visible, add:

```javascript
// Start character creation ambient
startBackground('/audio/awakening/a_nightmare.mp3', 0.22);
```

This plays quietly under lineage selection, instinct cards, and stat
distribution. It will be faded out when the awakening sequence begins.

---

## STEP 3 — Remove the Wake Up button

Find the awakening overlay HTML. It contains a button labeled
"Wake Up" or similar (id="wake-btn" or similar). Remove it entirely —
the voice clip replaces it.

Also remove any onclick handler or event listener attached to that
button.

---

## STEP 4 — Replace runAwakening() with the audio-driven version

Find the existing `runAwakening(playerName)` function (or wherever
the awakening text sequence is triggered after character creation
completes). Replace it entirely with:

```javascript
async function runAwakening(playerName) {
  const overlay  = document.getElementById('awakening-overlay');
  const nameEl   = document.getElementById('awakening-name');
  const taglineEl = document.getElementById('awakening-tagline');
  // Wake Up button is removed — no wakeBtn reference needed

  overlay.style.display  = 'flex';
  overlay.style.opacity  = '1';

  const wait = ms => new Promise(r => setTimeout(r, ms));

  // Fade out character creation music, start awakening drone
  if (_bgAudio) fadeOutAudio(_bgAudio, 2000);
  const drone = playLoop('/audio/awakening/abyssal.mp3', 0);
  fadeInAudio(drone, 0.28, 3000);

  // Helper: fade in a text element
  function showLine(el, text) {
    el.textContent = text;
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.8s ease';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { el.style.opacity = '1'; });
    });
  }

  // Text lines — create and append to overlay sequentially
  // Each line is a <p> that fades in. Assumes the overlay has a
  // #awakening-lines container div for the text lines.
  const linesEl = document.getElementById('awakening-lines');
  linesEl.innerHTML = '';

  function addLine(text) {
    const p = document.createElement('p');
    p.className = 'awakening-line';
    p.style.opacity = '0';
    p.style.transition = 'opacity 0.9s ease';
    p.textContent = text;
    linesEl.appendChild(p);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { p.style.opacity = '1'; });
    });
  }

  // ── Sequence ───────────────────────────────────────────────────
  await wait(300);  addLine("You are on the floor.");
  await wait(800);  addLine("The stone is cold.");
  await wait(1000); addLine("You do not know how you got here.");
  await wait(900);  addLine("You do not know where here is.");
  await wait(900);  addLine("You do not know your name.");
  await wait(1100); addLine("Wait.");
  await wait(1200); addLine("You know one thing.");

  await wait(1200);

  // ── Name reveal ───────────────────────────────────────────────
  playOnce('/audio/awakening/name_reveal.mp3', 0.85);
  nameEl.textContent = playerName;
  nameEl.classList.add('name-snap');

  await wait(80);
  playOnce('/audio/awakening/name_settle.mp3', 0.6);
  nameEl.classList.remove('name-snap');
  nameEl.classList.add('name-settle');

  await wait(1000);
  playOnce('/audio/awakening/dark_strings_swell.mp3', 0.7);

  await wait(1500);

  // ── "Open your eyes." — no button, just text ─────────────────
  if (taglineEl) {
    taglineEl.style.opacity = '0';
    taglineEl.style.transition = 'opacity 1.2s ease';
    taglineEl.textContent = 'Open your eyes.';
    taglineEl.style.display = 'block';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { taglineEl.style.opacity = '1'; });
    });
  }

  // ── Silence before the voice ──────────────────────────────────
  await wait(2200);

  // ── WAKE UP — voice triggers the transition ───────────────────
  playOnce('/audio/awakening/wakeup.mp3', 1.0);

  // Fade drone out as the voice fires
  fadeOutAudio(drone, 1800);

  // 500ms into the shout, start fading the overlay
  await wait(500);

  overlay.style.transition = 'opacity 1.5s ease';
  overlay.style.opacity = '0';

  await wait(1500);

  // ── Hand off to game ──────────────────────────────────────────
  overlay.style.display = 'none';
  overlay.style.transition = '';
  overlay.style.opacity = '1';

  // Clear awakening state for next time
  linesEl.innerHTML = '';
  nameEl.classList.remove('name-snap', 'name-settle');
  if (taglineEl) taglineEl.style.opacity = '0';

  // Load the game — player wakes in the tavern
  await loadGame();

  // Tavern ambient will be started by AudioManager.setZone()
  // when renderRoom fires with location='tavern'
  // (wire that in the ambient system prompt — not needed here yet)
}
```

---

## STEP 5 — CSS for awakening lines

Add to the stylesheet (near other awakening styles):

```css
.awakening-line {
  font-family: var(--font-body);
  font-size: 1.05rem;
  color: var(--text-dim);
  line-height: 1.8;
  margin: 0;
  padding: 0;
  letter-spacing: 0.03em;
}

#awakening-name {
  transition: transform 0.1s ease, opacity 0.3s ease,
              text-shadow 0.3s ease, font-size 0.2s ease;
}

#awakening-name.name-snap {
  font-size: 2.8rem;
  text-shadow: 0 0 40px var(--ember), 0 0 80px rgba(196,98,42,0.6);
  opacity: 1;
  transform: scale(1.08);
}

#awakening-name.name-settle {
  font-size: 2.2rem;
  text-shadow: 0 0 20px rgba(196,98,42,0.4);
  opacity: 1;
  transform: scale(1.0);
  transition: transform 0.4s ease, font-size 0.4s ease,
              text-shadow 0.6s ease;
}
```

---

## STEP 6 — Autoplay unlock

Browsers block audio until a user gesture. Character creation involves
many clicks so autoplay will be unlocked by the time the awakening
fires. Add this safeguard once at page load just in case:

```javascript
// Unlock audio context on first user interaction
let _audioUnlocked = false;
document.addEventListener('click', () => {
  if (_audioUnlocked) return;
  _audioUnlocked = true;
  // Play and immediately pause a silent buffer to unlock
  const unlock = new Audio();
  unlock.play().catch(() => {});
}, { once: false });
```

---

## VERIFICATION

1. Start character creation — a_nightmare.mp3 should begin quietly
2. Complete instinct + stat selection
3. Awakening overlay appears, abyssal drone fades in
4. Text lines appear one by one at correct cadence
5. Name snaps in with hit sound + visual snap
6. 80ms later settle sound fires + name scales down smoothly
7. Dark strings swell begins ~1s after name settles
8. "Open your eyes." fades in — NO button visible
9. ~2s silence
10. Voice shouts — overlay begins fading simultaneously
11. ~1.5s later overlay is gone, game is loaded, player is in tavern
12. No audio overlapping awkwardly — drone fully faded before game loads

---

## NOTES FOR CURSOR

- `#awakening-lines`, `#awakening-name`, `#awakening-tagline` must
  exist in the awakening overlay HTML. If they have different IDs,
  update the getElementById calls to match what's actually there.
- The Wake Up button must be fully removed from HTML and JS —
  not just hidden.
- `loadGame()` is called at the END of the sequence, same as before,
  just now triggered by the voice timing rather than a button click.
- Do not add any new endpoints or touch index.js.
