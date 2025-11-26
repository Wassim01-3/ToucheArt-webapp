const fs = require('fs');
const path = require('path');

const iconSource = path.join(__dirname, '..', 'apple-touch-icon.png');
const iconDest = path.join(__dirname, '..', 'dist', 'apple-touch-icon.png');
const distDir = path.join(__dirname, '..', 'dist');

if (fs.existsSync(iconSource) && fs.existsSync(distDir)) {
  fs.copyFileSync(iconSource, iconDest);
  console.log('✅ Copied apple-touch-icon.png to dist/');
} else {
  console.log('⚠️  Icon file or dist folder not found');
  if (!fs.existsSync(iconSource)) {
    console.log('   Missing: apple-touch-icon.png');
  }
  if (!fs.existsSync(distDir)) {
    console.log('   Missing: dist/ folder');
  }
}

