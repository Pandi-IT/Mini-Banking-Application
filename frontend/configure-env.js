const fs = require('fs');
const path = require('path');

// Scan for the separated .env file in the current directory
const envPath = path.join(__dirname, '.env');

let backendUrl = process.env.FRONTEND_BACKEND_API_URL || '';

if (!backendUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split(/\r?\n/);
  for (let line of lines) {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const match = line.match(/^\s*FRONTEND_BACKEND_API_URL\s*=\s*(.*)$/);
      if (match) {
        let val = match[1].trim();
        // Remove surrounding quotes if they exist
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        backendUrl = val;
        break;
      }
    }
  }
}

// Generate the api.config.ts contents with the resolved URL
const configContent = `import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Auto-generated from root .env configuration. DO NOT EDIT DIRECTLY.
 * Update FRONTEND_BACKEND_API_URL in the root .env file instead.
 */
export const BACKEND_API_URL: string = '${backendUrl}';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (BACKEND_API_URL && req.url.startsWith('/api')) {
    const baseUrl = BACKEND_API_URL.replace(/\\/$/, '');
    const clone = req.clone({
      url: \`\${baseUrl}\${req.url}\`
    });
    return next(clone);
  }
  return next(req);
};
`;

const outputPath = path.join(__dirname, 'src/app/core/api.config.ts');
fs.writeFileSync(outputPath, configContent, 'utf8');
console.log(`[EnvConfig] Successfully set BACKEND_API_URL = '${backendUrl}'`);
