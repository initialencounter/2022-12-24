<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import MinesweeperPlayer from "../components/MinesweeperPlayer.vue";

const route = useRoute();
const router = useRouter();

const recordId = route.params.recordId as string;
const recordType = (route.params.recordType as string) || "0";

function goBack() {
  router.go(-1);
}
</script>

<template>
  <div class="replay-view">
    <div class="header">
      <button class="back-btn" @click="goBack">← 返回帖子</button>
      <h1>录像回放 #{{ recordId }}</h1>
    </div>
    <div v-if="recordType == '0'">
      <MinesweeperPlayer :record-id="recordId" />
    </div>
    <div v-else>
      <p>暂不支持该类型的录像回放。</p>
    </div>
  </div>
</template>

<style scoped>
.replay-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 1.8rem;
  color: #fff;
  margin: 0;
}

.back-btn {
  display: inline-block;
  color: #fa7299;
  text-decoration: none;
  font-size: 1rem;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #444;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn:hover {
  background-color: #2a2a2a;
  border-color: #fa7299;
}
</style>
