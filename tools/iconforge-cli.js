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
const CONFIG_FILE = path.join(process.cwd(), 'iconforge.config.js');

function escapeSelector(selector) {
  return selector.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

function buildCSS(content) { 
  fs.ensureDirSync(OUTPUT_DIR);
  const iconsMeta = JSON.parse(fs.readFileSync(META_ICONS, "utf-8"));
  const stylesMeta = JSON.parse(fs.readFileSync(META_STYLES, "utf-8"));
  const usedClasses = new Set();
  const responsiveBreakpoints = {
    "sm:": "(min-width: 640px)",
    "md:": "(min-width: 768px)",
    "lg:": "(min-width: 1024px)",
    "xl:": "(min-width: 1280px)",
  };
  const variantPrefixes = [
    "hover:",
    "focus:",
    "active:",
    "dark:",
    ...Object.keys(responsiveBreakpoints),
  ];
  const regex = /class\s*=\s*["'`](.*?)["'`]/gms;
  let match;
  while ((match = regex.exec(content)) !== null) {
    match[1].split(/\s+/).forEach((cls) => {
      let baseClass = cls;
      const variant = variantPrefixes.find((v) => cls.startsWith(v));
      if (variant) {
        baseClass = cls.slice(variant.length);
      }
      if (baseClass.startsWith("if-") || baseClass.startsWith("is-")) {
        usedClasses.add(cls);
      }
    });
  }
  
  let cssOutput = `@font-face {font-family: 'IconForge'; src: url('iconforge.woff2') format('woff2'); font-style: normal; font-display: block; }[class^="if-"], [class*=" if-"] { font-family: 'IconForge' !important; display: inline-block; font-style: normal; font-weight: normal; font-variant: normal; text-transform: none; line-height: 1; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }\n`;
  const keyframesSet = new Set();
  const stylesByMedia = { default: new Set() };
  for (let cls of usedClasses) {
    let baseClass = cls;
    let variantCSS = "";
    let prefix = "";
    let mediaQuery = "default";
    const variant = variantPrefixes.find((v) => cls.startsWith(v));
    if (variant) {
      baseClass = cls.slice(variant.length);
      if (variant === "hover:") variantCSS = ":hover";
      else if (variant === "focus:") variantCSS = ":focus";
      else if (variant === "active:") variantCSS = ":active";
      else if (variant === "dark:") {
        prefix = ".dark ";
      } else if (responsiveBreakpoints[variant]) {
        mediaQuery = `@media ${responsiveBreakpoints[variant]}`;
      }
    }
    const arbitraryMatch = baseClass.match(/^(is-(?:color|bg|w|h|sq|size|p|pt|pr|pb|pl|px|py|m|mt|mr|mb|ml|my|mx))-\[(.+)\]$/);
    if (arbitraryMatch) {
      const [, type, value] = arbitraryMatch;
      const escapedClass = escapeSelector(cls);
      let properties = "";

      switch (type) {
        case "is-color":
          rule = `color: ${value};`;
          break;
        case "is-bg":
          rule = `background-color: ${value};`;
          break;
        case "is-w":
          rule = `width: ${value};`;
          break;
        case "is-h":
          rule = `height: ${value};`;
          break;
        case "is-sq":
          rule = `width: ${value}; height: ${value};`;
          break;
        case "is-size":
          rule = `font-size: ${value};`;
          break;
        case "is-p":
          rule = `padding: ${value};`;
          break;
        case "is-pt":
          rule = `padding-top: ${value};`;
          break;
        case "is-pr":
          rule = `padding-right: ${value};`;
          break;
        case "is-pb":
          rule = `padding-bottom: ${value};`;
          break;
        case "is-pl":
          rule = `padding-left: ${value};`;
          break;
        case "is-px":
          rule = `padding-left: ${value}; padding-right: ${value};`;
          break;
        case "is-py":
          rule = `padding-top: ${value}; padding-bottom: ${value};`;
          break;
        case "is-m":
          rule = `margin: ${value};`;
          break;
        case "is-mt":
          rule = `margin-top: ${value};`;
          break;
        case "is-mr":
          rule = `margin-right: ${value};`;
          break;
        case "is-mb":
          rule = `margin-bottom: ${value};`;
          break;
        case "is-ml":
          rule = `margin-left: ${value};`;
          break;
        case "is-mx":
          rule = `margin-left: ${value}; margin-right: ${value};`;
          break;
        case "is-my":
          rule = `margin-top: ${value}; margin-bottom: ${value};`;
          break;
      }

      if (properties) {
        const rule = `${prefix}.${escapedClass}${variantCSS} { ${properties} }`;
        if (!stylesByMedia[mediaQuery]) stylesByMedia[mediaQuery] = new Set();
        stylesByMedia[mediaQuery].add(rule);
      }
      continue;
  }

    const style = stylesMeta[baseClass];
    if (style) {
      let properties = "";
      let ruleSrc = "";
      if (typeof style === "object" && style !== null) {
        if (style.keyframes) keyframesSet.add(style.keyframes);
        ruleSrc = style.class || "";
      } else {
        ruleSrc = style || "";
      }
      const match =
        typeof ruleSrc === "string" ? ruleSrc.match(/{([^}]+)}/) : null;
      properties = match ? match[1].trim() : ruleSrc;
      if (properties) {
        const rule = `${prefix}.${escapeSelector(
          cls
        )}${variantCSS} { ${properties} }`;
        if (!stylesByMedia[mediaQuery]) stylesByMedia[mediaQuery] = new Set();
        stylesByMedia[mediaQuery].add(rule);
      }
    } else if (iconsMeta[baseClass]) {
      const iconStyle = iconsMeta[baseClass];
      let properties = "";
      let fullRule = "";
      if (typeof iconStyle === "object" && iconStyle.value) {
        fullRule = iconStyle.value;
      } else if (typeof iconStyle === "string") {
        fullRule = iconStyle;
      }
      if (fullRule) {
        const match = fullRule.match(/{([^}]+)}/);
        if (match) {
          properties = match[1].trim();
          const rule = `${prefix}.${escapeSelector(
            cls
          )}:before${variantCSS} { ${properties} }`;
          if (!stylesByMedia[mediaQuery]) stylesByMedia[mediaQuery] = new Set();
          stylesByMedia[mediaQuery].add(rule);
        }
      }
    }
  } cssOutput += Array.from(keyframesSet).join('\n') + '\n'; if (stylesByMedia.default) { cssOutput += Array.from(stylesByMedia.default).join('\n') + '\n'; } Object.keys(responsiveBreakpoints).forEach(bpKey => { const mq = `@media ${responsiveBreakpoints[bpKey]}`; if (stylesByMedia[mq] && stylesByMedia[mq].size > 0) { cssOutput += `${mq} {\n${Array.from(stylesByMedia[mq]).map(r => `  ${r}`).join('\n')}\n}\n`; } }); if (fs.existsSync(CONFIG_FILE)) { try { const config = require(CONFIG_FILE); if (config.customCSS && Array.isArray(config.customCSS)) { config.customCSS.forEach(customFile => { const customFilePath = path.resolve(process.cwd(), customFile); if (fs.existsSync(customFilePath)) { cssOutput += fs.readFileSync(customFilePath, 'utf-8') + '\n'; } else { console.warn(`Warning: Custom CSS file not found: ${customFilePath}`); } }); } } catch (e) { console.error("Error reading or parsing iconforge.config.js for customCSS", e); } } fs.writeFileSync(OUTPUT_CSS, cssOutput); console.log(`CSS generated: ${OUTPUT_CSS}`); subsetWOFF2(Array.from(usedClasses).map(cls => cls.replace(/^(hover:|focus:|active:|dark:|sm:|md:|lg:|xl:)/, ''))); }

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
          const match = content.match(/content: '\\([0-9a-fA-F]+)'/);
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
      getFontName: (name) => `${name}-subset`
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
  if (fs.existsSync(CONFIG_FILE)) {
    console.log('iconforge.config.js already exists.');
    return;
  }
  const configContent = `module.exports = {
    content: [
        './**/*.{html,js,ts,vue,jsx,tsx}',
    ],
    customCSS: [],
};
`;
  fs.writeFileSync(CONFIG_FILE, configContent);
  console.log('iconforge.config.js created successfully.');
}

