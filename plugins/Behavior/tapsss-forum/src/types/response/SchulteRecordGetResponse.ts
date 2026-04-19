export interface SchulteRecordGetResponse {
  code: number;
  data: Data;
  msg: null;
  url: null;
}

export interface Data {
  actions: string;
  blind: boolean;
  collect: boolean;
  column: number;
  createTime: number;
  id: number;
  map: string;
  maps: string;
  playCount: number;
  postId: number;
  rank: number;
  rankPercent: number;
  reactionTime: number;
  row: number;
  tap: number;
  tapCorrect: number;
  time: number;
  type: number;
  uid: null;
  user: User;
}

export interface User {
  avatar: string;
  background: string;
  chaosInGame: boolean;
  chaosInView: boolean;
  country: string;
  id: number;
  mark: null;
  nickName: string;
  online: boolean;
  puzzleRank: number;
  pvpInGame: boolean;
  pvpInWait: boolean;
  relation: number;
  sex: number;
  sign: string;
  timingLevel: number;
  timingRank: number;
  uid: string;
  vip: boolean;
}

export interface SchulteActionRecord {
  idx: number;
  right: 0 | 1;
  time: number; // ms
}
