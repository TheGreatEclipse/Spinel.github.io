export default {
  lang: "zh-CN",
  description: "Spinel 文档",
  themeConfig: {
    nav: [
      { text: '<i class="ri-home-2-fill"></i> 主页', link: '/zh-Hans/' },
      { text: '<i class="ri-book-2-fill"></i> 指南', link: '/zh-Hans/guide/' },
    ],
    sidebar: {
      '/zh-Hans/guide/': [
        {
          text: '内核指南',
          items: [
            { text: 'GKI 闪存指南', link: '/zh-Hans/guide/gki-flash-guide' },
          ],
        },
        {
          text: 'MediaTek Bootloader 解锁',
          items: [
            { text: 'Windows', link: '/zh-Hans/guide/mtk-windows' },
            { text: 'Linux (Bash)', link: '/zh-Hans/guide/mtk-linux-bash' },
            { text: 'Linux (Fish)', link: '/zh-Hans/guide/mtk-linux-fish' },
          ],
        },
      ],
    },
    editLink: {
      text: '在 GitHub 上编辑此页面',
      pattern: 'https://github.com/yourusername/spinel-docs/edit/main/docs/:path',
    },
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    lastUpdated: {
      text: '最后更新于',
    },
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '外观',
    langMenuLabel: '切换语言',
    outline: {
      label: '本页目录',
    },
  },
};