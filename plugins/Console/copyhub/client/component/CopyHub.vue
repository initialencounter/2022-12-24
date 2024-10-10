<template>
  <div class="copyhub-layout">
    <div class="data-container">
      <ItemContainer v-model="tmpData" />
      <div class="data-item">
        <div>
          <input
            @change="uploadFile"
            type="file"
            ref="fileInput"
            style="display: none"
          />
          <el-button @click="uploadFileClick">拖拽或点击上传</el-button>
        </div>
        <div>
          <el-button @click="pushClipContent">Push</el-button>
          <el-button @click="textarea = ''">Clear</el-button>
        </div>
        <el-input
          v-model="textarea"
          :rows="2"
          type="textarea"
          placeholder="Please input"
        />
        <div>
          <el-text class="mx-1" type="primary">{{ tmpData.content }}</el-text>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { send } from "@koishijs/client";
import { ref, onMounted } from "vue";
import { convertFileToBase64 } from "../utils";
import { dragenterEvent, dragleaveEvent, dragoverEvent } from "../drag";
import ItemContainer from "./ItemContainer.vue";

const tmpData = ref<{
  [key: string]: string;
}>({});
const textarea = ref<string>("");
const fileInput = ref(null);

async function dropEvent(event: DragEvent) {
  event.stopPropagation();
  event.preventDefault();
  const files = event.dataTransfer!.files;
  for (let i = 0; i < files.length; i++) {
    await postFile(files[i]);
  }
}

const uploadFileClick = async () => {
  fileInput.value.click();
};
const uploadFile = async () => {
  const files = fileInput.value.files;
  if (files && files.length) {
    await postFile(files[0]);
  }
};

async function postFile(file: File) {
  const base64Url: string = await convertFileToBase64(file);
  if (base64Url) {
    // @ts-ignore
    const timeStamp = Date.now().toString();
    tmpData.value[timeStamp] = base64Url;
    // @ts-ignore
    send("copyhub-add-data", timeStamp, base64Url);
  }
}

async function pushClipContent() {
  const timeStamp = Date.now().toString();
  const clipboardItem = await navigator.clipboard.read();
  if (textarea.value === "" && clipboardItem) {
    for (let i = 0; i < clipboardItem.length; i++) {
      const item = clipboardItem[i];
      if (item.types[0].includes("image")) {
        const blob =
          (await item.getType("image/png")) ??
          (await item.getType("image/jpeg")) ??
          (await item.getType("image/gif")) ??
          (await item.getType("image/webp")) ??
          (await item.getType("image/svg+xml")) ??
          (await item.getType("image/bmp")) ??
          (await item.getType("image/tiff")) ??
          (await item.getType("image/x-icon")) ??
          (await item.getType("image/vnd.microsoft.icon")) ??
          (await item.getType("image/vnd.wap.wbmp")) ??
          (await item.getType("image/vnd.adobe.photoshop")) ??
          (await item.getType("image/vnd.dwg")) ??
          (await item.getType("image/vnd.dxf")) ??
          (await item.getType("image/vnd.fpx")) ??
          (await item.getType("image/vnd.net-fpx")) ??
          (await item.getType("image/vnd.rn-realpix")) ??
          (await item.getType("image/vnd.wap.wbmp")) ??
          (await item.getType("image/vnd.xiff")) ??
          (await item.getType("image/vnd.zbrush.pcx"));
        const base64Url = await convertFileToBase64(blob);
        if (base64Url) {
          tmpData.value[timeStamp] = base64Url;
          // @ts-ignore
          send("copyhub-add-data", timeStamp, base64Url);
        }
      } else if (item.types[0].includes("text")) {
        const text = await navigator.clipboard.readText();
        if (text) {
          tmpData.value[timeStamp] = text;
          // @ts-ignore
          send("copyhub-add-data", timeStamp, text);
        }
      }
    }
    return;
  }
  tmpData.value[timeStamp] = textarea.value;
  // @ts-ignore
  send("copyhub-add-data", timeStamp, textarea.value);
}

const url = location.origin + "/copyhub-get-data";
onMounted(async () => {
  document.ondragover = dragoverEvent;
  document.ondragenter = dragenterEvent;
  document.ondragleave = dragleaveEvent;
  document.ondrop = dropEvent;
  const res = await fetch(url);
  if (!res.ok) {
    return;
  }
  const data = await res.json();
  tmpData.value = data;
});
</script>
<style scoped>
.copyhub-layout {
  overflow: auto;
  padding: 1rem;
  position: relative;
  height: 100%;
  width: 100%;
}
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
