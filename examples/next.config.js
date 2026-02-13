/** @type {import('next').NextConfig} */
const nextConfig = {
	output: 'export',
	basePath: process.env.NEXT_PUBLIC_REPO ? `/${process.env.NEXT_PUBLIC_REPO}` : undefined,
	assetPrefix: process.env.NEXT_PUBLIC_REPO ? `/${process.env.NEXT_PUBLIC_REPO}/` : undefined,
	env: {
		NEXT_PUBLIC_PREFIX: process.env.NEXT_PUBLIC_REPO ? `/${process.env.NEXT_PUBLIC_REPO}` : "",
	},
	transpilePackages: ['lambda360view', 'three'],
	webpack: (config) => {
		config.externals = config.externals || [];
		return config;
	},
};

module.exports = nextConfig;
