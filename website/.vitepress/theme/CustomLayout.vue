<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { computed } from 'vue'
import { useData } from 'vitepress'
import KofiButton from './components/KofiButton.vue'

const { Layout } = DefaultTheme
const { lang } = useData()
const isZh = computed(() => lang.value === 'zh-CN')
</script>

<template>
  <Layout>
    <template #layout-bottom>
      <footer class="site-footer">
        <div class="footer-kofi">
          <KofiButton />
        </div>
        <div class="footer-links">
          <span class="footer-links-label">{{ isZh ? '友情链接' : 'Links' }}</span>
          <a href="https://obsidian.md" target="_blank">Obsidian</a>
          <a href="https://github.com/coddingtonbear/obsidian-local-rest-api" target="_blank">Local REST API</a>
          <a href="https://github.com/nicehash/defuddle" target="_blank">Defuddle</a>
        </div>
        <div class="footer-copy">
          &copy; {{ new Date().getFullYear() }} OBClipper
        </div>
      </footer>
    </template>
  </Layout>
</template>
