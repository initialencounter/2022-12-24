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
import { parsePuzzleReplayHandle } from "../utils/replayParser";
import { puzzleRecordGetResponse } from "../api";
import { getCachedRecord, cacheRecord } from "@/utils/recordCache";
import type {
  PuzzleRecordGetResponse,
  Data,
  PuzzleActionRecord,
} from "@/types/response/PuzzleRecordGetResponse";

const BG_COLOR = [
  ["#707070", "#707070", "#707070", "#707070", "#707070", "#707070", "#707070", "#707070", "#707070", "#707070"],
  ["#444444", "#00C91A", "#00C91A", "#00C91A", "#00C91A", "#00C91A", "#00C91A", "#00C91A", "#00C91A", "#00C91A"],
  ["#444444", "#038317", "#006FFF", "#006FFF", "#006FFF", "#006FFF", "#006FFF", "#006FFF", "#006FFF", "#006FFF"],
  ["#444444", "#038317", "#001EE1", "#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000"],
  ["#444444", "#038317", "#001EE1", "#BA0100", "#FFA400", "#FFA400", "#FFA400", "#FFA400", "#FFA400", "#FFA400"],
  ["#444444", "#038317", "#001EE1", "#BA0100", "#CF8800", "#FFFB00", "#FFFB00", "#FFFB00", "#FFFB00", "#FFFB00"],
  ["#444444", "#038317", "#001EE1", "#BA0100", "#CF8800", "#B2AF00", "#06BB00", "#06BB00", "#06BB00", "#06BB00"],
  ["#444444", "#038317", "#001EE1", "#BA0100", "#CF8800", "#B2AF00", "#06BB00", "#34CCFF", "#34CCFF", "#34CCFF"],
  ["#444444", "#038317", "#001EE1", "#BA0100", "#CF8800", "#B2AF00", "#06BB00", "#34CCFF", "#6C2E8F", "#6C2E8F"],
  ["#444444", "#038317", "#001EE1", "#BA0100", "#CF8800", "#B2AF00", "#06BB00", "#34CCFF", "#6C2E8F", "#000000"],
];

const FONT_COLOR = [
  ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF"],
  ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF"],
  ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF"],
  ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"],
  ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"],
  ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"],
  ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"],
  ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"],
  ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"],
  ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"],
];

interface TileMove {
  num: number;
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
}

interface MoveInfo {
  tiles: TileMove[];
}

interface PlayData extends Data {
  parsedActions: PuzzleActionRecord[];
  boardSnapshots: number[][][];
  moveInfos: MoveInfo[];
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

let cellSize = 80;
const cellPadding = 3;
const borderRadius = 8;

let rafId: number | null = null;
let lastRenderedTime = -1;

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
    const source = offlineCtx.createBufferSource();
    source.buffer = flagBuffer;
    const gain = offlineCtx.createGain();
    gain.gain.value = 0.5;
    source.connect(gain);
    gain.connect(offlineCtx.destination);
    source.start(act.time);
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

const currentFrameIndex = computed(() => {
  if (!replayData.value) return 0;

  if (currentTime.value <= 0) return 0;

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

function parseMap(mapStr: string): number[][] {
  return mapStr.split("-").map((row) => row.split(":").map(Number));
}

function getTileColor(
  n: number,
  cols: number,
): { bg: string; fg: string } {
  if (n === 0) return { bg: "#1a1a1a", fg: "#fff" };
  const targetR = Math.floor((n - 1) / cols);
  const targetC = (n - 1) % cols;
  return {
    bg: BG_COLOR[targetR]?.[targetC] ?? "#444",
    fg: FONT_COLOR[targetR]?.[targetC] ?? "#fff",
  };
}

function computeSnapshots(
  initialBoard: number[][],
  actions: PuzzleActionRecord[],
  rows: number,
  cols: number,
) {
  const boardSnapshots: number[][][] = [];
  const moveInfos: MoveInfo[] = [];

  const board = initialBoard.map((row) => [...row]);
  boardSnapshots.push(board.map((row) => [...row]));

  let blankR = -1,
    blankC = -1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r]![c] === 0) {
        blankR = r;
        blankC = c;
      }
    }
  }

  for (const act of actions) {
    const targetR = act.row;
    const targetC = act.column;
    const tiles: TileMove[] = [];

    if (blankR === targetR && blankC !== targetC) {
      // Horizontal slide
      const dir = targetC > blankC ? 1 : -1;
      for (
        let c = blankC + dir;
        dir > 0 ? c <= targetC : c >= targetC;
        c += dir
      ) {
        tiles.push({
          num: board[blankR]![c]!,
          fromR: blankR,
          fromC: c,
          toR: blankR,
          toC: c - dir,
        });
      }
      if (dir > 0) {
        for (let c = blankC; c < targetC; c++) {
          board[blankR]![c] = board[blankR]![c + 1]!;
        }
      } else {
        for (let c = blankC; c > targetC; c--) {
          board[blankR]![c] = board[blankR]![c - 1]!;
        }
      }
      board[blankR]![targetC] = 0;
    } else if (blankC === targetC && blankR !== targetR) {
      // Vertical slide
      const dir = targetR > blankR ? 1 : -1;
      for (
        let r = blankR + dir;
        dir > 0 ? r <= targetR : r >= targetR;
        r += dir
      ) {
        tiles.push({
          num: board[r]![blankC]!,
          fromR: r,
          fromC: blankC,
          toR: r - dir,
          toC: blankC,
        });
      }
      if (dir > 0) {
        for (let r = blankR; r < targetR; r++) {
          board[r]![blankC] = board[r + 1]![blankC]!;
        }
      } else {
        for (let r = blankR; r > targetR; r--) {
          board[r]![blankC] = board[r - 1]![blankC]!;
        }
      }
      board[targetR]![blankC] = 0;
    }

    blankR = targetR;
    blankC = targetC;
    moveInfos.push({ tiles });
    boardSnapshots.push(board.map((row) => [...row]));
  }

  return { boardSnapshots, moveInfos };
}

