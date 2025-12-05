# Component Showcase

> Visual reference for all design system components

---

## Buttons

### Primary CTA
```tsx
<button className="group px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-mono font-semibold text-lg hover:scale-105 transition-transform">
  <span className="flex items-center gap-2">
    <Terminal className="w-5 h-5" />
    LAUNCH APP
    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
  </span>
</button>
```

**States**:
- Default: Gradient background, subtle shadow
- Hover: Scale 1.05, stronger shadow
- Active: Scale 0.98
- Focus: Rose ring with offset

**Usage**: Primary actions, main CTAs

---

### Secondary Button
```tsx
<button className="px-8 py-4 bg-white/5 border border-rose-500/30 text-white rounded-lg font-mono font-semibold text-lg hover:bg-white/10 hover:border-rose-500/60 transition-all">
  <span className="flex items-center gap-2">
    <Github className="w-5 h-5" />
    SOURCE CODE
  </span>
</button>
```

**States**:
- Default: Glass background, subtle border
- Hover: Lighter background, brighter border
- Active: Pressed effect
- Focus: Rose ring

**Usage**: Secondary actions, external links

---

### Icon Button
```tsx
<button className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Copy to clipboard">
  <Copy className="w-4 h-4 text-white/50 hover:text-rose-400" />
</button>
```

**States**:
- Default: Transparent, muted icon
- Hover: Light background, colored icon
- Active: Icon color change (e.g., checkmark)

**Usage**: Utility actions (copy, open, close)

---

## Cards

### Feature Card
```tsx
<div className="group p-6 bg-slate-900/60 backdrop-blur-sm border border-rose-500/20 rounded-xl hover:border-rose-500/50 hover:bg-slate-900/80 transition-all">
  <div className="mb-4">
    <div className="w-12 h-12 rounded-lg bg-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
      <Wallet className="w-6 h-6 text-rose-400" />
    </div>
  </div>
  <h3 className="text-lg font-mono font-bold text-white mb-2">Wallet</h3>
  <p className="text-white/50 font-mono text-sm mb-3">Manage addresses & balances</p>
  <span className="inline-block px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-semibold">
    STABLE
  </span>
</div>
```

**Anatomy**:
1. Icon container (48x48, colored bg, hover scale)
2. Title (18px, mono, bold)
3. Description (14px, mono, muted)
4. Status badge (stable/beta)

**Interactions**:
- Hover: Border brightens, background lightens, icon scales
- Click: Navigate or expand

**Usage**: Feature grid, capability showcase

---

### Glass Panel
```tsx
<div className="bg-slate-900/60 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-8">
  <div className="flex items-center gap-3 mb-6">
    <Shield className="w-8 h-8 text-rose-400" />
    <div>
      <h3 className="text-xl font-mono font-bold text-white">Panel Title</h3>
      <p className="text-white/50 font-mono text-sm">Subtitle</p>
    </div>
  </div>
  {/* Content */}
</div>
```

**Anatomy**:
1. Header with icon + title
2. Content area
3. Optional footer

**Styling**:
- Background: Semi-transparent with blur
- Border: Subtle rose glow
- Padding: 32px (p-8)

**Usage**: Contract info, stats, grouping content

---

### Stat Card
```tsx
<div className="p-6 bg-slate-900/60 backdrop-blur-sm border border-rose-500/20 rounded-xl text-center hover:border-rose-500/40 transition-all">
  <Users className="w-6 h-6 text-rose-400 mx-auto mb-3" />
  <div className="text-2xl font-mono font-bold text-white mb-1">100+</div>
  <div className="text-white/50 font-mono text-sm">Members</div>
</div>
```

**Anatomy**:
1. Icon (24px, centered)
2. Value (24px, bold, mono)
3. Label (14px, muted, mono)

**Layout**: Centered alignment

**Usage**: Stats grid, metrics display

---

## Badges

### Status Badge (Stable)
```tsx
<span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-semibold uppercase">
  STABLE
</span>
```

