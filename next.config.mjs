/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
                port: "",
                pathname: "**"
            }
        ]
    }
};

export default nextConfig;

/*
// For bundle analyzer setup

import withBundleAnalyzer from "@next/bundle-analyzer";
const bundleAnalyzer = withBundleAnalyzer({
    enabled: true
});

const nextConfig = {};

export default bundleAnalyzer(nextConfig);

*/
