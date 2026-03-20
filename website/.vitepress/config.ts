import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'OBClipper',
  description: 'Clip web content to Obsidian with one click',
  head: [
    ['link', { rel: 'icon', href: '/logo.webp' }],
    ['script', { src: 'https://storage.ko-fi.com/cdn/widget/Widget_2.js', defer: '' }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Docs', link: '/guide/getting-started', activeMatch: '/guide/' },
          { text: 'Community Profiles', link: '/community' },
          { text: 'Download', link: '/download' },
        ],
        sidebar: {
          '/guide/': [
            {
              text: 'Guide',
              items: [
                { text: 'Getting Started', link: '/guide/getting-started' },
                { text: 'Profiles', link: '/guide/profiles' },
                { text: 'AI Chat', link: '/guide/ai-chat' },
                { text: 'Auto-link', link: '/guide/auto-link' },
                { text: 'Advanced', link: '/guide/advanced' },
              ],
            },
          ],
        },
      },
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '文档', link: '/zh/guide/getting-started', activeMatch: '/zh/guide/' },
          { text: '社区 Profiles', link: '/zh/community' },
          { text: '下载', link: '/zh/download' },
        ],
        sidebar: {
          '/zh/guide/': [
            {
              text: '指南',
              items: [
                { text: '快速开始', link: '/zh/guide/getting-started' },
                { text: 'Profiles 配置', link: '/zh/guide/profiles' },
                { text: 'AI 对话剪藏', link: '/zh/guide/ai-chat' },
                { text: '自动双链', link: '/zh/guide/auto-link' },
                { text: '高级功能', link: '/zh/guide/advanced' },
              ],
            },
          ],
        },
      },
    },
  },

  themeConfig: {
    logo: '/logo.webp',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Xheldon/OBClipper' },
    ],
  },
})
