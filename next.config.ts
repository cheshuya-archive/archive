import type { NextConfig } from "next";

const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // GitHub Pages отдаёт только статические файлы: серверного оптимизатора Next там нет.
  output: "export",
  trailingSlash: true,
  basePath: isGitHubPages ? "/cheshuya" : "",
  assetPrefix: isGitHubPages ? "/cheshuya/" : undefined,
  images: { unoptimized: true },
};

export default nextConfig;
