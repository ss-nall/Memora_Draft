import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.memora.app',
  appName: 'Memora',
  webDir: 'out',
  server: {
    url: 'http://localhost:3000',
    cleartext: true
  }

};

export default config;
