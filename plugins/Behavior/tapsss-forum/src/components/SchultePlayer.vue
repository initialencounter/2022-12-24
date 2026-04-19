<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  computed,
  shallowRef,
  nextTick,
  watch,
} from "vue";
import UserAvatar from "./UserAvatar.vue";
import { parseSchulteReplayHandle } from "../utils/replayParser";
import { schulteRecordGet } from "../api";
import type {
  SchulteRecordGetResponse,
  Data,
  SchulteActionRecord,
} from "@/types/response/SchulteRecordGetResponse";

// Since Data from SchulteRecordGetResponse doesn't have `actions` parsed, we extend it
interface PlayData extends Data {
  parsedActions: SchulteActionRecord[];
  parsedMaps?: {
    board: number[][];
    numberMap: Map<number, { r: number; c: number }>;
  }[];
}

const props = defineProps<{
  recordId: string;
}>();

const loading = ref(true);
const errorMsg = ref("");
const replayData = shallowRef<PlayData | null>(null);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = shallowRef<CanvasRenderingContext2D | null>(null);

const isPlaying = ref(false);
const currentTime = ref(0);
const playbackSpeed = ref(1.0);
const totalTime = ref(0);

const cellSize = 60;
let rafId: number | null = null;
let lastRenderedTime = -1;

const currentFrameIndex = computed(() => {
  if (!replayData.value) return 0;
  const actions = replayData.value.parsedActions;
  let lo = 0,
    hi = actions.length - 1;
  let result = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (actions[mid]!.time <= currentTime.value) {
      result = mid + 1;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
});

// Web Audio API
let audioCtx: AudioContext | null = null;
let flagBuffer: AudioBuffer | null = null;

let mixedAudioBuffer: AudioBuffer | null = null;
let audioSourceNode: AudioBufferSourceNode | null = null;
let audioNodeStartedAt = 0;
let audioNodeOffset = 0;

async function initAudio() {
  audioCtx = new window.AudioContext();
  const flagResp = await fetch("/audio/flag.mp3");
  const flagData = await flagResp.arrayBuffer();
  flagBuffer = await audioCtx.decodeAudioData(flagData);
}

async function renderAudioTrack() {
  if (!audioCtx || !flagBuffer) return;
  const data = replayData.value;
  if (!data) return;
  const actions = data.parsedActions;
  const sr = audioCtx.sampleRate;
  const pad = flagBuffer.duration + 0.1;
  const offlineCtx = new OfflineAudioContext(
    2,
    Math.ceil((totalTime.value + pad) * sr),
    sr,
  );
  for (let i = 0; i < actions.length; i++) {
    const act = actions[i]!;
    if (act.right === 1) {
      // 仅对正确的点击播放声音
      const source = offlineCtx.createBufferSource();
      source.buffer = flagBuffer;
      const gain = offlineCtx.createGain();
      gain.gain.value = 0.5;
      source.connect(gain);
      gain.connect(offlineCtx.destination);
      source.start(act.time);
    }
  }
  mixedAudioBuffer = await offlineCtx.startRendering();
}

function startAudioPlayback(offset: number, speed: number) {
  stopAudioPlayback();
  if (!audioCtx || !mixedAudioBuffer) return;
  audioSourceNode = audioCtx.createBufferSource();
  audioSourceNode.buffer = mixedAudioBuffer;
  audioSourceNode.playbackRate.value = speed;
  audioSourceNode.connect(audioCtx.destination);
  audioSourceNode.start(0, offset);
  audioNodeStartedAt = audioCtx.currentTime;
  audioNodeOffset = offset;
}

function stopAudioPlayback() {
  if (audioSourceNode) {
    try {
      audioSourceNode.stop();
    } catch {}
    audioSourceNode.disconnect();
    audioSourceNode = null;
  }
}

async function loadReplay() {
  try {
    loading.value = true;
    errorMsg.value = "";
    const res: SchulteRecordGetResponse = await schulteRecordGet(
      Number(props.recordId),
    );

    if (res.code === 200 && res.data) {
      if (res.data.actions) {
        const rawActions = parseSchulteReplayHandle(res.data.actions);
        const parsedActions = rawActions.map((a) => ({
          ...a,
          time: a.time / 1000,
        }));

        const parsedMaps = [];
        const mapsSource = (res.data as any).maps
          ? (res.data as any).maps.split("|")
          : [res.data.map];
        for (const mapStr of mapsSource) {
          const rowsStr = mapStr.split("-");
          const b = rowsStr.map((r: string) => r.split(":").map(Number));
          const nm = new Map<number, { r: number; c: number }>();
          for (let r = 0; r < b.length; r++) {
            for (let c = 0; c < b[r]!.length; c++) {
              nm.set(b[r]![c]!, { r, c });
            }
          }
          parsedMaps.push({ board: b, numberMap: nm });
        }

        replayData.value = {
          ...res.data,
          parsedActions,
          parsedMaps,
        };
        console.log("Parsed actions:", replayData.value);

        totalTime.value = res.data.time / 1000;

        loading.value = false;
        await initAudio();
        await renderAudioTrack();
        await nextTick();
        initCanvas();
      } else {
        errorMsg.value = "录像内容为空";
      }
    } else {
      errorMsg.value = res.msg || "无法获取录像数据";
    }
  } catch (error: any) {
    console.error(error);
    errorMsg.value = error.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

function initCanvas() {
  const canvas = canvasRef.value;
  const data = replayData.value;
  if (!canvas || !data) return;

  ctx.value = canvas.getContext("2d");
  canvas.width = data.column * cellSize;
  canvas.height = data.row * cellSize;

  drawFrame();
}

function drawFrame() {
  if (!ctx.value) return;
  const data = replayData.value;
  if (!data) return;

  if (currentTime.value === lastRenderedTime && isPlaying.value) return;
  lastRenderedTime = currentTime.value;

  const g = ctx.value;
  const cols = data.column;
  const rows = data.row;
  const fi = currentFrameIndex.value;
  const actions = data.parsedActions;

  // Determine safely clicked numbers till current frame (which gives us currentTarget)
  let currentTarget = 1;

  for (let i = 0; i < fi; i++) {
    const act = actions[i]!;
    if (act.right === 1) {
      currentTarget++;
    }
  }

  // Current map depends on how many correct taps we had
  const mapIndex = Math.min(
    currentTarget - 1,
    (data.parsedMaps?.length || 1) - 1,
  );
  const currentMapObj = data.parsedMaps?.[mapIndex];
  if (!currentMapObj) return;

  const { board: currentBoard, numberMap: currentNm } = currentMapObj;

  const wrongCells = new Set<string>();
  if (fi > 0) {
    const lastAct = actions[fi - 1];
    if (lastAct && lastAct.right === 0) {
      const pos = currentNm.get(lastAct.idx);
      if (pos) {
        wrongCells.add(`${pos.r},${pos.c}`);
      }
    }
  }

  // Draw board
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = currentBoard[r]?.[c];
      const isClicked = val !== undefined && val < currentTarget;
      const isWrongInfo = wrongCells.has(`${r},${c}`);

      if (isWrongInfo) {
        g.fillStyle = "#ff4d4d"; // Red for wrong clicks
      } else {
        g.fillStyle = isClicked ? "#cc7000" : "#ff8c00";
      }
      g.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);

      g.strokeStyle = "#fff";
      g.lineWidth = 2;
      g.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);

      if (val !== undefined && (data.type !== 1 || !isClicked)) {
        g.fillStyle = "#fff";
        g.font = `bold ${cellSize * 0.4}px Arial`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(
          val.toString(),
          c * cellSize + cellSize / 2,
          r * cellSize + cellSize / 2,
        );
      }
    }
  }

  drawMotions();
}