**Colors**: Green (#00ff41)

---

### Status Badge (Beta)
```tsx
<span className="px-2 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs font-mono font-semibold uppercase">
  BETA
</span>
```

**Colors**: Red/Rose (#ff0000, #f43f5e)

---

### Section Badge
```tsx
<div className="inline-block px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
  <span className="font-mono text-rose-400 text-sm uppercase tracking-wider">
    8 Core Features
  </span>
</div>
```

**Usage**: Section headers, category labels

---

### Verified Badge
```tsx
<span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30">
  ✓ VERIFIED
</span>
```

**Style**: Pill shape (rounded-full)

**Usage**: Trust indicators, verification

---

## Typography

### Display Heading (Hero)
```tsx
<h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold font-mono leading-tight">
  <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 bg-clip-text text-transparent">
    YOUR LOCAL
  </span>
  <br />
  <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 bg-clip-text text-transparent">
    SUI CLI
  </span>
  <br />
  <span className="text-white">SUPERCHARGED</span>
</h1>
```

**Sizes**:
- Mobile: 48px (text-5xl)
- Tablet: 72px (text-7xl)
- Desktop: 96px (text-8xl)

**Effects**: Gradient text, glitch on hover

---

### Section Heading
```tsx
<h2 className="text-4xl sm:text-5xl font-bold font-mono text-white mb-4">
  FULL <span className="text-rose-400">TERMINAL</span> CONTROL
</h2>
```

**Pattern**: White text with colored accent word

**Sizes**: 36-48px responsive

---

### Card Title
```tsx
<h3 className="text-lg font-mono font-bold text-white mb-2">
  Feature Title
</h3>
```

**Size**: 18px (text-lg)

**Weight**: Bold (700)

---

### Body Text
```tsx
<p className="text-white/60 font-mono text-sm max-w-2xl mx-auto">
  Description text with opacity for hierarchy
</p>
```

**Size**: 14px (text-sm)

**Opacity**: 60% for muted text

---

### Code/Terminal
```tsx
<code className="text-rose-300 font-mono text-sm bg-black/30 px-3 py-1.5 rounded-lg inline-block">
  $ npm install
</code>
```

**Colors**: Rose text on dark background

**Usage**: Commands, code snippets

---

## Interactive Elements

### Scroll Indicator
```tsx
<div className="flex flex-col items-center gap-2 cursor-pointer group">
  <span className="text-white/40 text-sm font-mono uppercase tracking-wider group-hover:text-rose-400 transition-colors">
    Scroll Down
  </span>
  <div className="relative">
    {/* Outer ping ring */}
    <div className="absolute inset-0 animate-ping opacity-20">
      <div className="w-12 h-12 rounded-full border-2 border-rose-500" />
    </div>

    {/* Main container */}
    <div className="relative w-12 h-12 rounded-full border border-rose-500/30 bg-rose-500/10 backdrop-blur-sm flex items-center justify-center">
      <ArrowDown className="w-5 h-5 text-rose-400 animate-bounce" />
    </div>

    {/* Glow */}
    <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl animate-pulse" />
  </div>

  {/* Dotted line */}
  <div className="w-px h-16 bg-gradient-to-b from-rose-500/50 via-rose-500/20 to-transparent" />
</div>
```

**Effects**:
1. Ping ring (expanding fade)
2. Bouncing arrow
3. Pulsing glow
4. Fading line below

**Interaction**: Click to scroll to next section

---

### Progress Dots
```tsx
<div className="fixed right-8 top-1/2 -translate-y-1/2 z-50">
  <div className="flex flex-col gap-4">
    {sections.map((section, i) => (
      <button key={section} className="group relative">
        {/* Label (hover) */}
        <span className="absolute right-8 px-3 py-1.5 bg-slate-900/90 border border-rose-500/30 rounded-lg text-xs font-mono text-white/70 opacity-0 group-hover:opacity-100">
          {section}
        </span>

        {/* Dot */}
        <div className={`w-2.5 h-2.5 rounded-full transition-all ${
          i === active
            ? 'bg-rose-500 scale-150'
            : 'bg-white/20'
        }`} />
      </button>
    ))}

    {/* Progress line */}
    <div className="absolute top-0 right-1 w-px h-full -z-10">
      <div className="w-full h-full bg-white/10" />
      <div className="absolute top-0 w-full bg-gradient-to-b from-rose-500 to-pink-500"
           style={{ height: `${progress}%` }} />
    </div>
  </div>
</div>
```

**Anatomy**:
1. Dots (2.5px, scale 1.5 when active)
2. Labels (show on hover)
3. Progress line (fills based on scroll)

**Position**: Fixed right side

---

### Typing Text
```tsx
<span className="font-mono text-rose-400">
  {displayedText}
  <span className="inline-block w-0.5 h-[1em] bg-rose-500 ml-0.5 animate-blink" />
</span>
```

**Effect**: Characters appear one by one

**Cursor**: Blinking vertical line

**Speed**: ~80ms per character

---

### Glitch Text
```tsx
<span className="relative inline-block group">
  <span className="relative">Main Text</span>

  {/* On hover: RGB split layers */}
  <span className="absolute top-0 left-0 text-rose-500 opacity-70 glitch-layer-1">
    Main Text
  </span>
  <span className="absolute top-0 left-0 text-cyan-500 opacity-70 glitch-layer-2">
    Main Text
  </span>
</span>
```

**Effect**: RGB color split on hover

**Layers**:
- Red offset: -2px, 2px
- Cyan offset: 2px, -2px

**Duration**: 300ms, 2 iterations (medium)

---

## Form Elements

### Input (Terminal Style)
```tsx
<input
  className="w-full px-4 py-3 bg-black/40 border border-rose-500/20 rounded-lg font-mono text-white placeholder:text-white/40 focus:border-rose-500/60 focus:outline-none transition-all"
  placeholder="Enter address..."
/>
```

**States**:
- Default: Dark bg, subtle border
- Focus: Brighter border
- Error: Red border

---

### Command Line
```tsx
<div className="flex items-center gap-3 p-3 bg-black/40 border border-rose-500/20 rounded-lg">
  <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-mono font-bold text-sm">
    1
  </span>
  <code className="text-rose-300 font-mono text-sm">$ npm install</code>
</div>
```

**Anatomy**:
1. Step number (circle badge)
2. Terminal prompt ($)
3. Command text

**Usage**: Installation steps, tutorials

---

## Address Blocks

### Contract Address
```tsx
<div className="p-4 bg-black/30 rounded-xl border border-rose-500/20">
  <div className="text-white/40 font-mono text-xs mb-2 uppercase tracking-wider">
    PACKAGE_ID
  </div>
  <div className="flex items-center gap-2">
    <code className="flex-1 text-rose-300 text-sm font-mono truncate">
      0xffb8f17c91212d170cb0fee4128b8b44277bfd19af040590cfae08c1abd2bbd2
    </code>
    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
      <Copy className="w-4 h-4 text-white/50" />
    </button>
    <a href="#" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
      <ExternalLink className="w-4 h-4 text-white/50 hover:text-rose-400" />
    </a>
  </div>
</div>
```

**Features**:
- Label (uppercase, muted)
- Address (truncated, mono)
- Copy button (changes to checkmark)
- Explorer link (external)

**Interactions**:
- Click copy → Icon changes for 2s
- Click explorer → Opens in new tab
- Hover buttons → Background lightens

---

## Gradients

### Text Gradient
```tsx
<span className="bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 bg-clip-text text-transparent">
  Gradient Text
</span>
```

**Colors**: Rose → Pink → Rose

**Usage**: Headlines, emphasis

---

### Background Gradient (Hero)
```tsx
<div className="fixed inset-0">
  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-rose-950/20 to-slate-950" />
  <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl animate-pulse" />
  <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
</div>
```

**Layers**:
1. Base gradient (dark slate with rose tint)
2. Top-left blob (rose, pulsing)
3. Bottom-right blob (pink, pulsing with delay)

**Effect**: Subtle animated background

---

### Button Gradient
```tsx
<button className="bg-gradient-to-r from-rose-500 to-pink-500">
  Button
</button>
```

**Direction**: Left to right

**Colors**: Rose 500 → Pink 500

---

## Animations

### Fade In Up (Scroll Reveal)
```tsx
<div className={`transition-all duration-1000 ${
  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
}`}>
  Content
</div>
```

**Initial**: Opacity 0, translateY(40px)

**Final**: Opacity 1, translateY(0)

**Duration**: 1000ms

**Easing**: ease-in-out

---

### Stagger Animation
```tsx
{items.map((item, index) => (
  <div
    key={item.id}
    className="transition-all duration-300"
    style={{ transitionDelay: `${index * 100}ms` }}
  >
    {item.content}
  </div>
))}
```

**Delay**: 100ms per item

**Effect**: Sequential reveal

---

### Bounce (Arrow)
```css
@keyframes bounceArrow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(10px); }
}

.animate-bounce {
  animation: bounceArrow 2s ease-in-out infinite;
}
```

**Usage**: Scroll indicator arrow

---

### Glow Pulse
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

**Usage**: Active elements, emphasis

---

## Layouts

### Section Container
```tsx
<section className="relative py-24 px-4">
  <div className="max-w-6xl mx-auto">
    {/* Content */}
  </div>
</section>
```

**Padding**: 96px vertical (py-24)

**Max Width**: 1280px (max-w-6xl)

**Centering**: mx-auto

---

### Grid (Features)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {features.map(feature => <Card key={feature.id} />)}
</div>
```

**Breakpoints**:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 4 columns

**Gap**: 16px (gap-4)

---

### Flex (Buttons)
```tsx
<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
  <PrimaryButton />
  <SecondaryButton />
</div>
```

**Direction**: Column on mobile, row on tablet+

**Alignment**: Center

**Gap**: 16px

---

## Accessibility

### Focus Ring
```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-slate-950">
  Accessible Button
</button>
```

**Ring**: 2px rose color

**Offset**: 2px from element

**Background**: Slate 950 (matches page bg)

---

### ARIA Labels
```tsx
<button aria-label="Copy package ID to clipboard">
  <Copy className="w-4 h-4" />
</button>

<section aria-labelledby="features-heading">
  <h2 id="features-heading">Features</h2>
</section>
```

**Required**: All icon-only buttons, landmark sections

---

### Screen Reader Only
```tsx
<span className="sr-only">
  Additional context for screen readers
</span>
```

**Usage**: Hidden labels, descriptions

---

## Responsive Patterns

### Show/Hide
```tsx
<div className="hidden md:block">Desktop Only</div>
<div className="block md:hidden">Mobile Only</div>
```

---

### Typography Scale
```tsx
<h1 className="text-4xl sm:text-5xl lg:text-7xl">
  Responsive Heading
</h1>
```

**Scaling**: 36px → 48px → 72px

---

### Spacing
```tsx
<section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
  Content
</section>
```

**Padding increases**: Mobile → Tablet → Desktop

---

This showcase provides visual and code references for all components in the design system. Use as a reference when implementing new features or pages.