async function loadReplay() {
  try {
    loading.value = true;
    errorMsg.value = "";
    const recordIdNum = Number(props.recordId);
    const cached = await getCachedRecord<PuzzleRecordGetResponse>('puzzle', recordIdNum);
    const res: PuzzleRecordGetResponse = cached ?? await puzzleRecordGetResponse(recordIdNum);
    if (!cached && res.code === 200) {
      cacheRecord('puzzle', recordIdNum, res);
    }

    if (res.code === 200 && res.data) {
      const data = res.data;
      const rawActions = parsePuzzleReplayHandle(data.action);
      const parsedActions = rawActions.map((a) => ({
        ...a,
        time: a.time / 1000,
      }));

      const initialBoard = parseMap(data.map);
      const { boardSnapshots, moveInfos } = computeSnapshots(
        initialBoard,
        parsedActions,
        data.row,
        data.column,
      );

      replayData.value = {
        ...data,
        parsedActions,
        boardSnapshots,
        moveInfos,
      };

      totalTime.value = data.time / 1000;
      cellSize = Math.min(
        100,
        Math.floor(500 / Math.max(data.row, data.column)),
      );

      loading.value = false;
      await initAudio();
      await renderAudioTrack();
      await nextTick();
      initCanvas();
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

function drawRoundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.arcTo(x + w, y, x + w, y + r, r);
  g.lineTo(x + w, y + h - r);
  g.arcTo(x + w, y + h, x + w - r, y + h, r);
  g.lineTo(x + r, y + h);
  g.arcTo(x, y + h, x, y + h - r, r);
  g.lineTo(x, y + r);
  g.arcTo(x, y, x + r, y, r);
  g.closePath();
}

function drawTile(
  g: CanvasRenderingContext2D,
  num: number,
  x: number,
  y: number,
  cols: number,
) {
  const p = cellPadding;
  const { bg, fg } = getTileColor(num, cols);

  g.fillStyle = bg;
  drawRoundRect(
    g,
    x + p,
    y + p,
    cellSize - p * 2,
    cellSize - p * 2,
    borderRadius,
  );
  g.fill();

  g.fillStyle = fg;
  const fontSize = num >= 10 ? cellSize * 0.32 : cellSize * 0.4;
  g.font = `bold ${fontSize}px Arial`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(num.toString(), x + cellSize / 2, y + cellSize / 2);
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

  // Clear
  g.fillStyle = "#1a1a1a";
  g.fillRect(0, 0, cols * cellSize, rows * cellSize);

  const board = data.boardSnapshots[fi];
  if (!board) return;

  // Draw static tiles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = board[r]![c]!;
      if (val === 0) continue;
      drawTile(g, val, c * cellSize, r * cellSize, cols);
    }
  }
}

function tick() {
  if (!isPlaying.value || !audioCtx) return;

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
  if (fi === 0) return "等待操作";
  const act = replayData.value.parsedActions[fi - 1];
  if (!act) return "";

  const moveInfo = replayData.value.moveInfos[fi - 1];
  const tileNums = moveInfo?.tiles.map((t) => t.num).join(", ") ?? "";

  return `帧: ${fi}/${replayData.value.parsedActions.length} | 时间: ${act.time.toFixed(3)}s | 空白→(${act.column + 1}, ${act.row + 1}) | 移动: [${tileNums}]`;
});

function getActionDesc(idx: number) {
  const data = replayData.value;
  if (!data) return "";
  const act = data.parsedActions[idx];
  if (!act) return "";
  const moveInfo = data.moveInfos[idx];
  const tiles = moveInfo?.tiles.map((t) => t.num).join(",") ?? "";
  return `[${act.time.toFixed(3)}s] 空白→(${act.column + 1}, ${act.row + 1}) 移动: [${tiles}]`;
}
</script>

<template>
  <div class="puzzle-player">
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
          {{ replayData.swipe ? "滑动" : "点击" }}
          {{ replayData.blind ? "盲拼" : "" }}
        </div>
        <div class="stat-item">
          <span>时长: </span>{{ (replayData.time / 1000).toFixed(3) }}s
        </div>
        <div class="stat-item">
          <span>步数: </span>{{ replayData.step }}
        </div>
        <div class="stat-item">
          <span>观察时间: </span>{{ replayData.observeTime }}ms
        </div>
        <div class="stat-item">
          <span>排名: </span>#{{ replayData.rank }} ({{
            (replayData.rankPercent * 100).toFixed(1)
          }}%)
        </div>
        <div class="stat-item">
          <span>创建时间: </span
          >{{ new Date(replayData.createTime).toLocaleString() }}
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
          <option :value="0.25">0.25x</option>
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
            {{ Number(idx) + 1 }}. {{ getActionDesc(Number(idx)) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.puzzle-player {
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
