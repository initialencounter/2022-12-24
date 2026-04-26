<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface RadarRenderInput {
    nickname: string
    ranks: number[]
}

interface ScoreRow {
    name: string
    rank: number
    score: string
    tierClass: string
    evaluationText: string
    evaluationTier: number
    outOfBounds: boolean
}

declare global {
    interface Window {
        __RADAR_INPUT__?: Partial<RadarRenderInput>
    }
}

const projectDisplayNames = ['扫雷', '舒尔特', '华容道', '2048', '数独', '数织']

const radarMainTitle = ref('我的六边形能力图')
const scoreRows = ref<ScoreRow[]>([])
const overallScore = ref('0.0')
const overallTitle = ref('迷你萌新')
const overallTier = ref(7)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let radarChartInstance: Chart<'radar'> | null = null
let currentRanks: number[] = [1, 1, 1, 1, 1, 1]

function sanitizeRank(value: unknown) {
    const parsed = Number.parseInt(String(value), 10)
    return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
}

function resolveRenderInput(): RadarRenderInput {
    const injected = window.__RADAR_INPUT__
    if (injected && typeof injected === 'object') {
        const nickname = String(injected.nickname || '').trim() || '探险者'
        const ranks = Array.isArray(injected.ranks) ? injected.ranks : []
        return {
            nickname,
            ranks: Array.from({ length: 6 }, (_, i) => sanitizeRank(ranks[i] ?? 1)),
        }
    }

    const params = new URLSearchParams(window.location.search)
    const nickname = (params.get('nickname') || '').trim() || '探险者'
    const rawRanksText = (params.get('ranks') || '').trim()
    const byList = rawRanksText ? rawRanksText.split(/[,\s]+/).filter(Boolean) : []
    const byKey = Array.from({ length: 6 }, (_, i) => params.get(`r${i + 1}`))
    const source = byList.length >= 6 ? byList : byKey

    return {
        nickname,
        ranks: Array.from({ length: 6 }, (_, i) => sanitizeRank(source[i] ?? 1)),
    }
}

function getRankTier(rank: number) {
    if (rank < 1) return 1
    if (rank <= 3) return 1
    if (rank <= 10) return 2
    if (rank <= 100) return 3
    if (rank <= 300) return 4
    if (rank <= 1000) return 5
    if (rank <= 3000) return 6
    return 7
}

function getTierClass(tier: number) {
    switch (tier) {
        case 1:
            return 'tier-1'
        case 2:
            return 'tier-2'
        case 3:
            return 'tier-3'
        case 4:
            return 'tier-4'
        case 5:
            return 'tier-5'
        case 6:
            return 'tier-6'
        default:
            return 'tier-7'
    }
}

function computeRawScore(rank: number) {
    if (rank < 1) rank = 1
    if (rank <= 10) {
        return 5 - (0.25 * (rank - 1)) / 9
    }
    if (rank <= 10000) {
        const log10r = Math.log10(rank)
        return 5 - 0.25 * Math.pow(log10r, 2)
    }
    return 1
}

function clampScore(raw: number) {
    return Math.min(5, Math.max(0, raw))
}

function getEvaluation(rank: number, projectIndex: number) {
    const titlePrefixes = ['雷', '舒尔特', '华容', '2048', '数独', '织']
    const prefix = titlePrefixes[projectIndex] || ''

    if (rank === 1) return { text: `🥇${prefix} 帝`, tier: 1 }
    if (rank === 2) return { text: `🥈${prefix} 帝`, tier: 1 }
    if (rank === 3) return { text: `🥉${prefix} 帝`, tier: 1 }
    if (rank <= 10) return { text: `${prefix}圣`, tier: 2 }
    if (rank <= 100) return { text: `${prefix}神`, tier: 3 }
    if (rank <= 300) return { text: '顶尖', tier: 4 }
    if (rank <= 1000) return { text: '人上人', tier: 5 }
    if (rank <= 3000) return { text: 'NPC', tier: 6 }
    return { text: '小萌新', tier: 7 }
}

