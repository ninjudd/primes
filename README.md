# Prime Orbits

A moving portrait of the prime numbers. Each prime begins an orbit of its own, surrounding all those that came before it.

[Watch Prime Orbits](https://ninjudd.com/primes/)

## The riddle

> All that came before me turns,<br>
> each in an orbit of its own,<br>
> each returning, in time, to nothing.
>
> If even one is empty when I arrive,<br>
> I am already spoken for—<br>
> a child of what came before.
>
> But when nothing is nowhere to be found,<br>
> I make a nothing of my own.
>
> There I begin,<br>
> orbiting now among the others,<br>
> returning again and again<br>
> as my footsteps multiply,<br>
> to claim all those that are mine.
>
> What am I?

<details>
<summary>The answer</summary>

The prime numbers.

Each orbit returns to zero at multiples of its prime. If an existing orbit is at zero when the next integer arrives, that number is composite. If none is at zero, the number is prime: it creates a new orbit and begins at zero itself.

</details>

## The idea

Count upward from 2. Each prime gets a concentric orbit with a moving dot. The orbit for 2 takes two counts to complete a turn; the orbit for 3 takes three; the orbit for 5 takes five. They all advance together, each at its own pace.

Zero sits at twelve o'clock. Whenever a dot returns there at an integer count, its prime divides that number. At 4, the 2-orbit is at zero, so no new orbit appears. At 5, neither the 2-orbit nor the 3-orbit is at zero, so 5 begins a new orbit. At 6, both 2 and 3 return to zero. At 7, none returns, and another orbit is born.

This is a sieve expressed through motion: existing primes account for composites, and every unclaimed integer starts a new cycle. The test for a new prime happens at integer counts; between them, the dots move smoothly.

## The visualization

The canvas contains only rings and dots, with no numbers or text. Motion is clockwise. At time `p`, the ring for prime `p` and its dot appear together at zero. Its phase is `2π × ((t − p) mod p) / p`, so it completes one revolution every `p` time units. Frame steps stop exactly at every integer count and carry unused time to the following frame, ensuring collisions and prime births appear at zero.

Each orbit’s circumference is proportional to its prime. Since circumference is `2πr`, its radius is proportional to the prime too:

```text
radius(p, t) = availableRadius × p / (t + 4)
```

The common scale shrinks continuously with time, including the innermost orbit for 2. New rings never make existing rings jump. Gaps between rings reflect gaps between primes. Because each dot completes a turn in `p` time units, all dots have the same tangential speed at a given instant; the inward motion from contraction is separate.

A prime-number-theorem estimate still controls dot size as the collection grows. Very long runs become visually dense, especially at the center, and require more drawing work; the simulation imposes no time cap.

## Use

- Play/pause: button or Space when a control is not focused.
- Reset: button or R when a control is not focused. Returns to time 2 and preserves pause and speed settings.
- ℙ / ℕ toggle: ℙ shows primes only; ℕ adds muted rings and dim, unglowing dots for non-prime positive integers (including 1). Each has period and radius proportional to its number. Switching views preserves the current time and playback state.
- Share: pauses at the current moment and opens the device’s share sheet, or copies a link. If copying is unavailable, a selectable link appears.
- Speed: 0.25×–16×; 1× advances one time unit per second.
- Reduced-motion preferences start the site paused. Hidden tabs do not advance time.

## Links to a moment

Open `https://ninjudd.com/primes#997.125` to restore time 997.125, paused so the recipient can see the exact arrangement before pressing Play. Integers work too: `#997` starts with the 997-orbit at zero. Sharing retains the full fractional time rather than rounding to a count. It captures the moment the button is pressed; speed and viewport size are not encoded. The optional `?nonprimes=1` query retains the ℙ / ℕ toggle setting.

Without a number, the page starts at 2 as usual. Invalid fragments are ignored with a short message. Large starting values generate primes in chunks so the page stays responsive; Reset cancels loading and clears the fragment. Extremely large values can still take substantial time and memory to reconstruct. Reset also clears a shared moment from the address bar.

## Local preview

No installation or build is required. From the repository root:

```sh
npm test
node --check app.js
python3 -m http.server 8080 --bind 127.0.0.1
```

Use Node.js 24 for the tests. Open http://127.0.0.1:8080 in a browser. Stop the preview server with Ctrl+C. Opening the HTML directly as a file will not load its JavaScript modules.

## GitHub Pages

The workflow checks pull requests and publishes only pushes to `main`, after checks pass. Set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The site is served at [ninjudd.com/primes](https://ninjudd.com/primes/), using the account’s existing Pages domain. Only the static site files and social preview image are included in the deployment artifact.

## Verification

`npm test` checks prime discovery, exact zero at birth even across dropped frames, continuous phase, preserved elapsed time, reset, shrinking radii through births, capacity through one million, proportional circumferences, and equal tangential speeds. All tests should pass.

For a visual check, let the animation run: rings and dots should appear together at the top, existing rings should never jump at a birth, and dots should move smoothly clockwise. Pause should freeze the scene; reset while paused should leave just the 2-orbit with its dot at the top. Changing speed should update the multiplier without moving a paused scene. At narrow phone widths, all controls should remain visible below the canvas. Check these behaviors in the browser; the mathematical tests do not verify canvas appearance.

## Rendering performance

The rings are cached in a separate canvas and scaled together continuously. That layer is rebuilt on a birth, resize, reset, or after 2% contraction to refresh stroke sharpness. Dot glow is drawn once into a small reusable sprite instead of blurring every dot every frame. The animation loop stops entirely while paused or hidden. Each visible frame still positions every dot, so extremely long runs can eventually slow down.

At high counts, estimated ring spacing also controls visual density. Once spacing falls below a pixel, the ring layer fades and dots get smaller with less glow. The densest dots also become more transparent so overlap reveals curves without washing out the scene. Every prime is still drawn at its exact position; this changes appearance, not the simulation or shared time.

Showing non-primes adds a dot for every non-prime integer reached, so very high starting numbers require more rendering work. Their glow is disabled and opacity adapts to density. Non-prime rings occupying the same physical pixel are combined in the cached ring layer; all non-prime dots remain positioned individually. Primes are drawn on top to keep them distinct.

## The zero beam

A small warm dot marks zero at the center and remains visible between shots.

During the final 0.5 simulation units before each integer count, a short beam travels vertically upward from the center along the zero direction, reaching the zero position 0.06 counts early and holding briefly for the dot to arrive. For a composite number it stops at the innermost prime orbit whose dot is at zero: the smallest prime divisor. For a prime, nothing blocks it, so it reaches the newly born orbit. Each beam matches its destination ring’s color, opacity, and stroke width. The impact and prime creation still happen at the integer count. The destination is predicted before the count; prime orbits still appear only at their exact birth time. A brief impact fades over 0.15 simulation units, preserving smooth orbital motion. After impact, the beam trail disappears and the brief impact mark follows the struck dot, so it does not look like a missed shot as the dot moves away.

Only prime dots block the beam in both ℙ and ℕ modes. Optional non-prime dots, including 1, are display context. Pausing freezes the pulse, and shared times restore its exact state. At very high speeds or low frame rates, the clock can lag while it presents every integer event; no count is skipped.

In ℕ mode, composite counts launch two synchronized beams from the center: the prime-colored beam stops at the blocking prime and a dim gray beam travels to the new number's orbit. Both use the same launch and arrival timing; the gray ring and dot appear at the integer count with no reveal delay. Each impact follows its own dot afterward. ℙ mode has only the prime beam, and prime births use a single prime-colored beam in either mode.
