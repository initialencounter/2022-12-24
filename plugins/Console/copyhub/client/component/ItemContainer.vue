<template>
  <div v-for="(data, id) in tmpData" :key="id" class="data-item">
    <div class="item-content">
      <div>
        <el-button
          class="mb4 el-button-bottom"
          @click="copyImageToClipboard(data)"
          ><el-icon><CopyDocument /></el-icon
        ></el-button>
        <el-button
          class="mb4 el-button-bottom"
          @click="removeItem(id as string)"
          type="danger"
          ><el-icon><Delete /></el-icon
        ></el-button>
      </div>
      <template v-if="isImage(data)">
        <img :src="data" alt="Image" fit="cover" />
      </template>
      <template v-else>
        <el-text class="mx-1" type="primary">{{ data }}</el-text>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { send } from "@koishijs/client";
import { copyImageToClipboard, isImage } from "../utils";
import { Delete, CopyDocument } from "@element-plus/icons-vue";

const tmpData = defineModel<{
  [key: string]: string;
}>({ required: true });

const removeItem = (id: string) => {
  // @ts-ignore
  send("copyhub-delete-data", id);
  delete tmpData.value[id];
};
</script>
<style scoped>
.data-container {
  display: flex;
  flex-wrap: wrap;
}
.data-item {
  border: 1px solid #eaeaea;
  border-radius: 8px;
  margin: 10px;
  padding: 10px;
  width: 200px;
  position: relative;
}
.item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.item-content img {
  max-width: 100%;
  border-radius: 5px;
}
.el-button-bottom {
  bottom: auto;
}
</style>
