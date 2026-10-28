import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV?.trim() === 'production';
const isTest = process.env.NODE_ENV?.trim() === 'test';

const nextConfig: NextConfig = {
  reactStrictMode: isProduction,
  compiler: {
    removeConsole: !isProduction
      ? false
      : {
          exclude: ['error'],
        },
    reactRemoveProperties: isTest
      ? { properties: ['^data-custom$'] }
      : false,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/registrazione',
          destination: '/signup',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Gemini dice che è necessario sostiuire o affiancare alla configurazione di webpack
  // con la configurazione di turbopack, se si vuole sfruttare al massimo la velocità di
  // turbopack per la build e la modalità devs
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

export default nextConfig;