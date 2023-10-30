<template>
  <k-comment class="gocqhttp" v-if="data" :type="type">
    <p><a href="https://www.bilibili.com/video/BV15H4y1f7nu" style="color: yellowgreen;">登录教程</a>, 视频从1:44开始</p>
    <template v-if="data.status === 'offline'">
      <p>未连接到 go-cqhttp 子进程。</p>
    </template>
    <template v-else-if="data.status === 'error'">
      <p>{{ data.message }}</p>
    </template>
    <template v-else-if="data.status === 'init'">
      <p>正在创建 go-cqhttp 子进程……</p>
    </template>
    <template v-else-if="data.status === 'continue'">
      <p>账号登录中……</p>
    </template>
    <template v-else-if="data.status === 'success'">
      <p>已成功连接 go-cqhttp 子进程。</p>
    </template>
    <template v-else-if="data.status === 'qrcode'">
      <p>请使用手机登录 QQ 扫描二维码：</p>
      <img class="qrcode" :src="data.image" />
      <p v-if="data.message">{{ data.message }}</p>
    </template>
    <template v-else-if="data.status === 'captcha'">
      <p>请填写图中的内容：</p>
      <img :src="data.image" />
      <div class="action input">
        <el-input v-model="text"></el-input>
        <el-button type="primary" @click="submit(text)">提交</el-button>
      </div>
    </template>
    <template v-else-if="data.status === 'sms'">
      <p>请输入短信验证码：</p>
      <div class="action input">
        <el-input v-model="text"></el-input>
        <el-button type="primary" @click="submit(text)">提交</el-button>
      </div>
    </template>
    <template v-else-if="data.status === 'auto-or-manual'">
      <p>请选则提交 ticket 的方式:</p>
      <div class="action">
        <el-button type="primary" @click="choseGetTicketManual(true)">1. 自动提交</el-button>
        <el-button type="primary" style="background-color: green;" @click="choseGetTicketManual(false)">2. 手动提交</el-button>
      </div>
    </template>
    <template v-else-if="data.status === 'info'">
      <p>{{ data.message }}</p>
    </template>
    <template v-else-if="data.status === 'ticket'">
      <p>请前往该地址:</p>
      <textarea cols="60" rows="5">{{ (data.link).slice(11) }}</textarea>
      <br>
      <el-button type="primary" style="background-color: greenyellow;" @click.stop.prevent="copyToClipboard((data.link).slice(11))">复制到剪贴板</el-button>
      <p>手动获取 ticket <a style="color: aqua;" href="https://www.bilibili.com/video/BV1E94y1z7AK">（教程）</a></p>
      <p>请输入 ticket:</p>
      <div class="action input">
        <el-input v-model="text"></el-input>
        <el-button type="primary" @click="submit(text)">提交</el-button>
      </div>
    </template>
    <template v-else-if="data.status === 'sms-confirm'">
      <p>账号已开启设备锁。点击确认将向手机 {{ data.phone }} 发送短信验证码。</p>
      <div class="action">
        <el-button type="primary" @click="submit('')">确认</el-button>
      </div>
    </template>
    <template v-else-if="data.status === 'sms-or-qrcode'">
      <p>账号已开启设备锁。请选择验证方式：</p>
      <div class="action">
        <el-button type="primary" @click="submit('1')">1. 向手机 {{ data.phone }} 发送短信验证码</el-button>
        <el-button type="primary" @click="submit('2')">2. 使用手机登录 QQ 并扫码验证</el-button>
      </div>
    </template>
    <template v-else-if="data.status === 'slider-or-qrcode'">
      <p>登录需要滑条验证码。请选择验证方式：</p>
      <div class="action">
        <el-button type="primary" @click="submit('1')">1. 使用浏览器抓取滑条并登录</el-button>
        <el-button type="primary" @click="submit('2')">2. 使用手机登录 QQ 并扫码验证 (需要手机和 Koishi
          在同一网络下)</el-button>
      </div>
    </template>
    <template v-else-if="data.status === 'slider'">
      <p>请在 120 秒内完成下方的验证：</p>
      <iframe :src="data.link" height="280" width="300"></iframe>
    </template>

    <div class="action">
      <el-button type="primary" v-if="data.status === 'error' && data.link" @click="open(data.link)">前往验证</el-button>
      <el-button type="primary" v-if="data.device" @click="dialog = true">登录信息</el-button>

      <el-button type="primary" v-if="['offline', 'error'].includes(data.status)"
        @click="send('gocqhttp/start', sid)">重新启动</el-button>
      <el-button type="danger" v-else @click="send('gocqhttp/stop', sid)">断开连接</el-button>
    </div>
  </k-comment>

  <k-form v-if="sid" v-model="config" :initial="current.config" :schema="schema"></k-form>

  <el-dialog destroy-on-close v-model="dialog" title="登录信息">
    <el-input class="qdvc-input" :class="{ invalid }" v-model="data.device" type="textarea"
      :autosize="{ minRows: 10, maxRows: 10 }" :readonly="data.status === 'success'"></el-input>
    <template #footer>
      <template v-if="data.status !== 'success'">
        <el-button @click.stop.prevent="data.device = 'qdvc:'">清空登录信息</el-button>
        <el-button :disabled="invalid" @click.stop.prevent="saveDevice">保存登录信息</el-button>
      </template>
      <el-button @click.stop.prevent="copyToClipboard(data.device)">复制到剪贴板</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>

