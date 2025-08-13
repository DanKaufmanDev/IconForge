(() => {
  const VERSION = '1.1.6';
  const CDN = 'https://cdn.jsdelivr.net/gh/DanKaufmanDev/IconForge@75dd8b5/dist';
  const FONT_NAME = 'IconForge';
  const FONT_URL = `${CDN}/iconforge.woff2`;
  const META_ICONS_URL = `${CDN}/meta/iconforge-icons.json`;
  const META_STYLES_URL = `${CDN}/meta/iconforge-styles.json`;

  const usedIf = new Set();
  const usedIs = new Set();
  const usedVariants = new Set();
  const usedArbitrary = new Set();
  const injected = new Set();
  const style = document.createElement('style');
  document.head.appendChild(style);

  let iconsMeta = {};
  let stylesMeta = {};

  const metrics = {
    loadStart: performance.now(),
    fontLoaded: false,
    metaLoaded: false,
    errors: 0
  };

  const preloadFont = () => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = FONT_URL;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  };

  const injectFontFace = () => {
    const css = `/* Injected by IconForge */
@font-face { font-family: '${FONT_NAME}'; src: url('${FONT_URL}') format('woff2'); font-display: block; font-weight: normal; font-style: normal; }`;
    style.textContent = css;
  };

  const injectClass = () => {
    const css = `[class^="if-"], [class*=" if-"] { font-family: '${FONT_NAME}' !important; display: inline-block; font-style: normal; font-weight: normal; font-variant: normal; text-transform: none; line-height: 1; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }`;
    style.textContent += css;
  };

  const variantSelectors = {
    hover: s => `${s}:hover`,
    focus: s => `${s}:focus`,
    active: s => `${s}:active`,
    dark: s => `.dark ${s}`,
    xs: s => `@media (min-width: 420px) { ${s} }`,
    sm: s => `@media (min-width: 640px) { ${s} }`,
    md: s => `@media (min-width: 768px) { ${s} }`,
    lg: s => `@media (min-width: 1024px) { ${s} }`,
    xl: s => `@media (min-width: 1280px) { ${s} }`,
  };

  const arbitraryValueRegex = /^(is-(color|bg|size|w)-)\[(.+)\]$/;

  // Escape special CSS selector chars: [ ] \ / etc.
  function escapeClassName(cls) {
    return selector.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
  }

  // Parse variant classes, extended to flag arbitrary classes
  function parseVariantClass(cls) {
    if (!cls.includes(':')) return { variants: [], baseClass: cls, isArbitrary: arbitraryValueRegex.test(cls) };
    const parts = cls.split(':');
    const baseClass = parts.pop();
    const variants = parts;
    return { variants, baseClass, isArbitrary: arbitraryValueRegex.test(baseClass) };
  }

  function buildSelector(variants, baseClass) {
    let selector = `.${escapeClassName(baseClass)}`;
    let mediaQueries = [];

    variants.forEach(variant => {
      const fn = variantSelectors[variant];
      if (!fn) {
        selector = `.${variant} ${selector}`;
        return;
      }
      const result = fn(selector);
      if (result.startsWith('@media')) {
        mediaQueries.push(result);
      } else {
        selector = result;
      }
    });

    if (mediaQueries.length) {
      return mediaQueries.map(mq => {
        return mq.replace(/\{[^}]*\}/, `{ ${selector} }`);
      }).join(' ');
    }
    return selector;
  }

  // Generate CSS rule string for arbitrary class
  function generateArbitraryRule(cls) {
    const match = cls.match(arbitraryValueRegex);
    if (!match) return null;

    const prefix = match[1];   
    const type = match[2];     
    const value = match[3];    

    const escapedClass = escapeClassName(cls);

    switch (type) {
        case 'is-color': properties = `color: ${value};`; break;
        case 'is-bg': properties = `background-color: ${value};`; break;
        case 'is-w': properties = `width: ${value};`; break;
        case 'is-h': properties = `height: ${value};`; break;
        case 'is-sq': properties = `width: ${value}; height: ${value};`; break;
        case 'is-size': properties = `font-size: ${value};`; break;
        case 'is-p': properties = `padding: ${value};`; break;
        case 'is-pt': properties = `padding-top: ${value};`; break;
        case 'is-pr': properties = `padding-right: ${value};`; break;
        case 'is-pb': properties = `padding-bottom: ${value};`; break;
        case 'is-pl': properties = `padding-left: ${value};`; break;
        case 'is-px': properties = `padding-left: ${value}; padding-right: ${value};`; break;
        case 'is-py': properties = `padding-top: ${value}; padding-bottom: ${value};`; break;
        case 'is-m': properties = `margin: ${value};`; break;
        case 'is-mt': properties = `margin-top: ${value};`; break;
        case 'is-mr': properties = `margin-right: ${value};`; break;
        case 'is-mb': properties = `margin-bottom: ${value};`; break;
        case 'is-ml': properties = `margin-left: ${value};`; break;
        case 'is-mx': properties = `margin-left: ${value}; margin-right: ${value};`; break;
        case 'is-my': properties = `margin-top: ${value}; margin-bottom: ${value};`; break;
      }
  }

  const fetchMeta = async () => {
    try {
      const cachedIcons = sessionStorage.getItem('iconforge_icons');
      const cachedStyles = sessionStorage.getItem('iconforge_styles');
      
      if (cachedIcons && cachedStyles) {
        iconsMeta = JSON.parse(cachedIcons);
        stylesMeta = JSON.parse(cachedStyles);
        return;
      }

      const start = performance.now();
      const [icons, styles] = await Promise.all([
        fetchWithRetry(META_ICONS_URL, { priority: 'high' }),
        fetchWithRetry(META_STYLES_URL, { priority: 'high' })
      ]);
      
      metrics.metaLoaded = true;
      metrics.metaLoadTime = performance.now() - start;
      
      safeSave('iconforge_icons', icons);
      safeSave('iconforge_styles', styles);
      
      iconsMeta = icons;
      stylesMeta = styles;
    } catch (err) {
      metrics.errors++;
      console.warn('IconForge: Failed to load meta data, falling back to defaults', err);
      iconsMeta = {};
      stylesMeta = {};
    }
  };

  const scanNode = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const scanElement = (el) => {
      const classes = el.className;
      if (typeof classes !== 'string') return;

      classes.split(/\s+/).forEach(cls => {
        if (!cls) return;
        if (cls.startsWith('if-')) {
          usedIf.add(cls);
        } else if (cls.startsWith('is-')) {
          if (arbitraryValueRegex.test(cls)) {
            usedArbitrary.add(cls);
          } else {
            usedIs.add(cls);
          }
        } else if (cls.includes(':')) {
          usedVariants.add(cls);
        }
      });
    };

    scanElement(node);

    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          return node.className &&
            (node.className.includes('if-') ||
              node.className.includes('is-') ||
              node.className.includes(':'))
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        }
      }
    );

    while (walker.nextNode()) {
      scanElement(walker.currentNode);
    }
  };

  function appendToDynamicStyle(css) {
    requestAnimationFrame(() => {
      let dynamicStyle = document.querySelector('.iconforge-dynamic');
      if (!dynamicStyle) {
        dynamicStyle = document.createElement('style');
        dynamicStyle.classList.add('iconforge-dynamic');
        style.after(dynamicStyle);
      }
      dynamicStyle.textContent += css + '\n';
    });
  }

  const injectStyles = () => {
    let keyframes = '';
    let classes = '';

    // Base icons
    usedIf.forEach(cls => {
      if (!injected.has(cls) && iconsMeta[cls]) {
        classes += iconsMeta[cls] + '\n';
        injected.add(cls);
      }
    });

    // Base styles
    usedIs.forEach(cls => {
      if (!injected.has(cls) && stylesMeta[cls]) {
        const styleObj = stylesMeta[cls];
        if (typeof styleObj === 'object' && styleObj.class) {
          if (styleObj.keyframes && !injected.has(styleObj.keyframes)) {
            keyframes += styleObj.keyframes + '\n';
            injected.add(styleObj.keyframes);
          }
          classes += styleObj.class + '\n';
        } else if (typeof styleObj === 'string') {
          classes += styleObj + '\n';
        }
        injected.add(cls);
      }
    });

    // Variant classes
    usedVariants.forEach(vc => {
      if (injected.has(vc)) return;

      const parsed = parseVariantClass(vc);
      if (!parsed) return;

      const { variants, baseClass, isArbitrary } = parsed;
      let baseCss = null;

      if (isArbitrary) {
        baseCss = generateArbitraryRule(baseClass);
      } else {
        baseCss = iconsMeta[baseClass] || stylesMeta[baseClass];
      }
      if (!baseCss) return;

      const selector = buildSelector(variants, baseClass);
      const cssRule = baseCss.replace(new RegExp(`\\.${escapeClassName(baseClass)}`, 'g'), selector);

      classes += cssRule + '\n';
      injected.add(vc);
    });

    // Arbitrary classes without variants
    usedArbitrary.forEach(cls => {
      if (injected.has(cls)) return;
      // Only process those NOT already handled in variants
      if (usedVariants.has(cls)) return;

      const cssRule = generateArbitraryRule(cls);
      if (cssRule) {
        classes += cssRule + '\n';
        injected.add(cls);
      }
    });

    const newStyles = keyframes + classes;
    if (newStyles) {
      appendToDynamicStyle(newStyles);
    }
  };

  const run = async () => {
    await fetchMeta();
    scanNode(document.documentElement);
    injectStyles();

    let timeout;
    const observer = new MutationObserver((mutations) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(scanNode);
          } else if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            scanNode(mutation.target);
          }
        });
        injectStyles();
      }, 16);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  };

  const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  };

  const addResourceHints = () => {
    const hint = document.createElement('link');
    hint.rel = 'preconnect';
    hint.href = new URL(CDN).origin;
    hint.crossOrigin = 'anonymous';
    document.head.appendChild(hint);
  };

  const safeSave = (key, data) => {
    try {
      const serialized = JSON.stringify(data);
      if (serialized.length > 2097152) return false;
      sessionStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      return false;
    }
  };

  preloadFont();
  injectFontFace();
  injectClass();
  addResourceHints();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();