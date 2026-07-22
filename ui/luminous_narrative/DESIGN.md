---
name: Luminous Narrative
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#603e39'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#956d67'
  outline-variant: '#ebbbb4'
  surface-tint: '#c00100'
  primary: '#bc0100'
  on-primary: '#ffffff'
  primary-container: '#eb0000'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a8'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e2'
  on-secondary-container: '#646464'
  tertiary: '#0059ba'
  on-tertiary: '#ffffff'
  tertiary-container: '#0071e8'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#930100'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#d7e2ff'
  tertiary-fixed-dim: '#acc7ff'
  on-tertiary-fixed: '#001a40'
  on-tertiary-fixed-variant: '#004491'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  surface-pure: '#FFFFFF'
  surface-subtle: '#FBFBFB'
  glass-fill: rgba(255, 255, 255, 0.7)
  accent-gradient: 'linear-gradient(135deg, #FF0000 0%, #FF6B6B 100%)'
  soft-gradient: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255,
    255, 0.8) 100%)
typography:
  display-xl:
    fontFamily: Hanken Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  title-lg:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 64px
  xxl: 120px
  gutter: 24px
  margin: 64px
---

## Brand & Style

This design system establishes a "Cinematic Minimalist" aesthetic, blending the hyper-functional precision of Linear with the editorial warmth of Airbnb and the structural elegance of Apple. The brand personality is serene, premium, and photography-forward, positioning the product as a canvas for memories rather than a utility.

The design relies on a strict light-mode palette to maintain an "airy" feel. It utilizes high-contrast typography, massive whitespace, and subtle glassmorphism to create a sense of physical depth. The visual narrative is driven by large-scale imagery (60-70% of the screen area) and a 120px vertical rhythm that allows content to breathe. Every interaction is governed by a sophisticated motion language designed to feel intentional and fluid.

## Colors

The palette is strictly restricted to light neutrals to ensure a high-end, gallery-like feel. 
- **Primary:** The brand's signature red is used surgically for high-intent actions and critical status indicators.
- **Surfaces:** We use `#FFFFFF` for the base canvas and `#F5F5F5` for secondary structural elements like sidebars or card backgrounds. 
- **Gradients:** Introduce "Airy Gradients"—very subtle transitions from white to 5% opacity of the brand red or soft neutrals—to define section transitions without adding visual weight.
- **Accessibility:** All text must maintain a minimum 4.5:1 contrast ratio against white or off-white backgrounds, adhering to WCAG AA standards.

## Typography

Typography follows a strict hierarchy. **Hanken Grotesk** is selected for its sharp, contemporary geometry that mirrors the precision of Linear. Headlines use tight tracking (negative letter spacing) to create a "locked-in" editorial look. 

**Inter** is used for body copy and UI labels to ensure maximum legibility and a systematic feel. Body text is set with a generous 1.6 line-height to maintain the airy, readable quality of the design. Display levels are reserved for entry points and major section headers, often paired with photography.

## Layout & Spacing

The layout utilizes a **12-column fluid grid** for desktop with a maximum container width of 1440px. 

- **Vertical Rhythm:** A primary cadence of 64px (small sections) and 120px (major hero transitions) creates a cinematic sense of pace. 
- **Internal Spacing:** Components follow an 8px base grid.
- **Margins:** Desktop views utilize a wide 64px horizontal margin to push content inward, emphasizing the premium nature of the layout.
- **Mobile:** Transition to a 4-column grid with 16px margins and 16px gutters. Display typography should scale down to `title-lg` for mobile screens to maintain accessibility.

## Elevation & Depth

Hierarchy is established through four distinct levels of depth, avoiding heavy dropshadows in favor of tonal separation and glass effects:

- **Level 0 (Flat):** Used for the main background canvas and structural separators.
- **Level 1 (Soft):** Components like cards use a very subtle, large-radius shadow (Shadow: 0 4px 20px rgba(0,0,0,0.04)) to lift slightly from the background.
- **Level 2 (Interaction):** Hover states increase shadow spread and apply a subtle scale-up (1.02x) to mimic a physical "lift."
- **Level 3 (Focus/Modal):** Modals and dropdowns use **Glassmorphism**. A semi-transparent white fill (70% opacity) with a 20px backdrop-blur and a 1px solid white border provides depth without obstructing the "airy" feel.

## Shapes

The shape language is defined by significant corner rounding (20-24px), reflecting the approachable yet high-tech aesthetic of Apple and modern hardware design. 

- **Standard Radius:** 20px for buttons, input fields, and small cards.
- **Large Radius:** 32px for main content containers and image wrappers.
- **Buttons:** Large action buttons may use a fully pill-shaped profile to differentiate from structural containers.

## Components

- **Buttons:** Primary buttons use a solid `#000000` or `#FF0000` with white text. Secondary buttons use a subtle ghost style with a 1px `#E5E5E5` border.
- **Inputs:** Fields are 56px tall with a 20px radius. Use a light neutral background (`#F5F5F5`) that turns white with a 1px black border on focus.
- **Cards:** Cards should be photography-heavy. Use "Loom-style" hover states where the image slightly scales within its container. Information overlays use the Level 3 Glassmorphism style.
- **Chips:** Small, pill-shaped tags with `label-caps` typography. Use a light grey background (`#F0F0F0`) and no borders.
- **Motion:** All component transitions use `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo).
    - *Micro-interactions:* 200ms (buttons, toggles).
    - *Page transitions/Modals:* 500-600ms (entrance).
- **Accessibility:** Ensure all interactive elements have a minimum 44px hit target. Support `prefers-reduced-motion` by swapping transforms for simple opacities.