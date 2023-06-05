<template>
  <div
    class="blockly-registry-container"
    :style="{ 'pointer-events': isDisabled ? 'none' : 'auto' }"
  >
    <div class="blockly-registry-container-play">
      <p class="blockly-registry-container_words-play" :text="cloud_text">
        {{ cloud_text }}
      </p>
    </div>
    <div class="blockly-registry-title" id="arktitle">
      blocky插件镜像站
      <div style="display: flex">
        <span class="blockly-registry-mode-select" @click="openSw">
          <span v-if="!upload_mode">
            <img style="width: 4rem" src="./images/yunduanxiazai.png" />
            <span>下载</span>
          </span>
          <span v-if="upload_mode">
            <img style="width: 4rem" src="./images/yunduanshangchuan.png" />
            <span>上传</span>
          </span>
        </span>
        <span @click="refresh_market" class="blockly-registry-refresh-market">
          <img style="width: 4rem" src="./images/shuaxin.png" />
          <span>刷新🌟</span>
        </span>
        <span @click="search" class="blockly-registry-refresh-market">
          <img style="width: 4rem" src="./images/sousuo.png" />
          <span>搜索🔍</span>
        </span>
      </div>
    </div>

    <div class="blockly-registry-search">
      <input
        class="blockly-registry-input"
        @keyup.enter="search"
        v-model="input_text"
        placeholder="输入插件名称或作者,回车搜索"
      />
    </div>

    <div class="blockly-registry-pkg-container">
      <div
        v-for="(pkg, index) in packages"
        :key="index"
        class="blockly-registry-item"
      >
        <div class="blockly-registry-name">
          {{ pkg.name + "@" + pkg.version }}
        </div>
        <div class="blockly-registry-desc">{{ pkg.desc }}</div>
        <div class="blockly-registry-author">
          <svg
            t="1685970149254"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="12147"
          >
            <path
              d="M510.548 105.582c-129.797 0-235.386 105.593-235.386 235.39 0 93.999 55.509 175.067 135.354 212.767-147.613 43.35-255.793 179.825-255.793 341.273 0 10.275 8.327 18.594 18.594 18.594 10.267 0 18.594-8.319 18.594-18.594 0-175.702 142.956-318.65 318.636-318.65 129.797 0 235.395-105.593 235.395-235.39s-105.598-235.39-235.395-235.39z m0 433.591c-109.294 0-198.197-88.917-198.197-198.202 0-109.29 88.903-198.202 198.197-198.202 109.298 0 198.206 88.912 198.206 198.202 0 109.29-88.903 198.202-198.206 198.202z m0 0z m215.838 72.907c-8.175-6.229-19.83-4.686-26.057 3.487-6.245 8.17-4.686 19.826 3.484 26.074 79.681 60.886 125.367 153.241 125.367 253.366 0 10.279 8.332 18.598 18.595 18.598 10.275 0 18.594-8.319 18.594-18.598 0-111.818-51.024-214.941-139.984-282.927z m0 0z"
              fill=""
              p-id="12148"
            ></path>
          </svg>
          {{ pkg.author }}
        </div>
        <button
          :id="`blockly-registry-${pkg.name}`"
          class="blockly-registry-btn"
          v-if="!pkg.isinstalled"
          @click="showDialog(pkg.name)"
        >
          <svg
            t="1685970082203"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="11166"
          >
            <path
              d="M921.81 298.35a48.58 48.58 0 0 0-7.46-5.7L688.87 158.8c-7.84-4.71-17.33-5.22-21.09-5.22H348c-3.82 0-13.52 0.53-21.42 5.42L109.83 292.53l-0.19 0.12a48.23 48.23 0 0 0-7.44 5.69 27.16 27.16 0 0 0-17.88 25.48v502.52a27.17 27.17 0 0 0 27.14 27.14h801.07a27.09 27.09 0 0 0 27.14-27V323.82a27.16 27.16 0 0 0-17.86-25.47zM350.3 206.21h315.32L818 296.68H203.45zM887 800.84H137V349.32h750z"
              p-id="11167"
            ></path>
            <path
              d="M671.63 573.94l-38.97-35.39-94.34 103.87V411.99h-52.64v230.43l-94.34-103.87-38.97 35.39L512 749.68l159.63-175.74z"
              p-id="11168"
            ></path>
          </svg>
        </button>
        <button
          :id="`blockly-registry-${pkg.name}`"
          class="blockly-registry-btn"
          style="background-color: gold"
          v-if="pkg.isinstalled"
          @click="showDialog(pkg.name)"
        >
          <svg
            t="1685970041674"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="11025"
          >
            <path
              d="M855.6032 245.76H844.8v-46.6432c0-45.1584-36.7616-81.92-81.92-81.92H261.12c-45.1584 0-81.92 36.7616-81.92 81.92V245.76h-10.8032c-45.1584 0-81.92 36.7616-81.92 81.92v501.76c0 45.1584 36.7616 81.92 81.92 81.92h687.2064c45.1584 0 81.92-36.7616 81.92-81.92V327.68c0-45.1584-36.7616-81.92-81.92-81.92zM220.16 199.1168c0-22.5792 18.3808-40.96 40.96-40.96h501.76c22.5792 0 40.96 18.3808 40.96 40.96V245.76H220.16v-46.6432zM896.5632 829.44c0 22.5792-18.3808 40.96-40.96 40.96H168.3968c-22.5792 0-40.96-18.3808-40.96-40.96V327.68c0-22.5792 18.3808-40.96 40.96-40.96H855.6032c22.5792 0 40.96 18.3808 40.96 40.96v501.76z"
              fill="#666666"
              p-id="11026"
            ></path>
            <path
              d="M359.1168 850.9952c-14.3872 0-27.2384-8.6016-32.768-21.9648a35.90656 35.90656 0 0 1 7.7312-39.3216l28.672-28.672-29.184-29.184-28.672 28.672a35.84 35.84 0 0 1-39.2704 7.7312 35.87072 35.87072 0 0 1-22.0672-33.4336c0.256-30.4128 12.2368-59.0336 33.7408-80.5376 31.232-31.232 77.1584-41.5232 118.2208-27.6992l160.4096-160.4096c-13.1072-39.4752-4.0448-84.0704 24.4224-114.8928 21.7088-23.4496 52.4288-36.9664 84.2752-37.0688h0.1024c14.3872 0 27.2384 8.6016 32.768 21.9648 5.632 13.568 2.6112 28.9792-7.7312 39.3216l-28.672 28.672 29.184 29.184 28.672-28.672a35.84 35.84 0 0 1 39.2704-7.7312 35.74784 35.74784 0 0 1 22.016 33.4336 114.63168 114.63168 0 0 1-33.7408 80.5376c-31.1808 31.232-77.2096 41.5232-118.2208 27.6992L467.968 699.0336c13.1072 39.4752 4.0448 84.0704-24.4224 114.8928a115.6096 115.6096 0 0 1-84.2752 37.0688h-0.1536z m-25.5488-162.2016c9.216 0 18.3808 3.4816 25.3952 10.496l36.352 36.352c13.9776 13.9776 13.9776 36.7616 0 50.7392l-22.272 22.272c15.4112-2.9696 29.44-10.7008 40.3968-22.5792 20.5312-22.1696 25.344-55.552 12.032-83.0464l-6.3488-13.1072 200.2432-200.2432 13.1584 6.4c28.5184 13.9264 62.72 8.2944 85.1456-14.1312 10.5984-10.5984 17.6128-23.9104 20.4288-38.3488L715.776 465.92c-6.7584 6.7584-15.7696 10.496-25.3952 10.496s-18.5856-3.7376-25.3952-10.496l-36.352-36.352a35.6608 35.6608 0 0 1-10.496-25.3952 35.84 35.84 0 0 1 10.496-25.3952l22.272-22.272c-15.4112 2.9696-29.44 10.7008-40.448 22.5792-20.5312 22.1696-25.344 55.552-12.032 83.0464l6.3488 13.1072-200.2432 200.2432-13.1584-6.4512a74.36288 74.36288 0 0 0-85.1456 14.1312 74.17856 74.17856 0 0 0-20.4288 38.3488l22.272-22.272a36.61824 36.61824 0 0 1 25.4976-10.4448z"
              fill="#666666"
              p-id="11027"
            ></path>
          </svg>
        </button>
      </div>
    </div>
    <div class="blockly-registry-pkg-container">
      <div
        v-for="(pkg, index) in show_local_plugins"
        :key="index"
        class="blockly-registry-item"
      >
        <div class="blockly-registry-name">{{ pkg.name }}</div>
        <div class="blockly-registry-name">
          {{ pkg.name + "@" + (pkg?.version || "unknow") }}
        </div>
        <div class="blockly-registry-desc">{{ pkg?.desc || "unknow" }}</div>
        <div class="blockly-registry-author">
          <svg
            t="1685970149254"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="12147"
          >
            <path
              d="M510.548 105.582c-129.797 0-235.386 105.593-235.386 235.39 0 93.999 55.509 175.067 135.354 212.767-147.613 43.35-255.793 179.825-255.793 341.273 0 10.275 8.327 18.594 18.594 18.594 10.267 0 18.594-8.319 18.594-18.594 0-175.702 142.956-318.65 318.636-318.65 129.797 0 235.395-105.593 235.395-235.39s-105.598-235.39-235.395-235.39z m0 433.591c-109.294 0-198.197-88.917-198.197-198.202 0-109.29 88.903-198.202 198.197-198.202 109.298 0 198.206 88.912 198.206 198.202 0 109.29-88.903 198.202-198.206 198.202z m0 0z m215.838 72.907c-8.175-6.229-19.83-4.686-26.057 3.487-6.245 8.17-4.686 19.826 3.484 26.074 79.681 60.886 125.367 153.241 125.367 253.366 0 10.279 8.332 18.598 18.595 18.598 10.275 0 18.594-8.319 18.594-18.598 0-111.818-51.024-214.941-139.984-282.927z m0 0z"
              fill=""
              p-id="12148"
            ></path>
          </svg>
          {{ pkg.author || "unknow" }}
        </div>
        <button
          :id="`blockly-registry-${pkg.name}`"
          class="blockly-registry-btn2"
          style="background-color: gold"
          v-if="pkg.isuploaded"
          @click="showDialog(pkg.name)"
        >
          <svg
            t="1685970041674"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="11025"
          >
            <path
              d="M855.6032 245.76H844.8v-46.6432c0-45.1584-36.7616-81.92-81.92-81.92H261.12c-45.1584 0-81.92 36.7616-81.92 81.92V245.76h-10.8032c-45.1584 0-81.92 36.7616-81.92 81.92v501.76c0 45.1584 36.7616 81.92 81.92 81.92h687.2064c45.1584 0 81.92-36.7616 81.92-81.92V327.68c0-45.1584-36.7616-81.92-81.92-81.92zM220.16 199.1168c0-22.5792 18.3808-40.96 40.96-40.96h501.76c22.5792 0 40.96 18.3808 40.96 40.96V245.76H220.16v-46.6432zM896.5632 829.44c0 22.5792-18.3808 40.96-40.96 40.96H168.3968c-22.5792 0-40.96-18.3808-40.96-40.96V327.68c0-22.5792 18.3808-40.96 40.96-40.96H855.6032c22.5792 0 40.96 18.3808 40.96 40.96v501.76z"
              fill="#666666"
              p-id="11026"
            ></path>
            <path
              d="M359.1168 850.9952c-14.3872 0-27.2384-8.6016-32.768-21.9648a35.90656 35.90656 0 0 1 7.7312-39.3216l28.672-28.672-29.184-29.184-28.672 28.672a35.84 35.84 0 0 1-39.2704 7.7312 35.87072 35.87072 0 0 1-22.0672-33.4336c0.256-30.4128 12.2368-59.0336 33.7408-80.5376 31.232-31.232 77.1584-41.5232 118.2208-27.6992l160.4096-160.4096c-13.1072-39.4752-4.0448-84.0704 24.4224-114.8928 21.7088-23.4496 52.4288-36.9664 84.2752-37.0688h0.1024c14.3872 0 27.2384 8.6016 32.768 21.9648 5.632 13.568 2.6112 28.9792-7.7312 39.3216l-28.672 28.672 29.184 29.184 28.672-28.672a35.84 35.84 0 0 1 39.2704-7.7312 35.74784 35.74784 0 0 1 22.016 33.4336 114.63168 114.63168 0 0 1-33.7408 80.5376c-31.1808 31.232-77.2096 41.5232-118.2208 27.6992L467.968 699.0336c13.1072 39.4752 4.0448 84.0704-24.4224 114.8928a115.6096 115.6096 0 0 1-84.2752 37.0688h-0.1536z m-25.5488-162.2016c9.216 0 18.3808 3.4816 25.3952 10.496l36.352 36.352c13.9776 13.9776 13.9776 36.7616 0 50.7392l-22.272 22.272c15.4112-2.9696 29.44-10.7008 40.3968-22.5792 20.5312-22.1696 25.344-55.552 12.032-83.0464l-6.3488-13.1072 200.2432-200.2432 13.1584 6.4c28.5184 13.9264 62.72 8.2944 85.1456-14.1312 10.5984-10.5984 17.6128-23.9104 20.4288-38.3488L715.776 465.92c-6.7584 6.7584-15.7696 10.496-25.3952 10.496s-18.5856-3.7376-25.3952-10.496l-36.352-36.352a35.6608 35.6608 0 0 1-10.496-25.3952 35.84 35.84 0 0 1 10.496-25.3952l22.272-22.272c-15.4112 2.9696-29.44 10.7008-40.448 22.5792-20.5312 22.1696-25.344 55.552-12.032 83.0464l6.3488 13.1072-200.2432 200.2432-13.1584-6.4512a74.36288 74.36288 0 0 0-85.1456 14.1312 74.17856 74.17856 0 0 0-20.4288 38.3488l22.272-22.272a36.61824 36.61824 0 0 1 25.4976-10.4448z"
              fill="#666666"
              p-id="11027"
            ></path>
          </svg>
        </button>
        <button
          :id="`blockly-registry-${pkg.name}`"
          class="blockly-registry-btn"
          style="background-color: gold"
          v-if="pkg.isuploaded"
          @click="showDialog_u(pkg.id)"
        >
          <svg
            t="1685983200201"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="3705"
          >
            <path
              d="M821.54 153.57H202.46a27.19 27.19 0 0 0-27.16 27.16v645.59a27.19 27.19 0 0 0 27.16 27.16h619.08a27.19 27.19 0 0 0 27.16-27.16V180.73a27.19 27.19 0 0 0-27.16-27.16zM796 800.81H228V206.25h568z"
              p-id="3706"
            ></path>
            <path
              d="M485.75 391.42V732h52.67V391.47l145.93 160.71 39-35.41-211.26-232.65-211.43 232.64 38.98 35.43 146.11-160.77z"
              p-id="3707"
            ></path>
          </svg>
        </button>
        <button
          :id="`blockly-registry-${pkg.name}`"
          class="blockly-registry-btn"
          v-if="!pkg.isuploaded"
          @click="showDialog_u(pkg.id)"
        >
          <svg
            t="1685983052574"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="2396"
          >
            <path
              d="M890.88 141.312l-96.256 755.712c0 8.192-2.048 8.192-10.24 4.096l-210.944-122.88c-10.24-6.144-22.528-2.048-28.672 8.192-6.144 10.24-2.048 22.528 8.192 28.672l210.944 122.88c32.768 18.432 65.536 2.048 71.68-34.816l102.4-798.72c4.096-38.912-26.624-61.44-61.44-43.008l-778.24 411.648c-34.816 18.432-34.816 55.296-2.048 75.776l169.984 102.4c10.24 6.144 22.528 2.048 28.672-6.144 6.144-10.24 2.048-22.528-6.144-28.672l-169.984-102.4c-6.144-4.096-6.144-2.048 0-4.096l739.328-391.168-458.752 589.824v231.424c0 12.288 8.192 20.48 20.48 20.48s20.48-8.192 20.48-20.48v-219.136l450.56-579.584z"
              fill="#32373B"
              p-id="2397"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
  <el-dialog v-model="dialogVisible" class="dialog" :append-to-body="true">
    <div>⭐不错的插件，要安装莫？</div>
    <select v-model="select_plugin_version">
      <option
        v-for="(version, index) in availiable_version"
        :key="index"
        :value="version"
      >
        {{ version }}
      </option>
    </select>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close_dialogVisible">再想想👌</el-button>
        <el-button @click="install(false)">安装选择的版本(^-^)</el-button>
        <el-button type="primary" @click="install(true)" :loading="upLoading">
          <span>👍安装最新版</span>
        </el-button>
      </span>
    </template>
  </el-dialog>
  <el-dialog v-model="dialogVisible_u" class="dialog" :append-to-body="true">
    <div>⭐不错的插件，要上传莫？</div>
    <input v-model="upload_plugin_desc" placeholder="输入插件描述📖" />
    <br />
    <input v-model="upload_plugin_version" placeholder="输入插件版本✍️" />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible_u = false">再想想🙉</el-button>
        <el-button type="primary" @click="upload" :loading="upLoading">
          <span>👍即刻上传</span>
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { send, message } from "@koishijs/client";
import { ref, watch } from "vue";