function drawMotions() {
  const data = replayData.value;
  if (!ctx.value || !data) return;

  const fi = currentFrameIndex.value;
  if (fi === 0) return;

  const currentAction = data.parsedActions[fi - 1];
  if (!currentAction) return;

  let tapsSoFar = 0;
  for (let i = 0; i < fi - 1; i++) {
    if (data.parsedActions[i]?.right) tapsSoFar++;
  }
  const curMapIndex = Math.min(tapsSoFar, (data.parsedMaps?.length ?? 1) - 1);
  const curNm = data.parsedMaps![curMapIndex]?.numberMap;

  const pos = curNm?.get(currentAction.idx);
  if (!pos) return;

  let x = pos.c * cellSize + cellSize / 2;
  let y = pos.r * cellSize + cellSize / 2;

  if (fi < data.parsedActions.length) {
    const nextAction = data.parsedActions[fi];
    if (nextAction) {
      const nextMapIndex = Math.min(
        tapsSoFar + (currentAction.right ? 1 : 0),
        (data.parsedMaps?.length ?? 1) - 1,
      );
      const nextNm = data?.parsedMaps![nextMapIndex]?.numberMap;
      if (nextNm?.has(nextAction.idx)) {
        const nextPos = nextNm.get(nextAction.idx)!;
        const timeDiff = nextAction.time - currentAction.time;
        if (timeDiff > 0) {
          let progress = (currentTime.value - currentAction.time) / timeDiff;
          progress = Math.max(0, Math.min(1, progress));
          const nextX = nextPos.c * cellSize + cellSize / 2;
          const nextY = nextPos.r * cellSize + cellSize / 2;
          x = x + (nextX - x) * progress;
          y = y + (nextY - y) * progress;
        }
      }
    }
  }

  ctx.value.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.value.beginPath();
  ctx.value.arc(x, y, 8, 0, Math.PI * 2);
  ctx.value.fill();
  ctx.value.strokeStyle = "#333";
  ctx.value.stroke();
}