function getOverallTitle(score: number) {
    if (score >= 90) return { text: '至尊萌帝', tier: 1 }
    if (score >= 85) return { text: '闪耀萌圣', tier: 2 }
    if (score >= 80) return { text: '传说萌神', tier: 3 }
    if (score >= 75) return { text: '英勇萌将', tier: 4 }
    if (score >= 70) return { text: '梦幻萌侠', tier: 5 }
    if (score >= 65) return { text: '软糯萌豆', tier: 6 }
    if (score >= 60) return { text: '可爱萌芽', tier: 7 }
    return { text: '迷你萌新', tier: 7 }
}

function renderOverallEvaluation(clampedScores: number[]) {
    const weights = [5, 3.5, 4.5, 3, 1, 3]
    const weightedScore = weights.reduce((acc, weight, index) => {
        return acc + (clampedScores[index] || 0) * weight
    }, 0)
    const finalScore = Math.max(0, Math.min(100, Math.sqrt(weightedScore) * 10))
    const title = getOverallTitle(finalScore)

    overallScore.value = finalScore.toFixed(1)
    overallTitle.value = title.text
    overallTier.value = title.tier
}

function updateTitles(nickname: string) {
    const nick = nickname.trim() || '我的'
    radarMainTitle.value = `${nick} 的六边形能力图`
}

function renderScoreList(ranks: number[], rawScores: number[]) {
    scoreRows.value = projectDisplayNames.map((name, i) => {
        const rank = ranks[i]
        const raw = rawScores[i]
        const tier = getRankTier(rank)
        const evaluation = getEvaluation(rank, i)

        return {
            name,
            rank,
            score: raw.toFixed(2),
            tierClass: getTierClass(tier),
            evaluationText: evaluation.text,
            evaluationTier: evaluation.tier,
            outOfBounds: raw < 0 || raw > 5,
        }
    })
}

function getRankByIndex(index: number) {
    if (index >= 0 && index < currentRanks.length) {
        return sanitizeRank(currentRanks[index])
    }
    return 1
}

function renderRadarChart(dataValues: number[]) {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gradient = ctx.createLinearGradient(0, 0, 0, 400)
    gradient.addColorStop(0, 'rgba(34, 211, 238, 0.42)')
    gradient.addColorStop(0.45, 'rgba(59, 130, 246, 0.38)')
    gradient.addColorStop(1, 'rgba(168, 85, 247, 0.18)')

    if (!radarChartInstance) {
        radarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: projectDisplayNames,
                datasets: [
                    {
                        label: '能力分数',
                        data: dataValues,
                        backgroundColor: gradient,
                        borderColor: '#67e8f9',
                        borderWidth: 3.5,
                        pointBackgroundColor(context) {
                            const rank = getRankByIndex(context.dataIndex)
                            const tier = getRankTier(rank)
                            const colorMap: Record<number, string> = {
                                1: '#67e8f9',
                                2: '#38bdf8',
                                3: '#60a5fa',
                                4: '#818cf8',
                                5: '#c084fc',
                            }
                            return colorMap[tier] || '#67e8f9'
                        },
                        pointBorderColor: '#e0f2fe',
                        pointBorderWidth: 3,
                        pointRadius: 7,
                        pointHoverRadius: 12,
                        pointHoverBackgroundColor: '#f8fafc',
                        pointHoverBorderColor: '#22d3ee',
                        tension: 0.05,
                        fill: true,
                    },
                ],
            },
            plugins: [
                {
                    id: 'valueLabels',
                    afterDatasetsDraw(chart) {
                        const dataset = chart.data.datasets[0]
                        const meta = chart.getDatasetMeta(0)
                        chart.ctx.save()
                        chart.ctx.font = '800 24px Segoe UI, Inter, system-ui, sans-serif'
                        chart.ctx.fillStyle = '#e0f2fe'
                        chart.ctx.strokeStyle = 'rgba(2,6,23,0.85)'
                        chart.ctx.lineWidth = 3
                        chart.ctx.textAlign = 'center'
                        chart.ctx.textBaseline = 'middle'

                        meta.data.forEach((point, index) => {
                            const value = Number(dataset.data[index]).toFixed(2)
                            const pos = point.getProps(['x', 'y'], true)
                            const offsetY = pos.y - 22
                            chart.ctx.strokeText(value, pos.x, offsetY)
                            chart.ctx.fillText(value, pos.x, offsetY)
                        })
                        chart.ctx.restore()
                    },
                },
            ],
            options: {
                responsive: true,
                maintainAspectRatio: true,
                layout: { padding: 4 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#020617',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        borderColor: '#67e8f9',
                        borderWidth: 1.5,
                        padding: 10,
                        callbacks: {
                            label(context) {
                                const label = context.label || ''
                                const val = Number(context.raw)
                                const rank = getRankByIndex(context.dataIndex)
                                const rawScore = computeRawScore(rank)
                                return `${label} : ${val.toFixed(2)} (原始: ${rawScore.toFixed(2)}) 排名 #${rank}`
                            },
                        },
                    },
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        min: 0,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            color: '#bfdbfe',
                            backdropColor: 'transparent',
                            font: { weight: '700', size: 14 },
                        },
                        grid: {
                            color: 'rgba(96,165,250,0.28)',
                            circular: false,
                            lineWidth: 1.3,
                        },
                        angleLines: { color: 'rgba(96,165,250,0.36)', lineWidth: 1.6 },
                        pointLabels: {
                            color: '#dbeafe',
                            font: { weight: '900', size: 26 },
                            padding: 15,
                        },
                    },
                },
                elements: { line: { borderWidth: 3.5 } },
            },
        })
        return
    }

    radarChartInstance.data.datasets[0].data = dataValues
    radarChartInstance.data.datasets[0].backgroundColor = gradient
    radarChartInstance.data.datasets[0].pointBackgroundColor = (context) => {
        const rank = getRankByIndex(context.dataIndex)
        const tier = getRankTier(rank)
        const colorMap: Record<number, string> = {
            1: '#67e8f9',
            2: '#38bdf8',
            3: '#60a5fa',
            4: '#818cf8',
            5: '#c084fc',
        }
        return colorMap[tier] || '#67e8f9'
    }
    radarChartInstance.update()
}

