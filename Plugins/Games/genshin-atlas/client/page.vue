<template>
  <template v-if="data.type === 'str'">
    <p>{{ data.content }}</p>
  </template>
  <template v-if="data.type === 'bool'">
    <p>{{ data.content }}</p>
  </template>
  <template v-if="data.type === 'md'">
    <Markdown :source="data.content" class="markdown-inject"></Markdown>
  </template>
</template>

<script lang="ts" setup>

// 将 koishi-plugin-client 改为你的插件全称
import { } from '../lib/index'
import Markdown from 'marked-vue'
import { store } from '@koishijs/client'
import { inject, toRaw } from 'vue'

namespace Data {
  export type DataType = 'str' | 'bool' | 'md'
}


export interface Data {
  type: Data.DataType
  content: string
}

defineProps<{
  data: any
}>()
const current: any = inject('manager.settings.current')

const data: Data = (() => {

  // 判断插件配置页面的逻辑
  const plgNanme = toRaw(current._value)["name"]
  // 将 client 改为你想要显示的插件页面
  if (plgNanme !== "genshin-atlas") return
  return toRaw(store.genshinatlas)
})()
</script>

<style>
.markdown-inject {
  background: linear-gradient(to bottom, #97e5cb, #924ed7, #92c9d4);
  border-radius: 0.5rem 0.5rem 0.5rem 0.5rem;
}
</style>