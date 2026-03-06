# Cursor Prompt — Opening Sequence Atmospheric Overhaul
# Paste this entire prompt into Cursor
# Touch index.html only. No backend changes.

---

The opening sequence — account creation through first awakening — needs to feel
like the city is watching the player before they even enter. Currently it is
functional but flat. This prompt adds atmosphere, animation, and continuity
across the entire flow.

Read the full prompt before starting. The changes are layered and interdependent.

---

## THE PROBLEM (from screenshots)

1. Login/register: white input fields on dark background, standard form feel,
   no atmosphere. Inputs look like a banking site.
2. Tab copy: "New Account" — should feel diegetic, not administrative.
3. Lineage cards: all appear simultaneously, no stagger, no selection pulse.
4. Echo/Instinct cards: same problem.
5. Stat distribution: floating modal, feels disconnected.
6. Awakening sequence: text just appears, no pulse, no uneven reveal, too small.
7. Auth-to-game transition: `auth-screen.hidden` is `display:none` — hard cut.

---

## STEP 1 — CSS: Animations and Effects

Add these keyframes and utility classes to the `<style>` block.
Add them after the existing `@keyframes spin` definition.

```css
/* ── Atmospheric animations ────────────────────────────────────── */

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInSlow {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes breathe {
  0%, 100% { opacity: 0.85; }
  50%       { opacity: 1; }
}

@keyframes jitter {
  0%   { transform: translate(0, 0); }
  20%  { transform: translate(-1px, 0); }
  40%  { transform: translate(1px, 0); }
  60%  { transform: translate(0, -1px); }
  80%  { transform: translate(1px, 1px); }
  100% { transform: translate(0, 0); }
}

@keyframes emberSnap {
  0%   { box-shadow: none; }
  50%  { box-shadow: 0 0 12px rgba(196,98,42,0.6), inset 0 0 8px rgba(196,98,42,0.1); }
  100% { box-shadow: 0 0 6px rgba(196,98,42,0.3); }
}

@keyframes textPulse {
  0%   { opacity: 0.2; text-shadow: none; }
  60%  { opacity: 1; text-shadow: 0 0 20px rgba(196,98,42,0.4); }
  100% { opacity: 1; text-shadow: 0 0 8px rgba(196,98,42,0.2); }
}

@keyframes revealUneven {
  0%   { opacity: 0; letter-spacing: 0.4em; }
  40%  { opacity: 0.7; letter-spacing: 0.25em; }
  70%  { opacity: 0.9; letter-spacing: 0.2em; }
  100% { opacity: 1; letter-spacing: inherit; }
}

@keyframes wakeSnap {
  0%   { opacity: 0; transform: scale(0.97); }
  80%  { opacity: 0; transform: scale(0.97); }
  81%  { opacity: 1; transform: scale(1.01); }
  100% { opacity: 1; transform: scale(1); }
}

/* Staggered child reveal — add to parent, children get delay via nth-child */
.stagger-reveal > * {
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards;
}
.stagger-reveal > *:nth-child(1) { animation-delay: 0.05s; }
.stagger-reveal > *:nth-child(2) { animation-delay: 0.15s; }
.stagger-reveal > *:nth-child(3) { animation-delay: 0.25s; }
.stagger-reveal > *:nth-child(4) { animation-delay: 0.35s; }
.stagger-reveal > *:nth-child(5) { animation-delay: 0.45s; }
.stagger-reveal > *:nth-child(6) { animation-delay: 0.55s; }
.stagger-reveal > *:nth-child(7) { animation-delay: 0.65s; }
.stagger-reveal > *:nth-child(8) { animation-delay: 0.75s; }

/* Auth screen transition */
#auth-screen {
  transition: opacity 1.2s ease;
}
#auth-screen.fading-out {
  opacity: 0;
  pointer-events: none;
}
/* Remove the hard display:none — use opacity instead */
#auth-screen.hidden {
  display: none; /* keep for safety — but we fade first then hide */
}
```

---

