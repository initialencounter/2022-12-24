<template>
  <k-layout>
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div>加载中...</div>
    </div>

    <div v-else-if="error" class="text-red-500 p-4 border border-red-300 rounded">
      加载服务器信息时出错: {{ error }}
    </div>

    <div v-else-if="servers.length === 0" class="text-gray-500 p-4">
      暂无服务器信息
    </div>

    <div v-else class="space-y-4">
      <div v-for="(server, index) in servers" :key="index" class="border rounded p-4">
        <div class="flex justify-between items-start">
          <h2 class="text-lg font-semibold">{{ server.name }}</h2>
          <span :class="getStatusClass(server.status)" class="px-2 py-1 rounded text-sm">
            {{ server.status }}
          </span>
        </div>

        <div class="mt-2">
          <div v-if="server.error" class="text-red-500 text-sm mb-2">
            错误: {{ server.error }}
          </div>

          <details class="mt-2">
            <summary class="cursor-pointer">配置信息</summary>
            <JsonViewer :value="JSON.parse(server.config)" copyable boxed sort theme="jv-light"/>
          </details>

          <details class="mt-2" open>
            <summary class="cursor-pointer">
              可用工具 ({{ server.tools?.length }})
            </summary>
            <div class="mt-2">
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div
                  v-for="(tool, toolIndex) in server.tools"
                  :key="toolIndex"
                  class="border rounded-lg p-3 hover:shadow-md transition-shadow bg-white"
                >
                  <div class="font-medium text-indigo-700">{{ tool.name }}</div>
                  <div class="text-sm text-gray-600 mt-1">{{ tool.description }}</div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </k-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { send } from '@koishijs/client'
import { McpServer } from '../src/shared/mcp'
import {JsonViewer} from "vue3-json-viewer"

declare module '@koishijs/plugin-console' {
  interface Events {
    'get-mcp-servers'(): McpServer[]
  }
}

const servers = ref<McpServer[]>([])
const loading = ref(true)
const error = ref(null)


send('get-mcp-servers').then(data => {
  servers.value = data
  loading.value = false
})

// 根据状态返回对应的CSS类
const getStatusClass = (status) => {
  switch(status.toLowerCase()) {
    case 'connected':
      return 'bg-green-100 text-green-800'
    case 'disconnected':
      return 'bg-red-100 text-red-800'
    case 'error':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>
