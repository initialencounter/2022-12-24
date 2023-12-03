<template>
  <k-comment class="wechat4u" v-if="data">
    <template v-for="(bot, botid) in data">
      <p class="bot-guardiany-avatar"><img :src="bot.avatar" />{{ bot.name }}</p>
    </template>
    <p></p>
    <el-button type="primary" @click="refresh()">刷新</el-button>
    <p></p>
  </k-comment>
</template>

<script lang="ts" setup>

import { send, message } from '@koishijs/client'
import { inject, computed, ref } from 'vue'

declare module '@koishijs/plugin-console' {
  interface Events {
    'wechat4u/qrcode'(): Data
  }
}

export interface Bot {
  name: string
  status: number
  avatar?: string
}

export interface Data {
  selfId: string
  bots: Bot[]
}

defineProps<{
  data: any
}>()
const data = ref<Bot[]>();
const local: any = inject('manager.settings.local')
const config: any = inject('manager.settings.config')

const refresh = () => {
  send('wechat4u/qrcode').then((res) => {
    if (local.value.name !== 'koishi-plugin-bot-guardian') return
    console.log("111111111111111",res.selfId,config.value?.selfId)
    if (config.value?.selfId !== res.selfId) return
    data.value = res.bots
    message.success("刷新成功！")
  })
}


refresh()


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
.bot-guardiany-avatar {
    display: flex;
    gap: 0.25rem;

    img {
        height: 1.5rem;
        width: 1.5rem;
        border-radius: 100%;
        vertical-align: middle;
    }
}
</style>
