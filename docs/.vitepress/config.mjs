import { defineConfig } from "vitepress";

import llmstxt from "vitepress-plugin-llms";
import { copyOrDownloadAsMarkdownButtons } from "vitepress-plugin-llms";
import {
  GitChangelog,
  GitChangelogMarkdownSection,
} from "@nolebase/vitepress-plugin-git-changelog/vite";
import { BiDirectionalLinks } from "@nolebase/markdown-it-bi-directional-links";
import { InlineLinkPreviewElementTransform } from "@nolebase/vitepress-plugin-inline-link-preview/markdown-it";
import {
  chineseSearchOptimize,
  pagefindPlugin,
} from "vitepress-plugin-pagefind";
import mdAutoSpacing from "markdown-it-autospace";
import locale from "./locale/index.mjs";

export default defineConfig({
  title: "Spinel",
  description: "Spinel Documentation",
  sitemap: {
    hostname: "https://thegreateclipse.github.io",
  },
  locales: locale.locales,
  head: [
    ["link", { rel: "icon", href: "/favicon.svg" }],
    ["link", { rel: "preconnect", href: "https://cdn.jsdelivr.net/" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/jetbrains-mono-webfont@latest/jetbrains-mono.css",
      },
    ],
    ["meta", { name: "google-site-verification", content: "PFExExHEiCGSrImS-yWoSnddXHrVHFmejD_kcS1g6AY" }],
    ["meta", { name: "robots", content: "index, follow" }],
    [
      "meta",
      {
        name: "keywords",
        content:
          "Spinel, Documentation, MediaTek, Bootloader, GKI, Kernel, Android",
      },
    ],
    ["meta", { name: "author", content: "Spinel Development" }],
    [
      "meta",
      { property: "og:title", content: "Spinel Documentation" },
    ],
    [
      "meta",
      {
        property: "og:description",
        content: "Spinel Documentation",
      },
    ],
    ["meta", { property: "og:type", content: "website" }],
    [
      "meta",
      { property: "og:site_name", content: "Spinel" },
    ],
    ["meta", { property: "og:url", content: "https://thegreateclipse.github.io" }],
    [
      "meta",
      { property: "og:image", content: "https://thegreateclipse.github.io/logo.svg" },
    ],
    ["meta", { name: "twitter:card", content: "summary" }],
    [
      "meta",
      { name: "twitter:title", content: "Spinel Documentation" },
    ],
    [
      "meta",
      { name: "twitter:description", content: "Spinel Documentation" },
    ],
    [
      "meta",
      { name: "twitter:image", content: "https://thegreateclipse.github.io/logo.svg" },
    ],
  ],
  themeConfig: {
    logo: "/favicon.svg",
    socialLinks: [
      { icon: "github", link: "https://github.com/TheGreatEclipse/Spinel.github.io" },
      { icon: "telegram", link: "https://t.me/spinel" },
    ],
    footer: {
      message: "Documented with ❤️ by Spinel Development",
      copyright: "Copyright © 2025-2026 Spinel, under MIT License",
    },
    outline: { level: [2, 4] },
    externalLinkIcon: true,
  },
  markdown: {
    config: (md) => {
      md.use(BiDirectionalLinks());
      md.use(copyOrDownloadAsMarkdownButtons);
      md.use(InlineLinkPreviewElementTransform);
      md.use(mdAutoSpacing, {
        pangu: true,
        mojikumi: true,
        spacingItems: ["code_inline"],
      });
    },
  },
  vite: {
    plugins: [
      llmstxt(),
      GitChangelog({
        repoURL: () => "https://github.com/TheGreatEclipse/Spinel.github.io",
      }),
      GitChangelogMarkdownSection({
        exclude: (id) => id.endsWith("index.md"),
        sections: { disableContributors: true },
      }),
      pagefindPlugin({
        customSearchQuery: chineseSearchOptimize,
      }),
    ],
    optimizeDeps: {
      exclude: [
        "@nolebase/vitepress-plugin-enhanced-readabilities/client",
        "@nolebase/vitepress-plugin-inline-link-preview/client",
        "vitepress",
        "@nolebase/ui",
      ],
    },
    ssr: {
      noExternal: [
        "@nolebase/vitepress-plugin-enhanced-readabilities",
        "@nolebase/vitepress-plugin-highlight-targeted-heading",
        "@nolebase/vitepress-plugin-inline-link-preview",
        "@nolebase/ui",
      ],
    },
  },
});