export interface Packages {
  name: string;
  version: string;
  desc: string;
  author: string;
  isinstalled: boolean;
}
export interface BlocklyDocument {
  id: number;
  uuid: string;
  name: string;
  body: string;
  code: string;
  enabled?: boolean;
  edited?: boolean;
  author?: string;
  desc?: string;
  version?: string;
  isuploaded?: boolean;
}
const dialogVisible = ref(false);
const upLoading = ref(false);
const isDisabled = ref(false);
const upload_mode = ref(false);
const dialogVisible_u = ref(false);
const select_plugin_u = ref<number>();
const local_plugins = ref<BlocklyDocument[]>();
const cloud_plugins = ref<Packages[]>();
const select_plugin = ref<string>();
const input_text = ref<string>();
const packages = ref<Packages[]>();
const upload_plugin_desc = ref<string>();
const upload_plugin_version = ref<string>();
const select_plugin_version = ref<string>();
const availiable_version = ref<string[]>();
const cloud_text = ref<string>();
const get_cloud_text = () => {
  send("blockly-registry/cloud-text").then((data) => {
    cloud_text.value = data as string;
  });
};
const refresh_market = () => {
  get_cloud_text();
  send("blockly-registry/query-cloud").then((data) => {
    cloud_plugins.value = data;
    packages.value = data;
    message.success("刷新成功");
  });
};
const get_availiable_version = (name: string) => {
  send("blockly-registry/query-version", name).then((data) => {
    availiable_version.value = data;
  });
};
const showDialog = (name: string) => {
  get_availiable_version(name);
  select_plugin.value = name;
  dialogVisible.value = true;
};

