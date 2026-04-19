<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { userHome } from "@/api";
import type { Data as UserHomeData } from "@/types/response/userHomeResponse";
import {
  TIMING_LEVELS_MAP,
  TIMING_LEVELS_COLOR,
  TIMING_LEVELS_TEXT_COLOR,
} from "@/utils/constants";
import UserAvatar from "@/components/UserAvatar.vue";
import UserCareer from "@/views/UserCareer.vue";
import RecordList from "@/views/RecordList.vue";
import AboutTa from "@/components/AboutTa.vue";

const route = useRoute();
const userData = ref<UserHomeData | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const currentTab = ref<"career" | "records" | "about">("about");

onMounted(async () => {
  const uid = Number(route.params.uid);
  try {
    const res = await userHome(uid);
    if (res.code === 200) {
      userData.value = res.data;
    } else {
      error.value = res.msg || "获取用户信息失败";
    }
  } catch (err) {
    error.value = "加载发生错误";
    console.error(err);
  } finally {
    loading.value = false;
  }
});

const user = computed(() => userData.value?.user);
const saolei = computed(() => userData.value?.saoleiOauth);

const levelIndex = computed(() => {
  if (!user.value) return 0;
  return user.value.timingLevel === -1 ? 0 : user.value.timingLevel;
});
const levelColor = computed(
  () => TIMING_LEVELS_COLOR[levelIndex.value] || "#000",
);
const textColor = computed(
  () => TIMING_LEVELS_TEXT_COLOR[levelIndex.value] || "#FFF",
);
const rankText = computed(() => {
  if (!user.value || !user.value.timingRank) return "";
  const r = user.value.timingRank;
  if (r === 1) return "雷帝";
  return `${TIMING_LEVELS_MAP[levelIndex.value] || ""}${r <= 300 ? " " + r : ""}`;
});

const sexMap: Record<number, string> = { 0: "", 1: "♂", 2: "♀" };

const age = computed(() => {
  const b = user.value?.birthday;
  if (!b) return null;
  const d = new Date(b);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let a = today.getFullYear() - d.getFullYear();
  if (
    today.getMonth() < d.getMonth() ||
    (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())
  ) {
    a--;
  }
  return a >= 0 ? a : null;
});

const zodiac = computed(() => {
  const b = user.value?.birthday;
  if (!b) return null;
  const d = new Date(b);
  if (isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const c = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22];
  const s = [
    "摩羯座",
    "水瓶座",
    "双鱼座",
    "白羊座",
    "金牛座",
    "双子座",
    "巨蟹座",
    "狮子座",
    "处女座",
    "天秤座",
    "天蝎座",
    "射手座",
    "摩羯座",
  ];
  if (m === undefined || day === undefined) return null;
  return day < (c[m - 1] || 0) ? s[m - 1] : s[m];
});
</script>

