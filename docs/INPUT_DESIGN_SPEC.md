# Input Field Design Spec: High-Conversion Entry Point

## Research Summary

**Key Patterns from Top Products:**
- **Linear**: Minimal borders, generous padding, subtle focus states, action-oriented CTAs
- **Notion**: Soft shadows, rounded corners (12-16px), clear visual hierarchy
- **Stripe**: Integrated input+button groups, clear affordances, smooth micro-interactions
- **Figma**: Large touch targets (56-64px), clear focus rings, benefit-driven copy
- **Duolingo**: Playful but clear, gradient accents, encouraging micro-feedback
- **Apple**: Generous whitespace, subtle depth, system font clarity

## Design Spec: Version A (Highest Conversion Potential)

### Placeholder Text
**Option 1 (Recommended):** `"Enter any website URL to test accessibility"`
- **Rationale**: Direct, action-oriented, mentions benefit (accessibility)
- **Length**: Optimal (42 chars) - visible without truncation
- **Tone**: Professional yet approachable

**Option 2:** `"Try your website URL here"`
- **Rationale**: Personal, inviting, shorter
- **Length**: 28 chars - very concise

**Option 3:** `"Paste a URL to see how others experience it"`
- **Rationale**: Benefit-focused, empathetic
- **Length**: 47 chars - slightly long

### Visual Style Guide

**Container:**
- Background: `rgba(255, 255, 255, 0.98)` with `backdrop-filter: blur(12px)`
- Border: `1.5px solid rgba(110, 198, 255, 0.2)` (subtle brand color)
- Border Radius: `14px` (between 12-16px for modern feel)
- Shadow: `0 2px 8px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.02)`
- Min Height: `60px` (comfortable touch target)
- Padding: `0` (handled by input/button)

**Input Field:**
- Padding: `18px 24px` (generous, comfortable)
- Font Size: `16px` (prevents iOS zoom)
- Font Weight: `400` (regular, readable)
- Color: `rgba(0, 0, 0, 0.9)` (high contrast)
- Placeholder Color: `rgba(0, 0, 0, 0.5)` (clear but secondary)
- Border: `none` (handled by container)

**Button:**
- Background: `linear-gradient(135deg, #6EC6FF 0%, #4A90E2 100%)` (brand gradient)
- Padding: `0 28px`
- Font Size: `15px`
- Font Weight: `600` (semi-bold for emphasis)
- Border Left: `1px solid rgba(255, 255, 255, 0.2)` (subtle separation)
- Icon: Right arrow, 16px, white

### Micro-Interaction Spec

**Idle State:**
- Border: `rgba(110, 198, 255, 0.2)`
- Shadow: Subtle elevation
- No animation

**Hover State (Container):**
- Border: `rgba(110, 198, 255, 0.35)`
- Shadow: `0 4px 12px rgba(110, 198, 255, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)`
- Transform: `translateY(-1px)` (subtle lift)
- Transition: `0.2s cubic-bezier(0.4, 0, 0.2, 1)`

**Focus State (Container):**
- Border: `rgba(110, 198, 255, 0.6)`
- Shadow: `0 0 0 4px rgba(110, 198, 255, 0.15), 0 6px 20px rgba(110, 198, 255, 0.2)`
- Transform: `translateY(-2px)` (more pronounced lift)
- Placeholder: Fades to `rgba(0, 0, 0, 0.4)`

**Button Hover:**
- Background: `linear-gradient(135deg, #7DD3FF 0%, #5BA0F0 100%)` (lighter gradient)
- Transform: `scale(1.02)` (subtle growth)
- Icon: `translateX(2px)` (forward motion)
- Transition: `0.15s ease`

**Button Active:**
- Transform: `scale(0.98)` (press feedback)
- Background: Slightly darker gradient

**Typing State:**
- Real-time validation feedback
- Smooth character entry
- No distracting animations

**Success State (Post-submit):**
- Subtle checkmark animation (optional)
- Button shows loading spinner
- Input disabled with reduced opacity

### Rationale

1. **14px Border Radius**: Modern, friendly, matches app's rounded aesthetic
2. **Gradient Button**: Uses brand colors, stands out, feels premium
3. **60px Height**: Comfortable touch target, not overwhelming
4. **Subtle Lift on Hover**: Creates depth without being distracting
5. **Blue Focus Ring**: Clear affordance, accessible, brand-aligned
6. **Integrated Design**: Input+button as one unit reduces cognitive load
7. **16px Font**: Prevents iOS zoom, improves mobile UX
8. **Action-Oriented Placeholder**: Direct, benefit-focused copy

---

## Alternative Versions

### Version B: Ultra-Minimal (Medium Conversion)

**Differences:**
- Border: `1px solid rgba(0, 0, 0, 0.1)` (more subtle)
- Button: Solid `#000` (black, like Linear)
- Height: `56px` (more compact)
- Placeholder: `"Enter website URL"`
- **Rationale**: Appeals to power users, less "salesy"
- **Conversion Score**: 7/10 (clean but less inviting)

### Version C: Playful & Encouraging (Lower Conversion)

**Differences:**
- Border: `2px solid rgba(110, 198, 255, 0.3)` (more prominent)
- Button: Gradient with icon on left
- Height: `64px` (more spacious)
- Placeholder: `"Paste your URL and discover accessibility insights ✨"`
- Animated placeholder text
- **Rationale**: More engaging but potentially distracting
- **Conversion Score**: 6/10 (fun but may feel unprofessional)

---

## Implementation Priority

**Implement Version A** - Highest conversion potential:
- Clear value proposition
- Professional yet inviting
- Optimal balance of visual appeal and usability
- Aligns with app's soft gradient aesthetic
- Tested patterns from high-converting products


