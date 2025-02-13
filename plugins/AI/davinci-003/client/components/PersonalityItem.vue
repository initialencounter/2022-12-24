<template>
  <div class="personality-form">
    <el-form label-position="top" class="form-container">
      <el-form-item label="选择角色类型" class="form-item">
        <el-select
          v-model="personality.role"
          placeholder="请选择角色"
          size="large"
          class="full-width-select"
        >
          <el-option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
            class="role-option"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="对话内容" class="form-item">
        <el-input
          v-model="personality.content"
          placeholder="对话内容"
          type="textarea"
          :rows="4"
          resize="none"
          class="description-input"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>

const personality = defineModel<{
  role: string,
  content: string,
}>()

const options = [
  { value: 'system', label: 'system' },
  { value: 'user', label: 'user' },
  { value: 'assistant', label: 'assistant' },
]
</script>

<style scoped>
.personality-form {
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-item:deep(.el-form-item__label) {
  font-weight: 600;
  padding-bottom: 8px;
}

.full-width-select {
  width: 100%;
}

.description-input:deep(.el-textarea__inner) {
  font-size: 14px;
  line-height: 1.5;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.description-input:deep(.el-textarea__inner):hover {
  border-color: #409eff;
}

.role-option {
  padding: 8px 12px;
  transition: background 0.3s ease;
}

.role-option:hover {
  background: #6b6b6b;
}
</style>
