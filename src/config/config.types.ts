export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  databaseUrl: string;
  redis: { host: string; port: number };
  jwt: {
    privateKey: string;
    publicKey: string;
    accessTtl: number;
    refreshTtl: number;
  };
  bcryptRounds: number;
  throttle: { ttl: number; limit: number };
  appUrl: string;
  corsOrigins: string[];
}
