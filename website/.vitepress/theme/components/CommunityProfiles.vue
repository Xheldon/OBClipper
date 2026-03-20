<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useData } from 'vitepress'
import ProfileCard from './ProfileCard.vue'

const { lang } = useData()

const profiles = ref<any[]>([])
const search = ref('')
const showSubmit = ref(false)
const submitJson = ref('')
const toast = ref<{ msg: string; type: 'success' | 'error' } | null>(null)

// TODO: replace with actual extension ID after publishing
const EXTENSION_ID = 'your-extension-id'

const isZh = computed(() => lang.value === 'zh-CN')
const fileInput = ref<HTMLInputElement | null>(null)

const i18n = computed(() => isZh.value ? {
  search: '搜索 Profile...',
  submit: '提交我的 Profile',
  importBtn: '+ 导入到 OBClipper',
  preview: '预览',
  hide: '隐藏',
  submitTitle: '提交你的 Profile',
  submitDesc: '选择从插件导出的 Profile JSON 文件，或直接粘贴 JSON 内容。点击提交后会跳转到 GitHub 创建 Issue，经审核后会添加到社区集合中。',
  submitPlaceholder: '粘贴你的 Profile JSON...',
  uploadBtn: '选择 JSON 文件',
  orText: '或',
  cancel: '取消',
  submitBtn: '提交到 GitHub',
  noResults: '未找到匹配的 Profile',
  importSuccess: '已导入！',
  importFail: '导入失败，请确认已安装 OBClipper。',
  chromeOnly: '请在安装了 OBClipper 的 Chrome 浏览器中打开此页面。',
} : {
  search: 'Search profiles...',
  submit: 'Submit My Profile',
  importBtn: '+ Import to OBClipper',
  preview: 'Preview',
  hide: 'Hide',
  submitTitle: 'Submit Your Profile',
  submitDesc: 'Select a Profile JSON file exported from the extension, or paste JSON content directly. Clicking submit will open a GitHub Issue. After review, it will be added to the community collection.',
  submitPlaceholder: 'Paste your Profile JSON here...',
  uploadBtn: 'Choose JSON File',
  orText: 'or',
  cancel: 'Cancel',
  submitBtn: 'Submit to GitHub',
  noResults: 'No matching profiles found',
  importSuccess: 'imported!',
  importFail: 'Import failed. Is OBClipper installed?',
  chromeOnly: 'Please open this page in Chrome with OBClipper installed.',
})

function handleFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result as string)
      submitJson.value = JSON.stringify(parsed, null, 2)
    } catch {
      submitJson.value = reader.result as string
    }
  }
  reader.readAsText(file)
  // reset so the same file can be selected again
  if (fileInput.value) fileInput.value.value = ''
}

const filtered = computed(() => {
  if (!search.value) return profiles.value
  const q = search.value.toLowerCase()
  return profiles.value.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.description || '').toLowerCase().includes(q) ||
    (p.urlPatterns || []).some((u: string) => u.toLowerCase().includes(q))
  )
})

onMounted(async () => {
  try {
    const res = await fetch('/profiles.json')
    profiles.value = await res.json()
  } catch {
    profiles.value = []
  }
})

function handleToast(msg: string, type: 'success' | 'error') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3000)
}

function submitProfile() {
  const json = submitJson.value.trim()
  if (!json) return

  const title = encodeURIComponent('Community Profile Submission')
  const body = encodeURIComponent(`## Profile JSON\n\n\`\`\`json\n${json}\n\`\`\`\n\n## Notes\n\n(Optional: describe what this profile is for)`)
  const url = `https://github.com/Xheldon/OBClipper/issues/new?title=${title}&body=${body}&labels=community-profile`
  window.open(url, '_blank')
  showSubmit.value = false
  submitJson.value = ''
}
</script>

<template>
  <div>
    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
      <input
        v-model="search"
        :placeholder="i18n.search"
        style="flex: 1; padding: 8px 14px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); font-size: 14px;"
      />
      <button class="btn-import" @click="showSubmit = true">{{ i18n.submit }}</button>
    </div>

    <div v-if="filtered.length" class="profile-grid">
      <ProfileCard
        v-for="(p, idx) in filtered"
        :key="idx"
        :profile="p"
        :extension-id="EXTENSION_ID"
        @toast="handleToast"
      />
    </div>
    <div v-else style="text-align: center; color: var(--vp-c-text-3); padding: 40px 0;">
      {{ i18n.noResults }}
    </div>

    <!-- Submit modal -->
    <div v-if="showSubmit" class="modal-overlay" @click.self="showSubmit = false">
      <div class="modal-box">
        <div class="modal-title">{{ i18n.submitTitle }}</div>
        <div class="modal-desc">{{ i18n.submitDesc }}</div>
        <div class="upload-area">
          <input
            ref="fileInput"
            type="file"
            accept=".json,application/json"
            style="display: none"
            @change="handleFileUpload"
          />
          <button class="btn-upload" @click="fileInput?.click()">{{ i18n.uploadBtn }}</button>
          <span class="upload-or">{{ i18n.orText }}</span>
        </div>
        <textarea
          v-model="submitJson"
          class="modal-textarea"
          :placeholder="i18n.submitPlaceholder"
        ></textarea>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showSubmit = false">{{ i18n.cancel }}</button>
          <button class="btn-submit" @click="submitProfile">{{ i18n.submitBtn }}</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast" :class="['import-toast', toast.type]">
      {{ toast.msg }}
    </div>
  </div>
</template>
