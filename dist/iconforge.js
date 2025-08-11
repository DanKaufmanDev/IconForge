(() => {
  const VERSION = '1.1.4';
  // const CDN = 'https://cdn.jsdelivr.net/npm/iconforged@latest/dist';
  const CDN = 'https://cdn.jsdelivr.net/gh/DanKaufmanDev/IconForge@e2ad39d/dist/';
  const FONT_NAME = 'IconForge';
  const FONT_URL = `${CDN}/iconforge.woff2`;
  const META_ICONS_URL = `${CDN}/meta/iconforge-icons.json`;
  const META_STYLES_URL = `${CDN}/meta/iconforge-styles.json`;

  const usedIf = new Set();
  const usedIs = new Set();
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
        
        classes.split(' ').forEach(cls => {
            if (cls.startsWith('if-')) {
                usedIf.add(cls);
            } else if (cls.startsWith('is-')) {
                usedIs.add(cls);
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
                       (node.className.includes('if-') || node.className.includes('is-')) 
                       ? NodeFilter.FILTER_ACCEPT 
                       : NodeFilter.FILTER_SKIP;
            }
        }
    );

    while (walker.nextNode()) {
        scanElement(walker.currentNode);
    }
  };

  const injectStyles = () => {
    let keyframes = '';
    let classes = '';
    
    usedIf.forEach(cls => {
      if (!injected.has(cls) && iconsMeta[cls]) {
        classes += iconsMeta[cls] + '\n';
        injected.add(cls);
      }
    });

    usedIs.forEach(cls => {
      if (!injected.has(cls) && stylesMeta[cls]) {
        const style = stylesMeta[cls];
        if (typeof style === 'object' && style.class) {
          if (style.keyframes) {
            // Avoid duplicate keyframes
            if (!injected.has(style.keyframes)) {
              keyframes += style.keyframes + '\n';
              injected.add(style.keyframes);
            }
          }
          classes += style.class + '\n';
        } else if (typeof style === 'string') {
          classes += style + '\n';
        }
        injected.add(cls);
      }
    });

    const newStyles = keyframes + classes;

    if (newStyles) {
      requestAnimationFrame(() => {
        let dynamicStyle = document.querySelector('.iconforge-dynamic');
        if (!dynamicStyle) {
          dynamicStyle = document.createElement('style');
          dynamicStyle.classList.add('iconforge-dynamic');
          style.after(dynamicStyle);
        }
        dynamicStyle.textContent += newStyles;
      });
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