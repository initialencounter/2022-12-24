<template>
  <k-layout>
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div>加载中...</div>
    </div>

    <div v-else-if="error" class="text-red-500 p-4 border border-red-300 rounded">
      加载服务器信息时出错: {{ error }}
    </div>

    <div v-else-if="servers.length === 0" class="text-gray-500 p-4">
      暂无服务器信息(在工作目录下创建 .mcp.json 并配置 mcpServers 后重载插件)
    </div>

    <div v-else class="space-y-4">
      <div v-for="(server, index) in servers" :key="index" class="border rounded p-4">
        <div class="flex justify-between items-start">
          <h2 class="text-lg font-semibold">
            {{ server.name }}
            <span v-if="server.disabled" class="text-sm text-gray-400">(已禁用)</span>
          </h2>
          <span :class="getStatusClass(server.status)" class="px-2 py-1 rounded text-sm">
            {{ server.status }}
          </span>
        </div>

        <div class="mt-2">
          <div v-if="server.lastError" class="text-red-500 text-sm mb-2">
            错误: {{ server.lastError }}
          </div>

          <div class="text-sm text-gray-600">
            工具数量: {{ server.toolCount }}
          </div>

          <details v-if="server.metadata" class="mt-2">
            <summary class="cursor-pointer">元数据</summary>
            <JsonViewer :value="server.metadata" copyable boxed sort theme="jv-light"/>
          </details>
        </div>
      </div>
    </div>
  </k-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { send } from '@koishijs/client'
import type { McpServerSnapshot } from '@cline/core'
import { JsonViewer } from "vue3-json-viewer"

declare module '@koishijs/plugin-console' {
  interface Events {
    'get-mcp-servers'(): readonly McpServerSnapshot[]
  }
}

const servers = ref<readonly McpServerSnapshot[]>([])
const loading = ref(true)
const error = ref(null)

send('get-mcp-servers').then(data => {
  servers.value = data
  loading.value = false
}).catch(err => {
  error.value = String(err)
  loading.value = false
})

// 根据状态返回对应的CSS类
const getStatusClass = (status: string) => {
  switch(status.toLowerCase()) {
    case 'connected':
      return 'bg-green-100 text-green-800'
    case 'connecting':
      return 'bg-yellow-100 text-yellow-800'
    case 'disconnected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>