## STEP 2 — Auth Screen: Labels and Input Styling

### Tab copy

Find the auth tabs HTML and change the tab labels:
```html
<button class="auth-tab active" id="tab-login" ...>Sign In</button>
<button class="auth-tab" id="tab-register" ...>New Account</button>
```
→
```html
<button class="auth-tab active" id="tab-login" ...>Return</button>
<button class="auth-tab" id="tab-register" ...>Enter for the First Time</button>
```

### Form labels — diegetic copy

Find the login form labels and change:
- `Username` → `Who walks the ash?`
- `Password` → `What shape does your memory take?`
- Button: `Enter Verasanth` — keep as-is ✓

Find the register form labels and change:
- `Username` → `What name will the city record?`
- `Password` → `What shape does your memory take?`
- `Character Name` → `The one thing you remember`
- Button: `Begin Your Story` — keep as-is ✓

### Input focus glow

Find `.form-input:focus` and update to:
```css
.form-input:focus {
  border-color: var(--ember);
  box-shadow: 0 0 12px rgba(196,98,42,0.25), inset 0 0 6px rgba(196,98,42,0.05);
  animation: none;
}
```

### Input hover chromatic aberration
Add to the style block:
```css
.form-input:hover {
  border-color: rgba(196,98,42,0.5);
  /* subtle chromatic shift on hover */
  filter: drop-shadow(0.5px 0 0 rgba(196,98,42,0.3)) drop-shadow(-0.5px 0 0 rgba(100,140,200,0.15));
  transition: filter 0.15s, border-color 0.2s;
}
```

### Auth logo jitter
The `#auth-logo` currently uses `emberPulse`. Add a jitter pass on every 6th cycle:
```css
#auth-logo {
  /* existing styles preserved */
  animation: emberPulse 4s ease-in-out infinite, jitter 0.08s steps(1) 6;
  animation-delay: 0s, 3s;
}
```

---

## STEP 3 — Auth Screen Fade Transition

Replace the hard `classList.add('hidden')` pattern with a fade.

Find every instance of:
```javascript
document.getElementById('auth-screen').classList.add('hidden');
```

Replace each with:
```javascript
fadeOutAuthScreen();
```

Add this function to the script section:
```javascript
function fadeOutAuthScreen() {
  const screen = document.getElementById('auth-screen');
  screen.classList.add('fading-out');
  setTimeout(() => {
    screen.classList.add('hidden');
    screen.classList.remove('fading-out');
  }, 1200);
}
```

---

## STEP 4 — Lineage Cards: Staggered Reveal + Selection Pulse

### Find the lineage/race selection container
In the register form HTML, find the race select element:
```html
<select class="form-select" id="input-race">
```

Replace the `<select>` with a card grid. The current select drops races from
the API — the new version will do the same but render as cards.

**Replace the race form-field block** with:
```html
<div class="form-field">
  <label class="form-label">Your lineage shapes your strengths.</label>
  <div class="lineage-grid stagger-reveal" id="lineage-grid">
    <!-- Populated by JS from /api/data/races -->
  </div>
  <input type="hidden" id="input-race" value="">
</div>
```

**Add CSS:**
```css
.lineage-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.lineage-card {
  padding: 10px 14px;
  border: 1px solid var(--border-warm);
  background: transparent;
  color: var(--text);
  font-family: var(--font-body);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.lineage-card:hover {
  border-color: rgba(196,98,42,0.5);
  background: rgba(196,98,42,0.04);
  filter: drop-shadow(0.5px 0 0 rgba(196,98,42,0.2)) drop-shadow(-0.5px 0 0 rgba(100,140,200,0.1));
}

.lineage-card.selected {
  border-color: var(--ember);
  background: rgba(196,98,42,0.08);
  animation: emberSnap 0.4s ease forwards;
  color: var(--text-bright);
}

.lineage-card .lineage-name {
  font-family: var(--font-title);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  color: var(--ember-glow);
  display: block;
  margin-bottom: 2px;
}

.lineage-card .lineage-bonuses {
  font-size: 0.78rem;
  color: var(--text-dim);
  letter-spacing: 0.04em;
}
```

