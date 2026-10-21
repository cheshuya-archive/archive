import type { NextConfig } from "next";

const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";
const repositoryName = process.env.NEXT_PUBLIC_REPOSITORY_NAME || process.env.GITHUB_REPOSITORY?.split("/")[1] || "cheshuya";
const basePath = isGitHubPages && !repositoryName.toLowerCase().endsWith(".github.io") ? `/${repositoryName}` : "";

const nextConfig: NextConfig = {
  // GitHub Pages отдаёт только статические файлы: серверного оптимизатора Next там нет.
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: isGitHubPages ? `${basePath}/` : undefined,
  images: { unoptimized: true },
};

export default nextConfig;
