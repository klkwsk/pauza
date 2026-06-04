import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Agent SDK uruchamia własny skrypt CLI jako podproces — nie bundlować go.
  serverExternalPackages: ["@anthropic-ai/claude-agent-sdk"],
};

export default nextConfig;