function fullUpdate(input: RadarRenderInput) {
    updateTitles(input.nickname)
    currentRanks = input.ranks.map(sanitizeRank)
    const rawScores = currentRanks.map((r) => computeRawScore(r))
    const clampedScores = rawScores.map((s) => clampScore(s))

    renderScoreList(currentRanks, rawScores)
    renderOverallEvaluation(clampedScores)
    renderRadarChart(clampedScores)
}

const handleResize = () => {
    if (radarChartInstance) radarChartInstance.update()
}

onMounted(() => {
    fullUpdate(resolveRenderInput())
    window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    radarChartInstance?.destroy()
    radarChartInstance = null
})
</script>

<template>
    <div class="new-view">
        <div class="dashboard">
            <div class="header-row">
                <div class="title-section">
                    <h1>
                        <span>⚡</span>
                        <span>{{ radarMainTitle }}</span>
                    </h1>
                </div>
            </div>

            <div class="main-layout">
                <div class="chart-panel">
                    <div class="chart-body">
                        <div class="chart-side">
                            <div class="canvas-wrapper">
                                <canvas ref="canvasRef"></canvas>
                            </div>
                        </div>

                        <div class="score-detail chart-score-box">
                            <div class="detail-header">
                                <span>项目</span>
                                <span>排名 / 分数 / 评价</span>
                            </div>
                            <div class="project-list">
                                <div
                                    v-for="row in scoreRows"
                                    :key="row.name"
                                    class="project-row"
                                    :class="row.tierClass"
                                >
                                    <span class="project-name">{{ row.name }}</span>
                                    <span class="score-meta">
                                        <span class="rank-badge">#{{ row.rank }}</span>
                                        <span class="score-value" :class="{ 'out-of-bounds': row.outOfBounds }">{{ row.score }}</span>
                                        <span class="evaluation-chip" :class="`eval-tier-${row.evaluationTier}`">{{ row.evaluationText }}</span>
                                    </span>
                                </div>
                            </div>

                            <div class="overall-eval-box">
                                <div class="overall-eval-title">综合评价</div>
                                <div class="overall-eval-content">
                                    <span class="overall-score">综合得分：{{ overallScore }}</span>
                                    <span class="overall-title-chip" :class="`overall-tier-${overallTier}`">{{ overallTitle }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', 'Inter', system-ui, sans-serif;
}

