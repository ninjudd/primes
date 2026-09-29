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

The canvas contains only rings and dots, with no numbers or text. Motion is clockwise. At time `p`, the ring for prime `p` and its dot appear together at zero. Its phase is `2π × ((t − p) mod p) / p`, so it completes one revolution every `p` time units. Frame steps stop exactly at each birth and carry unused time to the following frame, ensuring a new dot first appears at zero.

As the collection grows, every orbit contracts continuously, including the innermost orbit for 2. A new prime never makes the existing rings jump inward. Radius is proportional to prime rank divided by the smooth capacity:

```text
capacity(t) = 4 + 1.3 × (t + 4) / log(t + 4)
```

Here `log` is the natural logarithm. The capacity follows the prime-number-theorem scale, `t / log(t)`, with extra headroom. It depends on continuous time rather than the changing number of discovered primes. Capacity is tested against the actual prime count through one million. Very long runs eventually become visually dense and require more drawing work; the simulation imposes no time cap.

## Use

- Play/pause: button or Space when a control is not focused.
- Reset: button or R when a control is not focused. Returns to time 2 and preserves pause and speed settings.
- Speed: 0.25×–16×; 1× advances one time unit per second.
- Reduced-motion preferences start the site paused. Hidden tabs do not advance time.

## Local preview

No installation or build is required. From the repository root:

```sh
npm test
node --check app.js
python3 -m http.server 8080 --bind 127.0.0.1
```

Use Node.js 24 for the tests. Open http://127.0.0.1:8080 in a browser. Stop the preview server with Ctrl+C. Opening the HTML directly as a file will not load its JavaScript modules.

## GitHub Pages

The workflow checks pull requests and publishes only pushes to `main`, after checks pass. Set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The site is served at [ninjudd.com/primes](https://ninjudd.com/primes/), using the account’s existing Pages domain. Only the five static site files are included in the deployment artifact.

## Verification

`npm test` checks prime discovery, exact zero at birth even across dropped frames, continuous phase, preserved elapsed time, reset, shrinking radii through births, and capacity through one million. All five tests should pass.

For a visual check, let the animation run: rings and dots should appear together at the top, existing rings should never jump at a birth, and dots should move smoothly clockwise. Pause should freeze the scene; reset while paused should leave just the 2-orbit with its dot at the top. Changing speed should update the multiplier without moving a paused scene. At narrow phone widths, all controls should remain visible below the canvas. Check these behaviors in the browser; the mathematical tests do not verify canvas appearance.
