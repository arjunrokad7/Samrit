# Samrit visual language

This refresh follows the supplied `design_rulebook.md`, `Fonts.txt`, Tailwind
configuration, and three PNG brand assets. They are design references for this
change; their embedded assistant wording does not expand the task scope.

The existing page layouts, roles, data, and API workflows remain in place.
The active Samrit UI uses Tailwind utilities through shared recipes in
`frontend/src/samrit/design.ts` and tokens in `frontend/tailwind.config.js`.
`design-entry.css` contains only the Tailwind directives and required Leaflet
library stylesheet import. The old legacy screens are not mounted by the router.

| Token | Color | Use |
| --- | --- | --- |
| samrita-charcoal | #244557 | Navigation, headlines, footer |
| samrita-teal | #376c6f | Feature surfaces, links, callouts |
| samrita-spruce | #2f4f31 | Deep accents and stacked edges |
| samrita-fern | #537a5a | Main actions and success states |
| samrita-iron | #484d48 | Supporting text and dark edges |

Dark brand surfaces use white text. Main page backgrounds use slate-50.
Cards, buttons, and form controls use rounded-2xl; primary buttons and feature
cards have solid stacked edges. Temporary photo, QR camera, and feedback entry
use bottom sheets with rounded-t-3xl and black/50 backdrops. Dialogs support
Escape, keyboard focus containment, focus restoration, and scroll locking.

## Typography

Lilita One is served locally for headings and highlighted numbers. Telegraf and
PP Telegraf are first in the body-font stack. No Telegraf font binary was supplied,
so browsers without that font installed use the bundled DM Sans fallback.
This does not claim to include or redistribute Telegraf. A licensed webfont can
be added later when supplied. Lilita One and DM Sans come from their Fontsource
packages, including the packages' font licenses.

## Brand assets

The supplied PNGs are copied unchanged to `frontend/public/brand`:

- `samrit-dark.png`: dark lettering for light backgrounds.
- `samrit-light.png`: white lettering for dark backgrounds.
- `logoleaf.png`: standalone leaf for the hero and favicon.

The logo component accounts for the transparent padding through its layout;
it does not recolor, crop, or regenerate the source PNG files.

## Validation

The frontend production build and scoped lint check are run alongside the
existing browser smoke checks. Desktop and mobile screenshots are written to
the ignored `.screenshots` folder. Computed palette/font styles and the new
photo/feedback sheet interactions are also checked in Chrome.
