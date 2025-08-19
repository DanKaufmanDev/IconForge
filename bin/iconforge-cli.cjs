#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const chokidar = require('chokidar');
const os = require('os');
const subsetFont = require('subset-font');

const DIST_DIR = path.resolve(__dirname, '../dist/');
const META_ICONS = path.join(DIST_DIR, 'meta/iconforge-icons.json');
const META_STYLES = path.join(DIST_DIR, 'meta/iconforge-styles.json');

const OUTPUT_DIR = path.join(process.cwd(), 'iconforge-output');
const OUTPUT_CSS = path.join(OUTPUT_DIR, 'iconforge.css');
const OUTPUT_WOFF2 = path.join(OUTPUT_DIR, 'iconforge.woff2');

const TEMP_DIR = path.join(os.tmpdir(), 'iconforge-subset');
const CJS_CONFIG_PATH = path.join(process.cwd(), 'iconforge.config.cjs');
const JS_CONFIG_PATH = path.join(process.cwd(), 'iconforge.config.js');

async function loadConfig() {
  let configPath = '';
  if (fs.existsSync(CJS_CONFIG_PATH)) {
    configPath = CJS_CONFIG_PATH;
  } else if (fs.existsSync(JS_CONFIG_PATH)) {
    configPath = JS_CONFIG_PATH;
    console.warn('Warning: iconforge.config.js is deprecated. Please rename to iconforge.config.cjs');
  }

  if (!configPath) return {};

  try {
    const fileUrl = 'file://' + configPath;
    const module = await import(fileUrl);
    return module.default || module;
  } catch (e) {
    console.error(`Error loading ${configPath} as a module, falling back to require.`, e);
    try {
      delete require.cache[require.resolve(configPath)];
      return require(configPath);
    } catch (e2) {
      console.error(`Error loading ${configPath} with require.`, e2);
      return {};
    }
  }
}

