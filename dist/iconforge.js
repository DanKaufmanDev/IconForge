(() => {
  const VERSION = '1.1.6';
  const CDN = 'https://cdn.jsdelivr.net/gh/DanKaufmanDev/IconForge@beecf03/dist';
  const FONT_NAME = 'IconForge';
  const FONT_URL = `${CDN}/iconforge.woff2`;
  const META_ICONS_URL = `${CDN}/meta/iconforge-icons.json`;
  const META_STYLES_URL = `${CDN}/meta/iconforge-styles.json`;

  const responsiveBreakpoints = {
    'sm:': '(min-width: 640px)',
    'md:': '(min-width: 768px)',
    'lg:': '(min-width: 1024px)',
    'xl:': '(min-width: 1280px)',
  };
  const variantPrefixes = ['hover:', 'focus:', 'active:', 'dark:', ...Object.keys(responsiveBreakpoints)];

  const usedIf = new Set();
  const usedIs = new Set();
  const style = document.createElement('style');
  document.head.appendChild(style);

  let iconsMeta = {};
  let stylesMeta = {};

  function escapeSelector(selector) {
    if (typeof selector !== 'string') return '';
    return selector.replace(/([ !"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g, '\\$1');
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

      const [icons, styles] = await Promise.all([
        fetch(META_ICONS_URL).then(res => res.json()),
        fetch(META_STYLES_URL).then(res => res.json())
      ]);
      
      safeSave('iconforge_icons', icons);
      safeSave('iconforge_styles', styles);
      
      iconsMeta = icons;
      stylesMeta = styles;
    } catch (err) {
      console.warn('IconForge: Failed to load meta data.', err);
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
            if (!cls) return;
            let baseClass = cls;
            const variant = variantPrefixes.find(v => cls.startsWith(v));
            if (variant) {
                baseClass = cls.slice(variant.length);
            }

            if (baseClass.startsWith('if-')) {
                usedIf.add(cls);
            } else if (baseClass.startsWith('is-')) {
                usedIs.add(cls);
            }
        });
    };

    scanElement(node);

    const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node) => {
            return node.hasAttribute('class') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
    });

    while (walker.nextNode()) {
        scanElement(walker.currentNode);
    }
  };

  const injectStyles = () => {
    const stylesByMedia = { default: [] };
    const keyframes = new Set();
    const allUsedClasses = [...usedIf, ...usedIs];

    for (const cls of allUsedClasses) {
      let baseClass = cls;
      let variantCSS = '';
      let prefix = '';
      let mediaQuery = 'default';

      const variant = variantPrefixes.find(v => cls.startsWith(v));
      if (variant) {
        baseClass = cls.slice(variant.length);
        if (variant === 'hover:') variantCSS = ':hover';
        else if (variant === 'focus:') variantCSS = ':focus';
        else if (variant === 'active:') variantCSS = ':active';
        else if (variant === 'dark:') {
          prefix = '.dark ';
        } else if (responsiveBreakpoints[variant]) {
          mediaQuery = `@media ${responsiveBreakpoints[variant]}`;
        }
      }

      const arbitraryMatch = baseClass.match(/^(is-(?:color|bg|w|h|sq|size|p|pt|pr|pb|pl|px|py|m|mt|mr|mb|ml|my|mx))-\[(.+)\]$/);
      if (arbitraryMatch) {
        const [, type, value] = arbitraryMatch;
        let properties = '';
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
        if (properties) {
          const rule = `${prefix}.${escapeSelector(cls)}${variantCSS} { ${properties} }`;
          if (!stylesByMedia[mediaQuery]) stylesByMedia[mediaQuery] = [];
          stylesByMedia[mediaQuery].push(rule);
        }
      } else if (stylesMeta[baseClass]) {
        const styleData = stylesMeta[baseClass];
        let properties = '';
        let ruleSrc = '';
        if (typeof styleData === 'object' && styleData.class) {
          if (styleData.keyframes) keyframes.add(styleData.keyframes);
          ruleSrc = styleData.class;
        } else if (typeof styleData === 'string') {
          ruleSrc = styleData;
        }
        
        if (ruleSrc) {
            const match = ruleSrc.match(/{([^}]+)}/);
            if (match && match[1]) {
                properties = match[1].trim();
            } else if (!ruleSrc.includes('{')) {
                properties = ruleSrc;
            }
        }

        if (properties) {
          const rule = `${prefix}.${escapeSelector(cls)}${variantCSS} { ${properties} }`;
          if (!stylesByMedia[mediaQuery]) stylesByMedia[mediaQuery] = [];
          stylesByMedia[mediaQuery].push(rule);
        }
      } else if (iconsMeta[baseClass]) {
        const iconData = iconsMeta[baseClass];
        if (typeof iconData === 'string') {
            const match = iconData.match(/{([^}]+)}/);
            if (match && match[1]) {
                const properties = match[1].trim();
                const rule = `${prefix}.${escapeSelector(cls)}:before${variantCSS} { ${properties} }`;
                if (!stylesByMedia[mediaQuery]) stylesByMedia[mediaQuery] = [];
                stylesByMedia[mediaQuery].push(rule);
            }
        }
      }
    }

    let newCSSText = Array.from(keyframes).join('\n');
    if (stylesByMedia.default.length) {
        newCSSText += '\n' + stylesByMedia.default.join('\n');
    }
    Object.keys(responsiveBreakpoints).forEach(bpKey => {
        const mq = `@media ${responsiveBreakpoints[bpKey]}`;
        if (stylesByMedia[mq] && stylesByMedia[mq].length) {
            newCSSText += `\n${mq} {\n  ${stylesByMedia[mq].join('\n  ')}\n}`;
        }
    });

    requestAnimationFrame(() => {
      let dynamicStyle = document.querySelector('.iconforge-dynamic');
      if (!dynamicStyle) {
        dynamicStyle = document.createElement('style');
        dynamicStyle.classList.add('iconforge-dynamic');
        style.after(dynamicStyle);
      }
      if (dynamicStyle.textContent !== newCSSText) {
          dynamicStyle.textContent = newCSSText;
      }
    });
  };

  const run = async () => {
    await fetchMeta();
    scanNode(document.documentElement);
    injectStyles();

    const observer = new MutationObserver((mutations) => {
        let needsScan = false;
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                needsScan = true;
                break;
            }
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                needsScan = true;
                break;
            }
        }
        if (needsScan) {
            scanNode(document.documentElement);
            injectStyles();
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
  };

  const safeSave = (key, data) => {
    try {
      const serialized = JSON.stringify(data);
      if (serialized.length > 2097152) return false; // 2MB limit
      sessionStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      return false;
    }
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