<template>
  <div class="user-detail">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="user" class="user-profile">
      <!-- 头部区域（包含背景与用户信息） -->
      <div class="header-section">
        <!-- 顶部背景 -->
        <div
          class="cover"
          :style="{
            backgroundImage: `url(${user.background || 'https://via.placeholder.com/800x200?text=Background'})`,
          }"
        ></div>

        <!-- 头像和基本信息 -->
        <div class="user-info-section">
          <UserAvatar :user="user" size="90px" className="avatar-large" />
          <div class="basic-info">
            <h2>
              {{ user.nickName }}
              <span v-if="user.vip" class="badge vip-badge">VIP</span>
              <span
                class="badge rank-badge"
                v-if="rankText"
                :style="{ backgroundColor: levelColor, color: textColor }"
              >
                {{ rankText }}
              </span>
            </h2>

            <!-- Follow & Fans -->
            <div class="follow-fans-row">
              <div class="stat-item">
                <span class="val">关注  {{ userData?.followCount || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="val">粉丝  {{ userData?.fansCount || 0 }}</span>
              </div>
            </div>

            <!-- Tags -->
            <div class="tags-row">
              <span class="badge" :class="'sex-' + user.sex" v-if="user.sex">
                {{ sexMap[user.sex] }} {{ age !== null ? age : "" }}
              </span>
              <span class="badge zodiac-badge" v-if="zodiac">{{ zodiac }}</span>
              <span class="badge saolei-badge" v-if="saolei"
                >扫雷网 {{ saolei.id }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-nav">
        <div
          class="tab-item"
          :class="{ active: currentTab === 'career' }"
          @click="currentTab = 'career'"
        >
          生涯
        </div>
        <div
          class="tab-item"
          :class="{ active: currentTab === 'records' }"
          @click="currentTab = 'records'"
        >
          记录
        </div>
        <div
          class="tab-item"
          :class="{ active: currentTab === 'about' }"
          @click="currentTab = 'about'"
        >
          关于Ta
        </div>
      </div>

      <div class="tab-content">
        <KeepAlive>
          <UserCareer v-if="currentTab === 'career'" :uid="String(user.id)" />
          <RecordList
            v-else-if="currentTab === 'records'"
            :uid="String(user.id)"
          />
          <AboutTa
            v-else-if="currentTab === 'about'"
            :user="user"
            :saolei="saolei"
            :userMatchMedals="userData?.userMatchMedals"
          />
        </KeepAlive>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-detail {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 50px;
  color: #fff;
  font-family: Arial, sans-serif;
}
.header-section {
  position: relative;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
}
.cover {
  height: 320px;
  width: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
}
.cover::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 180px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
}

.user-info-section {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: flex-end;
  padding: 20px 30px;
  box-sizing: border-box;
  z-index: 2;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

/* 用 :deep 或者全局类处理 UserAvatar 中定义的 className="avatar-large" */
:deep(.avatar-large) {
  border: 3px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  background-color: #333;
  flex-shrink: 0;
}

.basic-info {
  margin-left: 20px;
  height: 90px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
}
.basic-info h2 {
  margin: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.badge {
  font-size: 0.6rem;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: normal;
}
.vip-badge {
  background-color: #ff9800;
  color: #fff;
}
.sex-1 {
  background-color: #2196f3;
  color: #fff;
}
.sex-2 {
  background-color: #e91e63;
  color: #fff;
}
.sex-0 {
  background-color: #9e9e9e;
  color: #fff;
}

.id-row {
  display: flex;
  align-items: center;
  gap: 15px;
}
.uid {
  color: #bbb;
  font-size: 0.85rem;
}
.online-status {
  font-size: 0.85rem;
  color: #ccc;
}
.online-status.online {
  color: #4caf50;
}

.sign {
  color: #ddd;
  font-size: 0.9rem;
}

.tags-row {
  display: flex;
  gap: 8px;
}
.zodiac-badge {
  background-color: #9c27b0;
  color: #fff;
}
.saolei-badge {
  background-color: #2196f3;
  color: #fff;
}

.follow-fans-row {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
}
.follow-fans-row .stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.follow-fans-row .stat-item .val {
  color: #fff;
}
.follow-fans-row .stat-item .lbl {
  color: #aaa;
}

.tabs-nav {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  border-bottom: 2px solid #333;
}
.tab-item {
  padding: 10px 0;
  cursor: pointer;
  font-size: 1.1rem;
  color: #aaa;
  position: relative;
}
.tab-item.active {
  color: #2196f3;
  font-weight: bold;
}
.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #2196f3;
}
.tab-content {
  padding: 20px 0;
}
.stat-item .lbl {
  font-size: 0.9rem;
  color: #999;
  margin-top: 4px;
}

.details-section,
.saolei-section,
.medals-section {
  margin-top: 20px;
  padding: 20px;
  background: #1e1e1e;
  border-radius: 10px;
}
h3 {
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  color: #e0e0e0;
  border-left: 4px solid #fa7299;
  padding-left: 10px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}
.detail-item {
  display: flex;
  flex-direction: column;
}
.detail-item .lbl {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 4px;
}
.detail-item .val {
  font-size: 1.05rem;
  color: #eee;
}
.danger-text {
  color: #ff5252;
}

.saolei-card {
  display: flex;
  align-items: center;
  background: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
}
.saolei-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 15px;
  object-fit: cover;
}
.saolei-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.saolei-name {
  font-size: 1.1rem;
  font-weight: bold;
}
.saolei-name .lbl {
  font-size: 0.9rem;
  color: #999;
  font-weight: normal;
}
.saolei-time {
  font-size: 0.9rem;
  color: #aaa;
}

.medals {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
}
.medal-item {
  display: flex;
  align-items: center;
  background: #2a2a2a;
  padding: 12px;
  border-radius: 8px;
  transition: transform 0.2s;
}
.medal-item:hover {
  transform: translateY(-2px);
  background: #333;
}
.medal-item img {
  width: 40px;
  height: 40px;
  margin-right: 12px;
}
.medal-title {
  font-size: 1rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
}
.medal-rank {
  font-size: 0.85rem;
  color: #fa7299;
}

.loading,
.error {
  text-align: center;
  margin-top: 50px;
  font-size: 1.2rem;
}
.error {
  color: #fa7299;
}
</style>
