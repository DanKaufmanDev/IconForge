#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const chokidar = require('chokidar');
const { execSync } = require('child_process');
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

function buildCSS(content) {
  fs.ensureDirSync(OUTPUT_DIR);
  const iconsMeta = JSON.parse(fs.readFileSync(META_ICONS, 'utf-8'));
  const stylesMeta = JSON.parse(fs.readFileSync(META_STYLES, 'utf-8'));

  const usedClasses = new Set();

  const regex = /class\s*=\s*["'`](.*?)["'`]/gms;
  let match;
  while ((match = regex.exec(content)) !== null) {
    match[1].split(/\s+/).forEach(cls => {
      if (cls.startsWith('if-') || cls.startsWith('is-')) {
        usedClasses.add(cls);
      }
    });
  }

  let cssOutput = `@font-face {font-family: 'IconForge';src: url('iconforge.woff2') format('woff2');font-style: normal;font-display: block;}[class^="if-"], [class*=" if-"] {font-family: 'IconForge' !important;font-style: normal;font-weight: normal;font-variant: normal;text-transform: none;line-height: 1;-webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;}\n`;
  const keyframes = new Set();
  let mainOutput = '';

  for (let cls of usedClasses) {
    if (iconsMeta[cls]) {
      mainOutput += iconsMeta[cls] + '\n';
    }
    if (stylesMeta[cls]) {
      const style = stylesMeta[cls];
      if (typeof style === 'object' && style.class) {
        if (style.keyframes) {
          keyframes.add(style.keyframes);
        }
        mainOutput += style.class + '\n';
      } else if (typeof style === 'string') {
        mainOutput += style + '\n';
      }
    }
  }

  cssOutput += Array.from(keyframes).join('\n') + '\n';
  cssOutput += mainOutput;

  if (fs.existsSync(CONFIG_FILE)) {
    try {
        const config = require(CONFIG_FILE);
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
    } catch (e) {
        console.error("Error reading or parsing iconforge.config.js for customCSS", e);
    }
  }

  fs.writeFileSync(OUTPUT_CSS, cssOutput);
  console.log(`CSS generated: ${OUTPUT_CSS}`);

  subsetWOFF2(Array.from(usedClasses));
}

async function subsetWOFF2(usedClasses) {
  try {
    
    const iconsMeta = JSON.parse(await fs.readFile(META_ICONS, 'utf-8'));
    
    const unicodes = usedClasses
      .filter(cls => cls.startsWith('if-') && iconsMeta[cls])
      .map(cls => {
        const match = iconsMeta[cls].match(/content: '\\([0-9a-fA-F]+)'/);
        if (match && match[1]) {
          return String.fromCodePoint(parseInt(match[1], 16));
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
    console.log(`Font size reduced by ${reduction}% (${originalSize} → ${newSize} bytes)`);
    
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
    customCSS: ['./src/styles.css'],
};
`;
    fs.writeFileSync(CONFIG_FILE, configContent);
    console.log('iconforge.config.js created successfully.');
}

function getInputGlob(cliArgs) {
    if (cliArgs[1]) {
        return cliArgs[1];
    }

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
    if (mode === 'build') {
        runBuild(inputGlob);
    } else if (mode === 'watch') {
        runWatch(inputGlob);
    } else {
        console.log(`Unknown command: ${mode}`);
    }
}
