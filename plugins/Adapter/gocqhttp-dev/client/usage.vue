<template>
  <template v-if="data">
    <h1>插件文档：</h1>
    <details>
      <Markdown :source="data.message" class="markdown-inject"></Markdown>
    </details>

  </template>
</template>

<script lang="ts" setup>
import { } from 'koishi-plugin-gocqhttp-dev'
import { store } from '@koishijs/client'
import { inject, computed, toRaw } from 'vue'
import Markdown from 'marked-vue'

defineProps<{
  data: any
}>()

const current: any = inject('manager.settings.current')
const data = computed(() => {
  const plgNanme = toRaw(current._value).label
  if (plgNanme !== "gocqhttp-dev") return
  return toRaw(store.gocqhttp["usage"])
})

</script>
<style>
.markdown-inject {
  background-color: rgb(51, 124, 50);
  border-radius: 0.5rem 0.5rem 0.5rem 0.5rem;
}
</style>