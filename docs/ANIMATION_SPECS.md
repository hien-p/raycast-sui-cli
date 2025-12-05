# Animation Specifications

## Overview
All animations follow the hacker/terminal aesthetic with performance-first approach. Scroll-triggered animations reveal content progressively as user explores the page.

---

## Scroll-Triggered Animations

### Fade In Up (Primary Reveal)
**Usage**: Section headers, feature cards, content blocks

```css
/* Initial State */
opacity: 0;
transform: translateY(40px);

/* Animated State */
opacity: 1;
transform: translateY(0);

/* Timing */
transition: all 1000ms cubic-bezier(0.4, 0, 0.2, 1);
```

**Stagger Delays**:
- Item 1: 0ms
- Item 2: 100ms
- Item 3: 200ms
- Item 4: 300ms
- Continue +100ms per item

**Implementation**:
```tsx
const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });

<div
  ref={ref}
  className={`transition-all duration-1000 ${
    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
  }`}
>
  Content
</div>
```

---

### Scale In (Hero Elements)
**Usage**: Hero CTA section, terminal windows

```css
/* Initial State */
opacity: 0;
transform: scale(0.95);

/* Animated State */
opacity: 1;
transform: scale(1);

/* Timing */
transition: all 1000ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

**Easing**: Spring bounce effect for emphasis

---

## Interactive Animations

### Button Hover (Primary CTA)
```css
/* Default */
transform: scale(1);
box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);

/* Hover */
transform: scale(1.05);
box-shadow: 0 0 40px rgba(255, 0, 0, 0.5);

/* Active */
transform: scale(0.98);

/* Timing */
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

### Card Hover
```css
/* Default */
border-color: rgba(255, 0, 0, 0.2);
transform: translateY(0);

/* Hover */
border-color: rgba(255, 0, 0, 0.5);
transform: translateY(-4px);
box-shadow: 0 10px 30px rgba(255, 0, 0, 0.2);

/* Timing */
transition: all 300ms ease;
```

---

## Continuous Animations

### Scroll Indicator Bounce
**Element**: Arrow down indicator in hero

```css
@keyframes bounceArrow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(10px);
  }
}

animation: bounceArrow 2s ease-in-out infinite;
```

**Additional Effects**:
- Pulsing glow ring with `animate-ping`
- Opacity fade: `opacity-20`

---

### Glow Pulse (Active Elements)
**Usage**: Active progress dots, status indicators

```css
@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
  }
  50% {
    box-shadow:
      0 0 40px rgba(255, 0, 0, 0.6),
      0 0 60px rgba(255, 0, 110, 0.4);
  }
}

animation: glowPulse 4s ease-in-out infinite;
```

---

### Typing Effect
**Usage**: Hero terminal prompt

```tsx
<TypingText
  text="$ sui-cli-web --init"
  speed={80}
  delay={0}
  showCursor={true}
/>
```

**Cursor Blink**:
```css
@keyframes blink {
  0%, 50% { opacity: 1; }
  50.01%, 100% { opacity: 0; }
}

animation: blink 1s step-end infinite;
```

---

### Glitch Effect (Hover)
**Usage**: Main headlines, emphasis text

```tsx
<GlitchText intensity="medium">
  YOUR LOCAL SUI CLI
</GlitchText>
```

**Intensity Levels**:
- **Low**: Single glitch on hover (300ms, 1 iteration)
- **Medium**: Double glitch on hover (300ms, 2 iterations)
- **High**: Continuous glitch (200ms, infinite)

**RGB Split Effect**:
- Red layer: `translate(-2px, 2px)`, opacity 70%
- Cyan layer: `translate(2px, -2px)`, opacity 70%

```css
@keyframes glitch-anim-1 {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}
```

---

## Progress Indicators

### Scroll Progress Dots
**Location**: Fixed right side of viewport

**Active Dot**:
```css
width: 10px; /* 2.5 * scale(1.5) */
height: 10px;
background: #ff0000;
box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
```

**Inactive Dot**:
```css
width: 10px;
height: 10px;
background: rgba(255, 255, 255, 0.2);
```

**Progress Line**:
```css
width: 1px;
background: linear-gradient(to bottom, #ff0000, #ff006e);
height: calculated based on scroll position;
transition: height 500ms ease;
```

---

## Background Effects

### Gradient Orbs (Hero Background)
```css
/* Top Left Orb */
width: 384px; /* 96 * 4 */
height: 384px;
background: rgba(255, 0, 0, 0.2);
border-radius: 50%;
filter: blur(96px);
animation: pulse 8s ease-in-out infinite;

/* Bottom Right Orb */
animation-delay: 2s; /* Offset for variation */
```

