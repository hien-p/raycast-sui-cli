# Design Quick Reference Card

> One-page cheat sheet for implementing the Sui CLI Web design system

---

## Colors

```css
/* Primary Palette */
--red: #ff0000;          /* Brand primary */
--pink: #ff006e;         /* Accent */
--rose: #f43f5e;         /* CTA */
--green: #00ff41;        /* Success/Stable */

/* Backgrounds */
--bg: #0a0a0a;           /* Main background */
--panel: #141414;        /* Cards/panels */
--border: #1a1a1a;       /* Subtle borders */

/* Text */
--text: #e0e0e0;         /* Primary text */
--muted: #666666;        /* Secondary text */
--dim: #333333;          /* Disabled text */
```

**Usage**:
```tsx
bg-slate-950              /* Main background */
bg-slate-900/60          /* Glass panels */
text-white/60            /* Muted text */
border-rose-500/20       /* Subtle borders */
text-rose-400            /* Accent text */
```

---

## Typography

### Font Stack
```css
font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Consolas', monospace;
```

### Sizes
```tsx
text-8xl                 /* 96px - Hero */
text-5xl                 /* 48px - H1 */
text-4xl                 /* 36px - H2 */
text-xl                  /* 20px - H3 */
text-base                /* 16px - Body */
text-sm                  /* 14px - Small */
text-xs                  /* 12px - Labels */
```

### Weights
```tsx
font-bold                /* 700 - Headlines */
font-semibold            /* 600 - Subheads */
font-medium              /* 500 - Code */
font-normal              /* 400 - Body */
```

### Apply Mono
```tsx
className="font-mono font-bold text-5xl text-white"
```

---

## Spacing

```tsx
/* Padding/Margin Scale (4px base) */
p-1    /* 4px */
p-2    /* 8px */
p-4    /* 16px */
p-6    /* 24px */
p-8    /* 32px */
p-12   /* 48px */
p-16   /* 64px */
p-24   /* 96px */
p-32   /* 128px */

/* Gaps */
gap-2   /* 8px */
gap-4   /* 16px */
gap-6   /* 24px */
gap-8   /* 32px */
```

**Sections**: `py-24` or `py-32` (96-128px)

---

## Components

### Button (Primary CTA)
```tsx
<button className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-mono font-semibold hover:scale-105 transition-transform">
  <span className="flex items-center gap-2">
    <Icon className="w-5 h-5" />
    LAUNCH APP
  </span>
</button>
```

### Card (Feature/Glass)
```tsx
<div className="p-6 bg-slate-900/60 backdrop-blur-sm border border-rose-500/20 rounded-xl hover:border-rose-500/50 transition-all">
  {children}
</div>
```

### Badge
```tsx
<span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg font-mono text-xs uppercase">
  BETA
</span>
```

### Code Block
```tsx
<code className="px-3 py-1.5 bg-black/30 text-rose-300 rounded-lg font-mono text-sm">
  $ npm install
</code>
```

---

## Animations

### Scroll Reveal
```tsx
import { useScrollReveal } from '@/hooks/useScrollReveal';

const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });

<section ref={ref}>
  <div className={`transition-all duration-1000 ${
    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
  }`}>
    Content
  </div>
</section>
```

### Typing Text
```tsx
import { TypingText } from '@/components/ui/typing-text';

<TypingText text="$ sui-cli-web --init" speed={80} />
```

### Glitch Effect
```tsx
import { GlitchText } from '@/components/ui/glitch-text';

<GlitchText intensity="medium">
  YOUR LOCAL SUI CLI
</GlitchText>
```

### Scroll Indicator
```tsx
import { ScrollIndicator } from '@/components/ui/scroll-indicator';

<ScrollIndicator onClick={() => scrollToSection('features')} />
```

---

## Gradients

### Text Gradients
```tsx
<span className="bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 bg-clip-text text-transparent">
  Gradient Text
</span>
```

### Background Gradients
```tsx
/* Hero background */
<div className="bg-gradient-to-br from-slate-950 via-rose-950/20 to-slate-950">

/* Button gradient */
<button className="bg-gradient-to-r from-rose-500 to-pink-500">
```

### Glow Effects
```tsx
/* Subtle glow */
box-shadow: 0 0 20px rgba(255, 0, 0, 0.3)

/* Strong glow */
box-shadow: 0 0 40px rgba(255, 0, 0, 0.6), 0 0 60px rgba(255, 0, 110, 0.4)
```

---

## Icons

### Import
```tsx
import { Terminal, Shield, Zap } from 'lucide-react';
```

### Size Classes
```tsx
<Icon className="w-4 h-4" />   /* 16px - Small */
<Icon className="w-5 h-5" />   /* 20px - Medium */
<Icon className="w-6 h-6" />   /* 24px - Large */
<Icon className="w-8 h-8" />   /* 32px - XL */
```

### Colored Background
```tsx
<div className="w-12 h-12 rounded-lg bg-rose-500/20 flex items-center justify-center">
  <Icon className="w-6 h-6 text-rose-400" />
</div>
```

---

## Borders

### Border Radius
```tsx
rounded-lg      /* 8px - Buttons */
rounded-xl      /* 16px - Cards */
rounded-2xl     /* 24px - Panels */
rounded-full    /* 9999px - Pills */
```

### Border Colors
```tsx
border border-rose-500/20        /* Subtle */
border border-rose-500/30        /* Medium */
border border-rose-500/50        /* Strong */
hover:border-rose-500/60         /* Hover */
```

---

## Backdrop Effects

### Glass Morphism
```tsx
bg-slate-900/60 backdrop-blur-sm
bg-slate-900/80 backdrop-blur-xl
```

