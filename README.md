# Prime Orbits

A static, full-screen portrait of the primes. Each prime has a concentric ring and a dot; there are no numbers or text on the canvas. Zero is at twelve o'clock and motion is clockwise.

At time `p`, the ring for prime `p` and its dot appear together at zero. The dot then completes one revolution every `p` time units. Frame steps stop exactly at each birth, carrying unused time to the following frame, so a new dot never first appears past zero.

Radii use prime rank divided by the continuous capacity `4 + 1.3 * (t + 4) / log(t + 4)`. This is a prime-number-theorem-shaped estimate with extra headroom, not a discrete prime count. Every ring, including 2, contracts smoothly as time advances. Capacity is tested against the actual prime count through one million. Very long runs eventually become visually dense and require more drawing work; the simulation does not impose a time cap.

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

The workflow checks pull requests and publishes only pushes to `main`, after checks pass. Set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. Merging the site PR will publish at https://ninjudd.com/primes/ (the account’s existing Pages domain). Only the five static site files are included in the deployment artifact.

## Verification

`npm test` checks prime discovery, exact zero at birth even across dropped frames, continuous phase, preserved elapsed time, reset, shrinking radii through births, and capacity through one million. All five tests should pass.

For a visual check, let the animation run: rings and dots should appear together at the top, existing rings should never jump at a birth, and dots should move smoothly clockwise. Pause should freeze the scene; reset while paused should leave just the 2-orbit with its dot at the top. Changing speed should update the multiplier without moving a paused scene. At narrow phone widths, all controls should remain visible below the canvas. Check these behaviors in the browser; the mathematical tests do not verify canvas appearance.
