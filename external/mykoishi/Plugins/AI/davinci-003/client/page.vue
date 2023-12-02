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
    <h1 class="davinci-003-title">查询 ChatGPTAPI 余额</h1>
    <p v-if="failed === 'true'" style="color:red" class="davinci-003-credit">{{ credit_text }}</p>
    <p v-if="failed === 'false'" style="color:green" class="davinci-003-credit">{{ credit_text }}</p>
    <p> </p>
    <input placeholder="请输入以sk-开头的key..." placeholder-style="color:red;font-size:28rpx" class="davinci-003-input"
      v-model="input_text">
    <p> </p>
    <k-button class="davinci-003-serch" @click="get_credit">查询</k-button>
  </template>
</template>

<script lang="ts" setup>

// 将 koishi-plugin-client 改为你的插件全称
import { send } from '@koishijs/client';
import { } from '../lib/index'
import { ref } from "vue";


const input_text = ref<string>();
const credit_text = ref<string>();
const proxy = ref<string>();
const failed = ref<string>();
const mdData = ref<string>();
const show = ref<boolean>();
input_text.value = '';
credit_text.value = "";
proxy.value = "";
show.value = false;

declare module '@koishijs/plugin-console' {
  interface Events {
    'davinci-003/getproxy'(): string
    'davinci-003/getusage'(): string
    'davinci-003/getcredit'(key: string): Promise<number>
  }
}


show.value = (() => {
  // 判断插件配置页面的逻辑
  const pageUrl = window.location.href
  if (pageUrl.indexOf('davinci-003') === -1) return false
  // 将 client 改为你想要显示的插件页面
  return true
})()

async function get_credit() {
  if (!input_text.value) return
  const res = await send('davinci-003/getcredit', input_text.value)
  if (res === -1) {
    failed.value = 'true'
    credit_text.value = `查询失败，请检查key是否正确`
    return
  }
  failed.value = 'false'
  credit_text.value = `当前余额：${res}`
}

send('davinci-003/getusage').then((res)=>{
  mdData.value = res
})
send('davinci-003/getcredit', '').then((res) => {
  if (res === -1) {
    failed.value = 'true'
    credit_text.value = `查询失败，请检查key是否正确`
    return
  } else {
    failed.value = 'false'
    credit_text.value = `当前余额：${res}$`
  }
})

</script>

<style>
.davinci-003-credit {
  font-size: 1.5rem;
  color: #3e3d3d;
  margin: 0 0 0 0;
  padding: 0 0 0 0;
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

.davinci-003-serch {
  font-size: 1.5rem;
  color: #fff;
  background-color: #aaf;
  width: 33rem;
  height: 3rem;
  border-radius: 0.3rem 0.3rem 0.3rem 0.3rem;
}
</style>