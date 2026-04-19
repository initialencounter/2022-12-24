<script setup lang="ts">
import { formatTime } from "@/utils/constants";

defineProps<{
  user: any;
  saolei?: any;
  userMatchMedals?: any[];
}>();
</script>

<template>
  <div class="about-ta">
    <!-- 详细信息区 -->
    <div class="details-section">
      <h3>基本资料</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="lbl">UID</span>
          <span class="val">{{ user.uid }}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">注册时间</span>
          <span class="val">{{
            new Date(user.createTime)
              .toISOString()
              .substring(0, 10)
              .replace(/-/g, "/")
          }}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">人气</span>
          <span class="val">{{ user.visits }}</span>
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

        <div class="detail-item">
          <span class="lbl">简介</span>
          <span class="val">{{
            user.sign || "这个人很懒，什么都没有留下"
          }}</span>
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
    <div class="medals-section" v-if="userMatchMedals?.length">
      <h3>比赛奖牌</h3>
      <div class="medals">
        <div
          v-for="medal in userMatchMedals"
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
</template>

<style scoped>
h3 {
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.2rem;
  color: #eee;
}

.details-section,
.saolei-section,
.medals-section {
  background: #252525;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
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
  color: #aaa;
  font-size: 0.85rem;
  margin-bottom: 4px;
}
.detail-item .val {
  font-size: 1rem;
}
.danger-text {
  color: #f44336;
}

.saolei-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #333;
  padding: 15px;
  border-radius: 8px;
}
.saolei-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid #555;
}
.saolei-name {
  font-size: 1.1rem;
  font-weight: bold;
}
.saolei-name .lbl {
  font-size: 0.9rem;
  color: #bbb;
  font-weight: normal;
}
.saolei-time {
  font-size: 0.85rem;
  color: #999;
  margin-top: 5px;
}

.medals {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}
.medal-item {
  background: #333;
  padding: 10px 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.medal-item img {
  width: 40px;
  height: 40px;
}
.medal-info {
  display: flex;
  flex-direction: column;
}
.medal-title {
  font-weight: bold;
  font-size: 1rem;
}
.medal-rank {
  font-size: 0.85rem;
  color: #ff9800;
  margin-top: 3px;
}
</style>
