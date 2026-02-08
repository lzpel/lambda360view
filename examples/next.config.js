/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['lambda360view', 'three'],
    webpack: (config) => {
        config.externals = config.externals || [];
        return config;
    },
};

module.exports = nextConfig;
