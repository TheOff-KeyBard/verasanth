# Cursor Prompt — Awakening Sequence: Line-by-Line Reveal
# Touch index.html only. The awakening overlay already exists.
# This is purely a timing and animation fix.

---

## THE PROBLEM

The awakening screen appears all at once. It should reveal line by line,
with the player's name hitting like a sudden shouted whisper — sharp,
bright, then settling — followed by a slow fade of everything below it.

---

## STEP 1 — Restructure the awakening text HTML

Find the `#awakening-overlay` div. Currently `#awakening-text` contains
all the prose as a single block with `<br>` tags.

Replace the entire `#awakening-overlay` inner structure with this:

```html
<div id="awakening-overlay" style="display:none">
  <div id="awakening-lines">
    <p class="aw-line" data-delay="0.3">You are on the floor.</p>
    <p class="aw-line" data-delay="1.1">The stone is cold. The air smells of ash and old fire.</p>
    <p class="aw-line" data-delay="2.1">You do not know how you got here.</p>
    <p class="aw-line" data-delay="3.0">You do not know where here is.</p>
    <p class="aw-line" data-delay="3.9">You do not know your name.</p>
    <p class="aw-line" data-delay="5.0">Wait.</p>
    <p class="aw-line" data-delay="6.2">You know one thing.</p>
  </div>

  <div id="awakening-name"></div>

  <div id="awakening-below">
    <div id="awakening-tagline">Hold onto it. This city takes everything else.</div>
    <div id="awakening-cta">— Open your eyes —</div>
    <button id="awakening-btn" onclick="completeAwakening()">Wake Up</button>
  </div>
</div>
```

---

## STEP 2 — Replace the awakening CSS

Remove or replace all existing awakening-related CSS rules and substitute
these. The key principle: everything starts invisible and is triggered by JS,
not CSS `animation-delay`, so timing is precise and controllable.

```css
#awakening-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 300;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 40px;
}

/* ── Prose lines ──────────────────────────────────────────────── */
#awakening-lines {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin-bottom: 40px;
}

.aw-line {
  font-family: var(--font-body);
  font-size: 0.92rem;
  line-height: 2.0;
  text-align: center;
  color: var(--text);
  margin: 0;
  padding: 0;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.9s ease, transform 0.9s ease;
}

.aw-line.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ── Name — the shouted whisper ───────────────────────────────── */
#awakening-name {
  font-family: var(--font-title);
  font-size: 3.2rem;
  letter-spacing: 0.15em;
  color: var(--ember-glow);
  text-align: center;
  margin: 0 0 28px;
  opacity: 0;

  /* The snap: starts huge and bright, settles */
  transform: scale(1.18);
  text-shadow: none;
  transition: none; /* controlled by JS class swaps */
}

#awakening-name.name-snap {
  /* Frame 1: hits hard */
  opacity: 1;
  transform: scale(1.18);
  text-shadow:
    0 0 60px rgba(196,98,42,0.95),
    0 0 120px rgba(196,98,42,0.5),
    0 0 8px rgba(255,200,140,0.9);
  transition: none;
}

#awakening-name.name-settle {
  /* Frame 2: breathes back down */
  opacity: 1;
  transform: scale(1.0);
  text-shadow:
    0 0 30px rgba(196,98,42,0.5),
    0 0 60px rgba(196,98,42,0.2);
  transition: transform 0.7s ease, text-shadow 1.2s ease;
}

/* ── Everything below the name ────────────────────────────────── */
#awakening-below {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 1.4s ease, transform 1.4s ease;
}

#awakening-below.visible {
  opacity: 1;
  transform: translateY(0);
}

#awakening-tagline {
  font-size: 0.82rem;
  color: var(--text-dim);
  font-style: italic;
  letter-spacing: 0.06em;
  text-align: center;
}

#awakening-cta {
  font-family: var(--font-title);
  font-size: 0.72rem;
  letter-spacing: 0.25em;
  color: var(--text-dim);
  text-transform: uppercase;
  animation: breathe 2.5s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}

#awakening-btn {
  background: transparent;
  border: 1px solid var(--ember);
  color: var(--ember-glow);
  font-family: var(--font-title);
  font-size: 0.85rem;
  letter-spacing: 0.15em;
  padding: 12px 32px;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.2s;
}

#awakening-btn:hover {
  background: rgba(196,98,42,0.1);
  box-shadow: 0 0 20px rgba(196,98,42,0.3);
}
```

---

## STEP 3 — Replace showAwakening() with JS-driven sequencer

Find `showAwakening()` and replace it entirely:

```javascript
function showAwakening(characterName) {
  const overlay = document.getElementById('awakening-overlay');
  overlay.style.display = 'flex';
  overlay.style.opacity = '1';

  // Reset all elements to invisible
  document.querySelectorAll('.aw-line').forEach(el => el.classList.remove('visible'));
  const nameEl = document.getElementById('awakening-name');
  nameEl.textContent = characterName || '—';
  nameEl.className = ''; // clear name-snap / name-settle
  nameEl.style.opacity = '0';
  document.getElementById('awakening-below').classList.remove('visible');

  // Sequence each prose line using data-delay
  document.querySelectorAll('.aw-line').forEach(line => {
    const delay = parseFloat(line.dataset.delay || 0) * 1000;
    setTimeout(() => {
      line.classList.add('visible');
    }, delay);
  });

  // Name arrives at 7.4s — sharp snap
  setTimeout(() => {
    nameEl.classList.add('name-snap');
    nameEl.style.opacity = '1';

    // Then settle 80ms later
    setTimeout(() => {
      nameEl.classList.remove('name-snap');
      nameEl.classList.add('name-settle');
    }, 80);
  }, 7400);

  // Everything below fades in at 9.0s
  setTimeout(() => {
    document.getElementById('awakening-below').classList.add('visible');
  }, 9000);
}
```

---

## STEP 4 — completeAwakening() fade-out

Find `completeAwakening()` and ensure it's:

```javascript
async function completeAwakening() {
  const overlay = document.getElementById('awakening-overlay');
  overlay.style.transition = 'opacity 1.5s ease';
  overlay.style.opacity = '0';
  setTimeout(() => {
    overlay.style.display = 'none';
    overlay.style.opacity = '';
    overlay.style.transition = '';
    // Fade in the game
    requestAnimationFrame(() => {
      const app = document.getElementById('app');
      if (app) app.classList.add('visible');
    });
  }, 1500);
}
```

---

## TIMING SUMMARY

| Time   | Event |
|--------|-------|
| 0.3s   | "You are on the floor." |
| 1.1s   | "The stone is cold..." |
| 2.1s   | "You do not know how you got here." |
| 3.0s   | "You do not know where here is." |
| 3.9s   | "You do not know your name." |
| 5.0s   | "Wait." |
| 6.2s   | "You know one thing." |
| 7.4s   | **Name snaps in** — oversized, bright, immediate |
| 7.48s  | Name settles — scales down to normal, glow softens |
| 9.0s   | Tagline + "Open your eyes" + Wake Up button fade in together |

---

## VERIFICATION

- [ ] Each line appears one at a time, not all at once
- [ ] "Wait." hits harder because it's alone — single short line, long pause before it
- [ ] Name appears at full blast then visibly breathes back down
- [ ] Wake Up button is not visible until 9s
- [ ] Clicking Wake Up fades overlay, then fades game in
- [ ] On second login (returning player), awakening does NOT show
