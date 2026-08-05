# Assets, OpenGraph & Partner Logo Guidelines

This guide documents branding assets, OpenGraph link card specifications, and partner logo integrations.

---

## 🖼️ OpenGraph & Twitter Card Metadata

OpenGraph metadata is configured globally in `src/routes/__root.tsx`.

### 1. Dynamic Origin Resolution (`getOgImageUrl`)
Crawlers (Facebook, Messenger, Discord, LinkedIn) require absolute HTTPS image URLs (`https://...`). To support local testing, staging, and production seamlessly, `getOgImageUrl` resolves origins dynamically with a site fallback (`import.meta.env.VITE_SITE_URL` or `https://msc-qcu.tech`):

```typescript
const getOgImageUrl = (path: string): string => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  if (import.meta.env.VITE_SITE_URL) {
    return `${import.meta.env.VITE_SITE_URL.replace(/\/$/, "")}${path}`;
  }
  return path;
};
```

### 2. OpenGraph Banner Asset Specifications
- **File Location**: `public/OpenGraph-Banner.jpg`
- **Dimensions**: 1216 × 640 px (standard 1.91:1 ratio for mobile cards)
- **Format**: Native JPEG (`image/jpeg`)
- **File Size Limit**: **Strictly under 300 KB** (298 KB). Crawlers drop or refuse to render link preview images exceeding 300 KB.
- **Required Meta Tags**:
  - `og:image`: Direct image URL
  - `og:image:secure_url`: Explicit HTTPS URL required by Facebook externalhit crawler
  - `og:image:type`: `image/jpeg`
  - `og:image:width`: `1216`
  - `og:image:height`: `640`

### 3. Clearing Cached Link Previews on Facebook
Facebook caches Open Graph data for shared links. If Facebook previously cached a blank/white image:
1. Open the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/).
2. Paste the shared link URL (e.g. `https://msc-qcu.tech`).
3. Click **"Debug"** and then click **"Scrape Again"** to refresh Facebook's cached metadata and preview image.

---

## 🤝 Partner Logo Carousel Integration

Partner logos displayed in `WallOfLogos` on `src/routes/index.tsx` follow these standards:

### 1. File Location & Format
- **Directory**: `src/assets/images/partners/`
- **Format**: Vector SVG (`.svg`)
- **Design Rule**: SVGs should contain **only the icon shape/glyph** (no text elements inside the SVG). Text inside SVGs can clash with light/dark theme backgrounds.
 - **Examples**: `power-bi.svg`, `devcon-manila.svg`

### 2. Adding a New Partner
1. Place the clean icon SVG in `src/assets/images/partners/` (e.g. `power-bi.svg`).
2. Import the asset in `src/routes/index.tsx`:
   ```typescript
   import powerBiLogo from "../assets/images/partners/power-bi.svg";
   ```
3. Add the partner to the `PARTNERS` array with their display name:
   ```typescript
   const PARTNERS: Partner[] = [
     ...
     { name: "MSC Philippines", logo: mscPhilippinesLogo },
   ];
   ```
3. Keep the array order intentional: `WallOfLogos` renders partner sets from the `PARTNERS` array in sequence, so moving an entry changes the visual order on the homepage.

### 3. Responsive Layout Rules (mobile)

The slideshow stacks every slide into a single CSS grid cell (`col-start-1 row-start-1`) and cross-fades with opacity, instead of absolutely positioning slides inside a fixed-height box. This matters:

- **No fixed height / no `overflow-hidden`**: the container auto-sizes to the tallest slide, so the 2-column mobile grid (3 rows for 5 partners) is never clipped.
- **Logo bubble** uses `shrink-0` so the circular badge keeps its aspect ratio at narrow widths.
- **Partner name** uses `w-full break-words leading-snug text-balance`, allowing two-line names ("Microsoft Azure Community Philippines") to wrap instead of being cut off.
- Tiles are `w-full min-w-0 max-w-[9rem]` on mobile and revert to the fixed `sm:w-28` flex row from `sm:` up.

When adding a partner with a long name, verify the section at a 390 px viewport before shipping.


