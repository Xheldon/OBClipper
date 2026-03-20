<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import KofiButton from './components/KofiButton.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <KofiButton />
    </template>
  </Layout>
</template>
