<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  profile: {
    name: string
    description?: string
    urlPatterns?: string[]
    autoMatch?: boolean
    selectors: { name: string; selector: string; transform?: string; attr?: string; attachment?: boolean }[]
    template: string
    vaultPath: string
    attachmentPath?: string
  }
  extensionId: string
}>()

const emit = defineEmits<{
  toast: [msg: string, type: 'success' | 'error']
}>()

const showPreview = ref(false)

// Extension ID — will be set to the real one after publishing
const EXTENSION_ID = props.extensionId

function importProfile() {
  const data = {
    name: props.profile.name,
    autoMatch: props.profile.autoMatch ?? false,
    urlPatterns: props.profile.urlPatterns || [],
    selectors: props.profile.selectors,
    template: props.profile.template,
    vaultPath: props.profile.vaultPath,
    attachmentPath: props.profile.attachmentPath || '',
  }

  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { type: 'importProfile', profile: data },
        (response) => {
          if (response?.ok) {
            emit('toast', `"${props.profile.name}" imported!`, 'success')
          } else {
            emit('toast', 'Import failed. Is OBClipper installed?', 'error')
          }
        }
      )
    } else {
      emit('toast', 'Please open this page in Chrome with OBClipper installed.', 'error')
    }
  } catch {
    emit('toast', 'Import failed. Is OBClipper installed?', 'error')
  }
}
</script>

<template>
  <div class="profile-card">
    <div class="profile-card-name">{{ profile.name }}</div>
    <div v-if="profile.description" class="profile-card-desc">{{ profile.description }}</div>
    <div v-if="profile.urlPatterns?.length" class="profile-card-urls">
      <span v-for="url in profile.urlPatterns" :key="url" class="profile-card-url">{{ url }}</span>
    </div>
    <div class="profile-card-actions">
      <button class="btn-import" @click="importProfile">+ Import to OBClipper</button>
      <button class="btn-preview" @click="showPreview = !showPreview">
        {{ showPreview ? 'Hide' : 'Preview' }}
      </button>
    </div>
    <div v-if="showPreview" style="margin-top: 14px;">
      <pre style="font-size: 12px; overflow-x: auto; padding: 12px; border-radius: 8px; background: var(--vp-c-bg-alt); border: 1px solid var(--vp-c-divider);">{{ JSON.stringify(profile, null, 2) }}</pre>
    </div>
  </div>
</template>