const search = () => {
  if (isDisabled.value) {
    message.warning("操作频繁!!⚠️");
    return;
  }
  isDisabled.value = true;
  if (input_text.value == "") {
    refresh_package(cloud_plugins.value);
  }
  const target_list = [];
  for (var i of cloud_plugins.value) {
    if (
      i.name.includes(input_text.value) ||
      i.author.includes(input_text.value)
    ) {
      target_list.push(i);
    }
  }
  message.success(`找到${target_list.length}个插件`);
  refresh_package(target_list);
};
const refresh_package = (pkgs: Packages[]) => {
  packages.value = pkgs;
  isDisabled.value = false;
  input_text.value = "";
};
const openSw = () => {
  upload_mode.value = !upload_mode.value;
};
const install = (latest: boolean = true) => {
  const target_version: string = latest
    ? availiable_version.value[0]
    : select_plugin_version.value;
  isDisabled.value = true;
  close_dialogVisible();
  send("blockly-registry/install", select_plugin.value, target_version).then(
    (data) => {
      if ((data as string).startsWith("error")) {
        message.error(data as string);
      } else {
        message.success(data as string);
      }
      isDisabled.value = false;
    }
  );
};
const showDialog_u = (id: number) => {
  select_plugin_u.value = id;
  dialogVisible_u.value = true;
};
const show_local_plugins = ref<BlocklyDocument[]>();
const upload = () => {
  isDisabled.value = true;
  close_dialogVisible_u();
  send("blockly-registry/upload", select_plugin_u.value).then((data) => {
    if ((data as string).startsWith("error")) {
      message.error(data as string);
    } else {
      message.success(data as string);
    }
    isDisabled.value = false;
  });
};
const close_dialogVisible = () => {
  dialogVisible.value = false;
};
const close_dialogVisible_u = () => {
  dialogVisible_u.value = false;
  upload_plugin_desc.value = "";
  upload_plugin_version.value = "";
};