import { inject, computed, ref } from 'vue'
import { } from 'koishi-plugin-gocqhttp-dev'
import { Schema, store, send, message } from '@koishijs/client'

defineProps<{
  data: any
}>()

const local: any = inject('manager.settings.local')
const config: any = inject('manager.settings.config')
const current: any = inject('manager.settings.current')

const text = ref('')
const dialog = ref(false)

const sid = computed(() => {
  if (local.value.name !== 'koishi-plugin-adapter-onebot') return
  return `${config.value?.platform || 'onebot'}:${config.value?.selfId}`
})

const data = computed(() => {
  return store.gocqhttp?.[sid.value]
})

const type = computed(() => {
  if (!data.value) return
  if (data.value.status === 'init') return
  if (data.value.status === 'error') return 'error'
  if (data.value.status === 'success') return 'success'
  return 'warning'
})

const invalid = computed(() => {
  if (!data.value?.device?.startsWith('qdvc:')) return true
  const [device] = data.value.device.slice(5).split(',')
  if (device) {
    try {
      JSON.parse(atob(device))
    } catch {
      return true
    }
  }
})

interface Server {
  protocol: string
  disabled: boolean
  address: string
  middlewares: boolean
  postUrl?: string
  secret?: string
}

const Server: Schema = Schema.object({
  protocol: Schema.string().description("协议选择,正向ws， 反向ws-reverse").required(),
  disabled: Schema.boolean().required(true).description('是否停用'),
  address: Schema.string().required(true).description("地址,ws为0.0.0.0:端口号, ws-reverse为ws://ip:端口/path"),
  middlewares: Schema.boolean().required(true).description("引用默认中间件"),
})

const schema = Schema.object({
  gocqhttp: Schema.intersect([
    Schema.object({
      enabled: Schema.boolean().default(false).description('是否自动创建 go-cqhttp 子进程。'),
      password: Schema.string().role('secret').description('机器人的密码。'),
      qsignInlay: Schema.boolean().default(false).description('内置 qsign, 若未启用 @yunkuangao/qsign, 将无法启用 gocqhttp-dev'),
    }).description('go-cqhttp 基础设置'),
    Schema.object({
      heartBeatQsign: Schema.number().default(5000).description("自动检测 qsignServer 是否存活的时间间隔, 若 qsignServer 挂了, 将自动断开连接"),
      extensions: Schema.array(Server).description(`监听多个地址`)
    }).description('gocqhttp 进阶设置'),
  ])
})

function submit(text: string) {
  return send('gocqhttp/write', sid.value, text)
}

function open(url: string) {
  window.open(url, '_blank')
}

async function saveDevice() {
  await send('gocqhttp/device', sid.value, data.value.device)
  message.success('登录信息已保存')
  dialog.value = false
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
  message.success('已复制到剪贴板')
}

async function choseGetTicketManual(bol) {
  if (bol) {
    submit('1')
  } else {
    submit('2')
  }
  message.success(`已选择${bol ? "手动" : "自动"}获取ticket`)
  await send('gocqhttp/auto-or-manual' as any, bol)
}
</script>

<style lang="scss" scoped>
.gocqhttp {
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
