export default {
  lang: "en",
  description: "Spinel Documentation",
  themeConfig: {
    nav: [
      { text: '<i class="ri-home-2-fill"></i> Home', link: '/' },
      { text: '<i class="ri-book-2-fill"></i> Guide', link: '/guide/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Kernel Guide',
          items: [
            { text: 'GKI Flash Guide', link: '/guide/gki-flash-guide' },
          ],
        },
        {
          text: 'MediaTek Bootloader Unlock',
          items: [
            { text: 'Windows', link: '/guide/mtk-windows' },
            { text: 'Linux (Bash)', link: '/guide/mtk-linux-bash' },
            { text: 'Linux (Fish)', link: '/guide/mtk-linux-fish' },
          ],
        },
      ],
    },
    editLink: {
      text: 'Edit page on GitHub',
      pattern: 'https://github.com/yourusername/spinel-docs/edit/main/docs/:path',
    },
    docFooter: {
      prev: 'Previous page',
      next: 'Next page',
    },
    lastUpdated: {
      text: 'Last updated',
    },
    returnToTopLabel: 'Return to top',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Appearance',
    langMenuLabel: 'Change language',
  },
};