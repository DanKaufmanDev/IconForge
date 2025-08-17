(() => {
  const VERSION = '1.2.0';
  const CDN = 'https://cdn.jsdelivr.net/npm/iconforged@latest/dist';
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
  const pseudoMap = {
    'hover:': ':hover',
    'focus:': ':focus',
    'active:': ':active'
  };
  const darkToken = 'dark:';
  const allVariantTokens = [...Object.keys(breakpoints), ...Object.keys(pseudoMap), darkToken];

  const arbitraryRE = /^(is-(?:color|bg|w|h|sq|size|p|pt|pr|pb|pl|px|py|m|mt|mr|mb|ml|my|mx|z|scale|opacity|rot|grid-cols|grid-rows|gap|top|bottom|left|right|translate|translate-x|translate-y|border|border-t|border-b|border-l|border-r|fixed-bg|gradient-linear|gradient-radial|gradient-conic|outline|outline-dashed|outline-dotted|outline-double|blur|backdrop-blur|brightness|contrast|grayscale|saturate))-\[(.+)\]$/;

  const escapeSelector = (s) => {
    return String(s).replace(/([ !\"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g, '\\$1');
  };
  const wrapMedia = (css, mediaQuery) => (mediaQuery ? `${mediaQuery}{${css}}` : css);
  const extractProps = (ruleStr) => {
    if (typeof ruleStr !== 'string') return '';
    const m = ruleStr.match(/{([^}]+)}/);
    return m ? m[1].trim() : '';
  };

  function parseVariants(token) {
    let rest = String(token);
    let mediaQuery = '';
    const pseudos = [];
    let darkPrefix = '';

    outer: while (true) {
      for (const t of allVariantTokens) {
        if (rest.startsWith(t)) {
          if (t in breakpoints) {
            mediaQuery = breakpoints[t];
          } else if (t === darkToken) {
            darkPrefix = '.dark ';
          } else if (t in pseudoMap) {
            pseudos.push(pseudoMap[t]);
          }
          rest = rest.slice(t.length);
          continue outer;
        }
      }
      break;
    }

    return { base: rest, mediaQuery, variantSel: pseudos.join(''), darkPrefix };
  }

  function ruleForArbitrary(fullCls, type, valueRaw, variantSel, darkPrefix, isIconTarget) {
    const value = String(valueRaw);
    let props = '';

    switch (type) {
      case 'is-color':props = `color: ${value};`;break;
      case 'is-bg':props = `background-color: ${value};`;break;
      case 'is-w':props = `width: ${value};`;break;
      case 'is-h':props = `height: ${value};`;break;
      case 'is-sq':props = `width: ${value}; height: ${value};`;break;
      case 'is-size':props = `font-size: ${value};`;break;
      case 'is-p':props = `padding: ${value};`;break;
      case 'is-pt':props = `padding-top: ${value};`;break;
      case 'is-pr':props = `padding-right: ${value};`;break;
      case 'is-pb':props = `padding-bottom: ${value};`;break;
      case 'is-pl':props = `padding-left: ${value};`;break;
      case 'is-px':props = `padding-left: ${value}; padding-right: ${value};`;break;
      case 'is-py':props = `padding-top: ${value}; padding-bottom: ${value};`;break;
      case 'is-m':props = `margin: ${value};`;break;
      case 'is-mt':props = `margin-top: ${value};`;break;
      case 'is-mr':props = `margin-right: ${value};`;break;
      case 'is-mb':props = `margin-bottom: ${value};`;break;
      case 'is-ml':props = `margin-left: ${value};`;break;
      case 'is-mx':props = `margin-left: ${value}; margin-right: ${value};`;break;
      case 'is-my':props = `margin-top: ${value}; margin-bottom: ${value};`;break;
      case 'is-z':props = `z-index: ${value};`; break;
      case 'is-scale':props = `transform: scale(${value});`; break;
      case 'is-opacity':props = `opacity: ${value};`;break;
      case 'is-rot':props = `transform: rotate(${value});`;break;
      case 'is-grid-cols':props = `grid-template-columns: repeat(${value}, minmax(0, 1fr));`;break;
      case 'is-grid-rows':props = `grid-template-rows: repeat(${value}, minmax(0, 1fr));`;break;
      case 'is-gap':props = `gap: ${value};`;break;
      case 'is-top':props = `top: ${value};`;break;
      case 'is-bottom':props = `bottom: ${value};`;break;
      case 'is-left':props = `left: ${value};`;break;
      case 'is-right':props = `right: ${value};`;break;
      case 'is-translate':props = `transform: translate(${value}, ${value});`;break;
      case 'is-translate-x':props = `transform: translateX(${value});`;break;
      case 'is-translate-y':props = `transform: translateY(${value});`;break;
      case 'is-border': props = `border-width: ${value} ${value} ${value} ${value}; border-style: solid;`;break;
      case 'is-border-t':props = `border-top-width: ${value}; border-style: solid;`;break;
      case 'is-border-b':props = `border-bottom-width: ${value}; border-style: solid;`;break;
      case 'is-border-l':props = `border-left-width: ${value}; border-style: solid;`;break;
      case 'is-border-r':props = `border-right-width: ${value}; border-style: solid;`;break;
      case 'is-outline':props = `outline: 1px solid ${value};`;break;
      case 'is-outline-dashed':props = `outline: 1px dashed ${value};`;break;
      case 'is-outline-dotted':props = `outline: 1px dotted ${value};`;break;
      case 'is-outline-double':props = `outline: 2px solid ${value};`;break;
      case 'is-blur':props = `filter: blur(${value});`;break;
      case 'is-backdrop-blur':props = `backdrop-filter: blur(${value});`;break;
      case 'is-brightness': props = `filter: brightness(${value});`;break;
      case 'is-contrast': props = `filter: contrast(${value});`;break;
      case 'is-grayscale': props = `filter: grayscale(${value});`;break;
      case 'is-saturate': props = `filter: saturate(${value});`;break;
      case 'is-fixed-bg': {const safeVal = value.replace(/"/g, '\\"');props = `position: fixed; top: 0; left: 0; width: 100dvw; height: 100dvh; z-index: -1; background-repeat: no-repeat; background-size: cover; background-image: url("${safeVal}");`;break;}
      case 'is-gradient-linear': {const safeVal = value.replace(/_/g, ' ').replace(/\"/g, '\\"');const ruleElem = `${darkPrefix}.${escapeSelector(fullCls)}${variantSel} { background-image: linear-gradient(${safeVal}); color: transparent; -webkit-background-clip: text; background-clip: text; }`;return `${ruleElem}`}
      case 'is-gradient-radial': {const safeVal = value.replace(/_/g, ' ').replace(/\"/g, '\\"');const ruleElem = `${darkPrefix}.${escapeSelector(fullCls)}${variantSel} { background-image: radial-gradient(${safeVal}); color: transparent; -webkit-background-clip: text; background-clip: text; }`;return `${ruleElem}`}
      case 'is-gradient-conic': {const safeVal = value.replace(/_/g, ' ').replace(/\"/g, '\\"');const ruleElem = `${darkPrefix}.${escapeSelector(fullCls)}${variantSel} { background-image: conic-gradient(${safeVal}); color: transparent; -webkit-background-clip: text; background-clip: text; }`;return `${ruleElem}`}
      default:props = '';
    }

    if (!props) return '';
    const selector = `${darkPrefix}.${escapeSelector(fullCls)}${variantSel}`;
    return `${selector} { ${props} }`;
  }

  const baseStyle = document.createElement('style');
  baseStyle.textContent = `
/* IconForge CDN v${VERSION} */
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
      } catch { /* fall through */ }
    }
    const [icons, styles] = await Promise.all([
      fetchWithRetry(META_ICONS_URL),
      fetchWithRetry(META_STYLES_URL)
    ]);
    iconsMeta = icons || {};
    stylesMeta = styles || {};
    safeSave('iconforge_icons', iconsMeta);
    safeSave('iconforge_styles', stylesMeta);
  };

  function buildRuleForToken(token) {
    const { base, mediaQuery, variantSel, darkPrefix } = parseVariants(token);

    const arb = base.match(arbitraryRE);
    if (arb) {
      const [, type, valueRaw] = arb;
      const css = ruleForArbitrary(token, type, valueRaw, variantSel, darkPrefix, false);
      return { keyframes: '', css: wrapMedia(css, mediaQuery) };
    }

    const styleDef = stylesMeta[base];
    if (styleDef) {
      let keyframes = '';
      let props = '';
      if (typeof styleDef === 'object' && styleDef !== null) {
        if (styleDef.keyframes) keyframes = `${styleDef.keyframes}\n`;
        props = extractProps(styleDef.class) || styleDef.class || '';
      } else if (typeof styleDef === 'string') {
        props = extractProps(styleDef) || styleDef;
      }
      if (props) {
        const sel = `.${escapeSelector(token)}${variantSel}`;
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
      const props = extractProps(full) || full;
      if (props) {
        const sel = `.${escapeSelector(token)}${variantSel}:before`;
        const rule = `${darkPrefix}${sel} { ${props} }`;
        return { keyframes: '', css: wrapMedia(rule, mediaQuery) };
      }
    }

    return { keyframes: '', css: '' };
  }

  function tokenLooksRelevant(token) {
    if (!token) return false;
    if (token.startsWith('if-') || token.startsWith('is-')) return true;
    for (const t of allVariantTokens) {
      if (token.startsWith(t)) return true;
    }
    return false;
  }

  function scanElement(el) {
    const classes = el.className;
    if (typeof classes !== 'string') return;
    classes.split(/\s+/).forEach(token => {
      if (!tokenLooksRelevant(token)) return;
      const { base } = parseVariants(token);
      if (base && (base.startsWith('if-') || base.startsWith('is-'))) {
        usedClasses.add(token);
      }
    });
  }

  function scanNode(root) {
    if (!root) return;
    if (root.nodeType === Node.ELEMENT_NODE) scanElement(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) scanElement(walker.currentNode);
  }

  function injectCollected() {
    let keyframesBuf = '';
    let classesBuf = '';

    usedClasses.forEach(token => {
      if (injected.has(token)) return;
      const { keyframes, css } = buildRuleForToken(token);
      if (keyframes && !injected.has(keyframes)) {
        keyframesBuf += keyframes;
        injected.add(keyframes);
      }
      if (css) {
        classesBuf += css + '\n';
        injected.add(token);
      }
    });

    const newCSS = keyframesBuf + classesBuf;
    if (newCSS) {
      requestAnimationFrame(() => {
        dynamicStyle.textContent += newCSS;
      });
    }
  }

  (function hints() {
    try {
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
    } catch (e) { /* noop */ }
  })();

  const run = async () => {
    await fetchMeta();
    scanNode(document.documentElement);
    injectCollected();

    let debounce;
    const observer = new MutationObserver((mutations) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        for (const m of mutations) {
          if (m.type === 'childList') {
            m.addedNodes.forEach(scanNode);
          } else if (m.type === 'attributes' && m.attributeName === 'class') {
            scanElement(m.target);
          }
        }
        injectCollected();
      }, 16);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();