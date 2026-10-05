---
name: Kinetic Response
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#5c4037'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#916f65'
  outline-variant: '#e6beb2'
  surface-tint: '#ad3300'
  primary: '#a93100'
  on-primary: '#ffffff'
  primary-container: '#d34000'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb59e'
  secondary: '#705d00'
  on-secondary: '#ffffff'
  secondary-container: '#fcd400'
  on-secondary-container: '#6e5c00'
  tertiary: '#515c71'
  on-tertiary: '#ffffff'
  tertiary-container: '#6a758a'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59e'
  on-primary-fixed: '#3a0b00'
  on-primary-fixed-variant: '#842500'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-lg-bold:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-data:
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
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is engineered for high-stakes environments where clarity, speed, and trust are paramount. It serves a dual audience: citizens in distress requiring immediate guidance, and responders coordinating logistics. The emotional response is one of **urgent calm**—the UI must feel authoritative and steady while highlighting critical information with high-visibility cues.

The aesthetic follows a **Functional Minimalist** approach with **High-Contrast** accents. Every element is stripped of decorative flourish to maximize cognitive throughput. It prioritizes legibility under physical stress (e.g., direct sunlight, low-light environments, or shaky movement). The design balances the "institutional" reliability of government software with the "action-oriented" energy of emergency services.

## Colors

The palette is bifurcated into **Action** and **Atmosphere**.

- **Primary (International Orange):** Reserved strictly for primary calls to action, emergency alerts, and active distress signals.
- **Secondary (Safety Yellow):** Used for warnings, caution indicators, and secondary navigation elements that require attention without the panic of red.
- **Tertiary (Slate Blue):** Provides a calm, authoritative foundation for headers, sidebars, and structural elements.
- **Neutral (Slate Greys):** Used for text and non-critical borders to maintain a professional, systematic feel.

**Color Mode Support:**
- **Light Mode:** High-contrast (4.5:1 ratio minimum) for outdoor visibility.
- **Dark Mode:** Deep navy backgrounds (`#0F172A`) to reduce glare during nighttime operations while preserving the vibrancy of the Primary Orange.

## Typography

This design system utilizes **Inter** for all primary communication due to its exceptional tall x-height and legibility in high-pressure scenarios. For technical data—such as GPS coordinates, timestamps, or device IDs—**JetBrains Mono** is employed to prevent character confusion (e.g., 0 vs O, 1 vs l).

**Hierarchy Guidelines:**
- **Headlines:** Use heavy weights (700+) to anchor the page.
- **Body:** Standardized at 16px to ensure readability for a diverse age demographic.
- **Labels:** Uppercase monospaced labels are used for metadata to distinguish at a glance between "narrative" text and "data" points.

## Layout & Spacing

The layout utilizes a **strict 8px linear scale** to ensure alignment and predictability. 

- **Grid:** A 12-column fluid grid for desktop and a 4-column grid for mobile.
- **Touch Targets:** Minimum touch target size is 48px, even for smaller icons, to accommodate users with limited dexterity or those wearing gloves.
- **Content Density:** High density for data views (Responders) and low density with generous white space for emergency views (Citizens) to reduce overwhelm.
- **Safe Areas:** Significant bottom-padding is reserved for persistent emergency triggers (SOS buttons) that must remain accessible regardless of scroll position.

## Elevation & Depth

To maintain high contrast and a "secure" feeling, this design system avoids soft, decorative shadows in favor of **Tonal Layers** and **Rigid Outlines**.

1.  **Level 0 (Base):** The lowest surface (Background).
2.  **Level 1 (Surface):** Cards and main content blocks. Use a 1px solid border (`#E2E8F0` in light, `#1E293B` in dark) instead of a shadow.
3.  **Level 2 (Active):** Interactive elements when hovered or focused. Use a "Hard Shadow" (4px offset, 0px blur) in the Primary color to denote tactical focus.
4.  **Level 3 (Emergency):** High-priority modals or alerts. These use a high-opacity backdrop blur (60%) to mask the background and force focus on the urgent task.

## Shapes

The design system uses **Soft (0.25rem)** roundedness. This "Semi-Square" approach strikes a balance between the friendliness of rounded corners and the professional, industrial precision of sharp corners. 

- **Standard Elements:** 4px radius (Buttons, Inputs, Small Cards).
- **Large Containers:** 8px radius (Main Content areas).
- **Pills:** Used exclusively for status tags (e.g., "STABLE", "ACTIVE") to differentiate them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid International Orange with white text. Bold, all-caps for emergency triggers.
- **Secondary:** Solid Slate Blue or Outline Orange. 
- **Critical:** Red background, pulsing animation for active SOS states.

### Role-Based Cards
Cards should include a "Role Header"—a small monospaced label at the top indicating if the card is for "CITIZEN", "FIRST RESPONDER", or "VOLUNTEER." This ensures users only process information relevant to their clearance.

### Secure Input Fields
Inputs use a thick 2px border when focused. Success states are marked with a heavy green checkmark, and errors use a "Warning Yellow" background to indicate data needs correction before proceeding.

### Theme Toggle
A prominent, accessible toggle in the global navigation allows users to switch between Light, Dark, and a "High-Visibility" (Yellow/Black) mode for extreme conditions.

### Status Chips
Utilize a "Traffic Light" system: Green (Safe), Yellow (Caution), Orange (Urgent), Red (Critical). All chips must include an icon (e.g., checkmark, triangle) to remain accessible to color-blind users.