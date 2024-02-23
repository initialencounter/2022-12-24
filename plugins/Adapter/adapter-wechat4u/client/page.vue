<template>
  <k-comment class="wechat4u" v-if="data" :type="type">
    <template v-if="data?.url === 'success'">
      <p>已成功接入 Wechat for you</p>
    </template>
    <template v-else-if="data?.url.startsWith('https://')">
      <p>请使用手机登录 Wechat 扫描二维码：</p>
      <iframe :src="data.url" height="258" width="258"></iframe>
    </template>
    <template v-else-if="data?.url === 'error'">
      <p>未知错误, 问题反馈: 399899914</p>
    </template>
    <p></p>
    <el-button type="primary" @click="refresh(true)">刷新</el-button>
    <p></p>
  </k-comment>
</template>

<script lang="ts" setup>

import { send, message } from '@koishijs/client'
import { inject, computed, ref } from 'vue'

declare module '@koishijs/plugin-console' {
  interface Events {
    'wechat4u/qrcode'(): { selfId: string, url: string }
  }
}

export interface Data {
  selfId: string
  url: string
}

defineProps<{
  data: any
}>()
const data = ref<Data>();
const local: any = inject('manager.settings.local')
const config: any = inject('manager.settings.config')

const refresh = (info:boolean=false) => {
  send('wechat4u/qrcode').then((res) => {
    if (local.value.name !== 'koishi-plugin-adapter-wechat4u') return
    if (config.value?.selfId !== res.selfId) return
    data.value = res
    if(info){
      message.success("刷新成功！")
    }
  })
}

const type = computed(() => {
  if (!data.value?.url) return
  if (data.value?.url === 'error') return 'error'
  if (data.value?.url === 'success') return 'success'
  return 'warning'
})

refresh()

const loop = setInterval(()=>{
  if(data.value.url === 'success'){
    clearInterval(loop)
  }
  refresh()
},1000)

</script>

<style lang="scss" scoped>
.wechat4u {
  img {
    display: block;
    margin: 1rem 0;
  }

  .qrcode {
    width: 200px;
    image-rendering: pixelated;
  }

  .link {
    position: absolute;
    margin: 1rem 0;
    line-height: 1.7;
    right: 0;
    margin-right: 1.5rem;
  }

  .action {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    margin: 1rem 0;

    &.input {
      gap: 1rem 1rem;
    }

    .el-input {
      width: 200px;
    }

    .el-button {
      display: inline-block;
      text-align: initial;
      height: auto;
      white-space: normal;
      padding: 4px 15px;
      line-height: 1.6;
    }

    .el-button+.el-button {
      margin-left: 0;
    }

    iframe {
      border: none;
    }
  }
}

.qdvc-input.invalid {
  :deep(textarea) {
    box-shadow: 0 0 0 1px var(--el-color-danger) inset;
  }
}
</style>
