<div align="center">
  <img src="https://imgur.com/0PkWKFR.png" alt="IconForge Logo" style="width:35%; height:35%;"/>
</div>

# IconForge

[![npm version](https://img.shields.io/npm/v/iconforged.svg)](https://www.npmjs.com/package/iconforged)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Fast, Lightweight, and Customizable Icon Library. Stop Guessing, Start Forging.**

IconForge is a performance-focused, utility-style icon framework that lets you load **only the icons you need**.
Powered by a JIT (Just-In-Time) compiler, IconForge tree-shakes unused icons, dynamically injects CSS at runtime,
and delivers blazing-fast performance — whether you use it via CDN or IconForge CLI.

## Features

*   **Just-in-Time (JIT) Compiler:** IconForge scans your HTML and generates only the CSS for the icons you are actually using. No more bloated CSS files.
*   **Tree-Shaking by Default:** Unused icons are automatically removed, resulting in the smallest possible footprint.
*   **Utility-First Classes:** A rich set of utility classes allows you to customize icon size, color, rotation, and animations directly in your HTML. Fully compatible with both CDN and CLI methods.
*   **IDE Integration:** The official IconForge IntelliSense extension for VS Code provides autocompletion, icon previews, and CSS snippets right in your editor.
*   **CLI or CDN:** Use IconForge CLI or drop the CDN link into your project to get started instantly.
*   **Huge Library:** A massive library of icons for every need, from UI elements to popular brand logos.

## Getting Started

There are two ways to get started with IconForge:

### Method 1: CDN (Runtime JIT)

For the quickest setup, you can use the CDN link. The JIT compiler will scan your page on the fly and generate the necessary CSS.

Place the following script tag in the `<head>` section of your HTML file.

```html
<script src="https://cdn.jsdelivr.net/npm/iconforged@latest"></script>
```

### Method 2: IconForge CLI (Build-Time)

For a more robust, production-ready setup, you can install the IconForge CLI.

**1. Initialize your project:**

Run the `init` command to initialize the project and create a default `iconforge.config.js` file in your project root.
```bash
npx iconforged init
```

**2. Start the build process:**

Use the `build` command to perform a one-time scan and generate your CSS. Use `watch` to automatically rebuild as you make changes.
```bash
npx iconforged build

```
```bash
npx iconforged watch
```
This will generate an `iconforge-output` directory containing your `iconforge.css` and `iconforge.woff2` files.

**4. Link the generated stylesheet in your HTML:**

Copy the following `<link>` tag into the `<head>` of your HTML file. The path should be relative to your HTML file.

```html
<link rel="stylesheet" href="iconforge-output/iconforge.css">
```

## Usage

Using an icon is as simple as adding an `<i>` or `<span>` tag with the appropriate class name.

```html
<!-- Basic Icon -->
<i class="if-user"></i>

<!-- Styled Icon -->
<i class="if-heart is-color-red-5 is-size-2xl is-anim-pulse"></i>
```
Use prefix's like `dark:` `hover:` to dynamically change your icon
```html
<!-- Dynamic Icon -->
<i class="if-bulb is-color-white dark:is-color-amber-4 is-size-2xl hover:is-anim-pop"></I>
```
IconForge support arbitrary value handling simply place the value between square brackets `[VALUE]`
```html
<!-- Arbitrary Icon-->
<button class="is-sq hover:is-clickable">
    <i class="if-iconforge is-color-[#ffad8c] is-size-[64px]"></i>
</button>

```
## Configuration

The `iconforge.config.js` file allows you to control which files are scanned for icon classes.

```javascript
module.exports = {
    // Files to scan for icon classes
    content: [
        './**/*.{html,js,ts,vue,jsx,tsx}',
    ],
    // Custom CSS files to append to the output
    customCSS: ['styles.css'],
};
```

## IconForge Intellisense Extension

Supercharge your development workflow with the official IconForge IntelliSense extension for VS Code.

*   **Autocomplete:** Get suggestions for icon and style classes as you type.
*   **Icon Previews:** Hover over a icon class to see a smart preview of the icon.
*   **CSS Snippets:** View the pre generated CSS.

[Download Here](https://github.com/DanKaufmanDev/IconForge-Intellisense)

## Contribution

Can't find an icon you're looking for? [Request an icon](https://github.com/DanKaufmanDev/IconForge/issues/new?labels=request)

Found a bug? [Report Here](https://github.com/DanKaufmanDev/IconForge/issues/new?labels=bug)

