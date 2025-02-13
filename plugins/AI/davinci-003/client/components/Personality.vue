<template>
  <div class="personality-editor">
    <div class="header">
      <el-input
        v-model="personality.name"
        placeholder="请输入人格名称"
        class="name-input"
        size="large"
      />
    </div>

    <div class="item-list">
      <div
        v-for="(_item, index) in personality.personality"
        :key="index"
        class="item-card"
      >
        <PersonalityItem
          v-model="personality.personality[index]"
          class="item-content"
        />
        <el-button
          class="delete-btn"
          type="danger"
          :icon="Delete"
          circle
          @click="deleteItem(index)"
        />
        <el-button
          type="primary"
          @click="addItem(index)"
          class="add-button"
        >
          <el-icon><Plus />+ 添加项目</el-icon>
        </el-button>
        <el-button
          type="success"
          @click="emit('save')"
          class="save-button"
        >
          保存
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineEmits } from 'vue';
import PersonalityItem from "./PersonalityItem.vue";
import type { PersonalityConfig } from "../types";
import { Delete } from "@element-plus/icons-vue";
import { message } from "@koishijs/client";

const emit = defineEmits<{
  (e: "save"): void
}>()

const personality = defineModel<PersonalityConfig>()

function addItem(index: number) {
  personality.value.personality.splice(index + 1, 0, {
    role: "assistant",
    content: "",
  });
}

function deleteItem(index: number) {
  if (personality.value.personality.length == 1) {
    message.error("至少需要保留一个项目")
    return
  }
  personality.value.personality.splice(index, 1);
}
</script>

<style scoped>
.personality-editor {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.name-input {
  flex: 1;
}

.name-input :deep(.el-input__inner) {
  border-radius: 8px;
  height: 48px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-card {
  position: relative;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: box-shadow 0.3s;
}

.item-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.delete-btn {
  position: absolute;
  right: -10px;
  top: -10px;
  width: 32px;
  height: 32px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.add-button {
  position: absolute;
  right: 40px;
  top: -10px;
  width: 100px;
  height: 32px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.save-button {
  position: absolute;
  right: 160px;
  top: -10px;
}

.delete-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.item-content {
  margin-right: 24px;
}
</style>