// 初始化
get_cloud_text();
send("blockly-registry/query-cloud").then((data) => {
  cloud_plugins.value = data;
  packages.value = data;
});
send("blockly-registry/query").then((data) => {
  local_plugins.value = data;
});
watch(upload_mode, (value) => {
  if (!value) {
    packages.value = cloud_plugins.value;
    show_local_plugins.value = [];
  } else {
    packages.value = [];
    show_local_plugins.value = local_plugins.value;
  }
});
</script>
<style lang="scss" scoped>
.blockly-registry-container-play {
  position: relative;
  /* 最外层盒子，需要三个属性：定宽、文字不换行、超过隐藏 */
  width: 60rem;
  white-space: nowrap;
  overflow: hidden;
  font-size: 20px;
  color: #65b4ae;
}
.blockly-registry-container_words-play {
  top: 0%;
  /* 盒子背景宽度将随文字宽度而进行自适应 */
  width: fit-content;
  /* 添加动画 */
  animation: move 4s linear infinite;
  /* 让前面的几个文字有一个初始的距离，达到更好的呈现效果 */
  padding-left: 20px;
}
.blockly-registry-container_words-play::after {
  position: absolute;
  right: -100%;
  content: attr(text);
}
@keyframes move {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}

.blockly-registry-container {
  padding: 1rem;
  position: relative;
  height: 100%;
  width: 100%;
}
.blockly-registry-title {
  position: relative;
  left: 20%;
  font-size: xx-large;
  margin: auto;
}
#arktitle {
  font-size: 4rem;
  font-weight: bold;
  line-height: 4rem;
  background: linear-gradient(to bottom, green, gold );
  -webkit-background-clip: text;
  color: transparent;
  animation: blink 2s linear infinite;
  -webkit-animation: blink 2s linear infinite;
  -moz-animation: blink 2s linear infinite;
  -ms-animation: blink 2s linear infinite;
  -o-animation: blink 2s linear infinite;
  text-align:justify;
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.8;
  }
}
@-webkit-keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.8;
  }
}
@-moz-keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.8;
  }
}
@-ms-keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.8;
  }
}
@-o-keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.8;
  }
}

