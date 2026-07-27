# Space UI Design System Specification

The QCU MSC Central Portal uses a rich space-themed UI design system built with custom CSS variables, TailwindCSS, and glassmorphic UI utilities.

---

## 🎨 Color Palette & Theme Tokens

### Core Colors
- **Space Deep Blue (`--color-brand-blue-deep`)**: `#0f172a` (Primary dark background and high-contrast headings)
- **Mission Blue (`--color-brand-blue`)**: `#1e3a8a` (Interactive elements and navigation headers)
- **Orbit Orange (`--color-brand-orange`)**: `#f97316` (Accent badges, glowing callouts, progress bars)
- **Starlight White**: `#ffffff` (Text on dark cards, glass panel backgrounds)

### Background Gradients
- `var(--gradient-space)`: Deep radial dark space backdrop with star field particle overlay.
- `var(--gradient-cta)`: Vibrant linear gradient used for primary call-to-action buttons (`#1e3a8a` ➔ `#f97316`).

---

## ✨ Glassmorphism Component Utility (`glass-strong`)

Cards and step panels use custom glassmorphic styling:

```css
.glass-strong {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.4);
}
```

---

## 🔤 Typography & Font Hierarchy

- **Heading Font (`font-heading`)**: Outfit / Montserrat (Uppercase tracked labels, step badges, section titles)
- **Display Font (`font-display`)**: Inter / Plus Jakarta Sans (Main page titles, card headers)
- **Body Font (`font-body`)**: Inter (Readable paragraph text, inputs, form helper hints)
