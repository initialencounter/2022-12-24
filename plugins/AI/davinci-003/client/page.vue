<template>
  <template v-if="show">
    <div class="davinci-container">
      <!-- 文档部分 -->
      <section class="doc-section">
        <h2 class="section-title">📚 文档中心</h2>
        <div class="doc-group">
          <details class="doc-card">
            <summary class="doc-summary">本地文档 ·点我展开· 👈</summary>
            <div class="doc-content">
              <k-markdown :source="mdData"></k-markdown>
            </div>
          </details>
          <details class="doc-card">
            <summary class="doc-summary">云端文档 ·点我展开· 👈</summary>
            <div class="doc-iframe-container">
              <iframe
                src="https://initialencounter.github.io/doc/docs/KoishiPlugins/AI/davinci-003"
                class="doc-iframe"
                title="云端文档"
              ></iframe>
            </div>
          </details>
        </div>
      </section>

      <!-- 测试交互区 -->
      <section class="chat-section">
        <h2 class="section-title">🤖 ChatGPT 测试</h2>

        <div class="input-group">
          <input
            v-model="input_text"
            placeholder="输入测试内容..."
            class="chat-input"
          >
          <k-button
            v-if="!clicked"
            @click="chatTest"
            class="chat-button"
          >
            {{ credit_text ? '重新测试' : '开始测试' }}
          </k-button>
        </div>

        <transition name="fade">
          <div v-if="credit_text" class="result-box">
            <Markdown v-if="!failed" :source="credit_text"></Markdown>
            <div v-else class="error-message">
              ⚠️ 测试失败，请检查 key 和 baseURL 是否正确
            </div>
          </div>
        </transition>
      </section>

      <!-- 人格管理 -->
      <section class="personality-section">
        <div class="personality-header">
          <h2 class="section-title">🎭 在线添加人格</h2>
        </div>
        <Personalities v-model="personality" @save="savePersonality" />
      </section>
    </div>
  </template>
</template>

<script lang="ts" setup>

// 将 koishi-plugin-client 改为你的插件全称
import { send, message } from '@koishijs/client';
import { } from '../lib/index'
import { ref, inject } from "vue";
import Markdown from 'marked-vue'
import Personalities from './components/Personality.vue'
import type { PersonalityConfig, Personality } from "./types";

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
    'davinci-003/addPersonality'(personality: PersonalityConfig): Promise<string>
  }
}

const local: any = inject('manager.settings.local')
const personality = ref<PersonalityConfig>({
  name: '',
  personality: [{
    role: 'system',
    content: '你是我的全AI助理'
  }],
});

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

async function savePersonality() {
  try {
    const tmpConfig: PersonalityConfig = personality.value;
    let res = await send("davinci-003/addPersonality", tmpConfig);
    if (tmpConfig.name === "") {
      message.error("人格名称不能为空");
      return;
    }
    if (tmpConfig.personality.length === 0) {
      message.error("人格内容不能为空");
      return;
    }
    if (res === "success") {
      message.success("人格添加成功");
    } else {
      message.error("人格添加失败: " + res);
    }
  } catch (error) {
    message.error("人格添加失败: " + error);
  }
}
send('davinci-003/getusage').then((res)=>{
  mdData.value = res
})
</script>

<style>
.davinci-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

.section-title {
  font-size: 1.5rem;
  margin: 2rem 0 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e0e0;
}

/* 文档区域样式 */
.doc-group {
  display: grid;
  gap: 1.5rem;
}

.doc-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.doc-summary {
  padding: 1rem 1.5rem;
  cursor: pointer;
  list-style: none;
  font-weight: 500;
  transition: background 0.2s;
}

.doc-summary:hover {
  background: #e9ecef;
}

.doc-content {
  padding: 1.5rem;
}

.doc-iframe-container {
  position: relative;
  padding-top: 56.25%; /* 16:9 比例 */
  height: 0;
}

.doc-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* 聊天测试区域 */
.chat-section {
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.input-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.chat-input {
  flex: 1;
  padding: 0.8rem 1.2rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.chat-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52,152,219,0.1);
}

.chat-button {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  transition: transform 0.2s, opacity 0.2s;
}

.chat-button:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.result-box {
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-top: 1rem;
}

.error-message {
  color: #e74c3c;
  font-weight: 500;
}

/* 人格管理 */
.personality-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.personality-button {
  background: linear-gradient(135deg, #2ecc71, #27ae60) !important;
  border: none !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .davinci-container {
    padding: 1rem;
  }

  .input-group {
    flex-direction: column;
  }

  .chat-button {
    width: 100%;
  }
}
</style>
