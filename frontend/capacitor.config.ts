import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.memora.app',
  appName: 'Memora',
  webDir: 'out',
  server: {
    url: 'http://10.36.192.1:3000',
    cleartext: true
  }
};

export default config;