### Dark Overlay
```tsx
bg-black/30     /* 30% opacity */
bg-black/60     /* 60% opacity */
```

---

## Responsive

### Breakpoints
```tsx
sm:    /* 640px+ */
md:    /* 768px+ */
lg:    /* 1024px+ */
xl:    /* 1280px+ */
2xl:   /* 1536px+ */
```

### Common Patterns
```tsx
/* Typography scaling */
text-4xl sm:text-5xl lg:text-7xl

/* Grid responsiveness */
grid-cols-1 md:grid-cols-2 lg:grid-cols-4

/* Flex direction */
flex-col sm:flex-row

/* Spacing */
px-4 sm:px-6 lg:px-8
py-16 sm:py-24 lg:py-32
```

---

## Hover States

### Buttons
```tsx
hover:scale-105 hover:shadow-lg transition-all
```

### Cards
```tsx
hover:border-rose-500/50 hover:-translate-y-1 transition-all
```

### Links
```tsx
hover:text-rose-400 transition-colors
```

### Icons
```tsx
group-hover:scale-110 transition-transform
```

---

## Common Layouts

### Section Container
```tsx
<section className="relative py-24 px-4">
  <div className="max-w-6xl mx-auto">
    {/* Content */}
  </div>
</section>
```

### Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Flex Layout
```tsx
<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
  {/* Items */}
</div>
```

---

## Accessibility

### Focus States
```tsx
focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2
```

### ARIA Labels
```tsx
<button aria-label="Launch application">
  <Icon />
</button>
```

### Screen Reader Only
```tsx
<span className="sr-only">Additional context</span>
```

---

## Performance

### GPU Acceleration
Only animate these properties:
- `transform`
- `opacity`
- `filter` (sparingly)

Avoid:
- `width`, `height`
- `top`, `left`
- `margin`, `padding`

### Optimization
```tsx
/* Good */
transform: scale(1.05)
opacity: 0.5

/* Bad */
width: 200px
margin-left: 20px
```

---

## Quick Copy-Paste

### Section Header
```tsx
<div className="text-center mb-16">
  <div className="inline-block mb-4 px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
    <span className="font-mono text-rose-400 text-sm uppercase tracking-wider">
      Section Badge
    </span>
  </div>
  <h2 className="text-4xl sm:text-5xl font-bold font-mono text-white mb-4">
    SECTION <span className="text-rose-400">TITLE</span>
  </h2>
  <p className="text-white/50 font-mono text-sm max-w-2xl mx-auto">
    Description text
  </p>
</div>
```

### Feature Card
```tsx
<div className="group p-6 bg-slate-900/60 backdrop-blur-sm border border-rose-500/20 rounded-xl hover:border-rose-500/50 transition-all">
  <div className="w-12 h-12 rounded-lg bg-rose-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
    <Icon className="w-6 h-6 text-rose-400" />
  </div>
  <h3 className="text-lg font-mono font-bold text-white mb-2">Title</h3>
  <p className="text-white/50 font-mono text-sm">Description</p>
</div>
```

### Command Line
```tsx
<div className="p-3 bg-black/40 border border-rose-500/20 rounded-lg">
  <code className="text-rose-300 font-mono text-sm">$ command here</code>
</div>
```

### Stat Card
```tsx
<div className="p-6 bg-slate-900/60 border border-rose-500/20 rounded-xl text-center">
  <Icon className="w-6 h-6 text-rose-400 mx-auto mb-3" />
  <div className="text-2xl font-mono font-bold text-white mb-1">100+</div>
  <div className="text-white/50 font-mono text-sm">Label</div>
</div>
```

---

## Color Combinations

### Trust/Security
```tsx
bg-emerald-500/10 text-emerald-400 border-emerald-500/30
```

### Warning/Beta
```tsx
bg-rose-500/10 text-rose-400 border-rose-500/30
```

### Info
```tsx
bg-blue-500/10 text-blue-400 border-blue-500/30
```

### Neutral
```tsx
bg-white/5 text-white/70 border-white/10
```

---

## Animation Delays

### Stagger Pattern
```tsx
style={{ transitionDelay: `${index * 100}ms` }}

// index 0: 0ms
// index 1: 100ms
// index 2: 200ms
// index 3: 300ms
```

### Utility Classes
```css
animation-delay-2000   /* 2s delay */
animation-delay-4000   /* 4s delay */
```

---

## Common Pitfalls

### ❌ Don't
```tsx
/* Wrong: Inline styles for colors */
style={{ color: '#ff0000' }}

/* Wrong: Pixel values in className */
className="w-[250px]"

/* Wrong: Sans-serif for terminal UI */
className="font-sans"
```

### ✅ Do
```tsx
/* Right: Tailwind utilities */
className="text-rose-500"

/* Right: Semantic spacing */
className="w-64"

/* Right: Monospace everywhere */
className="font-mono"
```

---

## Resources

- [Design System](./DESIGN_SYSTEM.md) - Full design tokens
- [Animation Specs](./ANIMATION_SPECS.md) - Animation details
- [Implementation Guide](./LANDING_PAGE_IMPLEMENTATION.md) - Setup instructions
- [Comparison](./DESIGN_COMPARISON.md) - Before/after analysis

---

## Support

**Questions?**
1. Check this quick reference
2. Review design system docs
3. Test in isolation
4. Ask in team chat

**Common Issues**:
- Font not loading? Check CDN or local path
- Animation not working? Verify IntersectionObserver
- Colors wrong? Use opacity variants (text-rose-500/20)
- Layout broken? Check responsive classes (sm:, md:, lg:)