.new-view {
    min-height: 100vh;
    background:
        radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.22), transparent 28%),
        radial-gradient(circle at 80% 18%, rgba(14, 165, 233, 0.16), transparent 24%),
        radial-gradient(circle at 50% 80%, rgba(37, 99, 235, 0.18), transparent 30%),
        linear-gradient(180deg, #020617 0%, #05112b 48%, #030712 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: #e2e8f0;
}

.dashboard {
    max-width: 1320px;
    width: 100%;
    background: linear-gradient(180deg, rgba(8, 15, 36, 0.88), rgba(4, 10, 25, 0.92));
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
    border-radius: 48px;
    box-shadow: 0 30px 60px -18px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    padding: 32px;
    border: 1px solid rgba(96, 165, 250, 0.18);
}

.header-row {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 30px;
    margin-bottom: 30px;
}

.title-section {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 30px;
    flex: 1 1 100%;
}

h1 {
    font-weight: 650;
    font-size: 3rem;
    letter-spacing: -0.01em;
    color: #eff6ff;
    display: flex;
    align-items: center;
    gap: 8px;
    text-align: center;
}

.main-layout {
    display: flex;
    flex-direction: column;
    gap: 26px;
    align-items: center;
}

.project-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.chart-panel {
    background: rgba(12, 18, 34, 0.72);
    backdrop-filter: blur(8px);
    border-radius: 40px;
    padding: 10px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 18px 36px -18px rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(96, 165, 250, 0.16);
    display: flex;
    flex-direction: column;
    width: min(92vw, 1400px);
    max-width: min(92vw, 1400px);
}

.chart-body {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(340px, 1fr);
    gap: 14px;
    align-items: stretch;
    min-height: 66vh;
    height: auto;
}

.chart-side {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    height: 100%;
}

.canvas-wrapper {
    position: relative;
    width: 85%;
    height: auto;
    aspect-ratio: 1 / 1;
    max-width: 85%;
    margin: 0 auto;
}

canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
    border-radius: 24px;
    background: radial-gradient(circle at center, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.96));
    backdrop-filter: blur(2px);
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.12), 0 0 36px rgba(37, 99, 235, 0.18), inset 0 0 56px rgba(56, 189, 248, 0.08);
}

.score-detail {
    margin-top: 0;
    background: linear-gradient(180deg, rgba(4, 10, 28, 0.96), rgba(10, 18, 44, 0.92));
    border-radius: 26px;
    padding: 14px 10px;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(103, 232, 249, 0.58);
    box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.18), 0 0 18px rgba(34, 211, 238, 0.18), 0 0 34px rgba(59, 130, 246, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.detail-header {
    display: flex;
    justify-content: flex-start;
    font-weight: 650;
    color: #bffcff;
    padding-bottom: 12px;
    border-bottom: 2px dashed rgba(103, 232, 249, 0.6);
    margin-bottom: 14px;
    font-size: 1.875rem;
    line-height: 1.15;
    text-shadow: 0 0 10px rgba(34, 211, 238, 0.35);
}

.detail-header span {
    flex: 1;
    text-align: center;
}

.detail-header span:first-child,
.detail-header span:nth-child(2) {
    text-align: left;
}

.project-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 10px 10px 16px;
    min-height: 78px;
    border-radius: 18px;
    transition: all 0.15s;
    font-weight: 500;
    color: #e2e8f0;
    border: 1px solid rgba(125, 211, 252, 0.18);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03), 0 0 12px rgba(56, 189, 248, 0.06);
}

.project-row:hover {
    transform: translateY(-1px);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 0 1px rgba(103, 232, 249, 0.12), 0 0 18px rgba(34, 211, 238, 0.16);
}