**Update the races init JS** — find where races are loaded (in `init()`) and replace:
```javascript
const sel = document.getElementById('input-race');
for (const [id, info] of Object.entries(data.races)) {
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = info.name || id;
  sel.appendChild(opt);
}
```
→
```javascript
const grid = document.getElementById('lineage-grid');
if (grid) {
  for (const [id, info] of Object.entries(data.races)) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'lineage-card';
    card.dataset.raceId = id;
    // Format bonuses from race stat_mods
    const mods = info.stat_mods || {};
    const bonusStr = Object.entries(mods)
      .map(([stat, val]) => `${stat.toUpperCase()} ${val > 0 ? '+' : ''}${val}`)
      .join(' · ');
    card.innerHTML = `
      <span class="lineage-name">${info.name || id}</span>
      <span class="lineage-bonuses">${bonusStr}</span>
    `;
    card.addEventListener('click', () => {
      grid.querySelectorAll('.lineage-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      document.getElementById('input-race').value = id;
    });
    grid.appendChild(card);
  }
}
```

---

## STEP 5 — Echo/Instinct Cards: Staggered Reveal

Find `renderInstincts()` — the function that builds the instinct grid.
The instinct buttons are rendered into `#instinctGrid`.

After the instinct grid is populated, add the stagger class:
```javascript
instinctGrid.classList.add('stagger-reveal');
// Force reflow so the animation triggers
instinctGrid.offsetHeight;
```

Also update the instinct card hover state. Find `.instinct:hover` or add:
```css
.instinct:hover {
  border-color: rgba(196,98,42,0.5);
  filter: drop-shadow(0.5px 0 0 rgba(196,98,42,0.2)) drop-shadow(-0.5px 0 0 rgba(100,140,200,0.1));
}

.instinct.selected {
  /* existing selected styles — add pulse */
  animation: emberSnap 0.4s ease forwards;
}
```

---

## STEP 6 — Stat Distribution: Point Labels, Not Just Numbers

Find `renderPointBuy()`. The stat labels currently show just stat names and
stepper controls. Add flavor framing:

Find the section heading (h3 or similar) that says "Set your stats" or
"Distribute Your Echoes" and update to:
```html
<div class="stat-screen-header">
  <div class="stat-title">Distribute Your Echoes</div>
  <div class="stat-subtitle">Your body remembers more than your mind does.</div>
</div>
```

Add CSS:
```css
.stat-title {
  font-family: var(--font-title);
  font-size: 1.1rem;
  letter-spacing: 0.15em;
  color: var(--ember-glow);
  animation: revealUneven 0.8s ease forwards;
}
.stat-subtitle {
  font-size: 0.78rem;
  color: var(--text-dim);
  font-style: italic;
  margin-top: 4px;
  animation: fadeInSlow 1.2s ease forwards;
  animation-delay: 0.4s;
  opacity: 0;
  animation-fill-mode: forwards;
}
```

Stepper button click — add a visual pulse. Find where `renderPointBuy()` is
called on stepper clicks, and after re-render add:
```javascript
btn.style.animation = 'none';
btn.offsetHeight; // reflow
btn.style.animation = 'emberSnap 0.3s ease forwards';
```

---

## STEP 7 — Awakening Sequence

This is the most important change. The awakening screen currently shows text
that just appears. It needs to feel like the player is regaining consciousness.

### Find the awakening HTML
Look for the `#wake-screen`, `#awakening`, or the screen with the
"You are on the floor..." text. It may be called something like
`startTrueWelcomeFromCharacter` triggering a modal, or a dedicated screen.

If the awakening is triggered as part of `loadGame()` after first registration,
add the awakening screen as an intermediate overlay before the game UI loads.