function getInputGlob(cliArgs) {
  if (cliArgs[1]) return cliArgs[1];
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const config = require(CONFIG_FILE);
      if (config.content && Array.isArray(config.content) && config.content.length > 0) {
        return config.content;
      }
    } catch (e) {
      console.error("Error reading or parsing iconforge.config.js", e);
    }
  }
  return ['**/*.{html,js,ts,vue,jsx,tsx}'];
}

function runBuild(inputGlob) {
  const patterns = [].concat(inputGlob);
  const files = patterns.flatMap(pattern => glob.sync(pattern, { nodir: true, ignore: ['node_modules/**'] }));
  let combinedContent = '';
  [...new Set(files)].forEach(file => {
    combinedContent += fs.readFileSync(file, 'utf-8') + '\n';
  });
  buildCSS(combinedContent);
}

function runWatch(inputGlob) {
  console.log(`Watching for changes...`);
  chokidar.watch(inputGlob, { ignored: ['node_modules/**'] }).on('change', () => runBuild(inputGlob));
}

const args = process.argv.slice(2);
const mode = args[0] || 'build';
if (mode === 'init') {
  runInit();
} else {
  const inputGlob = getInputGlob(args);
  if (mode === 'build') runBuild(inputGlob);
  else if (mode === 'watch') runWatch(inputGlob);
  else console.log(`Unknown command: ${mode}`);
}