---
name: Soteria Tactical Command
colors:
  surface: '#031427'
  surface-dim: '#031427'
  surface-bright: '#2a3a4f'
  surface-container-lowest: '#000f21'
  surface-container-low: '#0b1c30'
  surface-container: '#102034'
  surface-container-high: '#1b2b3f'
  surface-container-highest: '#26364a'
  on-surface: '#d3e4fe'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#d3e4fe'
  inverse-on-surface: '#213145'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#c2c6d8'
  on-secondary: '#2b303e'
  secondary-container: '#424656'
  on-secondary-container: '#b0b4c7'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#1bbd85'
  on-tertiary-container: '#00452e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#dee2f5'
  secondary-fixed-dim: '#c2c6d8'
  on-secondary-fixed: '#161b29'
  on-secondary-fixed-variant: '#424656'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  panel-padding: 20px
---

## Brand & Style
The design system is engineered for high-stakes, mission-critical disaster response. It adopts a **Tactical SaaS** aesthetic—a synthesis of high-density functionalism and modern Glassmorphism. The visual language prioritizes rapid information processing, environmental awareness, and authority.

The UI utilizes a "Command Center" philosophy:
- **Minimalism & Precision:** Heavy reliance on structured grids and functional whitespace to prevent cognitive overload during crises.
- **Glassmorphism:** Subtle translucent layers are used for floating overlays and secondary panels, allowing map data or telemetry to remain partially visible underneath.
- **Tactical Utility:** Elements are crisp with hairline borders, evoking the feel of high-end aerospace or specialized hardware interfaces.
- **Urgency-Driven Contrast:** A strict hierarchy of signals ensures that life-critical alerts immediately penetrate the systematic, subdued base UI.

## Colors
The palette is divided into "Operational Base" and "Alert States." 

### Base Tones
- **Primary (Cyan):** Used for active states, primary actions, and focused telemetry.
- **Surface:** In dark mode, surfaces utilize a deep slate (#0B101D) with varying levels of opacity to create depth without sacrificing the "void" aesthetic of the background.
- **Neutrals:** Used for secondary text and borders to maintain a low-profile interface until interaction is required.

### Semantic Alerts
- **High (Red):** Reserved strictly for immediate life-safety threats.
- **Medium (Amber):** Used for escalating situations and logistical bottlenecks.
- **Low (Emerald):** Indicates cleared sectors, stable vitals, or successful deployments.

In **Light Mode**, the interface flips to a high-contrast "Daylight" configuration using a white base (#FFFFFF) and slate text (#0F172A), optimized for outdoor visibility under direct sunlight.

## Typography
The system employs a dual-font strategy to distinguish between narrative content and technical data.

- **Primary Sans (Inter):** Used for all UI controls, headers, and instructional text. It provides high legibility and a neutral, professional tone.
- **Secondary Mono (JetBrains Mono):** Used exclusively for telemetry, coordinates, timestamps, and sensor readings. The monospaced nature ensures that fluctuating numbers do not cause layout "jitter" during real-time updates.

**Scale adjustments:** For mobile devices, `display-lg` should downscale to 32px to maintain viewport integrity. All labels should be uppercase when using the monospace font to enhance the "tactical" feel.

## Layout & Spacing
This design system utilizes a **Fixed Grid** logic for primary dashboards and a **Fluid Grid** for content-heavy internal views.

- **Grid:** A 12-column grid is used for desktop. Sidebars are fixed at 240px or 280px, while the central "Stage" or "Map" remains fluid.
- **The 4px Rule:** All spacing (margins, padding, gaps) must be multiples of 4px. This ensures a tight, engineered look.
- **Density:** The system defaults to "High Density." Elements are packed closer than a standard consumer app to maximize the information visible on a single screen.
- **Breakpoints:**
  - Mobile (< 768px): Single column, hidden sidebars (drawer), 16px margins.
  - Tablet (768px - 1280px): 8-column grid, collapsed icon-only sidebars.
  - Desktop (> 1280px): Full 12-column grid, persistent sidebars.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Backdrop Blurs** rather than traditional heavy shadows.

- **Level 0 (Base):** The #070A12 background.
- **Level 1 (Panels):** #0B101D with a 1px solid border (#1E293B). Used for primary content containers.
- **Level 2 (Overlays/Glass):** Surfaces with 80% opacity and a 12px backdrop blur. These "float" above Level 1 and feature a slightly brighter border (#334155).
- **Glow Effects:** Critical status indicators use a 4px to 8px outer glow (drop shadow with 0 offset and high spread) in the color of the severity (e.g., a red glow for emergency alerts).
- **Tactical Borders:** Use 1px internal strokes instead of shadows to define button shapes and input fields, reinforcing the "instrument panel" aesthetic.

## Shapes
The shape language is "Soft-Industrial." 

- **Standard Elements:** Use `0.25rem` (4px) corner radius. This provides a modern feel while remaining disciplined and professional.
- **Interactive Triggers:** Buttons and inputs follow the standard 4px radius.
- **Selection Indicators:** Tab highlights or active state indicators use sharp corners (0px) or very small offsets to maintain a precise, mechanical look.
- **Avoid:** Do not use pill-shaped buttons or large rounded corners, as they detract from the tactical, "built-for-purpose" narrative.

## Components
Consistent component behavior is vital for rapid interaction in high-stress environments.

- **Buttons:** Primary buttons use a solid Cyan (#06B6D4) background with dark text. Secondary buttons use a ghost style with a 1px border. "Danger" buttons feature a subtle pulse animation when an alert is active.
- **Status Indicators:** Small, circular "LED" icons. Use a CSS pulse animation for "Live" or "Active" states.
- **Input Fields:** Darker than the surface background with a 1px border that brightens to Cyan on focus. Use Monospace font for numerical inputs.
- **Cards:** No shadows. Instead, use 1px borders and a slightly lighter background hex than the base.
- **Chips/Tags:** Monospace text, all-caps, with a subtle background tint of the status color (e.g., Red background at 10% opacity for "CRITICAL" tags).
- **Telemetry Feeds:** High-density lists with alternating row highlights and JetBrains Mono for all data columns.
- **Map Controls:** Transparent "Glass" containers grouped in the corners of the viewport with icon-only buttons.