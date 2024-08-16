<template>
  <template v-if="show">
    <h1 class="davinci-003-title">插件文档（本地）：</h1>
    <details>
      <k-markdown :source="mdData" ></k-markdown>
    </details>
    <h1 class="davinci-003-title">插件文档（云端）：</h1>
    <details>
      <iframe src="https://initialencounter.github.io/doc/docs/KoishiPlugins/AI/davinci-003" width="800px"
        height="600px"></iframe>
    </details>
    <h1 class="davinci-003-title">ChatGPT</h1>
    <input placeholder="测试" placeholder-style="color:red;font-size:28rpx" class="davinci-003-input"
      v-model="input_text">
    <p> </p>
    <Markdown v-if="!failed" :source="credit_text"></Markdown>
    <k-button v-if="!clicked" class="davinci-003-search" @click="chatTest">Chat</k-button>
  </template>
</template>

<script lang="ts" setup>

// 将 koishi-plugin-client 改为你的插件全称
import { send, message } from '@koishijs/client';
import { } from '../lib/index'
import { ref, inject } from "vue";
import Markdown from 'marked-vue'

const clicked = ref<boolean>(false);
const input_text = ref<string>();
const credit_text = ref<string>();
const proxy = ref<string>();
const failed = ref<boolean>();
const mdData = ref<string>();
const show = ref<boolean>();
input_text.value = '';
credit_text.value = "";
proxy.value = "";
show.value = false;

declare module '@koishijs/plugin-console' {
  interface Events {
    'davinci-003/getusage'(): string
    'davinci-003/chatTest'(text:string): Promise<string>
  }
}

const local: any = inject('manager.settings.local')

show.value = (() => {
  // 判断插件配置页面的逻辑
  if (local.value.name !== 'koishi-plugin-davinci-003') return false
  // 将 client 改为你想要显示的插件页面
  return true
})()

async function chatTest() {
  clicked.value = true
  failed.value = true
  message.success('测试中，请稍等~')
  await send('davinci-003/chatTest', input_text.value).then((res) => {
    if(res===''){
      failed.value = true
      credit_text.value = `测试失败，请检查 key 和 baseURL 是否正确`
      message.error('测试失败，请检查 key 和 baseURL 是否正确')
      return
    }
    failed.value = false
    message.success('测试成功')
    credit_text.value = res
    clicked.value = false
  })
}

send('davinci-003/getusage').then((res)=>{
  mdData.value = res
})
</script>

<style>
.davinci-003-search {
  font-size: 1.5rem;
  color: #fff;
  background-color: #aaf;
  width: 33rem;
  height: 3rem;
  border-radius: 0.3rem 0.3rem 0.3rem 0.3rem;
}
.davinci-003-input::-webkit-input-placeholder {
  /* placeholder颜色 */
  color: #555555;
  /* placeholder字体大小 */
  font-size: 1.5rem;
}

.davinci-003-input {
  width: 32.5rem;
  height: 3rem;
  border-radius: 0.3rem 0.3rem 0.3rem 0.3rem;
  background-color: #fff;
  font-size: 1.5rem;
  color: #555555;
}

.davinci-003-search:hover {
  background-color: #88f;
}
</style>
