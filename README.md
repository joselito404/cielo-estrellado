# cielo-estrellado

A dark night-blue theme for the Claude Code desktop app, with a starry sky as its background: a Milky Way crossed by dust lanes, around two thousand stars, a few bright ones with soft glints, and the odd shooting star. Everything is drawn as pure vectors, so there are no images to download and nothing leaves your machine.

It is a Claude Code mod (a plugin made of a hooks module): it sets a theme at the start of each session and draws the backdrop. It only has a dark look.

## Install

At the prompt of a terminal session:

```
/plugin install cielo-estrellado --marketplace joselito404/cielo-estrellado
```

From a shell:

```
claude plugin install cielo-estrellado --marketplace joselito404/cielo-estrellado
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `joselito404/cielo-estrellado`, then **Add plugin**.

## Use

The sky is applied when a session starts. The `/fondo` command (Spanish for "background") switches it during a session:

- `/fondo estrellas` the still starry sky (the default). It is drawn once and uses almost no GPU while idle.
- `/fondo estrellas-animado` the same sky with twinkling stars and shooting stars. The app repaints the whole SVG on every frame, and on an RTX 5060 that took about 46% of the GPU while idle (about 5% with the still sky), so it is opt-in.
- `/fondo degradado` a plain blue gradient, in case the sky gives you trouble.

## Notes

- Built and checked on Claude Code 2.1.325 in the Windows desktop app. Installing it through the marketplace lines above has not been tested yet.
- In the animated variant only part of the movement is confirmed to run in the app: the `stroke-dashoffset` animations. The twinkling by `opacity` and `r`, and the shooting star by `transform`, are extras.
- The palette comes from the `makeColors` helper that ships with the plugin authoring guide (`hooks/make-colors.js`, kept as it was given).

## Licence

MIT, see [LICENSE](LICENSE).
