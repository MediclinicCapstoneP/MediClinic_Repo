# Theme Color Guide - #91C8E4

This guide shows how to use the new theme color `#91C8E4` throughout your IgabayCare application.

## 🎨 Color Palette

### Primary Theme Colors
- **Main Theme**: `#91C8E4` (Light Blue)
- **Light**: `#a8d2ea` (Lighter shade)
- **Dark**: `#7bb8d4` (Darker shade)
- **Darker**: `#65a8c4` (Even darker)
- **Darkest**: `#4f98b4` (Darkest shade)

### CSS Variables
```css
--theme-primary: #91C8E4;
--theme-primary-light: #a8d2ea;
--theme-primary-dark: #7bb8d4;
--theme-primary-darker: #65a8c4;
--theme-primary-darkest: #4f98b4;
```

## 🎯 Tailwind Classes

### Background Colors
```html
<!-- Main theme background -->
<div class="bg-theme">Main theme color</div>

<!-- Light theme background -->
<div class="bg-theme-light">Light theme color</div>

<!-- Dark theme background -->
<div class="bg-theme-dark">Dark theme color</div>

<!-- Hover effects -->
<div class="hover:bg-theme">Hover to theme color</div>
<div class="hover:bg-theme-dark">Hover to dark theme</div>
```

### Text Colors
```html
<!-- Theme text color -->
<p class="text-theme">Theme colored text</p>

<!-- Light theme text -->
<p class="text-theme-light">Light theme text</p>

<!-- Dark theme text -->
<p class="text-theme-dark">Dark theme text</p>

<!-- Hover text effects -->
<p class="hover:text-theme">Hover to theme color</p>
```

### Border Colors
```html
<!-- Theme border -->
<div class="border-theme">Theme border</div>

<!-- Light theme border -->
<div class="border-theme-light">Light theme border</div>

<!-- Dark theme border -->
<div class="border-theme-dark">Dark theme border</div>

<!-- Hover border effects -->
<div class="hover:border-theme">Hover to theme border</div>
```

### Gradients
```html
<!-- Main theme gradient -->
<div class="bg-gradient-theme">Theme gradient</div>

<!-- Light theme gradient -->
<div class="bg-gradient-theme-light">Light theme gradient</div>

<!-- Dark theme gradient -->
<div class="bg-gradient-theme-dark">Dark theme gradient</div>

<!-- Hero gradient -->
<div class="bg-gradient-theme-hero">Hero gradient</div>
```

### Shadows and Effects
```html
<!-- Theme shadow -->
<div class="shadow-theme">Theme shadow</div>

<!-- Theme glow effect -->
<div class="shadow-theme-glow">Theme glow</div>

<!-- Focus ring -->
<input class="focus:ring-theme" />
<input class="focus:border-theme" />
```

## 🧩 Component Classes

### Button Styles
```html
<!-- Theme button -->
<button class="btn-theme">Theme Button</button>

<!-- Outline theme button -->
<button class="btn-theme-outline">Outline Theme Button</button>
```

### Card Styles
```html
<!-- Theme card -->
<div class="card-theme">Theme Card</div>

<!-- Accent theme card -->
<div class="card-theme-accent">Accent Theme Card</div>
```

### Input Styles
```html
<!-- Theme input -->
<input class="input-theme" />
```

### Badge Styles
```html
<!-- Theme badge -->
<span class="badge-theme">Theme Badge</span>

<!-- Light theme badge -->
<span class="badge-theme-light">Light Theme Badge</span>
```

## 📱 Usage Examples

### Navigation Components
```tsx
// Header with theme colors
<header className="bg-white border-b border-theme-light">
  <h1 className="text-2xl font-bold text-theme">iGabayAtiCare</h1>
</header>

// Sidebar with theme colors
<nav className="bg-theme-light text-theme-dark">
  <div className="bg-gradient-theme rounded-lg">
    <Heart className="text-white" />
  </div>
</nav>
```

### Buttons and Actions
```tsx
// Primary action button
<Button variant="primary" className="bg-theme hover:bg-theme-dark">
  Book Appointment
</Button>

// Secondary action button
<Button variant="outline" className="border-theme text-theme">
  Learn More
</Button>
```

### Cards and Containers
```tsx
// Feature card
<Card className="hover:border-theme-light">
  <CardHeader>
    <CardTitle className="text-theme">Smart Booking</CardTitle>
  </CardHeader>
</Card>

// Status badge
<span className="badge-theme">Confirmed</span>
```

### Forms and Inputs
```tsx
// Form input with theme focus
<Input 
  className="focus:border-theme focus:ring-theme"
  placeholder="Enter your email"
/>

// Form submit button
<Button className="bg-theme hover:bg-theme-dark">
  Submit
</Button>
```

## 🎨 Design Patterns

### Primary Actions
- Use `bg-theme` for primary buttons
- Use `text-theme` for important text
- Use `border-theme` for active states

### Secondary Actions
- Use `bg-theme-light` for secondary backgrounds
- Use `text-theme-dark` for secondary text
- Use `border-theme-light` for subtle borders

### Interactive Elements
- Use `hover:bg-theme` for hover states
- Use `focus:ring-theme` for focus states
- Use `shadow-theme` for emphasis

### Status Indicators
- Use `badge-theme` for success/active states
- Use `badge-theme-light` for neutral states
- Use gradients for special elements

## 🔧 Customization

### Adding New Theme Variations
```css
/* Add to your CSS */
.bg-theme-custom {
  background-color: var(--theme-primary);
}

.text-theme-custom {
  color: var(--theme-primary);
}
```

### Creating Custom Gradients
```css
/* Custom gradient */
.bg-gradient-theme-custom {
  background: linear-gradient(135deg, #91C8E4 0%, #7bb8d4 50%, #65a8c4 100%);
}
```

### Animation with Theme Colors
```css
/* Theme pulse animation */
@keyframes themePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.animate-theme-pulse {
  animation: themePulse 2s infinite;
}
```

## 🎯 Best Practices

### Color Hierarchy
1. **Primary**: Use `bg-theme` for main actions
2. **Secondary**: Use `bg-theme-light` for supporting elements
3. **Tertiary**: Use `text-theme` for important text
4. **Neutral**: Use `border-theme-light` for subtle borders

### Accessibility
- Always ensure sufficient contrast with white text on theme backgrounds
- Use `text-theme-dark` for better readability on light backgrounds
- Test with color blindness simulators

### Consistency
- Use the same theme color for related elements
- Maintain consistent hover and focus states
- Apply theme colors systematically across components

## 🚀 Quick Start

1. **Replace existing blue colors** with theme classes
2. **Update component variants** to use theme colors
3. **Test all interactive states** (hover, focus, active)
4. **Ensure accessibility** with proper contrast ratios

## 📋 Checklist

- [ ] Updated Button component with theme colors
- [ ] Updated Card component with theme hover effects
- [ ] Updated Input component with theme focus states
- [ ] Updated Header with theme branding
- [ ] Updated Sidebar with theme navigation
- [ ] Updated LandingPage with theme elements
- [ ] Tested all hover and focus states
- [ ] Verified accessibility compliance
- [ ] Updated any remaining blue color references

Your application now uses the beautiful `#91C8E4` theme color consistently throughout! 🎉 