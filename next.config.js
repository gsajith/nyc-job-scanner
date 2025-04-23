/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs', 'child_process' and other node-specific modules on the client
      config.resolve.fallback = {
        fs: false,
        child_process: false,
        net: false,
        tls: false,
        "iconv-lite": false,
        encoding: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