.tier-1 { background: linear-gradient(90deg, rgba(255, 215, 0, 0.28), rgba(255, 236, 179, 0.16)); border-left: 6px solid rgba(255, 215, 0, 0.88); box-shadow: inset 0 0 16px rgba(255, 215, 0, 0.08); }
.tier-2 { background: linear-gradient(90deg, rgba(74, 20, 140, 0.3), rgba(106, 27, 154, 0.16)); border-left: 6px solid rgba(106, 27, 154, 0.88); box-shadow: inset 0 0 16px rgba(74, 20, 140, 0.08); }
.tier-3 { background: linear-gradient(90deg, rgba(156, 39, 176, 0.3), rgba(186, 104, 200, 0.16)); border-left: 6px solid rgba(186, 104, 200, 0.88); box-shadow: inset 0 0 16px rgba(156, 39, 176, 0.08); }
.tier-4 { background: linear-gradient(90deg, rgba(125, 211, 252, 0.28), rgba(186, 230, 253, 0.16)); border-left: 6px solid rgba(56, 189, 248, 0.88); box-shadow: inset 0 0 16px rgba(56, 189, 248, 0.08); }
.tier-5 { background: linear-gradient(90deg, rgba(0, 150, 136, 0.3), rgba(77, 182, 172, 0.16)); border-left: 6px solid rgba(77, 182, 172, 0.88); box-shadow: inset 0 0 16px rgba(0, 150, 136, 0.08); }
.tier-6 { background: linear-gradient(90deg, rgba(139, 195, 74, 0.3), rgba(197, 225, 165, 0.16)); border-left: 6px solid rgba(139, 195, 74, 0.88); box-shadow: inset 0 0 16px rgba(139, 195, 74, 0.08); }
.tier-7 { background: linear-gradient(90deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.16)); border-left: 6px solid rgba(255, 152, 0, 0.88); box-shadow: inset 0 0 16px rgba(255, 152, 0, 0.08); }

.project-name {
    font-weight: 650;
    min-width: 88px;
    flex: 1;
    color: #f8fafc;
    font-size: 2rem;
    line-height: 1.2;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', 'Segoe UI', sans-serif;
}

.rank-badge {
    font-weight: 700;
    padding: 0 12px;
    border-radius: 40px;
    background: rgba(8, 14, 32, 0.9);
    box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.08), 0 0 10px rgba(34, 211, 238, 0.12);
    min-width: 64px;
    height: 42px;
    text-align: center;
    margin-left: 0;
    border: 1px solid rgba(103, 232, 249, 0.18);
    font-size: 1.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    white-space: nowrap;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', 'Segoe UI', sans-serif;
    font-variant-numeric: tabular-nums;
}

.score-value {
    font-weight: 700;
    min-width: 66px;
    height: 42px;
    text-align: right;
    padding: 0 12px;
    border-radius: 40px;
    background: rgba(8, 14, 32, 0.9);
    font-feature-settings: 'tnum';
    margin-left: 0;
    border: 1px solid rgba(125, 211, 252, 0.18);
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
    font-size: 1.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    white-space: nowrap;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', 'Segoe UI', sans-serif;
    font-variant-numeric: tabular-nums;
}

.score-value.out-of-bounds {
    color: #b91c1c !important;
    background: #fee2e2 !important;
    font-weight: 700;
}

.evaluation-chip {
    min-width: 76px;
    height: 42px;
    padding: 0 10px;
    border-radius: 999px;
    text-align: center;
    font-size: 1.5rem;
    font-weight: 700;
    margin-left: 0;
    color: #001018;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', 'Segoe UI', sans-serif;
    border: 1px solid rgba(255, 255, 255, 0.28);
    box-shadow: 0 0 14px rgba(103, 232, 249, 0.18);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    white-space: nowrap;
}

