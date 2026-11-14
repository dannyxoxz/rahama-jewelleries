# Rahama Essentials — responsive slideshow upgrade

The homepage hero now uses a product-led editorial slideshow instead of the 3D viewer.

- Slides are populated from the existing product catalogue and use each product's existing image URL.
- Automatic rotation every 5.2 seconds, pause/play, previous/next controls, and slide indicators.
- Touch swipe support on mobile.
- Responsive layout with a dedicated mobile composition and reduced-motion support.
- The original product catalogue, cart, admin page, API/backend and WhatsApp enquiry links are retained.

## Run locally

From the project root, install dependencies with `npm install`, then in separate terminals run `cd backend && npm install && npm run dev` and `cd frontend && npm install && npm run dev`.

The slideshow uses the existing product image fields. If a product has no image, the hero displays a branded fallback panel. No Blender files or 3D viewer are required for this version.
