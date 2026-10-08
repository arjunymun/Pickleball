# Venue assets

Real academy photographs inspected on the user-supplied District venue listing:
https://www.district.in/play/doon-pickleball-academy-doon-pickleball-academy-dehradun-slots-booking

- academy-daylight.jpg — District publisher image 01KVDA5E20VX05N0ST0MYFA8PZ, 1600×900.
- academy-evening.jpg — District gallery 01KVDA7W6V4J608HFYNXKA2P3F, evening overhead.
- academy-courts.jpg — District gallery 01KVDA7ZD65QJM5194JM98JBJK, reverse daytime view.
- academy-night.png — Owner-supplied District night-court image, 540×304, added October 6. Copied unchanged from the attachment and retained as an original; it is not used in the current page assignments.

Photo assignments in the film pass: the homepage uses academy-courts.jpg as its primary daytime photo and academy-evening.jpg for the later evening view. Contact and membership use academy-daylight.jpg; booking review uses academy-courts.jpg for the reverse daytime view; sign-in retains academy-evening.jpg for its night view. Customer photos use the explicitly allowed Next.js quality 90 setting. The two main homepage photograph sections no longer repeat the same image.

The hero film (`public/media/doon-film.mp4`) and poster (`public/media/doon-film-poster.jpg`) are original procedural 3D artwork rendered locally from `motion/index.tsx` and `motion/court-film.tsx`, using Remotion/Three.js. Eight seconds, 30 fps, 1280×720, silent H.264; video approximately 2 MB. The court/ball are illustrative, not captured venue footage or a claim about physical court numbering. Reproduce with `npm run film:render` and `npm run film:poster`; the editable preview is `npm run film:studio`. Source tools are development dependencies only; the public site serves native video and an optional separately loaded court explorer. Remotion's free license permits the individual owner's video creation: https://www.remotion.dev/docs/license/pricing.

The homepage and Contact page use the academy's exact Google Maps Share → Embed a map URL, retrieved October 6. This standard embed uses no API key or billing configuration. It is lazy-loaded, with an external Maps link available if embedded maps are blocked. Third-party Google listing hours/contact information are not used to overwrite the owner's business rules.

Copied without image edits from browser-observed asset bundles. The user identifies this academy as their business. No platform watermarks removed. Use next/image responsive crops; replace with owner-supplied originals if needed during final owner setup. Court selector is schematic: physical court-number positions are not asserted from these photographs.

The October 7 composition pass adds an original transparent ball illustration (`public/media/doon-ball.webp`, 1024×1024). It is rendered locally with the existing procedural ball geometry and brighter studio lighting in the `DoonBall` Still (`motion/hero-ball.tsx`), then encoded with the existing Sharp dependency at quality 92. Reproduction: local Remotion CLI `still motion/index.tsx DoonBall .cache/doon-ball.png --image-format=png --gl=angle`; Sharp WebP encoding. It is intentional website artwork, not venue photography. No generated build/cache files are committed. The public hero needs no Three/Remotion runtime. Pointer-responsive depth is decorative, bounded, and disabled under reduced motion.