**Add HTML** — after the auth-screen div, before the main app div:
```html
<!-- ── Awakening Overlay ─────────────────────────────────────────── -->
<div id="awakening-overlay" style="display:none">
  <div id="awakening-text"></div>
  <div id="awakening-name"></div>
  <div id="awakening-tagline"></div>
  <div id="awakening-cta">— Open your eyes —</div>
  <button id="awakening-btn" onclick="completeAwakening()">Wake Up</button>
</div>
```

**Add CSS:**
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

#awakening-text {
  font-family: var(--font-body);
  font-size: 0.92rem;
  line-height: 2.2;
  text-align: center;
  color: var(--text);
  max-width: 440px;
  opacity: 0;
  animation: fadeInSlow 2s ease forwards;
  animation-delay: 0.5s;
}

#awakening-name {
  font-family: var(--font-title);
  font-size: 2.8rem;
  letter-spacing: 0.2em;
  color: var(--ember-glow);
  margin: 32px 0 12px;
  opacity: 0;
  animation: textPulse 1.8s ease forwards;
  animation-delay: 2.2s;
  text-shadow: 0 0 40px rgba(196,98,42,0.5);
}

#awakening-tagline {
  font-size: 0.78rem;
  color: var(--text-dim);
  font-style: italic;
  letter-spacing: 0.08em;
  opacity: 0;
  animation: fadeInSlow 1s ease forwards;
  animation-delay: 3.6s;
  animation-fill-mode: forwards;
  margin-bottom: 28px;
}

#awakening-cta {
  font-family: var(--font-title);
  font-size: 0.72rem;
  letter-spacing: 0.25em;
  color: var(--text-dim);
  text-transform: uppercase;
  opacity: 0;
  animation: breathe 2.5s ease-in-out infinite;
  animation-delay: 4.2s;
  animation-fill-mode: forwards;
  margin-bottom: 28px;
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
  opacity: 0;
  animation: wakeSnap 5s ease forwards;
  transition: all 0.2s;
}

#awakening-btn:hover {
  background: rgba(196,98,42,0.1);
  box-shadow: 0 0 20px rgba(196,98,42,0.3);
}
```

**Add JS:**
```javascript
// Track if this is a first-time registration (new character)
let isFirstWake = false;

function showAwakening(characterName) {
  const overlay = document.getElementById('awakening-overlay');
  overlay.style.display = 'flex';

  document.getElementById('awakening-text').innerHTML =
    `You are on the floor.<br>
     The stone is cold. The air smells of ash and old fire.<br>
     You do not know how you got here.<br>
     You do not know where here is.<br>
     You do not know your name.<br>
     Wait.<br>
     You know one thing.`;

  document.getElementById('awakening-name').textContent = characterName || '—';
  document.getElementById('awakening-tagline').textContent =
    'Hold onto it. This city takes everything else.';
}

async function completeAwakening() {
  const overlay = document.getElementById('awakening-overlay');
  overlay.style.transition = 'opacity 1.5s ease';
  overlay.style.opacity = '0';
  setTimeout(() => {
    overlay.style.display = 'none';
    overlay.style.opacity = '';
    overlay.style.transition = '';
  }, 1500);
}
```

**Wire the awakening into the registration flow:**

Find `doRegister()`. After successful registration and before (or instead of)
directly calling `loadGame()`, check if this is a new character and show awakening:

```javascript
// After vToken is set and data.token received:
vToken = data.token;
localStorage.setItem('v_token', vToken);
isFirstWake = true;

// Fade out auth screen first
fadeOutAuthScreen();

// Wait for auth fade, then show awakening
setTimeout(async () => {
  // Get character name from registration form
  const charName = document.getElementById('input-name')?.value?.trim() || '';
  showAwakening(charName);

  // Pre-load game in background while awakening plays
  await loadGame();
}, 1200);
```

**Remove** the `await loadGame()` and `fadeOutAuthScreen()` calls that were
previously at the end of `doRegister()` — they are now handled above.

---

## STEP 8 — Name Input: Ember Glow on Confirm

Find the character name input (`#input-name`). Add an event listener that
adds a glow when the user tabs out or presses Enter:

```javascript
const nameInput = document.getElementById('input-name');
if (nameInput) {
  nameInput.addEventListener('blur', () => {
    if (nameInput.value.trim()) {
      nameInput.style.boxShadow = '0 0 16px rgba(196,98,42,0.35), inset 0 0 8px rgba(196,98,42,0.08)';
      nameInput.style.borderColor = 'var(--ember)';
      nameInput.style.color = 'var(--ember-glow)';
    }
  });
  nameInput.addEventListener('input', () => {
    // Reset glow while typing
    nameInput.style.boxShadow = '';
    nameInput.style.borderColor = '';
    nameInput.style.color = '';
  });
}
```

---

## STEP 9 — Game Load: First Scene Fade-In

Currently `loadGame()` sets content and it all appears instantly.
When the game loads after awakening, content should fade in.

Find the main game container (e.g. `#app` or `#main-area`).

Add CSS:
```css
#app {
  /* existing styles */
  opacity: 0;
  transition: opacity 1.5s ease;
}
#app.visible {
  opacity: 1;
}
```

In `loadGame()`, after all content is set and the sidebar is populated,
add at the end:
```javascript
// Fade in the game
requestAnimationFrame(() => {
  document.getElementById('app').classList.add('visible');
});
```

If the app needs to be invisible again on logout, add `#app.classList.remove('visible')`
to the logout function before resetting content.

---

## VERIFICATION CHECKLIST

**Auth screen:**
- [ ] Login tab reads "Return", register tab reads "Enter for the First Time"
- [ ] Login labels: "Who walks the ash?" / "What shape does your memory take?"
- [ ] Register labels: "What name will the city record?" / etc.
- [ ] Input hover shows chromatic aberration (subtle color fringe)
- [ ] Input focus shows ember glow box-shadow
- [ ] Auth logo jitters briefly every ~7 seconds
- [ ] Tab switch is crossfade not instant (verify no visual glitch)

**Lineage cards:**
- [ ] Cards appear one by one, not all at once (stagger delay visible)
- [ ] Hovering a card shows chromatic aberration
- [ ] Clicking a card fires `emberSnap` pulse, stays selected
- [ ] Selected card value correctly updates `#input-race` hidden input
- [ ] Register form still submits the correct race ID

**Instinct cards:**
- [ ] Stagger reveal on each card (0.1s delay between each)
- [ ] Selected instinct pulses with `emberSnap`

**Stat distribution:**
- [ ] "Distribute Your Echoes" / "Your body remembers..." text present
- [ ] Title animates in with uneven reveal
- [ ] Stepper buttons pulse on click

**Awakening:**
- [ ] Shows only on first registration (not on subsequent logins)
- [ ] Text fades in over ~2s
- [ ] Player name appears with ember pulse at ~2.2s
- [ ] Tagline fades in at ~3.6s
- [ ] "— Open your eyes —" breathing at ~4.2s
- [ ] "Wake Up" button snaps into existence at ~5s
- [ ] Clicking "Wake Up" fades overlay out over 1.5s
- [ ] Game is already pre-loaded behind the overlay

**Game first load:**
- [ ] `#app` fades in from opacity 0 to 1 over 1.5s
- [ ] Room description appears before sidebar stats
- [ ] No visual pop / instant-appear on any element

---

## WHAT THIS DOES NOT DO (audio pass, separate)

- Ambient hum / dripping water / whisper SFX
- Heartbeat thrum before awakening
- Tavern ambience fade-in
- These require adding an `<audio>` element and Web Audio API — separate pass
  once visuals are confirmed working

---

## IMPORTANT NOTES FOR CURSOR

- Do not break the registration API call — the hidden `#input-race` input
  must still submit the race ID via `doRegister()`
- The `loadGame()` in the background during awakening must not
  make the game visible — `#app` starts at opacity 0
- The awakening overlay should only show for new registrations.
  Returning players (`doLogin()`) should load the game directly
  with the fade-in on `#app`
- Test the registration flow end-to-end after changes
