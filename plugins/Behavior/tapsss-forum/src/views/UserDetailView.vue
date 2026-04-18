<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { userHome } from "@/api";
import type { Data as UserHomeData } from "@/types/response/userHomeResponse";
import {
  TIMING_LEVELS_MAP,
  TIMING_LEVELS_COLOR,
  TIMING_LEVELS_TEXT_COLOR,
  formatTime,
} from "@/utils/constants";
import UserAvatar from "@/components/UserAvatar.vue";

const route = useRoute();
const userData = ref<UserHomeData | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

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

const sexMap: Record<number, string> = { 0: "", 1: "男", 2: "女" };
</script>

<template>
  <div class="user-detail">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="user" class="user-profile">
      <!-- 顶部背景 -->
      <div
        class="cover"
        :style="{
          backgroundImage: `url(${user.background || 'https://via.placeholder.com/800x200?text=Background'})`,
        }"
      ></div>

      <!-- 头像和基本信息 -->
      <div class="user-info-section">
        <UserAvatar :user="user" size="100px" className="avatar-large" />
        <div class="basic-info">
          <h2>
            {{ user.nickName }}
            <span v-if="user.vip" class="badge vip-badge">VIP</span>
            <span class="badge sex-badge" :class="'sex-' + user.sex">{{
              sexMap[user.sex]
            }}</span>
            <span
              class="badge rank-badge"
              v-if="rankText"
              :style="{ backgroundColor: levelColor, color: textColor }"
            >
              {{ rankText }}
            </span>
          </h2>
          <div class="id-row">
            <span class="uid">UID: {{ user.uid || user.id }}</span>
            <span class="online-status" :class="{ online: user.online }">{{
              user.online ? "在线" : "离线"
            }}</span>
          </div>
          <p class="sign">{{ user.sign || "这个人很懒，什么都没写~" }}</p>
        </div>
      </div>

      <!-- 数据统计区 -->
      <div class="stats-section">
        <div class="stat-item">
          <span class="val">{{ userData?.followCount }}</span>
          <span class="lbl">关注</span>
        </div>
        <div class="stat-item">
          <span class="val">{{ userData?.fansCount }}</span>
          <span class="lbl">粉丝</span>
        </div>
        <div class="stat-item">
          <span class="val">{{ userData?.distance }}</span>
          <span class="lbl">距离</span>
        </div>
        <div class="stat-item">
          <span class="val">{{ user.visits }}</span>
          <span class="lbl">人气</span>
        </div>
        <div class="stat-item">
          <span class="val">{{ user.puzzleRank || "-" }}</span>
          <span class="lbl">puzzleRank</span>
        </div>
      </div>

      <!-- 详细信息区 -->
      <div class="details-section">
        <h3>基本资料</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="lbl">注册时间</span>
            <span class="val">{{ new Date(user.createTime).toISOString() }}</span>
          </div>
          <div class="detail-item" v-if="user.birthday">
            <span class="lbl">生日</span>
            <span class="val">{{ formatTime(user.birthday) }}</span>
          </div>
          <div class="detail-item">
            <span class="lbl">地区</span>
            <span class="val"
              >{{ user.country || "暂无" }}
              {{ user.province ? "- " + user.province : "" }}</span
            >
          </div>
          <div class="detail-item">
            <span class="lbl">账号状态</span>
            <span class="val">
              <span v-if="user.accountStatus === 0">正常</span>
              <span v-else class="danger-text"
                >异常 (状态码: {{ user.accountStatus }})</span
              >
            </span>
          </div>
        </div>
      </div>

      <!-- 绑定的扫雷网账号 -->
      <div class="saolei-section" v-if="saolei">
        <h3>扫雷网绑定</h3>
        <div class="saolei-card">
          <img
            class="saolei-avatar"
            :src="saolei.avatar || 'https://via.placeholder.com/60'"
            alt="saolei avatar"
          />
          <div class="saolei-info">
            <div class="saolei-name">
              {{ saolei.name }} <span class="lbl">(ID: {{ saolei.id }})</span>
            </div>
            <div class="saolei-time">
              绑定于: {{ formatTime(parseInt(saolei.createTime) || 0) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 比赛奖牌 -->
      <div class="medals-section" v-if="userData?.userMatchMedals?.length">
        <h3>比赛奖牌</h3>
        <div class="medals">
          <div
            v-for="medal in userData.userMatchMedals"
            :key="medal.id"
            class="medal-item"
            :title="'Rank: ' + medal.rank"
          >
            <img v-if="medal.icon" :src="medal.icon" :alt="medal.title" />
            <div class="medal-info">
              <div class="medal-title">{{ medal.title }}</div>
              <div class="medal-rank">No.{{ medal.rank }}</div>
            </div>
          </div>
        </div>
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
.cover {
  height: 220px;
  background-size: cover;
  background-position: center;
  border-radius: 0 0 12px 12px;
  position: relative;
}
.cover::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  border-radius: 0 0 12px 12px;
}

.user-info-section {
  display: flex;
  align-items: flex-end;
  margin-top: -50px;
  padding: 0 20px;
  position: relative;
  z-index: 2;
}

/* 用 :deep 或者全局类处理 UserAvatar 中定义的 className="avatar-large" */
:deep(.avatar-large) {
  border: 4px solid #1b1b1b !important;
  background-color: #333;
}

.basic-info {
  margin-left: 20px;
  padding-bottom: 5px;
  flex: 1;
}
.basic-info h2 {
  margin: 0;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.badge {
  font-size: 0.8rem;
  padding: 2px 6px;
  border-radius: 4px;
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
  margin-top: 6px;
}
.uid {
  color: #bbb;
  font-size: 0.95rem;
}
.online-status {
  font-size: 0.85rem;
  color: #777;
}
.online-status.online {
  color: #4caf50;
}

.sign {
  margin-top: 8px;
  color: #ddd;
  font-size: 1rem;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  padding: 20px;
  margin-top: 25px;
  background: #1e1e1e;
  border-radius: 10px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-item .val {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
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