.blockly-registry-mode-select {
  font-size: 1rem;
}
.blockly-registry-refresh-market {
  font-size: 1rem;
}
.blockly-registry-search {
  padding-left: 20%;
  grid-gap: 1rem;
  display: grid;
  margin: auto;
  align-content: center;
}
.blockly-registry-input {
  align-content: center;
  background-color: rgb(44, 68, 113);
  padding: 0.5rem;
  border-radius: 1rem 1rem 1rem 1rem;
  width: 20rem;
  height: 1rem;
  position: relative;
  border: 1px solid rgb(36, 171, 171);
}

/* 插件列表 */
.blockly-registry-pkg-container {
  padding: 1rem;
  padding-top: 2rem;
  grid-gap: 1rem;
  display: grid;
}

@media screen and (max-device-width: 30rem) {
  .blockly-registry-pkg-container {
    grid-template-columns: repeat(1, 0fr);
  }
  .blockly-registry-container-play {
    width: 30rem;
  }
}

@media screen and (min-device-width: 30rem) and (max-device-width: 55rem) {
  .blockly-registry-pkg-container {
    grid-template-columns: repeat(2, 0fr);
  }
  .blockly-registry-container-play {
    width: 40rem;
  }
}
@media screen and (min-device-width: 55rem) and (max-device-width: 80rem) {
  .blockly-registry-pkg-container {
    grid-template-columns: repeat(3, 0fr);
  }
  .blockly-registry-container-play {
    width: 70rem;
  }
}
@media screen and (min-device-width: 80rem) {
  .blockly-registry-pkg-container {
    grid-template-columns: repeat(4, 0fr);
  }
  .blockly-registry-container-play {
    width: 80rem;
  }
}

.blockly-registry-item {
  position: relative;
  padding: 1rem;
  left: 20%;
  width: 15rem;
  height: 10rem;
  background-color: rgb(46, 69, 104);
  border-radius: 1rem 1rem 1rem 1rem;
}
.blockly-registry-name {
  position: absolute;
  top: 1rem;
  left: 1rem;
}
.blockly-registry-author {
  width: 1.5rem;
  color: rgb(29, 150, 125);
  border-radius: 1rem 1rem 1rem 1rem;
  position: absolute;
  bottom: 1rem;
  left: 1rem;
}
.blockly-registry-desc {
  position: absolute;
  font-size: 0.8rem;
  text-align: left;
  top: 5rem;
  right: 1rem;
  left: 1rem;
}
.blockly-registry-btn {
  padding: 0.2rem;
  width: 4rem;
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background-color: rgb(10, 171, 23);
  border-radius: 1rem 1rem 1rem 1rem;
  

}
.blockly-registry-btn2 {
  padding: 0.2rem;
  width: 4rem;
  position: absolute;
  bottom: 1rem;
  right: 6rem;
  background-color: rgb(10, 171, 23);
  border-radius: 1rem 1rem 1rem 1rem;
  

}
</style>