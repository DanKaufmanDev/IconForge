# IconForge Styles Documentation

Welcome to the IconForge Styles documentation. This document provides a detailed overview of all the utility classes available in IconForge. These classes allow you to style your icons with ease, directly in your HTML.

## Table of Contents
*   [State & Prefixes](#state--responsive-prefixes)
*   [Colors](#colors)
*   [Background Colors](#background-colors)
*   [Border Colors](#border-colors)
*   [Sizing](#sizing)
*   [Height](#height)
*   [Width](#width)
*   [Rotate](#rotate)
*   [Flip](#flip)
*   [Opacity](#opacity)
*   [Cursor](#cursor)
*   [Display](#display)
*   [Flexbox](#flexbox)
*   [Spacing](#spacing)
*   [Animations](#animations)
*   [Typography](#typography)
*   [Positioning](#positioning)
*   [Transitions](#transitions)
*   [Transforms](#transforms)
*   [Grid](#grid)
*   [Border Radius](#border-radius)

---

## State & Responsive Prefixes

IconForge allows you to apply styles conditionally using state and responsive prefixes. This is a powerful feature that lets you create dynamic and responsive designs.

### State Prefixes

State prefixes are used to apply styles based on the state of an element, such as when it is hovered over or focused.

| Prefix | Description |
| --- | --- |
| `hover:` | Applied when the element is hovered over. |
| `focus:` | Applied when the element is focused. |
| `active:` | Applied when the element is active. |
| `disabled:` | Applied when the element is disabled. |
| `dark:` | Applied when the `dark` class is present on a parent element. |

**Example:**
```html
<i class="if-heart is-color-red-5 hover:is-color-red-7"></i>
```

### Responsive Prefixes

Responsive prefixes are used to apply styles at different screen sizes.

| Prefix | Media Query |
| --- | --- |
| `xs:` | `@media (min-width: 420px)` |
| `sm:` | `@media (min-width: 640px)` |
| `md:` | `@media (min-width: 768px)` |
| `lg:` | `@media (min-width: 1024px)` |
| `xl:` | `@media (min-width: 1280px)` |

**Example:**
```html
<i class="if-heart is-size-2xl md:is-size-3xl"></i>
```

---

## Colors

Control the color of your icons using the `is-color-{color}-{shade}` classes. IconForge provides a wide range of colors, each with 10 shades, from 1 (lightest) to 10 (darkest).

**Class format:** `is-color-{color}-{shade}`

**Example:**
```html
<i class="if-heart is-color-red-5"></i>
```

```css
.is-color-red-5 { color: #FF1A1A; }
```

### Available Colors

| Grayscale | Colors | Pastels | Absolute |
| --- | --- | --- | --- |
| `cloud` | `red` | `blush` | `white` |
| `mist` | `orange` | `peach` | `black` |
| `ash` | `yellow` | `amber` | |
| `ink` | `green` | `zest` | |
| `coal` | `blue` | `frost` | |
| `dune` | `purple` | `twilight` | |



### Arbitrary Values

> **Note:** Arbitrary values are supported for all color, background, and border color utilities.

You can also use arbitrary color values using the following syntax:

**Class format:** `is-color-[{value}]`

**Example:**
```html
<i class="if-heart is-color-[#ff0000]"></i>
```

---

## Background Colors

Control the background color of your icons using the `is-bg-{color}-{shade}` classes. These work just like the `is-color` classes, with the same range of colors and shades.

**Class format:** `is-bg-{color}-{shade}`

**Example:**
```html
<i class="if-heart is-bg-red-5"></i>
```

```css
.is-bg-red-5 { background-color: #dc2626; }
```

---

## Gradients

Create beautiful gradient effects on your icons.

**Class format:** `is-gradient-{type}-[{value}]`

**Types:**

*   `linear`
*   `radial`
*   `conic`

**Example:**
```html
<i class="if-heart is-gradient-linear-[to_right,red,orange]"></i>
```

```css
.is-gradient-linear-\[to_right\,red\,orange\] {
  background: linear-gradient(to right, red, orange);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}
```

---

## Border Colors

Control the border color of your icons using the `is-border-{color}-{shade}` classes. These work just like the `is-color` and `is-bg` classes, with the same range of colors and shades.

**Class format:** `is-border-{color}-{shade}`

**Example:**
```html
<i class="if-heart is-border-red-5"></i>
```

```css
.is-border-red-5 { border-color: #FF1A1A; }
```

---

## Sizing

Control the size of your icons using the `is-size-{size}` classes.

**Class format:** `is-size-{size}`

| Class | CSS |
| --- | --- |
| `is-size-xs` | `font-size: 0.75rem;` |
| `is-size-sm` | `font-size: 0.875rem;` |
| `is-size-md` | `font-size: 1rem;` |
| `is-size-lg` | `font-size: 1.25rem;` |
| `is-size-xl` | `font-size: 1.5rem;` |
| `is-size-2xl` | `font-size: 2rem;` |
| `is-size-3xl` | `font-size: 3rem;` |
| `is-size-4xl` | `font-size: 4rem;` |
| `is-size-5xl` | `font-size: 5rem;` |
| `is-size-6xl` | `font-size: 6rem;` |
| `is-size-7xl` | `font-size: 7rem;` |
| `is-size-8xl` | `font-size: 8rem;` |

**Example:**
```html
<i class="if-heart is-size-2xl"></i>
```

### Arbitrary Values

> **Note:** Arbitrary values are supported for all sizing, height, and width utilities.

You can also use arbitrary size values using the following syntax:

**Class format:** `is-size-[{value}]`

**Example:**
```html
<i class="if-heart is-size-[64px]"></i>
```

---

## Height

Control the height of your icons using the `is-h-{value}` classes.

**Class format:** `is-h-{value}`

| Class | CSS |
| --- | --- |
| `is-h-auto` | `height: auto;` |
| `is-h-fit` | `height: fit-content;` |
| `is-h-min` | `height: min-content;` |
| `is-h-max` | `height: max-content;` |
| `is-h-full` | `height: 100%;` |
| `is-h-three-quarter` | `height: 75%;` |
| `is-h-half` | `height: 50%;` |
| `is-h-quarter` | `height: 25%;` |

**Example:**
```html
<i class="if-heart is-h-full"></i>
```

---

## Width

Control the width of your icons using the `is-w-{value}` classes.

**Class format:** `is-w-{value}`

| Class | CSS |
| --- | --- |
| `is-w-auto` | `width: auto;` |
| `is-w-fit` | `width: fit-content;` |
| `is-w-min` | `width: min-content;` |
| `is-w-max` | `width: max-content;` |
| `is-w-full` | `width: 100%;` |
| `is-w-three-quarter` | `width: 75%;` |
| `is-w-half` | `width: 50%;` |
| `is-w-quarter` | `width: 25%;` |

**Example:**
```html
<i class="if-heart is-w-full"></i>
```

---

## Rotate

Rotate your icons using the `is-rot-{degree}` classes.

**Class format:** `is-rot-{degree}`

| Class | CSS |
| --- | --- |
| `is-rot-45` | `rotate: 45deg;` |
| `is-rot-90` | `rotate: 90deg;` |
| `is-rot-135` | `rotate: 135deg;` |
| `is-rot-180` | `rotate: 180deg;` |
| `is-rot-225` | `rotate: 225deg;` |
| `is-rot-270` | `rotate: 270deg;` |
| `is-rot-315` | `rotate: 315deg;` |
| `is-rot-360` | `rotate: 360deg;` |

**Example:**
```html
<i class="if-heart is-rot-45"></i>
```

### Arbitrary Values

> **Note:** Arbitrary values are supported for all rotation utilities.

You can also use arbitrary rotation values using the following syntax:

**Class format:** `is-rot-[{value}]`

**Example:**
```html
<i class="if-heart is-rot-[60deg]"></i>
```

---

## Flip

Flip your icons vertically or horizontally using the `is-flip-{direction}` classes.

**Class format:** `is-flip-{direction}`

| Class | CSS |
| --- | --- |
| `is-flip-v` | `transform: scaleY(-1);` |
| `is-flip-h` | `transform: scaleX(-1);` |

**Example:**
```html
<i class="if-heart is-flip-v"></i>
```

---

## Opacity

Control the opacity of your icons using the `is-opacity-{value}` classes.

**Class format:** `is-opacity-{value}`

| Class | CSS |
| --- | --- |
| `is-opacity-0` | `opacity: 0;` |
| `is-opacity-25` | `opacity: 0.25;` |
| `is-opacity-50` | `opacity: 0.5;` |
| `is-opacity-75` | `opacity: 0.75;` |
| `is-opacity-100` | `opacity: 1;` |

**Example:**
```html
<i class="if-heart is-opacity-50"></i>
```

### Arbitrary Values

> **Note:** Arbitrary values are supported for all opacity utilities.

You can also use arbitrary opacity values using the following syntax:

**Class format:** `is-opacity-[{value}]`

**Example:**
```html
<i class="if-heart is-opacity-[0.3]"></i>
```

---

## Cursor

Control the cursor style when hovering over an icon.

| Class | CSS |
| --- | --- |
| `is-clickable` | `cursor: pointer;` |
| `is-not-clickable` | `cursor: not-allowed;` |

**Example:**
```html
<i class="if-heart is-clickable"></i>
```

---

## Display

Control the display property of your icons.

| Class | CSS |
| --- | --- |
| `is-hidden` | `display: none;` |
| `is-block` | `display: block;` |
| `is-inline` | `display: inline;` |
| `is-inline-block` | `display: inline-block;` |
| `is-flex` | `display: flex;` |
| `is-inline-flex` | `display: inline-flex;` |

**Example:**
```html
<i class="if-heart is-flex"></i>
```

---

## Flexbox

IconForge provides a full suite of flexbox utilities.

### Flex Direction

| Class | CSS |
| --- | --- |
| `is-flex-row` | `flex-direction: row;` |
| `is-flex-row-reverse` | `flex-direction: row-reverse;` |
| `is-flex-col` | `flex-direction: column;` |
| `is-flex-col-reverse` | `flex-direction: column-reverse;` |

### Flex Wrap

| Class | CSS |
| --- | --- |
| `is-flex-wrap` | `flex-wrap: wrap;` |
| `is-flex-nowrap` | `flex-wrap: nowrap;` |
| `is-flex-wrap-reverse` | `flex-wrap: wrap-reverse;` |

### Justify Content

| Class | CSS |
| --- | --- |
| `is-justify-start` | `justify-content: flex-start;` |
| `is-justify-end` | `justify-content: flex-end;` |
| `is-justify-center` | `justify-content: center;` |
| `is-justify-between` | `justify-content: space-between;` |
| `is-justify-around` | `justify-content: space-around;` |
| `is-justify-evenly` | `justify-content: space-evenly;` |

### Align Items

| Class | CSS |
| --- | --- |
| `is-items-start` | `align-items: flex-start;` |
| `is-items-end` | `align-items: flex-end;` |
| `is-items-center` | `align-items: center;` |
| `is-items-baseline` | `align-items: baseline;` |
| `is-items-stretch` | `align-items: stretch;` |

### Align Self

| Class | CSS |
| --- | --- |
| `is-self-start` | `align-self: flex-start;` |
| `is-self-end` | `align-self: flex-end;` |
| `is-self-center` | `align-self: center;` |
| `is-self-baseline` | `align-self: baseline;` |
| `is-self-stretch` | `align-self: stretch;` |

### Align Content

| Class | CSS |
| --- | --- |
| `is-content-start` | `align-content: flex-start;` |
| `is-content-end` | `align-content: flex-end;` |
| `is-content-center` | `align-content: center;` |
| `is-content-between` | `align-content: space-between;` |
| `is-content-around` | `align-content: space-around;` |
| `is-content-evenly` | `align-content: space-evenly;` |

---

## Spacing

IconForge provides margin and padding utilities.

### Margin

**Class format:** `is-m{direction}-{size}`

*   `m` - margin on all sides
*   `mt` - margin-top
*   `mr` - margin-right
*   `mb` - margin-bottom
*   `ml` - margin-left
*   `mx` - margin-left and margin-right
*   `my` - margin-top and margin-bottom

**Sizes:** `auto`, `1-10`

### Padding

**Class format:** `is-p{direction}-{size}`

*   `p` - padding on all sides
*   `pt` - padding-top
*   `pr` - padding-right
*   `pb` - padding-bottom
*   `pl` - padding-left
*   `px` - padding-left and padding-right
*   `py` - padding-top and padding-bottom

**Sizes:** `auto`, `1-10`

### Arbitrary Values

> **Note:** Arbitrary values are supported for all spacing utilities.

You can also use arbitrary spacing values using the following syntax:

**Class format:** `is-{m|p}{direction}-[{value}]`

**Example:**
```html
<i class="if-heart is-m-[10px]"></i>
```

---

## Animations

Bring your icons to life with animations.

| Class | CSS |
| --- | --- |
| `is-anim-pulse` | `animation: is-pulse 1s ease-in-out infinite alternate;` |
| `is-anim-blink` | `animation: is-blink 0.5s ease-in-out infinite alternate;` |
| `is-anim-ping` | `animation: is-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;` |
| `is-anim-spin` | `animation: is-spin 2s linear infinite;` |
| `is-anim-bounce` | `animation: is-bounce 1s infinite;` |
| `is-anim-shake` | `animation: is-shake 0.5s infinite;` |
| `is-anim-wiggle` | `animation: is-wiggle 1s ease-in-out infinite;` |
| `is-anim-flip` | `animation: is-flip 1s linear infinite;` |
| `is-anim-pop` | `animation: is-pop 0.45s ease-out;` |
| `is-anim-flicker` | `animation: is-flicker 2s infinite;` |
| `is-anim-drift` | `position: absolute; opacity: 0; animation: is-drift 10s ease-in-out infinite; animation-delay: calc(var(--i) * 0.1s);` |

**Example:**
```html
<i class="if-heart is-anim-pulse"></i>
```

---

## Typography

### Text Alignment

| Class | CSS |
| --- | --- |
| `is-text-start` | `text-align: start;` |
| `is-text-end` | `text-align: end;` |
| `is-text-left` | `text-align: left;` |
| `is-text-right` | `text-align: right;` |
| `is-text-center` | `text-align: center;` |

### Text Decoration

| Class | CSS |
| --- | --- |
| `is-text-none` | `text-decoration: none;` |

### Line Height

| Class | CSS |
| --- | --- |
| `is-line-none` | `line-height: 1;` |
| `is-line-tight` | `line-height: 1.25;` |
| `is-line-snug` | `line-height: 1.375;` |
| `is-line-normal` | `line-height: 1.5;` |

### Vertical Alignment

| Class | CSS |
| --- | --- |
| `is-align-middle` | `vertical-align: middle;` |
| `is-align-top` | `vertical-align: text-top;` |
| `is-align-bottom` | `vertical-align: text-bottom;` |

---

## Positioning

| Class | CSS |
| --- | --- |
| `is-nav` | `position: sticky; top: 0; z-index: 999;` |
| `is-sticky` | `position: sticky;` |
| `is-absolute` | `position: absolute;` |
| `is-relative` | `position: relative;` |

### Z-Index

| Class | CSS |
| --- | --- |
| `is-z-0` | `z-index: 0;` |
| `is-z-50` | `z-index: 50;` |
| `is-z-100` | `z-index: 100;` |

### Arbitrary Values

> **Note:** Arbitrary values are supported for all z-index utilities.

You can also use arbitrary z-index values using the following syntax:

**Class format:** `is-z-[{value}]`

**Example:**
```html
<i class="if-heart is-z-[9999]"></i>
```

---

## Transitions

| Class | CSS |
| --- | --- |
| `is-transition` | `transition: all 0.2s ease-in-out;` |
| `is-transition-fast` | `transition: all 0.1s ease-in-out;` |
| `is-transition-slow` | `transition: all 0.5s ease-in-out;` |

---

## Transforms

### Scale

| Class | CSS |
| --- | --- |
| `is-scale-50` | `transform: scale(0.5);` |
| `is-scale-100` | `transform: scale(1);` |
| `is-scale-125` | `transform: scale(1.25);` |
| `is-scale-150` | `transform: scale(1.5);` |
| `is-scale-200` | `transform: scale(2);` |

### Arbitrary Values

> **Note:** Arbitrary values are supported for all scale utilities.

You can also use arbitrary scale values using the following syntax:

**Class format:** `is-scale-[{value}]`

**Example:**
```html
<i class="if-heart is-scale-[1.1]"></i>
```

---

## Grid

### Grid Template Columns

| Class | CSS |
| --- | --- |
| `is-grid-cols-1` | `grid-template-columns: repeat(1, minmax(0, 1fr));` |
| `is-grid-cols-2` | `grid-template-columns: repeat(2, minmax(0, 1fr));` |
| `is-grid-cols-3` | `grid-template-columns: repeat(3, minmax(0, 1fr));` |
| `is-grid-cols-4` | `grid-template-columns: repeat(4, minmax(0, 1fr));` |
| `is-grid-cols-5` | `grid-template-columns: repeat(5, minmax(0, 1fr));` |
| `is-grid-cols-6` | `grid-template-columns: repeat(6, minmax(0, 1fr));` |

### Grid Template Rows

| Class | CSS |
| --- | --- |
| `is-grid-rows-1` | `grid-template-rows: repeat(1, minmax(0, 1fr));` |
| `is-grid-rows-2` | `grid-template-rows: repeat(2, minmax(0, 1fr));` |
| `is-grid-rows-3` | `grid-template-rows: repeat(3, minmax(0, 1fr));` |
| `is-grid-rows-4` | `grid-template-rows: repeat(4, minmax(0, 1fr));` |
| `is-grid-rows-5` | `grid-template-rows: repeat(5, minmax(0, 1fr));` |
| `is-grid-rows-6` | `grid-template-rows: repeat(6, minmax(0, 1fr));` |

### Gap

| Class | CSS |
| --- | --- |
| `is-gap-0` | `gap: 0;` |
| `is-gap-1` | `gap: 0.25rem;` |
| `is-gap-2` | `gap: 0.5rem;` |
| `is-gap-3` | `gap: 0.75rem;` |
| `is-gap-4` | `gap: 1rem;` |
| `is-gap-5` | `gap: 1.25rem;` |
| `is-gap-6` | `gap: 1.5rem;` |
| `is-gap-8` | `gap: 2rem;` |
| `is-gap-10` | `gap: 2.5rem;` |
| `is-gap-12` | `gap: 3rem;` |

### Arbitrary Values

> **Note:** Arbitrary values are supported for all gap utilities.

You can also use arbitrary gap values using the following syntax:

**Class format:** `is-gap-[{value}]`

**Example:**
```html
<div class="is-grid is-gap-[1rem]">
  <!-- ... -->
</div>
```

---

## Border Radius

| Class | CSS |
| --- | --- |
| `is-rounded-sm` | `border-radius: 0.125rem;` |
| `is-rounded` | `border-radius: 0.25rem;` |
| `is-rounded-md` | `border-radius: 0.375rem;` |
| `is-rounded-lg` | `border-radius: 0.5rem;` |
| `is-rounded-xl` | `border-radius: 0.75rem;` |
| `is-rounded-2xl` | `border-radius: 1rem;` |
| `is-rounded-3xl` | `border-radius: 1.5rem;` |
| `is-rounded-full` | `border-radius: 9999px;` |

### Arbitrary Values

> **Note:** Arbitrary values are supported for all border radius utilities.

You can also use arbitrary border radius values using the following syntax:

**Class format:** `is-rounded-[{value}]`

**Example:**
```html
<div class="is-rounded-[10px]">
  <!-- ... -->
</div>
```

---

## Contributing

We welcome contributions to IconForge! If you have an idea for a new style or an improvement to an existing one, please open an issue or a pull request on our [GitHub repository](https://github.com/DanKaufmanDev/IconForge).