.eval-tier-1 { background: linear-gradient(135deg, #ffd700, #ffecb3); box-shadow: 0 0 16px rgba(255, 215, 0, 0.34); }
.eval-tier-2 { background: linear-gradient(135deg, #4a148c, #6a1b9a); box-shadow: 0 0 16px rgba(74, 20, 140, 0.28); color: #f8fafc; }
.eval-tier-3 { background: linear-gradient(135deg, #9c27b0, #ba68c8); box-shadow: 0 0 16px rgba(156, 39, 176, 0.28); color: #f8fafc; }
.eval-tier-4 { background: linear-gradient(135deg, #23b9ff, #67c6fa); box-shadow: 0 0 16px rgba(56, 189, 248, 0.28); color: #082f49; }
.eval-tier-5 { background: linear-gradient(135deg, #009688, #4db6ac); box-shadow: 0 0 16px rgba(0, 150, 136, 0.26); color: #f8fafc; }
.eval-tier-6 { background: linear-gradient(135deg, #7abe2d, #b1ce8f); box-shadow: 0 0 16px rgba(139, 195, 74, 0.24); }
.eval-tier-7 { background: linear-gradient(135deg, #ffdc75, #fde5c1); box-shadow: 0 0 16px rgba(255, 152, 0, 0.24); color: #402100; }

.score-meta {
    flex: 0 0 420px;
    display: grid;
    grid-template-columns: 120px 120px 160px;
    align-items: center;
    justify-content: end;
    justify-items: stretch;
    gap: 10px;
    white-space: nowrap;
}

.overall-eval-box {
    margin-top: 12px;
    background: rgba(15, 23, 42, 0.78);
    border: 1px solid rgba(96, 165, 250, 0.2);
    border-radius: 18px;
    padding: 12px 14px;
}

.overall-eval-title {
    font-size: 2rem;
    color: #bfdbfe;
    margin-bottom: 8px;
    font-weight: 700;
}

.overall-eval-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.overall-score {
    font-size: 2rem;
    font-weight: 800;
    color: #e0f2fe;
    letter-spacing: 0.2px;
}

.overall-title-chip {
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 2rem;
    font-weight: 800;
    color: #0f172a;
    white-space: nowrap;
    font-family: 'STKaiti', 'KaiTi', 'FangSong', 'Segoe UI', serif;
}

.overall-tier-1 { background: linear-gradient(135deg, #ffd700, #ffecb3); box-shadow: 0 0 16px rgba(255, 215, 0, 0.34); color: #2b1600; }
.overall-tier-2 { background: linear-gradient(135deg, #4a148c, #6a1b9a); box-shadow: 0 0 16px rgba(74, 20, 140, 0.28); color: #f8fafc; }
.overall-tier-3 { background: linear-gradient(135deg, #9c27b0, #ba68c8); box-shadow: 0 0 16px rgba(156, 39, 176, 0.28); color: #f8fafc; }
.overall-tier-4 { background: linear-gradient(135deg, #7dd3fc, #bae6fd); box-shadow: 0 0 16px rgba(56, 189, 248, 0.28); color: #082f49; }
.overall-tier-5 { background: linear-gradient(135deg, #009688, #4db6ac); box-shadow: 0 0 16px rgba(0, 150, 136, 0.26); color: #f8fafc; }
.overall-tier-6 { background: linear-gradient(135deg, #8bc34a, #c5e1a5); box-shadow: 0 0 16px rgba(139, 195, 74, 0.24); color: #1b2a0d; }
.overall-tier-7 { background: linear-gradient(135deg, #ffc107, #ff9800); box-shadow: 0 0 16px rgba(255, 152, 0, 0.24); color: #402100; }

@media (max-width: 1100px) {
    .chart-panel {
        width: 100%;
        max-width: 100%;
    }

    .chart-body {
        grid-template-columns: 1fr;
        min-height: 520px;
    }

    .chart-side {
        min-height: 520px;
    }
}

@media (max-width: 800px) {
    .new-view {
        padding: 12px;
    }

    .dashboard {
        padding: 20px;
    }

    .title-section {
        flex-wrap: wrap;
    }

    h1 {
        font-size: 2rem;
    }

    .detail-header {
        font-size: 1.3rem;
    }

    .project-name,
    .overall-score,
    .overall-title-chip,
    .overall-eval-title {
        font-size: 1.1rem;
    }

    .score-meta {
        flex: 0 0 auto;
        grid-template-columns: 88px 88px 120px;
        gap: 6px;
    }

    .rank-badge,
    .score-value,
    .evaluation-chip {
        min-width: auto;
        font-size: 1rem;
        height: 36px;
    }
}
</style>