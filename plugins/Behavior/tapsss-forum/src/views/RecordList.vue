<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  minesweeperRecordList,
  schulteRecordListFilter,
  puzzleRecordListFilter,
  tzfeRecordListFilter,
  nonoRecordListFilter,
} from "../api";
import UserAvatar from "../components/UserAvatar.vue";

const props = defineProps<{
  uid: string;
}>();

const router = useRouter();

const tabs = ["扫雷", "舒尔特方格", "数字华容道", "2048", "数织"];
const activeTab = ref(0);

const loading = ref(false);
const records = ref<any[]>([]);
const page = ref(0);
const pageSize = 20;

async function loadRecords(isLoadMore = false) {
  if (!props.uid) return;

  if (!isLoadMore) {
    page.value = 0;
    records.value = [];
  }
  loading.value = true;
  try {
    let res: any;
    if (activeTab.value === 0) {
      res = await minesweeperRecordList(props.uid, page.value, pageSize);
    } else if (activeTab.value === 1) {
      res = await schulteRecordListFilter(props.uid, page.value, pageSize);
    } else if (activeTab.value === 2) {
      res = await puzzleRecordListFilter(props.uid, page.value, pageSize);
    } else if (activeTab.value === 3) {
      res = await tzfeRecordListFilter(props.uid, page.value, pageSize);
    } else if (activeTab.value === 4) {
      res = await nonoRecordListFilter(props.uid, page.value, pageSize);
    }

    if (res && res.code === 200 && res.data) {
      if (isLoadMore) {
        records.value.push(...res.data);
      } else {
        records.value = res.data;
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function switchTab(index: number) {
  activeTab.value = index;
  loadRecords();
}

function loadMore() {
  page.value++;
  loadRecords(true);
}

const formatDate = (timestamp: number) => {
  const d = new Date(timestamp);
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const h = d.getHours().toString().padStart(2, "0");
  const min = d.getMinutes().toString().padStart(2, "0");
  if (d.getFullYear() !== new Date().getFullYear()) {
    return `${d.getFullYear()}-${m}-${day} ${h}:${min}`;
  }
  return `${m}-${day} ${h}:${min}`;
};

const getLevelText = (type: number) => {
  if (type === 0) return "初级";
  if (type === 1) return "中级";
  if (type === 2) return "高级";
  return "自定义";
};

const getModeText = (mode: number) => {
  if (mode === 0) return "标记";
  if (mode === 1) return "无标记";
  return "";
};

const tapMap: Record<number, string> = {
  0: "0",
  1: "3",
  2: "1",
  3: "2",
  4: "4",
};

const openReplay = (recordId: number) => {
  const routeData = router.resolve({
    name: "replay",
    params: { recordId, recordType: tapMap[activeTab.value] },
  });
  window.open(routeData.href, "_blank");
};

onMounted(() => {
  loadRecords();
});
</script>

<template>
  <div class="record-list-container">
    <!-- Header tabs -->
    <div class="header-nav">
      <div class="top-bar">
        <button class="back-btn" @click="router.back()">
          <span class="back-icon">‹</span>
        </button>
        <span class="title">所有录像</span>
      </div>
      <div class="tabs">
        <div
          v-for="(tab, index) in tabs"
          :key="index"
          :class="['tab-item', { active: activeTab === index }]"
          @click="switchTab(index)"
        >
          {{ tab }}
        </div>
      </div>
    </div>

    <!-- List -->
    <div class="list-wrapper">
      <div v-if="loading && records.length === 0" class="loading">
        加载中...
      </div>
      <div v-else-if="records.length === 0" class="empty">暂无录像</div>
      <div v-else class="records">
        <div
          class="record-card"
          v-for="item in records"
          :key="item.id"
          @click="openReplay(item.id)"
        >
          <!-- User info -->
          <div class="card-header">
            <div class="user-info">
              <UserAvatar
                :user="item.user"
                :size="28"
                :disableClick="true"
                class="avatar"
              />
              <span class="nickname">{{ item.user.nickName }}</span>
              <span class="rank-star">★ {{ item.user.timingLevel }}</span>
            </div>
            <div class="tags" v-if="activeTab === 0">
              <span class="tag tag-classic">经典</span>
              <span class="tag tag-border" v-if="getModeText(item.mode)">{{
                getModeText(item.mode)
              }}</span>
            </div>
            <!-- Other games tags if any -->
          </div>

          <!-- Score display -->
          <div class="score-container">
            <div class="score-left">
              <span v-if="activeTab === 0">{{ getLevelText(item.type) }}</span>
              <span v-else>{{ item.row }}x{{ item.column }}</span>
            </div>
            <div class="score-main">
              <div class="score-val" v-if="item.time !== undefined">
                {{ (item.time / 1000).toFixed(3) }}
              </div>
              <div class="score-val" v-else-if="item.score !== undefined">
                {{ item.score }}
              </div>
              <div class="score-lbl">时间</div>
            </div>
            <div class="score-sub">
              <template v-if="activeTab === 0 && item.bvs">
                <div class="score-val">{{ item.bvs.toFixed(3) }}</div>
                <div class="score-lbl">3BV/s</div>
              </template>
              <template v-else-if="activeTab === 1 && item.tapCorrect">
                <div class="score-val">{{ item.tapCorrect }}</div>
                <div class="score-lbl">正确点击</div>
              </template>
              <template v-else-if="activeTab === 2 && item.step">
                <div class="score-val">{{ item.step }}</div>
                <div class="score-lbl">步数</div>
              </template>
              <template v-else-if="activeTab === 4 && item.mode !== undefined">
                <!-- nono default sub score -->
              </template>
            </div>
          </div>

          <!-- Footer -->
          <div class="card-footer">
            <span class="date">{{ formatDate(item.createTime) }}</span>
            <span class="play-count"
              ><span class="play-icon">▷</span> {{ item.playCount || 0 }}</span
            >
          </div>
        </div>

        <div
          class="load-more-btn"
          @click="loadMore"
          v-if="records.length > 0 && records.length % pageSize === 0"
        >
          加载更多
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.record-list-container {
  background-color: #121212;
  min-height: 100vh;
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
}

.header-nav {
  position: sticky;
  top: 0;
  background-color: #1b1b1b;
  z-index: 10;
  padding-top: 10px;
}

.top-bar {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  font-size: 18px;
  font-weight: bold;
}

.back-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 28px;
  line-height: 1;
  margin-right: 15px;
  cursor: pointer;
}

.tabs {
  display: flex;
  overflow-x: auto;
  gap: 20px;
  padding: 10px 16px;
  border-bottom: 1px solid #333;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab-item {
  white-space: nowrap;
  padding-bottom: 8px;
  color: #999;
  cursor: pointer;
  font-size: 15px;
}

.tab-item.active {
  color: #fa7299;
  font-weight: bold;
  border-bottom: 2px solid #fa7299;
}

.list-wrapper {
  padding: 16px;
  flex: 1;
}

.loading,
.empty {
  text-align: center;
  color: #888;
  padding: 40px 0;
}

.records {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-card {
  background-color: #242424;
  border-radius: 6px;
  padding: 14px;
  cursor: pointer;
  transition:
    transform 0.2s,
    background-color 0.2s;
}

.record-card:hover {
  background-color: #2a2a2a;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  border-radius: 50%;
  object-fit: cover;
}

.nickname {
  font-size: 14px;
  color: #fff;
}

.rank-star {
  background-color: #e53935;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.tags {
  display: flex;
  gap: 6px;
}

.tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
}

.tag-classic {
  color: #fa7299;
  background-color: rgba(250, 114, 153, 0.1);
}

.tag-border {
  color: #aaa;
  border: 1px solid #555;
}

.score-container {
  display: flex;
  background-color: #333;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 12px;
  align-items: center;
}

.score-left {
  flex: 1;
  font-size: 15px;
  color: #fff;
}

.score-main {
  flex: 1;
  text-align: center;
}

.score-sub {
  flex: 1;
  text-align: center;
}

.score-val {
  font-size: 20px;
  color: #fff;
  margin-bottom: 4px;
}

.score-lbl {
  font-size: 12px;
  color: #888;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #777;
}

.play-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.play-icon {
  font-size: 14px;
}

.load-more-btn {
  text-align: center;
  padding: 14px;
  color: #fa7299;
  background-color: #242424;
  border-radius: 6px;
  cursor: pointer;
}
.load-more-btn:hover {
  background-color: #2a2a2a;
}
</style>
