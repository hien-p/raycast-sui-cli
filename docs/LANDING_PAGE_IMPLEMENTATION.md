# Landing Page Redesign - Implementation Guide

## Overview
Complete redesign of the Sui CLI Web landing page with hacker/terminal aesthetic, scroll-triggered animations, and improved visual hierarchy.

---

## File Structure

```
packages/client/src/
├── components/
│   ├── LandingPage/
│   │   ├── index.tsx                    # Current landing page
│   │   └── NewLandingPage.tsx           # New redesigned version
│   └── ui/
│       ├── scroll-indicator.tsx         # Bouncing arrow component
│       ├── typing-text.tsx              # Terminal typing effect
│       ├── glitch-text.tsx              # Glitch hover effect
│       └── progress-dots.tsx            # Scroll position indicator
├── hooks/
│   └── useScrollReveal.ts               # Intersection Observer hook
└── styles/
    └── globals.css                      # Updated with animations

docs/
├── DESIGN_SYSTEM.md                     # Complete design tokens
├── ANIMATION_SPECS.md                   # Animation specifications
└── LANDING_PAGE_IMPLEMENTATION.md       # This file
```

---

## How to Use the New Landing Page

### Option 1: Test Side-by-Side
Keep both versions and compare:

```tsx
// In your routing setup
<Route path="/" element={<LandingPage />} />
<Route path="/new" element={<NewLandingPage />} />
```

### Option 2: Direct Replacement
Replace the current landing page:

```tsx
// packages/client/src/App.tsx or routing config
import { NewLandingPage } from '@/components/LandingPage/NewLandingPage';

// Use NewLandingPage instead of LandingPage
```

### Option 3: Feature Flag
Implement A/B testing:

```tsx
const USE_NEW_LANDING = import.meta.env.VITE_USE_NEW_LANDING === 'true';

{USE_NEW_LANDING ? <NewLandingPage /> : <LandingPage />}
```

---

## Key Improvements

### 1. Visual Hierarchy
**Before**: Dense text blocks, unclear structure
**After**: Clear sectioning with progressive disclosure

**Changes**:
- Larger, bold monospace typography
- Reduced text density (50% fewer words)
- Visual icons replace text descriptions
- Glitch effects on key headlines

### 2. Scroll Indication
**Problem**: Users didn't know content existed below fold
**Solution**: Animated scroll indicator in hero

**Implementation**:
```tsx
<ScrollIndicator onClick={() => scrollToSection('features')} />
```

**Features**:
- Bouncing arrow animation
- Pulsing glow effect
- Dotted line extending down
- Smooth scroll to next section

### 3. Scroll-Triggered Animations
**Pattern**: ReactBits-style reveal-on-scroll

**Implementation**:
```tsx
const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });

<section ref={ref}>
  <div className={isVisible ? 'opacity-100' : 'opacity-0'}>
    Content reveals on scroll
  </div>
</section>
```

**Animations**:
- Fade in + slide up
- Staggered delays for cards
- Scale animations for emphasis

### 4. Progress Navigation
**Feature**: Fixed right-side navigation dots
**Purpose**: Show scroll position, allow quick jumps

**Sections**:
1. Hero
2. Features
3. Contract
4. Community
5. Get Started

### 5. Typography Overhaul
**Font**: JetBrains Mono (or similar monospace)

**Scale**:
- Display: 72px (hero)
- H1: 48px (sections)
- H2: 36px (subsections)
- Body: 16px
- Code: 14px
- Labels: 12px

**Implementation**:
```css
font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
```