let lastTickTime = performance.now();
function tick() {
  if (!isPlaying.value || !audioCtx) return;

  // 从音频时钟推导游戏时间
  const audioElapsed = audioCtx.currentTime - audioNodeStartedAt;
  currentTime.value = audioNodeOffset + audioElapsed * playbackSpeed.value;

  if (currentTime.value >= totalTime.value) {
    currentTime.value = totalTime.value;
    isPlaying.value = false;
    stopTicker();
  }
  drawFrame();
}

function startTicker() {
  stopTicker();
  startAudioPlayback(currentTime.value, playbackSpeed.value);
  const loop = () => {
    tick();
    if (isPlaying.value) rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
}

function stopTicker() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  stopAudioPlayback();
}

function togglePlay() {
  if (audioCtx?.state === "suspended") {
    audioCtx.resume();
  }
  if (currentTime.value >= totalTime.value) {
    currentTime.value = 0;
  }
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) {
    startTicker();
  } else {
    stopTicker();
  }
}

function seek(e: Event) {
  const target = e.target as HTMLInputElement;
  currentTime.value = parseFloat(target.value);
  if (isPlaying.value) {
    startAudioPlayback(currentTime.value, playbackSpeed.value);
  } else {
    drawFrame();
  }
}

function jumpToAction(idx: number) {
  const data = replayData.value;
  if (!data) return;
  currentTime.value = data.parsedActions[idx]?.time ?? 0;
  isPlaying.value = false;
  stopTicker();
  drawFrame();
}

function stepFrame(direction: number) {
  const data = replayData.value;
  if (!data) return;

  let targetIndex = currentFrameIndex.value + direction;
  if (targetIndex < 0) targetIndex = 0;
  if (targetIndex > data.parsedActions.length)
    targetIndex = data.parsedActions.length;

  if (targetIndex === 0) {
    currentTime.value = 0;
  } else {
    currentTime.value = data.parsedActions[targetIndex - 1]?.time ?? 0;
  }

  isPlaying.value = false;
  stopTicker();
  drawFrame();
}

watch(playbackSpeed, () => {
  if (isPlaying.value) {
    startAudioPlayback(currentTime.value, playbackSpeed.value);
  }
});

onMounted(() => {
  loadReplay();
});

onUnmounted(() => {
  stopTicker();
});

const currentFrameActionInfo = computed(() => {
  if (!replayData.value) return "";
  const fi = currentFrameIndex.value;
  if (fi === 0) return "无操作";
  const act = replayData.value.parsedActions[fi - 1];
  if (!act) return "";

  let tapsSoFar = 0;
  for (let i = 0; i < fi - 1; i++) {
    if (replayData.value.parsedActions[i]?.right) tapsSoFar++;
  }
  const curMapIndex = Math.min(
    tapsSoFar,
    (replayData.value.parsedMaps?.length ?? 1) - 1,
  );
  const nm = replayData?.value?.parsedMaps![curMapIndex]?.numberMap;

  const pos = nm?.get(act.idx);
  const c = pos ? pos.c + 1 : "?";
  const r = pos ? pos.r + 1 : "?";

  return `帧: ${fi}/${replayData.value.parsedActions.length} | 时间: ${act.time.toFixed(3)}s | 坐标: (${c}, ${r}) | 目标: ${act.idx} | ${act.right ? "正确" : "错误"}`;
});

function getActionPos(idx: number) {
  const data = replayData.value;
  if (!data) return { c: "?", r: "?" };
  let tapsSoFar = 0;
  for (let i = 0; i < idx; i++) {
    if (data.parsedActions[i]?.right) tapsSoFar++;
  }
  const curMapIndex = Math.min(tapsSoFar, (data.parsedMaps?.length ?? 1) - 1);
  const nm = data.parsedMaps![curMapIndex]?.numberMap;
  // @ts-ignore
  const pos = nm?.get(data?.parsedActions[idx].idx);
  return pos ? { c: pos.c + 1, r: pos.r + 1 } : { c: "?", r: "?" };
}
</script>

