# Sui CLI Web - Design System

## Brand Identity

### Core Aesthetic
**Hacker Terminal Mode** - Matrix-inspired, cyberpunk, retro-futuristic terminal interface

### Brand Values
- Technical Excellence
- Security First
- Developer Focused
- Open Source Spirit

---

## Color Palette

### Primary Colors
```css
--terminal-red: #ff0000;      /* Pure red - primary brand */
--terminal-pink: #ff006e;     /* Hot pink - accent */
--rose-500: #f43f5e;          /* Rose - CTAs */
--rose-400: #fb7185;          /* Light rose - highlights */
--rose-600: #e11d48;          /* Dark rose - hover states */
```

### Matrix Theme Colors
```css
--matrix-green: #00ff41;      /* Classic matrix green */
--neon-cyan: #00fff9;         /* Neon highlights */
--electric-blue: #00d4ff;     /* Electric accents */
--warning-yellow: #ffff00;    /* Warning states */
```

### Neutrals
```css
--terminal-bg: #0a0a0a;       /* Near black background */
--terminal-darker: #050505;   /* Deeper blacks */
--terminal-panel: #141414;    /* Panel backgrounds */
--terminal-border: #1a1a1a;   /* Subtle borders */
--terminal-text: #e0e0e0;     /* Primary text */
--terminal-muted: #666666;    /* Muted text */
--terminal-dim: #333333;      /* Dim text */
```

### Gradient Combinations
```css
/* Hero Gradient */
background: linear-gradient(135deg, #ff0000 0%, #ff006e 50%, #f43f5e 100%);

/* Glow Effect */
box-shadow: 0 0 20px rgba(255, 0, 0, 0.4), 0 0 40px rgba(255, 0, 110, 0.2);

/* Glass Morphism */
background: rgba(20, 20, 20, 0.6);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 0, 0, 0.2);
```

---

## Typography

### Font Families

#### Monospace (Primary)
```css
font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', 'Monaco', monospace;
```

**Usage**:
- All headings
- Code blocks
- Terminal output
- Navigation
- CTAs

#### Sans-serif (Secondary)
```css
font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
```

**Usage**:
- Body text (limited use)
- Descriptions
- Legal text

### Type Scale

```css
/* Display */
--text-display: 72px / 1.1;        /* Hero headlines */
--text-display-weight: 800;

/* Headings */
--text-h1: 48px / 1.2;             /* Section titles */
--text-h1-weight: 700;

--text-h2: 36px / 1.3;             /* Subsection titles */
--text-h2-weight: 700;

--text-h3: 24px / 1.4;             /* Card titles */
--text-h3-weight: 600;

--text-h4: 18px / 1.4;             /* Small headings */
--text-h4-weight: 600;

/* Body */
--text-body-lg: 18px / 1.6;        /* Large body */
--text-body-lg-weight: 400;

--text-body: 16px / 1.6;           /* Default body */
--text-body-weight: 400;

--text-body-sm: 14px / 1.5;        /* Small body */
--text-body-sm-weight: 400;

/* Code */
--text-code-lg: 16px / 1.4;        /* Large code blocks */
--text-code: 14px / 1.6;           /* Default code */
--text-code-sm: 12px / 1.5;        /* Inline code */
--text-code-weight: 500;

/* Labels */
--text-label: 12px / 1.4;          /* Labels, badges */
--text-label-weight: 600;
--text-label-spacing: 0.05em;      /* Letter spacing */
```

### Font Features
```css
/* Enable ligatures for code */
font-feature-settings: 'liga' 1, 'calt' 1;

/* Tabular numbers for stats */
font-variant-numeric: tabular-nums;
```

---

## Spacing System

### Scale (8px base)
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
--space-9: 96px;
--space-10: 128px;
--space-11: 192px;
--space-12: 256px;
```

### Layout Spacing
```css
/* Section Padding */
--section-py-mobile: 64px;
--section-py-desktop: 96px;

/* Section Margin */
--section-gap: 128px;

/* Container */
--container-max: 1280px;
--container-padding: 24px;
```

---

## Border Radius

```css
--radius-sm: 4px;      /* Small elements */
--radius-md: 8px;      /* Cards, buttons */
--radius-lg: 16px;     /* Panels */
--radius-xl: 24px;     /* Hero cards */
--radius-full: 9999px; /* Pills, circles */
```

---

## Animation System

### Duration
```css
--duration-instant: 100ms;
--duration-fast: 200ms;
--duration-base: 300ms;
--duration-slow: 500ms;
--duration-slower: 800ms;
```

### Easing
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Key Animations

#### Fade In Up (Scroll Reveal)
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Typing Effect
```css
@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes blink {
  50% { border-color: transparent; }
}
```

#### Glitch Effect
```css
@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}
```

#### Glow Pulse
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
```

