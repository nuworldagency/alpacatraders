const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const componentsDir = path.join(__dirname, '..', 'components', 'ui');

// Ensure the ui directory exists
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// List of required UI components
const requiredComponents = [
  'button',
  'input',
  'scroll-area',
  'table',
  'tabs',
  'card',
  'select',
  'toast',
];

// Check and install required dependencies
const dependencies = [
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-slot',
  '@radix-ui/react-tabs',
  '@radix-ui/react-toast',
  'class-variance-authority',
  'clsx',
  'tailwind-merge',
];

console.log('Installing dependencies...');
dependencies.forEach(dep => {
  try {
    execSync(`npm install ${dep}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to install ${dep}`);
  }
});

console.log('Checking UI components...');
requiredComponents.forEach(component => {
  const componentPath = path.join(componentsDir, `${component}.tsx`);
  if (!fs.existsSync(componentPath)) {
    console.log(`Missing component: ${component}`);
  } else {
    console.log(`✓ ${component}.tsx exists`);
  }
});
