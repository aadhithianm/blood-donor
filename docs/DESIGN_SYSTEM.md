# BloodLink Design System Specification

**Project:** BloodLink  
**Design Philosophy:** Trust, Urgency, Clarity, and Visual Excellence  
**Tokens, Primitives, Components & Micro-Interactions**  

---

## 1. Visual Identity & Color Palette

The color system blends life-affirming medical warmth with a modern, high-contrast, distraction-free interface. It supports both a crisp Light Mode and a deep, low-eye-strain Medical Dark Mode.

### 1.1 Primary Palette (Life & Urgency)
- **Crimson Brand 500:** `#DC2626` (HSL: `0, 72%, 50%`) - Primary action, emergency indicators, blood branding.
- **Crimson Brand 600 (Hover):** `#B91C1C` (HSL: `0, 74%, 42%`) - Active states.
- **Crimson Glow / Tint:** `rgba(220, 38, 38, 0.12)` - Glowing card halos, focus rings.
- **Deep Ruby:** `#7F1D1D` - Critical banners and high-contrast badges.

### 1.2 Neutral & Surface System (Dark & Light)
| Token | Light Mode | Dark Mode (Default for Emergency Ops) |
| :--- | :--- | :--- |
| **`--bg-canvas`** | `#F8FAFC` (Slate 50) | `#090D16` (Deep Midnight Obsidian) |
| **`--bg-surface`** | `#FFFFFF` (Pure White) | `#111827` (Card Surface) |
| **`--bg-surface-elevated`**| `#F1F5F9` (Slate 100) | `#1F2937` (Modal / Dropdown) |
| **`--border-subtle`** | `#E2E8F0` (Slate 200) | `rgba(255, 255, 255, 0.08)` |
| **`--border-active`** | `#CBD5E1` (Slate 300) | `rgba(255, 255, 255, 0.18)` |
| **`--text-primary`** | `#0F172A` (Slate 900) | `#F9FAFB` (Gray 50) |
| **`--text-secondary`** | `#475569` (Slate 600) | `#9CA3AF` (Gray 400) |
| **`--text-muted`** | `#94A3B8` (Slate 400) | `#6B7280` (Gray 500) |

### 1.3 Semantic States
- **Success (Eligible / Verified / Donated):** `#10B981` (Emerald 500) / BG: `rgba(16, 185, 129, 0.12)`
- **Warning (Cooldown / Expiring / Low Stock):** `#F59E0B` (Amber 500) / BG: `rgba(245, 158, 11, 0.12)`
- **Emergency / Urgent:** `#EF4444` (Red 500) / Pulse: `animate-pulse`
- **Info / Hospital:** `#3B82F6` (Blue 500) / BG: `rgba(59, 130, 246, 0.12)`

---

## 2. Typography Hierarchy

We utilize **Outfit** for distinctive headings and numbers, paired with **Inter** for clinical readability and density.

- **Display 1:** `font-heading font-extrabold text-4xl md:text-5xl tracking-tight` (Hero headline)
- **Heading 1:** `font-heading font-bold text-2xl md:text-3xl` (Dashboard main titles)
- **Heading 2:** `font-heading font-semibold text-xl` (Section headers, modal titles)
- **Heading 3:** `font-sans font-semibold text-base` (Card headings, table headers)
- **Body Regular:** `font-sans font-normal text-sm text-secondary leading-relaxed`
- **Caption / Metadata:** `font-sans font-medium text-xs text-muted tracking-wide`
- **Blood Group Tag:** `font-heading font-black text-lg tracking-wider`

---

## 3. UI Primitives & Components

1. **Glassmorphic Stat Cards:** Subtle background blur (`backdrop-blur-md`), 1px translucent borders, glowing icon container with accent tint.
2. **Interactive Blood Group Selector:** Octagonal/Pill grid buttons with active glow state and compatibility preview tooltip.
3. **Emergency Pulsing Banner:** Sticky red banner for active critical requests in user's home district with one-click response button.
4. **Availability Pill Switch:** Dynamic switch showing "Available to Donate" (Emerald glow) vs "On Cooldown (18 days left)" (Amber badge).
5. **Interactive Map Container:** Rounded 16px frame with custom red hospital markers, donor density circles, and zoom-to-district controls.

---

## 4. Accessibility & Micro-Interactions

- **Focus States:** Every interactive button and input features `focus-visible:ring-2 focus-visible:ring-red-500/50`.
- **Contrast Ratios:** All text combinations exceed WCAG 2.1 AA standards (minimum 4.5:1 for body copy).
- **Reduced Motion:** All framer-motion animations respect `prefers-reduced-motion: reduce`.
- **Screen Reader Support:** Full ARIA landmarks (`role="status"`, `aria-live="polite"`, `aria-label` on icon-only buttons).
