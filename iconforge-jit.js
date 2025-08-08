(() => {
  const CDN = 'https://cdn.jsdelivr.net/gh/DanKaufmanDev/IconForge@latest';
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
    const css = `
      @font-face {
        font-family: '${FONT_NAME}';
        src: url('${FONT_URL}') format('woff2');
        font-display: block;
      }
    `;
    const fontStyle = document.createElement('style');
    fontStyle.textContent = css;
    document.head.appendChild(fontStyle);
  };

  const fetchMeta = async () => {
    const [icons, styles] = await Promise.all([
      fetch(META_ICONS_URL).then(res => res.json()),
      fetch(META_STYLES_URL).then(res => res.json()),
    ]);
    iconsMeta = icons;
    stylesMeta = styles;
  };

  const scanDOM = () => {
    document.querySelectorAll('[class]').forEach(el => {
      el.classList.forEach(cls => {
        if (cls.startsWith('if-')) usedIf.add(cls);
        else if (cls.startsWith('is-')) usedIs.add(cls);
      });
    });
  };

  const injectStyles = () => {
    let css = '';

    usedIf.forEach(cls => {
      if (!injected.has(cls) && iconsMeta[cls]) {
        css += iconsMeta[cls] + '\n';
        injected.add(cls);
      }
    });

    usedIs.forEach(cls => {
      if (!injected.has(cls) && stylesMeta[cls]) {
        css += stylesMeta[cls] + '\n';
        injected.add(cls);
      }
    });

    if (css) style.textContent += css;
  };

  const run = async () => {
    if (!Object.keys(iconsMeta).length || !Object.keys(stylesMeta).length) {
      await fetchMeta();
    }
    scanDOM();
    injectStyles();
  };

  // Observe DOM mutations for dynamic content
  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      preloadFont();
      injectFontFace();
      run();
    });
  } else {
    preloadFont();
    injectFontFace();
    run();
  }
})();