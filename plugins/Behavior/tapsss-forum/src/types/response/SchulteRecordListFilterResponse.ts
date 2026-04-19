export interface SchulteRecordListFilterResponse {
  code: number;
  data: Datum[];
  msg: null;
  url: null;
}

export interface Datum {
  actions: null;
  blind: boolean;
  collect: boolean;
  column: number;
  createTime: number;
  id: number;
  map: null;
  maps: null;
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
  background: null;
  chaosInGame: boolean;
  chaosInView: boolean;
  country: null;
  id: number;
  mark: null;
  nickName: string;
  online: boolean;
  puzzleRank: number;
  pvpInGame: boolean;
  pvpInWait: boolean;
  relation: number;
  sex: number;
  sign: null;
  timingLevel: number;
  timingRank: number;
  uid: string;
  vip: boolean;
}
