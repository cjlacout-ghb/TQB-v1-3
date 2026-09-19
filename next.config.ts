import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    compress: true,
    compiler: {
        removeConsole: process.env.NODE_ENV === "production",
    },
    // ESLint checks are enabled during builds to catch regressions
    eslint: {
        ignoreDuringBuilds: false,
    },
};

export default nextConfig;
