import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import CommunityProfiles from './components/CommunityProfiles.vue'
import CustomLayout from './CustomLayout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: CustomLayout,
  enhanceApp({ app }) {
    app.component('CommunityProfiles', CommunityProfiles)
  },
} satisfies Theme
