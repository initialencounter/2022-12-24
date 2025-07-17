import { Schema } from "koishi";
import { Rule } from "./activeMsg";

export interface GameNewsConfig {
  passLine: PassLine;
  rules: Rule[];
}
export const GameNewsConfig: Schema<GameNewsConfig> = Schema.object({
  passLine: Schema.lazy(() => PassLine).description('推送纪录配置'),
  rules: Schema.array(Rule).description('推送规则'),
}).description('游戏资讯服务配置');

export interface PassLine {
  minesweeper: {
    classic: {
      time: {
        beg: number;
        int: number;
        exp: number;
      },
      bvs: {
        beg: number;
        int: number;
        exp: number;
      }
    },
    endless: number;
  },
  schulteGrid: {
    simple: {
      '3x3': number,
      '4x4': number,
      '5x5': number,
      '6x6': number,
      '7x7': number,
      '8x8': number,
      '9x9': number,
      '10x10': number,
    },
    classic: {
      '3x3': number,
      '4x4': number,
      '5x5': number,
      '6x6': number,
      '7x7': number,
      '8x8': number,
      '9x9': number,
      '10x10': number,
    },
    simpleDisrupt: {
      '3x3': number,
      '4x4': number,
      '5x5': number,
      '6x6': number,
      '7x7': number,
      '8x8': number,
      '9x9': number,
      '10x10': number,
    },
    classicDisrupt: {
      '3x3': number,
      '4x4': number,
      '5x5': number,
      '6x6': number,
      '7x7': number,
      '8x8': number,
      '9x9': number,
      '10x10': number,
    },
  },
  puzzle: {
    classic: {
      '3x3': number,
      '4x4': number,
      '5x5': number,
      '6x6': number,
      '7x7': number,
      '8x8': number,
      '9x9': number,
      '10x10': number,
    },
    blind: {
      '3x3': number,
      '4x4': number,
      '5x5': number,
      '6x6': number,
      '7x7': number,
      '8x8': number,
      '9x9': number,
      '10x10': number,
    },

  },
  '2048': {
    time: {
      '3x3': number,
      '4x4': number,
      '5x5': number,
    },
    score: {
      '3x3': number,
      '4x4': number,
      '5x5': number,
    }
  },
  nonoSweeper: {
    beg: number;
    int: number;
    exp: number;
    exxp: number;
  }
}

export const PassLine: Schema<PassLine> = Schema.object({
  minesweeper: Schema.object({
    classic: Schema.object({
      time: Schema.object({
        beg: Schema.number().default(1).description('初级时间阈值'),
        int: Schema.number().default(15).description('中级时间阈值'),
        exp: Schema.number().default(60).description('高级时间阈值'),
      }),
      bvs: Schema.object({
        beg: Schema.number().default(7).description('初级3BV/s阈值'),
        int: Schema.number().default(4).description('中级3BV/s阈值'),
        exp: Schema.number().default(3).description('高级3BV/s阈值'),
      })
    }),
    endless: Schema.number().default(55).description('无尽模式关卡阈值'),
  }).description('扫雷推送配置'),
  schulteGrid: Schema.object({
    simple: Schema.object({
      '3x3': Schema.number().default(1.1),
      '4x4': Schema.number().default(2.2),
      '5x5': Schema.number().default(4.2),
      '6x6': Schema.number().default(9),
      '7x7': Schema.number().default(17),
      '8x8': Schema.number().default(30),
      '9x9': Schema.number().default(50),
      '10x10': Schema.number().default(90),
    }).description('简单模式'),
    classic: Schema.object({
      '3x3': Schema.number().default(1.1),
      '4x4': Schema.number().default(2.2),
      '5x5': Schema.number().default(4.4),
      '6x6': Schema.number().default(10),
      '7x7': Schema.number().default(20),
      '8x8': Schema.number().default(50),
      '9x9': Schema.number().default(100),
      '10x10': Schema.number().default(140),
    }).description('普通模式'),
    simpleDisrupt: Schema.object({
      '3x3': Schema.number().default(3.2),
      '4x4': Schema.number().default(7),
      '5x5': Schema.number().default(13),
      '6x6': Schema.number().default(23),
      '7x7': Schema.number().default(38),
      '8x8': Schema.number().default(60),
      '9x9': Schema.number().default(100),
      '10x10': Schema.number().default(140),
    }).description('简单打乱模式'),
    classicDisrupt: Schema.object({
      '3x3': Schema.number().default(3.8),
      '4x4': Schema.number().default(8.4),
      '5x5': Schema.number().default(17),
      '6x6': Schema.number().default(32),
      '7x7': Schema.number().default(60),
      '8x8': Schema.number().default(94),
      '9x9': Schema.number().default(150),
      '10x10': Schema.number().default(240),
    }).description('打乱模式'),
  }).description('舒尔特方格推送配置'),
  puzzle: Schema.object({
    classic: Schema.object({
      '3x3': Schema.number().default(0.3),
      '4x4': Schema.number().default(2),
      '5x5': Schema.number().default(7),
      '6x6': Schema.number().default(18),
      '7x7': Schema.number().default(30),
      '8x8': Schema.number().default(60),
      '9x9': Schema.number().default(90),
      '10x10': Schema.number().default(120),
    }).description('普通模式'),
    blind: Schema.object({
      '3x3': Schema.number().default(0.3),
      '4x4': Schema.number().default(3),
      '5x5': Schema.number().default(9),
      '6x6': Schema.number().default(36),
      '7x7': Schema.number().default(60),
      '8x8': Schema.number().default(120),
      '9x9': Schema.number().default(180),
      '10x10': Schema.number().default(240),
    }).description('盲拼模式'),
  }).description('数字华容道推送配置'),
  '2048': Schema.object({
    time: Schema.object({
      '3x3': Schema.number().default(12),
      '4x4': Schema.number().default(90),
      '5x5': Schema.number().default(560),
    }).description('时间模式'),
    score: Schema.object({
      '3x3': Schema.number().default(6600),
      '4x4': Schema.number().default(280000),
      '5x5': Schema.number().default(2000000),
    }).description('分数模式'),
  }).description('2048推送配置'),
  nonoSweeper: Schema.object({
    beg: Schema.number().default(2).description('初级'),
    int: Schema.number().default(20).description('中级'),
    exp: Schema.number().default(80).description('高级'),
    exxp: Schema.number().default(240).description('专家'),
  }).description('数织推送配置'),
}).description('推送纪录配置')
