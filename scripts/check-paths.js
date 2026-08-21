#!/usr/bin/env node
// NutriTrack Path Consistency Checker - TEST ENVIRONMENT
// Validates that all paths in the codebase match the centralized configuration

const fs = require('fs');
const path = require('path');
const { DEPLOY_CONFIG, getPath, getPrecacheAssets, getSWPath, getSWScope, getFoodsJsonUrl } = require('../deploy-config.js');

console.log('Checking path consistency for TEST environment...\n');

let errors = 0;
let warnings = 0;

function checkFile(filePath, checks) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠ File not found: ${filePath}`);
    warnings++;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  for (const check of checks) {
    const { pattern, expected, description, shouldExist, shouldNotExist } = check;
    
    if (shouldExist) {
      if (pattern.test(content)) {
        console.log(`✓ ${filePath}: ${description}`);
      } else {
        console.error(`✗ ${filePath}: Missing expected pattern: ${description}`);
        console.error(`  Expected: ${expected}`);
        errors++;
      }
    } else if (shouldNotExist) {
      const matches = content.match(pattern);
      if (matches) {
        console.error(`✗ ${filePath}: Found unexpected hardcoded path: ${description}`);
        console.error(`  Found: ${matches.join(', ')}`);
        errors++;
      } else {
        console.log(`✓ ${filePath}: No hardcoded paths found: ${description}`);
      }
    } else {
      const matches = content.match(pattern);
      if (matches) {
        const actual = matches[0];
        if (actual === expected) {
          console.log(`✓ ${filePath}: ${description} = "${actual}"`);
        } else {
          console.error(`✗ ${filePath}: ${description}`);
          console.error(`  Expected: "${expected}"`);
          console.error(`  Found: "${actual}"`);
          errors++;
        }
      } else {
        console.error(`✗ ${filePath}: Pattern not found: ${description}`);
        console.error(`  Pattern: ${pattern}`);
        errors++;
      }
    }
  }
}

// Check index.html for TEST environment
console.log('=== Checking index.html (TEST) ===');
checkFile('index.html', [
  {
    pattern: /const SHELL_APP_VERSION = ['"](.*)['"]/,
    expected: DEPLOY_CONFIG.BUILD_VERSION,
    description: 'SHELL_APP_VERSION matches TEST config'
  },
  {
    pattern: /\/NutriTrack-test\/sw\.js\?v=v\d+(-test)?/,
    expected: `/NutriTrack-test/sw.js?v=${DEPLOY_CONFIG.BUILD_VERSION}`,
    description: 'SW registration URL matches TEST version'
  },
  {
    pattern: /scope:\s*['"]\/NutriTrack-test\/["']/,
    expected: DEPLOY_CONFIG.TEST_BASE_PATH,
    description: 'SW scope is correct for TEST'
  },
  {
    pattern: /href=["']\/NutriTrack-test\/manifest\.webmanifest["']/,
    expected: '/NutriTrack-test/manifest.webmanifest',
    description: 'Manifest path is correct for TEST'
  },
  {
    pattern: /href=["']\/NutriTrack-test\/icons\/apple-touch-icon\.png["']/,
    expected: '/NutriTrack-test/icons/apple-touch-icon.png',
    description: 'Apple touch icon path is correct for TEST'
  },
  {
    pattern: /src=['"]\.\/NutriTrack\.js\?v=(\d+)/,
    expected: `./NutriTrack.js?v=${DEPLOY_CONFIG.APP_VERSION}`,
    description: 'NutriTrack.js load URL matches version'
  }
]);

// Check sw.js for TEST environment
console.log('\n=== Checking sw.js (TEST) ===');
checkFile('sw.js', [
  {
    pattern: /const CACHE_VERSION = ["']nutritrack-v\d+(-test)?["']/,
    expected: DEPLOY_CONFIG.CACHE_VERSION,
    description: 'CACHE_VERSION matches TEST config'
  },
  {
    pattern: /\/NutriTrack-test\/NutriTrack\.js/,
    expected: '/NutriTrack-test/NutriTrack.js',
    description: 'NutriTrack.js in precache assets for TEST'
  },
  {
    pattern: /\/NutriTrack-test\/foods\.json/,
    expected: '/NutriTrack-test/foods.json',
    description: 'foods.json in precache assets for TEST'
  },
  {
    pattern: /\/NutriTrack-test\/icons\/icon-192\.png/,
    expected: '/NutriTrack-test/icons/icon-192.png',
    description: 'icon-192.png in precache assets for TEST'
  },
  {
    pattern: /\/NutriTrack-test\/icons\/icon-512\.png/,
    expected: '/NutriTrack-test/icons/icon-512.png',
    description: 'icon-512.png in precache assets for TEST'
  },
  {
    pattern: /\/NutriTrack-test\/icons\/apple-touch-icon\.png/,
    expected: '/NutriTrack-test/icons/apple-touch-icon.png',
    description: 'apple-touch-icon.png in precache assets for TEST'
  },
  {
    pattern: /url\.pathname === ["']\/NutriTrack-test\/["']/,
    expected: '/NutriTrack-test/',
    description: 'index.html path check for TEST'
  },
  {
    pattern: /url\.pathname === ["']\/NutriTrack-test\/index\.html["']/,
    expected: '/NutriTrack-test/index.html',
    description: 'index.html explicit path check for TEST'
  }
]);

// Check NutriTrack.jsx for TEST environment
console.log('\n=== Checking NutriTrack.jsx (TEST) ===');
checkFile('NutriTrack.jsx', [
  {
    pattern: /const FOODS_DB_VERSION = ["'](\d+)["']/,
    expected: DEPLOY_CONFIG.FOODS_DB_VERSION,
    description: 'FOODS_DB_VERSION matches TEST config'
  },
  {
    pattern: /\/NutriTrack-test\/foods\.json\?v=\$\{FOODS_DB_VERSION\}/,
    shouldExist: true,
    description: 'foods.json URL uses FOODS_DB_VERSION variable for TEST'
  },
  {
    pattern: /const WORKER_URL = ["'](https:\/\/[^"']+)["']/,
    expected: DEPLOY_CONFIG.WORKER_ORIGIN,
    description: 'WORKER_URL matches config'
  }
]);

// Check deploy-config.js exists and is valid
console.log('\n=== Checking deploy-config.js (TEST) ===');
if (fs.existsSync('deploy-config.js')) {
  console.log('✓ deploy-config.js exists');
  
  const configContent = fs.readFileSync('deploy-config.js', 'utf8');
  
  // Check that TEST properties are defined
  const requiredProps = [
    'BASE_PATH',
    'TEST_BASE_PATH',
    'CACHE_VERSION',
    'APP_VERSION',
    'BUILD_VERSION',
    'FOODS_DB_VERSION',
    'WORKER_ORIGIN'
  ];
  
  for (const prop of requiredProps) {
    if (configContent.includes(prop)) {
      console.log(`✓ ${prop} defined in TEST config`);
    } else {
      console.error(`✗ ${prop} missing from TEST config`);
      errors++;
    }
  }
} else {
  console.error('✗ deploy-config.js not found');
  errors++;
}

// Check build.js exists
console.log('\n=== Checking build.js (TEST) ===');
if (fs.existsSync('build.js')) {
  console.log('✓ build.js exists');
  
  const buildContent = fs.readFileSync('build.js', 'utf8');
  
  if (buildContent.includes('deploy-config.js')) {
    console.log('✓ build.js references deploy-config.js');
  } else {
    console.error('✗ build.js does not reference deploy-config.js');
    errors++;
  }
  
  if (buildContent.includes('@babel/core')) {
    console.log('✓ build.js uses @babel/core');
  } else {
    console.error('✗ build.js does not use @babel/core');
    errors++;
  }
} else {
  console.error('✗ build.js not found');
  errors++;
}

// Check recover.html exists
console.log('\n=== Checking recover.html (TEST) ===');
if (fs.existsSync('recover.html')) {
  console.log('✓ recover.html exists');
  
  const recoverContent = fs.readFileSync('recover.html', 'utf8');
  
  if (recoverContent.includes('exportData') && recoverContent.includes('localStorage')) {
    console.log('✓ recover.html has export functionality');
  } else {
    console.error('✗ recover.html missing export functionality');
    errors++;
  }
  
  if (recoverContent.includes('indexedDB')) {
    console.log('✓ recover.html has IndexedDB support');
  } else {
    console.warn('⚠ recover.html missing IndexedDB support');
    warnings++;
  }
} else {
  console.error('✗ recover.html not found');
  errors++;
}

// Check package.json exists
console.log('\n=== Checking package.json (TEST) ===');
if (fs.existsSync('package.json')) {
  console.log('✓ package.json exists');
} else {
  console.error('✗ package.json not found');
  errors++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('SUMMARY (TEST)');
console.log('='.repeat(50));
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors > 0) {
  console.error('\n❌ Path consistency check FAILED for TEST');
  process.exit(1);
} else if (warnings > 0) {
  console.warn('\n⚠ Path consistency check PASSED with warnings for TEST');
  process.exit(0);
} else {
  console.log('\n✅ Path consistency check PASSED for TEST');
  process.exit(0);
}
