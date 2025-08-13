(() => {
  const VERSION = '1.1.6';
  const CDN = 'https://cdn.jsdelivr.net/gh/DanKaufmanDev/IconForge@f8b7790/dist';
  const FONT_NAME = 'IconForge';
  const FONT_URL = `${CDN}/iconforge.woff2`;
  const META_ICONS_URL = `${CDN}/meta/iconforge-icons.json`;
  const META_STYLES_URL = `${CDN}/meta/iconforge-styles.json`;

  const usedClasses = new Set();
  const injected = new Set();
  let iconsMeta = {};
  let stylesMeta = {};

  const breakpoints = {
    'xs:': '@media (min-width: 420px)',
    'sm:': '@media (min-width: 640px)',
    'md:': '@media (min-width: 768px)',
    'lg:': '@media (min-width: 1024px)',
    'xl:': '@media (min-width: 1280px)'
  };

  const variants = {
    'hover:': ':hover',
    'focus:': ':focus',
    'active:': ':active',
    'dark:': 'dark'
  };

  const arbitraryMatch = /^(is-(?:color|bg|w|h|sq|size|p|pt|pr|pb|pl|px|py|m|mt|mr|mb|ml|mx|my))-\[(.+)\]$/;

  const escapeSelector = (selector) => {
    return selector.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
  }

  const preloadFont = () => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = FONT_URL;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  };

  const baseStyle = document.createElement('style');
  baseStyle.textContent = `
@font-face {
  font-family: '${FONT_NAME}';
  src: url('${FONT_URL}') format('woff2');
  font-display: block;
  font-weight: normal;
  font-style: normal;
}
[class^="if-"], [class*=" if-"] {
  font-family: '${FONT_NAME}' !important;
  display: inline-block;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;
  document.head.appendChild(baseStyle);

  let dynamicStyle = document.querySelector('.iconforge-dynamic');
  if (!dynamicStyle) {
    dynamicStyle = document.createElement('style');
    dynamicStyle.classList.add('iconforge-dynamic');
    baseStyle.after(dynamicStyle);
  }

  const fetchWithRetry = async (url, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  };

  const safeSave = (key, data) => {
    try {
      const s = JSON.stringify(data);
      if (s.length > 2_097_152) return false;
      sessionStorage.setItem(key, s);
      return true;
    } catch { return false; }
  };

  const fetchMeta = async () => {
    const cachedIcons = sessionStorage.getItem('iconforge_icons');
    const cachedStyles = sessionStorage.getItem('iconforge_styles');
    if (cachedIcons && cachedStyles) {
      try {
        iconsMeta = JSON.parse(cachedIcons);
        stylesMeta = JSON.parse(cachedStyles);
        return;
      } catch { }
    }
    const [icons, styles] = await Promise.all([
      fetchWithRetry(META_ICONS_URL),
      fetchWithRetry(META_STYLES_URL)
    ]);
    iconsMeta = icons;
    stylesMeta = styles;
    safeSave('iconforge_icons', icons);
    safeSave('iconforge_styles', styles);
  };

  const normalizeClass = (cls) => {
    let base = cls;
    let mediaQuery = '';
    let variantSel = '';
    let darkPrefix = '';

    for (const pfx of Object.keys(breakpoints)) {
      if (base.startsWith(pfx)) {
        mediaQuery = breakpoints[pfx];
        base = base.slice(pfx.length);
        break;
      }
    }

    for (const pfx of Object.keys(variants)) {
      if (base.startsWith(pfx)) {
        const v = variants[pfx];
        if (pfx === 'dark:') {
          darkPrefix = '.dark ';
        } else {
          variantSel = v;
        }
        base = base.slice(pfx.length);
        break;
      }
    }
    return { base, mediaQuery, variantSel, darkPrefix };
  };

  const ruleForArbitrary = (fullCls, type, value, variantSel, darkPrefix) => {
    let props = '';
    switch (type) {
      case 'is-color': props = `color: ${value};`; break;
      case 'is-bg': props = `background-color: ${value};`; break;
      case 'is-w': props = `width: ${value};`; break;
      case 'is-h': props = `height: ${value};`; break;
      case 'is-sq': props = `width: ${value}; height: ${value};`; break;
      case 'is-size': props = `font-size: ${value};`; break;
      case 'is-p': props = `padding: ${value};`; break;
      case 'is-pt': props = `padding-top: ${value};`; break;
      case 'is-pr': props = `padding-right: ${value};`; break;
      case 'is-pb': props = `padding-bottom: ${value};`; break;
      case 'is-pl': props = `padding-left: ${value};`; break;
      case 'is-px': props = `padding-left: ${value}; padding-right: ${value};`; break;
      case 'is-py': props = `padding-top: ${value}; padding-bottom: ${value};`; break;
      case 'is-m': props = `margin: ${value};`; break;
      case 'is-mt': props = `margin-top: ${value};`; break;
      case 'is-mr': props = `margin-right: ${value};`; break;
      case 'is-mb': props = `margin-bottom: ${value};`; break;
      case 'is-ml': props = `margin-left: ${value};`; break;
      case 'is-mx': props = `margin-left: ${value}; margin-right: ${value};`; break;
      case 'is-my': props = `margin-top: ${value}; margin-bottom: ${value};`; break;
    }
    if (!props) return '';
    const sel = `.${escapeSelector(fullCls)}${variantSel}`;
    return `${darkPrefix}${sel} { ${props} }`;
  };

  const extractProps = (ruleStr) => {
    if (typeof ruleStr !== 'string') return '';
    const m = ruleStr.match(/{([^}]+)}/);
    return m ? m[1].trim() : '';
  };


  const buildRuleForClass = (cls) => {
    const { base, mediaQuery, variantSel, darkPrefix } = normalizeClass(cls);

    const arb = base.match(arbitraryMatch);
    if (arb) {
      const [, type, value] = arb;
      const rule = ruleForArbitrary(cls, type, value, variantSel, darkPrefix);
      return { keyframes: '', css: wrapMedia(rule, mediaQuery) };
    }

    const styleDef = stylesMeta[base];
    if (styleDef) {
      let keyframes = '';
      let props = '';
      if (typeof styleDef === 'object' && styleDef !== null) {
        if (styleDef.keyframes) keyframes = `${styleDef.keyframes}\n`;
        if (styleDef.class) props = extractProps(styleDef.class);
      } else if (typeof styleDef === 'string') {
        props = extractProps(styleDef);
      }
      if (props) {
        const sel = `.${escapeSelector(cls)}${variantSel}`;
        const rule = `${darkPrefix}${sel} { ${props} }`;
        return { keyframes, css: wrapMedia(rule, mediaQuery) };
      }
      return { keyframes, css: '' };
    }

    const iconDef = iconsMeta[base];
    if (iconDef) {
      let full = '';
      if (typeof iconDef === 'object' && iconDef.value) full = iconDef.value;
      else if (typeof iconDef === 'string') full = iconDef;
      const props = extractProps(full);
      if (props) {
        const sel = `.${escapeSelector(cls)}:before${variantSel}`;
        const rule = `${darkPrefix}${sel} { ${props} }`;
        return { keyframes: '', css: wrapMedia(rule, mediaQuery) };
      }
    }

    return { keyframes: '', css: '' };
  };

  const wrapMedia = (css, mediaQuery) => mediaQuery ? `${mediaQuery}{${css}}` : css;

  const scanElement = (el) => {
    const classes = el.className;
    if (typeof classes !== 'string') return;
    classes.split(/\s+/).forEach(token => {
      if (!token) return;
      const isCandidate =
        token.startsWith('if-') ||
        token.startsWith('is-') ||
        Object.keys(breakpoints).some(p => token.startsWith(p)) ||
        Object.keys(variants).some(v => token.startsWith(v));
      if (!isCandidate) return;

      const { base } = normalizeClass(token);
      if (base.startsWith('if-') || base.startsWith('is-')) {
        usedClasses.add(token);
      }
    });
  };

  const scanNode = (root) => {
    if (!root) return;
    if (root.nodeType === Node.ELEMENT_NODE) scanElement(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) scanElement(walker.currentNode);
  };

  const injectStyles = () => {
    let keyframesBuf = '';
    let classesBuf = '';

    usedClasses.forEach((cls) => {
      if (injected.has(cls)) return;
      const { keyframes, css } = buildRuleForClass(cls);
      if (keyframes) {
        if (!injected.has(keyframes)) {
          keyframesBuf += keyframes;
          injected.add(keyframes);
        }
      }
      if (css) {
        classesBuf += css + '\n';
        injected.add(cls);
      }
    });

    const newCSS = keyframesBuf + classesBuf;
    if (newCSS) {
      requestAnimationFrame(() => {
        dynamicStyle.textContent += newCSS;
      });
    }
  };

  const run = async () => {
    await fetchMeta();

    scanNode(document.documentElement);
    injectStyles();

    let debounce;
    const observer = new MutationObserver((mutations) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        for (const m of mutations) {
          if (m.type === 'childList') {
            m.addedNodes.forEach(scanNode);
          } else if (m.type === 'attributes' && m.attributeName === 'class') {
            scanNode(m.target);
          }
        }
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

  (() => {
    const pre = document.createElement('link');
    pre.rel = 'preconnect';
    pre.href = new URL(CDN).origin;
    pre.crossOrigin = 'anonymous';
    document.head.appendChild(pre);

    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'font';
    preload.type = 'font/woff2';
    preload.crossOrigin = 'anonymous';
    preload.href = FONT_URL;
    document.head.appendChild(preload);
  })();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();