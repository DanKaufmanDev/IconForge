(() => {
  const CDN = 'https://cdn.jsdelivr.net/gh/DanKaufmanDev/IconForge@4b44755';
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
    const [icons, styles] = await Promise.all([
      fetch(META_ICONS_URL).then(res => res.json()),
      fetch(META_STYLES_URL).then(res => res.json()),
    ]);
    iconsMeta = icons;
    stylesMeta = styles;
  };

  const scanNode = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const scanElement = (el) => {
        el.classList.forEach(cls => {
            if (cls.startsWith('if-')) usedIf.add(cls);
            else if (cls.startsWith('is-')) usedIs.add(cls);
        });
    };

    if (node.hasAttribute('class')) {
        scanElement(node);
    }

    node.querySelectorAll('[class]').forEach(scanElement);
  };

  const injectStyles = () => {
    let css = '';

    usedIf.forEach(cls => {
      if (!injected.has(cls) && iconsMeta[cls]) {
        css += iconsMeta[cls] + '';
        injected.add(cls);
      }
    });

    usedIs.forEach(cls => {
      if (!injected.has(cls) && stylesMeta[cls]) {
        css += stylesMeta[cls] + '';
        injected.add(cls);
      }
    });

    if (css) style.textContent += css;
  };

  const run = async () => {
    await fetchMeta();
    scanNode(document.documentElement);
    injectStyles();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(scanNode);
            } else if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                scanNode(mutation.target);
            }
        });
        injectStyles();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
  };

  preloadFont();
  injectFontFace();
  injectClass();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();