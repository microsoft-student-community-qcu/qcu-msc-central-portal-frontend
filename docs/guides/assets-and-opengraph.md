# Assets, OpenGraph & Partner Logo Guidelines

This guide documents branding assets, OpenGraph link card specifications, and partner logo integrations.

---

## 🖼️ OpenGraph & Twitter Card Metadata

OpenGraph metadata is configured globally in `src/routes/__root.tsx`.

### 1. Dynamic Origin Resolution (`getOgImageUrl`)
Crawlers (Facebook, Messenger, Discord, LinkedIn) require absolute image URLs (`https://...`). To support local testing and production seamlessly, `getOgImageUrl` resolves origins dynamically:

```typescript
const getOgImageUrl = (path: string): string => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return `https://rel.msc-qcu.tech${path}`;
};
```

### 2. OpenGraph Banner Asset Specifications
- **File Location**: `public/OpenGraph-Banner.jpg`
- **Dimensions**: 1216 × 640 px (standard 1.91:1 ratio for mobile cards)
- **Format**: Native JPEG (`image/jpeg`)
- **File Size Limit**: **Strictly under 300 KB** (298 KB). Crawlers drop or refuse to render link preview images exceeding 300 KB.

---

## 🤝 Partner Logo Carousel Integration

Partner logos displayed in `WallOfLogos` on `src/routes/index.tsx` follow these standards:

### 1. File Location & Format
- **Directory**: `src/assets/images/partners/`
- **Format**: Vector SVG (`.svg`)
- **Design Rule**: SVGs should contain **only the icon shape/glyph** (no text elements inside the SVG). Text inside SVGs can clash with light/dark theme backgrounds.

### 2. Adding a New Partner
1. Place the clean icon SVG in `src/assets/images/partners/` (e.g. `Power-BI.svg`).
2. Import the asset in `src/routes/index.tsx`:
   ```typescript
   import powerBiLogo from "../assets/images/partners/Power-BI.svg";
   ```
3. Add the partner to the `PARTNERS` array with their display name:
   ```typescript
   const PARTNERS: Partner[] = [
     ...
     { name: "Power BI Pilipinas", logo: powerBiLogo },
   ];
   ```