---

### Matrix Rain Background
**Implementation**: Already exists in `FaultyTerminal.tsx`

**Configuration**:
```tsx
<FaultyTerminal
  tint="#ffffff"
  brightness={0.15}
  scale={1}
  gridMul={[2, 1]}
  digitSize={1.5}
  scanlineIntensity={0.3}
  glitchAmount={1}
  noiseAmp={0}
  mouseReact={true}
  pageLoadAnimation={true}
/>
```

---

## Component-Specific Animations

### Feature Cards
**Stagger Pattern**:
```tsx
{features.map((feature, index) => (
  <div
    key={feature.id}
    className="transition-all duration-300"
    style={{ transitionDelay: `${index * 100}ms` }}
  >
    {/* Card content */}
  </div>
))}
```

**Icon Scale on Hover**:
```css
.group:hover .icon {
  transform: scale(1.1);
  transition: transform 300ms ease;
}
```

---

### Contract Section
**Address Block Hover**:
```css
/* Default */
border-color: rgba(255, 0, 0, 0.2);

/* Hover */
border-color: rgba(255, 0, 0, 0.4);
background: rgba(0, 0, 0, 0.4);
transition: all 200ms ease;
```

---

### CTA Terminal Window
**Scale on Reveal**:
```css
/* Initial */
opacity: 0;
transform: scale(0.95);

/* Visible */
opacity: 1;
transform: scale(1);

/* Timing */
transition: all 1000ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

**Command Line Reveal**:
Stagger each command by 150ms

---

## Performance Guidelines

### GPU Acceleration
Only animate these properties:
- `transform`
- `opacity`
- `filter` (use sparingly)

**Avoid**:
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`

### Will-Change
Use only on actively animating elements:
```css
.animating {
  will-change: transform, opacity;
}

/* Remove after animation */
.animation-complete {
  will-change: auto;
}
```

### Reduced Motion
Respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Timing Functions Reference

```css
/* Speed Curves */
--ease-in: cubic-bezier(0.4, 0, 1, 1);           /* Slow start, fast end */
--ease-out: cubic-bezier(0, 0, 0.2, 1);          /* Fast start, slow end */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);     /* Slow both ends */

/* Special Effects */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);  /* Overshoot bounce */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);       /* Spring effect */
```

---

## Duration Scale

```css
--duration-instant: 100ms;   /* Micro-interactions */
--duration-fast: 200ms;      /* Button hovers */
--duration-base: 300ms;      /* Card interactions */
--duration-slow: 500ms;      /* Section transitions */
--duration-slower: 800ms;    /* Hero reveals */
--duration-slowest: 1000ms;  /* Full-screen transitions */
```

---

## Animation Checklist

Before deploying animations:

- [ ] Test on 60Hz and 120Hz displays
- [ ] Verify reduced motion preference
- [ ] Check mobile performance
- [ ] Ensure no layout shift
- [ ] Test with 6x CPU slowdown (Chrome DevTools)
- [ ] Validate WCAG 2.1 compliance
- [ ] Check animation doesn't block interaction
- [ ] Verify animations complete properly

---

## Debug Tips

### Chrome DevTools
1. **Performance Panel**: Record scroll interaction
2. **Rendering Panel**:
   - Enable "Paint flashing"
   - Enable "Layer borders"
   - Check "Frame Rendering Stats"
3. **Coverage Panel**: Find unused CSS

### Firefox DevTools
- **Performance Panel**: "Enable paint flashing"
- **Accessibility Panel**: Check motion sensitivity

---

## Future Enhancements

Potential additions for v2:

1. **Parallax Scrolling**: Background layers move at different speeds
2. **3D Card Flips**: Feature cards flip to show more detail
3. **Particle System**: Terminal characters float up on scroll
4. **Loading Sequences**: Step-by-step terminal boot animation
5. **Sound Effects**: Optional terminal beeps/clicks (muted by default)
6. **Theme Switcher**: Animated color scheme transitions

---

## Implementation Priority

### Phase 1 (Current)
- ✅ Scroll reveal animations
- ✅ Typing text effect
- ✅ Glitch hover effect
- ✅ Progress dots
- ✅ Button interactions

### Phase 2 (Future)
- Parallax backgrounds
- Advanced particle effects
- Sound design
- Custom cursor
- Loading sequences
