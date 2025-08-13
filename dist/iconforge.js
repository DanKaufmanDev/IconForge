(() => {
  const CDN = 'https://cdn.jsdelivr.net/gh/DanKaufmanDev/IconForge@8b0e185/dist';
  const FONT_NAME = 'IconForge';
  const FONT_URL = `${CDN}/iconforge.woff2`;
  const META_ICONS_URL = `${CDN}/meta/iconforge-icons.json`;
  const META_STYLES_URL = `${CDN}/meta/iconforge-styles.json`;

  const usedClasses = new Set();
  const injected = new Set();
  const style = document.createElement('style');
  document.head.appendChild(style);

  let iconsMeta = {};
  let stylesMeta = {};

  const variants = {
    'hover:': ':hover',
    'focus:': ':focus',
    'active:': ':active',
    'dark:': '.dark &'
  };

  const breakpoints = {
    'sm:': '@media (min-width: 640px)',
    'md:': '@media (min-width: 768px)',
    'lg:': '@media (min-width: 1024px)',
    'xl:': '@media (min-width: 1280px)',
    '2xl:': '@media (min-width: 1536px)'
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
    style.textContent = `
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
}`;
  };

  const fetchMeta = async () => {
    try {
      const cachedIcons = sessionStorage.getItem('iconforge_icons');
      const cachedStyles = sessionStorage.getItem('iconforge_styles');

      if (cachedIcons && cachedStyles) {
        iconsMeta = JSON.parse(cachedIcons);
        stylesMeta = JSON.parse(cachedStyles);
        return;
      }

      const [icons, styles] = await Promise.all([
        fetchWithRetry(META_ICONS_URL),
        fetchWithRetry(META_STYLES_URL)
      ]);

      iconsMeta = icons;
      stylesMeta = styles;

      safeSave('iconforge_icons', icons);
      safeSave('iconforge_styles', styles);
    } catch (err) {
      console.warn('IconForge: Failed to load meta data', err);
      iconsMeta = {};
      stylesMeta = {};
    }
  };

  const normalizeClass = (cls) => {
    let base = cls;
    let variantSelector = '';
    let mediaQuery = '';

    for (const bp in breakpoints) {
      if (base.startsWith(bp)) {
        mediaQuery = breakpoints[bp];
        base = base.slice(bp.length);
        break;
      }
    }

    for (const v in variants) {
      if (base.startsWith(v)) {
        variantSelector = variants[v];
        base = base.slice(v.length);
        break;
      }
    }

    return { base, variantSelector, mediaQuery };
  };

  const scanNode = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const scanElement = (el) => {
      const classes = el.className;
      if (typeof classes !== 'string') return;
      classes.split(/\s+/).forEach(cls => {
        if (cls.startsWith('if-') || cls.startsWith('is-') ||
            Object.keys(variants).some(v => cls.startsWith(v)) ||
            Object.keys(breakpoints).some(bp => cls.startsWith(bp))) {
          usedClasses.add(cls);
        }
      });
    };
    scanElement(node);
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) scanElement(walker.currentNode);
  };

  const injectStyles = () => {
    let outputCSS = '';
    usedClasses.forEach(cls => {
      if (injected.has(cls)) return;
      const { base, variantSelector, mediaQuery } = normalizeClass(cls);
      const meta = iconsMeta[base] || stylesMeta[base];

      if (!meta) return;

      let cssBlock = '';
      if (typeof meta === 'string') {
        cssBlock = meta;
      } else if (typeof meta === 'object' && meta.class) {
        cssBlock = meta.class;
        if (meta.keyframes && !injected.has(meta.keyframes)) {
          outputCSS += meta.keyframes + '\n';
          injected.add(meta.keyframes);
        }
      }

      if (variantSelector) {
        cssBlock = cssBlock.replace(new RegExp(`\\.${base}`, 'g'), `.${cls}${variantSelector}`);
      } else {
        cssBlock = cssBlock.replace(new RegExp(`\\.${base}`, 'g'), `.${cls}`);
      }

      if (mediaQuery) {
        cssBlock = `${mediaQuery}{${cssBlock}}`;
      }

      outputCSS += cssBlock + '\n';
      injected.add(cls);
    });

    if (outputCSS) {
      let dynamicStyle = document.querySelector('.iconforge-dynamic');
      if (!dynamicStyle) {
        dynamicStyle = document.createElement('style');
        dynamicStyle.classList.add('iconforge-dynamic');
        style.after(dynamicStyle);
      }
      dynamicStyle.textContent += outputCSS;
    }
  };

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
      const serialized = JSON.stringify(data);
      if (serialized.length > 2097152) return false;
      sessionStorage.setItem(key, serialized);
      return true;
    } catch {
      return false;
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
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  };

  preloadFont();
  injectFontFace();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