### 6. Color System
**Primary**: Red/Pink gradient (#ff0000 → #ff006e → #f43f5e)
**Accents**: Matrix green (#00ff41) for stable features
**Backgrounds**: Near-black (#0a0a0a, #141414)

**Usage**:
- Red: Primary brand, CTAs, active states
- Pink: Gradients, glows, highlights
- Green: Success, stable features
- White: Text (with opacity variations)

---

## Component Breakdown

### Hero Section
**Purpose**: Grab attention, set tone, show value prop

**Elements**:
1. Terminal prompt with typing animation
2. Large headline with glitch effects
3. Subtitle emphasizing local/secure
4. Dual CTAs (primary + secondary)
5. Scroll indicator at bottom

**Animations**:
- Typing effect: "$ sui-cli-web --init"
- Glitch on hover for headlines
- Pulse on background gradients
- Bounce on scroll arrow

### Features Section
**Layout**: 4-column grid (2-col on tablet, 1-col on mobile)

**Card Structure**:
```tsx
<FeatureCard>
  <Icon /> {/* 48x48 in colored bg */}
  <Title /> {/* 18px bold */}
  <Description /> {/* 14px muted */}
  <Badge /> {/* STABLE or BETA */}
</FeatureCard>
```

**Animations**:
- Cards fade in with 100ms stagger
- Icons scale on card hover
- Border glow on hover

### Contract Section
**Purpose**: Transparency, verification, trust

**Elements**:
- Package ID with copy/explorer buttons
- Registry ID with copy/explorer buttons
- Available functions list
- Verified badge

**Interactions**:
- Click to copy addresses
- Open in Sui Explorer
- Hover highlights

### Community Section
**Stats Grid**:
- Total members (from on-chain)
- NFT membership type
- Gas cost (~0.01 SUI)
- Auto level-up system

**CTA**: Embedded MembershipJoin component

### CTA Section
**Design**: Terminal window effect

**Flow**:
1. Show 3 install commands
2. Big "ENTER APPLICATION" button
3. Security reassurance

**Animation**: Scale in when visible

---

## Animation System

### Scroll Reveal Hook
```tsx
// Basic usage
const { ref, isVisible } = useScrollReveal();

// Advanced options
const { ref, isVisible } = useScrollReveal({
  threshold: 0.2,      // Trigger when 20% visible
  rootMargin: '0px',   // Offset from viewport
  triggerOnce: true,   // Only animate once
  delay: 200,          // Delay before triggering
});
```

### Active Section Tracking
```tsx
const SECTIONS = ['hero', 'features', 'contract', 'community', 'cta'];
const activeSection = useActiveSection(SECTIONS);

// Returns index of currently visible section
```

### Smooth Scroll
```tsx
import { scrollToSection } from '@/hooks/useScrollReveal';

scrollToSection('features'); // Scrolls to #features
```

---

## Typography Implementation

### Font Loading
**Option 1**: Google Fonts (CDN)
```html
<!-- In index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

**Option 2**: Self-hosted
```css
/* In globals.css */
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/JetBrainsMono-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

### Tailwind Config
```js
// tailwind.config.js
fontFamily: {
  mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Consolas', 'monospace']
}
```

### Usage
```tsx
<h1 className="font-mono font-bold text-5xl">
  Monospace Heading
</h1>
```

---

## Effects Implementation

### Glitch Text
```tsx
import { GlitchText } from '@/components/ui/glitch-text';

<GlitchText intensity="low">
  Hover me for glitch
</GlitchText>

// Intensity: 'low' | 'medium' | 'high'
```

### Typing Text
```tsx
import { TypingText } from '@/components/ui/typing-text';

<TypingText
  text="$ sui-cli-web --version"
  speed={80}        // Characters per second
  delay={500}       // Initial delay
  showCursor={true} // Show blinking cursor
  onComplete={() => console.log('Done!')}
/>
```

### Scroll Indicator
```tsx
import { ScrollIndicator } from '@/components/ui/scroll-indicator';

<ScrollIndicator
  onClick={() => scrollToSection('next-section')}
/>
```

### Progress Dots
```tsx
import { ProgressDots } from '@/components/ui/progress-dots';

<ProgressDots
  sections={['Hero', 'Features', 'Contract', 'Community', 'CTA']}
  currentSection={activeSection}
  onDotClick={(index) => scrollToSection(SECTIONS[index])}
/>
```

---

## Responsive Design

### Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Wide desktop */
2xl: 1536px /* Ultra wide */
```

### Typography Scaling
```tsx
// Mobile → Desktop
text-4xl sm:text-5xl lg:text-7xl  /* Hero title */
text-xl sm:text-2xl               /* Hero subtitle */
text-sm sm:text-base              /* Body text */
```

### Layout Changes
```tsx
// Grid responsiveness
grid-cols-1 md:grid-cols-2 lg:grid-cols-4  /* Features */
flex-col sm:flex-row                        /* Buttons */
```

### Mobile Optimizations
- Reduce animation complexity
- Simplify background effects
- Larger touch targets (min 44px)
- Stack elements vertically

---

## Performance Checklist

### Images
- [ ] Use WebP format
- [ ] Implement lazy loading
- [ ] Provide srcset for responsive images
- [ ] Optimize SVG icons

### Animations
- [ ] Only animate transform/opacity
- [ ] Use IntersectionObserver for scroll triggers
- [ ] Debounce scroll events
- [ ] Remove will-change after animation

### Code Splitting
- [ ] Lazy load sections below fold
- [ ] Dynamic import for heavy components
- [ ] Tree-shake unused utilities

### Critical Path
- [ ] Inline critical CSS
- [ ] Preload hero fonts
- [ ] Defer non-critical JS
- [ ] Optimize first contentful paint

---

## Accessibility

### Keyboard Navigation
```tsx
// Ensure all interactive elements are focusable
<button aria-label="Navigate to features">
  <Icon />
</button>
```

### Screen Readers
```tsx
// Provide descriptive labels
<section aria-labelledby="features-heading">
  <h2 id="features-heading">Features</h2>
</section>
```

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Color Contrast
- Text on dark: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: Clear focus states

---

## Testing Guide

### Manual Testing
1. **Desktop Chrome**: Test animations, scroll behavior
2. **Desktop Safari**: Verify backdrop-blur support
3. **Mobile Chrome**: Check touch interactions
4. **Mobile Safari**: Test iOS-specific issues
5. **Firefox**: Verify all animations work

### Automated Testing
```bash
# Lighthouse CI
npm run lighthouse

# Visual regression
npm run visual-test

# Accessibility audit
npm run a11y-test
```

### Checklist
- [ ] Scroll indicator visible on load
- [ ] All sections reveal on scroll
- [ ] Progress dots update correctly
- [ ] Typing animation completes
- [ ] Glitch effect triggers on hover
- [ ] Copy buttons work
- [ ] Smooth scroll functions
- [ ] Keyboard navigation works
- [ ] Screen reader announces sections
- [ ] Reduced motion preference respected

---

## Migration Path

### Phase 1: Preparation
1. Review design system docs
2. Install new UI components
3. Test hooks independently
4. Verify animation performance

### Phase 2: Gradual Rollout
1. Deploy to staging environment
2. A/B test with 10% of traffic
3. Monitor analytics and feedback
4. Iterate based on data

### Phase 3: Full Deployment
1. Roll out to 100% of users
2. Archive old landing page
3. Update documentation
4. Announce redesign

---

## Troubleshooting

### Animations Not Playing
**Check**:
1. IntersectionObserver browser support
2. CSS transitions enabled
3. Reduced motion preference
4. Element visibility (display/opacity)

### Scroll Behavior Issues
**Check**:
1. Smooth scroll CSS: `scroll-behavior: smooth`
2. Section IDs match navigation
3. Browser scroll-snap conflicts
4. Fixed positioning on mobile

### Performance Problems
**Check**:
1. Number of animated elements
2. Background effects complexity
3. Image optimization
4. JS bundle size

### Typography Not Loading
**Check**:
1. Font file paths
2. CORS headers for CDN fonts
3. Font-display setting
4. Fallback fonts available

---

## Future Enhancements

### v2.0 Features
- Parallax scrolling backgrounds
- 3D card flip interactions
- Custom mouse cursor
- Terminal boot sequence animation
- Sound effects (optional)
- Dark/light theme toggle
- Locale/i18n support

### Analytics Integration
Track user behavior:
- Scroll depth
- Section visibility time
- CTA click-through rate
- Feature card interactions
- Copy button usage

---

## Resources

### Design References
- ReactBits: https://reactbits.dev
- Vercel Design: https://vercel.com
- Stripe Animations: https://stripe.com
- Linear App: https://linear.app

### Code Examples
- Framer Motion: https://www.framer.com/motion/
- GSAP ScrollTrigger: https://greensock.com/scrolltrigger/
- React Spring: https://react-spring.dev/

### Tools
- Figma: Design prototyping
- Rive: Advanced animations
- Lottie: Motion graphics
- Spline: 3D elements

---

## Support

For questions or issues:
1. Check design system documentation
2. Review animation specifications
3. Test in isolation (Storybook/CodeSandbox)
4. Open GitHub issue with reproduction

---

## Changelog

### v1.1.0 (Current)
- New landing page design
- Scroll-triggered animations
- Progress navigation
- Typography overhaul
- Glitch effects
- Typing animations

### v1.0.0 (Previous)
- Basic landing page
- Static sections
- Simple hover effects
