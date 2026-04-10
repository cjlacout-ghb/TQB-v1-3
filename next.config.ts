import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    compress: true,
    compiler: {
        removeConsole: process.env.NODE_ENV === "production",
    },
    // This tells Vercel/Next.js to NOT fail the build on ESLint warnings/errors.
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