#### Bounce Arrow
```css
@keyframes bounceArrow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(10px);
  }
}
```

#### Scanline
```css
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
```

---

## Component Patterns

### Buttons

#### Primary CTA
```css
/* Base */
background: linear-gradient(135deg, #ff0000, #ff006e);
padding: 16px 32px;
border-radius: 12px;
font-family: 'JetBrains Mono', monospace;
font-weight: 600;
box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);

/* Hover */
transform: scale(1.05);
box-shadow: 0 0 40px rgba(255, 0, 0, 0.5);

/* Active */
transform: scale(0.98);
```

#### Secondary
```css
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 0, 0, 0.3);
backdrop-filter: blur(10px);
```

### Cards

#### Feature Card
```css
background: rgba(20, 20, 20, 0.6);
border: 1px solid rgba(255, 0, 0, 0.2);
border-radius: 16px;
backdrop-filter: blur(20px);
transition: all 300ms ease;

/* Hover */
border-color: rgba(255, 0, 0, 0.5);
transform: translateY(-4px);
box-shadow: 0 10px 30px rgba(255, 0, 0, 0.2);
```

#### Glass Panel
```css
background: rgba(10, 10, 10, 0.4);
border: 1px solid rgba(255, 255, 255, 0.1);
backdrop-filter: blur(30px) saturate(180%);
```

### Badges

#### Status Badge
```css
/* Stable */
background: rgba(0, 255, 65, 0.1);
color: #00ff41;
border: 1px solid rgba(0, 255, 65, 0.3);

/* Beta */
background: rgba(255, 0, 0, 0.1);
color: #ff0000;
border: 1px solid rgba(255, 0, 0, 0.3);
```

---

## Effects Library

### Matrix Rain Background
- Falling code characters
- Green/red color shift
- Subtle glow on characters
- Performance optimized with WebGL

### Terminal Cursor
```css
border-right: 2px solid #ff0000;
animation: blink 1s step-end infinite;
```

### Code Block Syntax
```css
.keyword { color: #ff006e; }
.string { color: #00ff41; }
.number { color: #00d4ff; }
.comment { color: #666666; }
```

### Glitch Text Hover
- Random character displacement
- RGB split effect
- Brief flash
- Trigger on hover

### Progress Indicator
```css
/* Scroll dots */
width: 8px;
height: 8px;
background: rgba(255, 0, 0, 0.3);
border-radius: 50%;

/* Active */
background: #ff0000;
transform: scale(1.5);
```

---

## Responsive Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Wide desktop */
--breakpoint-2xl: 1536px; /* Ultra wide */
```

### Mobile-First Approach
- Stack cards vertically on mobile
- Reduce font sizes by 20-30%
- Simplify animations
- Touch-friendly tap targets (min 44px)

---

## Accessibility

### Color Contrast
- Ensure 4.5:1 ratio for body text
- Ensure 3:1 ratio for large text (18px+)
- Red on dark bg maintains WCAG AA

### Focus States
```css
outline: 2px solid #ff0000;
outline-offset: 2px;
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Performance Guidelines

### Animation Performance
- Use `transform` and `opacity` only
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly
- Debounce scroll events

### Asset Optimization
- WebP for images
- SVG for icons
- Lazy load components
- Code split by route

---

## Component Architecture

### Folder Structure
```
components/
├── ui/                    # Primitive components
│   ├── ScrollIndicator.tsx
│   ├── TypingText.tsx
│   ├── GlitchText.tsx
│   └── ProgressDots.tsx
├── sections/              # Landing page sections
│   ├── HeroSection.tsx
│   ├── FeaturesSection.tsx
│   ├── ContractSection.tsx
│   └── CTASection.tsx
└── layouts/
    └── LandingLayout.tsx
```

---

## Design Tokens Export

```json
{
  "colors": {
    "terminal-red": "#ff0000",
    "terminal-pink": "#ff006e",
    "rose-500": "#f43f5e",
    "matrix-green": "#00ff41"
  },
  "spacing": {
    "1": "4px",
    "2": "8px",
    "4": "16px",
    "8": "64px"
  },
  "typography": {
    "fontFamily": {
      "mono": "'JetBrains Mono', monospace"
    },
    "fontSize": {
      "display": "72px",
      "h1": "48px",
      "body": "16px"
    }
  }
}
```