function escapeSelector(selector) {
  return selector.replace(/([ !"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g, '\\$1');
}

const responsiveBreakpoints = {
  'xs:': '(min-width: 420px)',
  'sm:': '(min-width: 640px)',
  'md:': '(min-width: 768px)',
  'lg:': '(min-width: 1024px)',
  'xl:': '(min-width: 1280px)',
};
const pseudoMap = {
  'hover:': ':hover',
  'focus:': ':focus',
  'active:': ':active',
  'disabled:': ':disabled',
};
const darkToken = 'dark:';

const allVariantTokens = [
  ...Object.keys(responsiveBreakpoints),
  ...Object.keys(pseudoMap),
  darkToken,
];

function parseVariants(token) {
  let rest = token;
  let mediaQuery = '';
  const pseudos = [];
  let darkPrefix = '';

  
  outer: while (true) {
    for (const t of allVariantTokens) {
      if (rest.startsWith(t)) {
  
        if (t in responsiveBreakpoints) {
          mediaQuery = `@media ${responsiveBreakpoints[t]}`;
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

  return {
    base: rest,
    mediaQuery,
    variantSel: pseudos.join(''),
    darkPrefix,
  };
}

function wrapMedia(css, mediaQuery) {
  return mediaQuery ? `${mediaQuery} { ${css} }` : css;
}

async function buildCSS(content) {
  fs.ensureDirSync(OUTPUT_DIR);
  const iconsMeta = JSON.parse(fs.readFileSync(META_ICONS, 'utf-8'));
  const stylesMeta = JSON.parse(fs.readFileSync(META_STYLES, 'utf-8'));

  const usedClasses = new Set();
  const config = await loadConfig();

  if (config.safelist && Array.isArray(config.safelist)) {
    config.safelist.forEach(cls => usedClasses.add(cls));
  }

  const regex = /(?:class|className)\s*=\s*["'](.*?)["']/gms;
  let match;
  while ((match = regex.exec(content)) !== null) {
    match[1].split(/\s+/).forEach(cls => {
      if (!cls) return;

      const { base } = parseVariants(cls);
      if (base && (base.startsWith('if-') || base.startsWith('is-') || base.startsWith('is-['))) {
        usedClasses.add(cls);
      }
    });
  }

  let cssOutput =
    `@font-face {font-family: 'IconForge'; src: url('iconforge.woff2') format('woff2'); font-style: normal; font-display: block; }\n` +
    `[class^="if-"], [class*=" if-"] { font-family: 'IconForge' !important; display: inline-block; font-style: normal; font-weight: normal; font-variant: normal; text-transform: none; line-height: 1; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }\n`;

  const keyframesSet = new Set();
  const stylesByMedia = { default: new Set() };

  for (let cls of usedClasses) {
    const { base, mediaQuery, variantSel, darkPrefix } = parseVariants(cls);

    let rule = null;

    const arbitraryMatch = base.match(/^(is-(?:color|bg|w|h|sq|size|p|pt|pr|pb|pl|px|py|m|mt|mr|mb|ml|my|mx|z|scale|opacity|rot|grid-cols|grid-rows|gap|top|bottom|left|right|translate|translate-x|translate-y|border|border-t|border-b|border-l|border-r|fixed-bg|gradient-linear|gradient-radial|gradient-conic|outline|outline-dashed|outline-dotted|outline-double|blur|backdrop-blur|brightness|contrast|grayscale|saturate))-\[(.+)\]$/);
    if (arbitraryMatch) {
      const [, type, valueRaw] = arbitraryMatch;
      const value = typeof valueRaw === 'string' ? valueRaw : String(valueRaw);
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
        case 'is-z': properties = `z-index: ${value};`; break;
        case 'is-scale':properties = `transform: scale(${value});`; break;
        case 'is-opacity': properties = `opacity: ${value};`; break;
        case 'is-rot': properties = `transform: rotate(${value});`; break;
        case 'is-grid-cols':properties = `grid-template-columns: repeat(${value}, minmax(0, 1fr));`;break;
        case 'is-grid-rows':properties = `grid-template-rows: repeat(${value}, minmax(0, 1fr));`;break;
        case 'is-gap':properties = `gap: ${value};`;break;
        case 'is-top':properties = `top: ${value};`;break;
        case 'is-bottom':properties = `bottom: ${value};`;break;
        case 'is-left':properties = `left: ${value};`;break;
        case 'is-right':properties = `right: ${value};`;break;
        case 'is-translate':properties = `transform: translate(${value}, ${value});`;break;
        case 'is-translate-x':properties = `transform: translateX(${value});`;break;
        case 'is-translate-y':properties = `transform: translateY(${value});`;break;
        case 'is-border': properties = `border-width: ${value} ${value} ${value} ${value}; border-style: solid;`;break;
        case 'is-border-t':properties = `border-top-width: ${value}; border-style: solid;`;break;
        case 'is-border-b':properties = `border-bottom-width: ${value}; border-style: solid;`;break;
        case 'is-border-l':properties = `border-left-width: ${value}; border-style: solid;`;break;
        case 'is-border-r':properties = `border-right-width: ${value}; border-style: solid;`;break;
        case 'is-outline':properties = `outline: 1px solid ${value};`;break;
        case 'is-outline-dashed':properties = `outline: 1px dashed ${value};`;break;
        case 'is-outline-dotted':properties = `outline: 1px dotted ${value};`;break;
        case 'is-outline-double':properties = `outline: 2px solid ${value};`;break;
        case 'is-blur':properties = `filter: blur(${value});`;break;
        case 'is-backdrop-blur':properties = `backdrop-filter: blur(${value});`;break;
        case 'is-brightness': properties = `filter: brightness(${value});`;break;
        case 'is-contrast': properties = `filter: contrast(${value});`;break;
        case 'is-grayscale': properties = `filter: grayscale(${value});`;break;
        case 'is-saturate': properties = `filter: saturate(${value});`;break;
        case 'is-fixed-bg': {const safeVal = value.replace(/"/g, '\"');properties = `position: fixed; top: 0; left: 0; width: 100dvw; height: 100dvh; z-index: -1; background-repeat: no-repeat; background-size: cover; background-image: url("${safeVal}");`;break;}
        case 'is-gradient-linear': {const safeVal = value.replace(/_/g, ' ').replace(/"/g, '"');properties = `background: linear-gradient(${safeVal}); background-clip: text;  -webkit-text-fill-color: transparent;`; break;}
        case 'is-gradient-radial': {const safeVal = value.replace(/_/g, ' ').replace(/"/g, '"');properties = `background: radial-gradient(${safeVal}); background-clip: text;  -webkit-text-fill-color: transparent;`; break;}
        case 'is-gradient-conic': {const safeVal = value.replace(/_/g, ' ').replace(/"/g, '"');properties = `background: conic-gradient(${safeVal}); background-clip: text;  -webkit-text-fill-color: transparent;`; break;}
        default:properties = '';
      }
      if (properties) {
        const sel = `${darkPrefix}.${escapeSelector(cls)}${variantSel}`;
        rule = `${sel} { ${properties} }`;
      }
    } else {
      const style = stylesMeta[base];
      if (style) {
        let properties = '';
        let ruleSrc = '';
        if (typeof style === 'object' && style !== null) {
          if (style.keyframes) keyframesSet.add(style.keyframes);
          ruleSrc = style.class || '';
        } else {
          ruleSrc = style || '';
        }
        const m = typeof ruleSrc === 'string' ? ruleSrc.match(/{([^}]+)}/) : null;
        properties = m ? m[1].trim() : ruleSrc;
        if (properties) {
          const sel = `${darkPrefix}.${escapeSelector(cls)}${variantSel}`;
          rule = `${sel} { ${properties} }`;
        }
      } else if (iconsMeta[base]) {
        const iconStyle = iconsMeta[base];
        let fullRule = '';
        if (typeof iconStyle === 'object' && iconStyle.value) {
          fullRule = iconStyle.value;
        } else if (typeof iconStyle === 'string') {
          fullRule = iconStyle;
        }
        if (fullRule) {
          const m = fullRule.match(/{([^}]+)}/);
          if (m) {
            const properties = m[1].trim();
            const sel = `${darkPrefix}.${escapeSelector(cls)}${variantSel}:before`;
            rule = `${sel} { ${properties} }`;
          }
        }
      }
    }

    if (rule) {
      const bucket = mediaQuery || 'default';
      if (!stylesByMedia[bucket]) stylesByMedia[bucket] = new Set();
      stylesByMedia[bucket].add(rule);
    }
  }

  cssOutput += Array.from(keyframesSet).join('\n') + '\n';

  if (stylesByMedia.default) {
    cssOutput += Array.from(stylesByMedia.default).join('\n') + '\n';
  }

  Object.keys(responsiveBreakpoints).forEach(bpKey => {
    const mq = `@media ${responsiveBreakpoints[bpKey]}`;
    if (stylesByMedia[mq] && stylesByMedia[mq].size > 0) {
      cssOutput += `${mq} {\n${Array.from(stylesByMedia[mq]).map(r => `  ${r}`).join('\n')}\n}\n`;
    }
  });

  if (config.customCSS && Array.isArray(config.customCSS)) {
    config.customCSS.forEach(customFile => {
      const customFilePath = path.resolve(process.cwd(), customFile);
      if (fs.existsSync(customFilePath)) {
        cssOutput += fs.readFileSync(customFilePath, 'utf-8') + '\n';
      } else {
        console.warn(`Warning: Custom CSS file not found: ${customFilePath}`);
      }
    });
  }

  fs.writeFileSync(OUTPUT_CSS, cssOutput);
  console.log(`CSS generated: ${OUTPUT_CSS}`);

  await subsetWOFF2(Array.from(usedClasses).map(stripAllPrefixes));
}

function stripAllPrefixes(token) {
  let rest = token;
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of allVariantTokens) {
      if (rest.startsWith(t)) {
        rest = rest.slice(t.length);
        changed = true;
      }
    }
  }
  return rest;
}

async function subsetWOFF2(usedClasses) {
  try {
    const iconsMeta = JSON.parse(await fs.readFile(META_ICONS, 'utf-8'));
    const unicodes = usedClasses
      .filter(cls => cls.startsWith('if-') && iconsMeta[cls])
      .map(cls => {
        const iconStyle = iconsMeta[cls];
        let content = null;
        if (typeof iconStyle === 'object' && iconStyle.value) {
          content = iconStyle.value;
        } else if (typeof iconStyle === 'string') {
          content = iconStyle;
        }
        if (content) {
          const match = content.match(/content:\s*'\\([0-9a-fA-F]+)'/);
          if (match && match[1]) {
            return String.fromCodePoint(parseInt(match[1], 16));
          }
        }
        return null;
      })
      .filter(Boolean)
      .join('');

    if (!unicodes.length) {
      console.log('No icons to subset, copying full font...');
      await fs.copyFile(path.join(DIST_DIR, 'iconforge.woff2'), OUTPUT_WOFF2);
      return;
    }

    const fontBuffer = await fs.readFile(path.join(DIST_DIR, 'iconforge.woff2'));
    const subsetBuffer = await subsetFont(fontBuffer, unicodes, {
      targetFormat: 'woff2',
      getFontName: (name) => `${name}-subset`,
    });
    await fs.writeFile(OUTPUT_WOFF2, subsetBuffer);

    const originalSize = fontBuffer.length;
    const newSize = subsetBuffer.length;
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    console.log(`File size reduced by ${reduction}% (${originalSize} → ${newSize} bytes)`);
  } catch (err) {
    console.error('Error during font subsetting:', err);
    await fs.copyFile(path.join(DIST_DIR, 'iconforge.woff2'), OUTPUT_WOFF2);
  }
}

function runInit() {
  if (fs.existsSync(CJS_CONFIG_PATH) || fs.existsSync(JS_CONFIG_PATH)) {
    console.log('iconforge.config.js or .cjs already exists.');
    return;
  }
  const configContent = `module.exports = {
    content: [
      './**/*.{html,js,ts,vue,jsx,tsx}',
    ],
    // Add any classes that are generated dynamically and not found by the parser.
    safelist: [],
    customCSS: [],
};
`;
  fs.writeFileSync(CJS_CONFIG_PATH, configContent);
  console.log('iconforge.config.cjs created successfully.');
}

async function getInputGlob(cliArgs, config) {
  if (cliArgs[1]) return cliArgs[1];
  if (config.content && Array.isArray(config.content) && config.content.length > 0) {
    return config.content;
  }
  return ['**/*.{html,js,ts,vue,jsx,tsx}'];
}

async function runBuild(inputGlob) {
  const patterns = [].concat(inputGlob);
  const files = patterns.flatMap(pattern => glob.sync(pattern, { nodir: true, ignore: ['node_modules/**'] }));
  let combinedContent = '';
  [...new Set(files)].forEach(file => {
    combinedContent += fs.readFileSync(file, 'utf-8') + '\n';
  });
  await buildCSS(combinedContent);
}

async function runWatch(inputGlob) {
  console.log(`Watching for changes...`);
  const watcher = chokidar.watch(inputGlob, { ignored: ['node_modules/**'], ignoreInitial: true });
  
  const buildOnChange = async (filePath) => {
    console.log(`File changed: ${filePath}. Rebuilding...`);
    await runBuild(inputGlob);
  };

  watcher.on('change', buildOnChange);
  watcher.on('add', buildOnChange);
  watcher.on('unlink', buildOnChange);
}

async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'build';

    if (mode === 'init') {
      runInit();
      return;
    }

    const config = await loadConfig();
    const inputGlob = await getInputGlob(args, config);

    if (mode === 'build') {
      await runBuild(inputGlob);
    } else if (mode === 'watch') {
      await runBuild(inputGlob);
      await runWatch(inputGlob);
    } else {
      console.log(`Unknown command: ${mode}`);
    }
}

main().catch(e => {
    console.error("An unexpected error occurred:", e);
    process.exit(1);
});
