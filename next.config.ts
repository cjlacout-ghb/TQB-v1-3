import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    compress: true,
    compiler: {
        removeConsole: process.env.NODE_ENV === "production",
    },
};
export default nextConfig;
