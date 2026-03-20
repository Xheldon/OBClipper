<script setup lang="ts">
import { onMounted } from 'vue'

function initKofi() {
  const w = (window as any)
  if (w.kofiwidget2) {
    w.kofiwidget2.init('Support me on Ko-fi', '#9273f5', 'K3K01C2NWU')
    const el = document.getElementById('kofi-widget-container')
    if (el) {
      el.innerHTML = w.kofiwidget2.getHTML()
    }
    return
  }
  // SDK not loaded yet, wait for it
  const script = document.querySelector('script[src*="ko-fi"]') as HTMLScriptElement | null
  if (script) {
    script.addEventListener('load', initKofi)
  }
}

onMounted(initKofi)
</script>

<template>
  <span id="kofi-widget-container" class="kofi-nav-btn"></span>
</template>

<style>
.kofi-nav-btn {
  display: inline-flex;
  align-items: center;
}

.kofi-nav-btn .btn-container {
  display: inline-flex !important;
}

.kofi-nav-btn .kofi-button {
  font-size: 13px !important;
  padding: 4px 12px !important;
  border-radius: 8px !important;
  line-height: 1.4 !important;
}

.kofi-nav-btn .kofitext {
  font-size: 13px !important;
  letter-spacing: 0 !important;
}

.kofi-nav-btn .kofi-button img.kofiimg {
  height: 16px !important;
}
</style>