<template>
  <div class="schulte-player">
    <div v-if="loading" class="loading">加载录像中...</div>
    <div v-else-if="errorMsg" class="error">{{ errorMsg }}</div>
    <div v-else-if="replayData" class="player-container">
      <div class="player-info" v-if="replayData.user">
        <UserAvatar :user="replayData.user" :size="48" class="avatar" />
        <span class="nickname">{{ replayData.user.nickName }}</span>
      </div>

      <div class="info-panel">
        <div class="stat-item">
          <span>难度: </span>{{ replayData.row }} x {{ replayData.column }}
          {{ replayData.type === 1 ? "简单" : "普通" }}
          {{ replayData.maps ? "打乱" : "" }}
          {{ replayData.blind ? "盲玩" : "" }}
        </div>
        <div class="stat-item">
          <span>时长: </span>{{ (replayData.time / 1000).toFixed(3) }}s
        </div>
        <div class="stat-item">
          <span>点击: </span>{{ replayData.tapCorrect }}/{{ replayData.tap }}
        </div>
        <div class="stat-item">
          <span>反应时间: </span>{{ replayData.reactionTime }}ms
        </div>
        <div class="stat-item">
          <span>创建时间: </span
          >{{ new Date(replayData.createTime).toISOString() }}
        </div>
      </div>

      <div class="canvas-wrapper">
        <canvas ref="canvasRef"></canvas>
      </div>

      <div class="controls">
        <button @click="togglePlay" class="play-btn">
          {{ isPlaying ? "暂停" : currentTime >= totalTime ? "重播" : "播放" }}
        </button>
        <button @click="stepFrame(-1)" class="step-btn" title="上一帧">
          ◀
        </button>
        <button @click="stepFrame(1)" class="step-btn" title="下一帧">▶</button>
        <div class="progress-bar">
          <span>{{ currentTime.toFixed(3) }}</span>
          <input
            type="range"
            min="0"
            :max="totalTime"
            step="0.001"
            :value="currentTime"
            @input="seek"
          />
          <span>{{ totalTime.toFixed(3) }}</span>
        </div>
        <select v-model="playbackSpeed" class="speed-select">
          <option :value="0.5">0.5x</option>
          <option :value="1.0">1.0x</option>
          <option :value="2.0">2.0x</option>
          <option :value="5.0">5.0x</option>
        </select>
      </div>

      <div class="current-action">
        <strong>当前动作: </strong> {{ currentFrameActionInfo }}
      </div>

      <div class="actions-list">
        <h3>操作记录 ({{ replayData.parsedActions.length }})</h3>
        <div class="list-scroll">
          <div
            v-for="(act, idx) in replayData.parsedActions"
            :key="idx"
            :class="[
              'action-row',
              { active: Number(idx) < currentFrameIndex },
              { current: Number(idx) === currentFrameIndex - 1 },
            ]"
            @click="jumpToAction(Number(idx))"
          >
            {{ Number(idx) + 1 }}. [{{ act.time.toFixed(3) }}s] 目标:
            {{ act.idx }} 坐标: ({{ getActionPos(Number(idx)).c }},
            {{ getActionPos(Number(idx)).r }}) [{{
              act.right ? "正确" : "错误"
            }}]
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schulte-player {
  background: #1b1b1b;
  border-radius: 12px;
  padding: 20px;
  color: #fff;
  max-width: 900px;
  margin: 0 auto;
}
.loading,
.error {
  text-align: center;
  padding: 40px;
  font-size: 1.2rem;
}
.error {
  color: #ff4d4d;
}
.player-info {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ff8c00;
}
.nickname {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ff8c00;
}
.info-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  background: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
}
.stat-item {
  font-size: 0.95rem;
}
.stat-item span {
  color: #999;
}
.canvas-wrapper {
  overflow: auto;
  display: flex;
  justify-content: center;
  background: #333;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}
canvas {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}
.controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}
.play-btn {
  background: #ff8c00;
  border: none;
  color: #fff;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1rem;
}
.play-btn:hover {
  background: #e07b00;
}
.step-btn {
  background: #2a2a2a;
  border: 1px solid #444;
  color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.step-btn:hover {
  background: #444;
}
.progress-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}
.progress-bar input {
  flex: 1;
  cursor: pointer;
}
.speed-select {
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  padding: 5px 10px;
  border-radius: 5px;
}
.current-action {
  font-size: 1.1rem;
  margin-bottom: 15px;
  padding: 10px;
  background: #2a2a2a;
  border-radius: 5px;
}
.current-action strong {
  color: #ff8c00;
}
.actions-list {
  background: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
}
.actions-list h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1rem;
  color: #ccc;
}
.list-scroll {
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.9rem;
}
.action-row {
  padding: 5px;
  border-bottom: 1px solid #333;
  cursor: pointer;
}
.action-row:hover {
  background: rgba(255, 255, 255, 0.1);
}
.action-row.active {
  color: #aaa;
}
.action-row.current {
  background: rgba(255, 140, 0, 0.4);
  color: #fff;
  font-weight: bold;
}
</style>
