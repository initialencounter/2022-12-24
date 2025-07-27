import { Schema } from "koishi";
import { Rule } from "./activeMsg";

export interface PostList {
  code: number;
  data: Datum[];
  msg: null;
  url: null;
}

export interface Datum {
  collect: boolean;
  commentCount: number;
  commentTime: number;
  createTime: number;
  device: null | string;
  essence: boolean;
  forum: null | string;
  goodCount: number;
  goodTime: null;
  goodUser: null;
  hasGood: boolean;
  id: number;
  lastComment: LastComment;
  minesweeperThemeId: number;
  minesweeperThemeScore: number;
  nonoRecord: null | NonoRecord;
  nonoThemeId: number;
  nonoThemeScore: number;
  puzzleRecord: null | PuzzleRecord;
  record: Record;
  recordId: number;
  recordType: number;
  schulteRecord: null | SchulteRecord;
  sourceUid: null;
  status: number;
  stick: number;
  text: null | string;
  title: null | string;
  tzfeRecord: TzfeRecord;
  uid: string;
  user: DatumUser;
  userStick: boolean;
  viewCount: number;
}

export interface LastComment {
  comment: string;
  createTime: number;
  device: null | string;
  goodCount: number;
  hasGood: boolean;
  id: number;
  parentId: number;
  picture: string;
  postId: number;
  replyCount: number;
  replyList: null;
  stick: boolean;
  uid: string;
  user: LastCommentUser;
}

export interface LastCommentUser {
  avatar: string;
  background: string;
  chaosInGame: boolean;
  chaosInView: boolean;
  country: null | string;
  id: number;
  mark: null | string;
  nickName: string;
  online: boolean;
  puzzleRank: number;
  pvpInGame: boolean;
  pvpInWait: boolean;
  relation: number;
  sex: number;
  sign: null | string;
  timingLevel: number;
  timingRank: number;
  uid: string;
  vip: boolean;
}

export interface PuzzleRecord {
  blind: boolean;
  column: number;
  id: number;
  row: number;
  step: number;
  time: number;
}

export interface Record {
  bvs: number;
  column: number;
  createTime: number;
  finished: boolean;
  id: number;
  mine: number;
  row: number;
  time: number;
}

export interface SchulteRecord {
    actions: null;
    blind: boolean;
    column: number;
    createTime: null;
    id: number;
    map: null;
    maps: null;
    playCount: number;
    postId: number;
    reactionTime: number;
    row: number;
    tap: number;
    tapCorrect: number;
    time: number;
    type: number;
    uid: null;
}

export interface NonoRecord {
    column: number;
    createTime: number;
    finishMode: number;
    handle: null;
    id: number;
    map: null;
    mine: number;
    mode: number;
    playCount: number;
    postId: number;
    row: number;
    themeId: number;
    time: number;
    type: number;
    uid: null;
    upload: boolean;
}

export interface TzfeRecord {
  actions: null;
  beginMap: null;
  column: number;
  createTime: null;
  id: number;
  map: null;
  maxValue: number;
  playCount: number;
  postId: number;
  row: number;
  score: number;
  seed: number;
  stageTimes: null;
  time: number;
  uid: null;
}

export interface DatumUser {
  avatar: null | string;
  background: null | string;
  chaosInGame: boolean;
  chaosInView: boolean;
  country: null | string;
  id: number;
  mark: null | string;
  nickName: string;
  online: boolean;
  puzzleRank: number;
  pvpInGame: boolean;
  pvpInWait: boolean;
  relation: number;
  sex: number;
  sign: null | string;
  timingLevel: number;
  timingRank: number;
  uid: string;
  vip: boolean;
}

export interface PostListConfig {
  rules: Rule[]
}

export const PostListConfig: Schema<PostListConfig> = Schema.object({
  rules: Schema.array(Rule).description('推送规则'),
}).description('帖子列表配置');
