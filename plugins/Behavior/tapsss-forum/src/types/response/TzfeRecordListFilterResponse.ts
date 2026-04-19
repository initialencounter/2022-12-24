export interface TzfeRecordListFilterResponse {
  code: number;
  data: Datum[];
  msg: null;
  url: null;
}

export interface Datum {
  actions: null;
  beginMap: null;
  collect: boolean;
  column: number;
  createTime: number;
  id: number;
  map: string;
  maxValue: number;
  playCount: number;
  postId: number;
  row: number;
  score: number;
  scoreRank: number;
  scoreRankPercent: number;
  seed: number;
  stageTimes: string;
  time: number;
  timeRankPercent: number;
  timeTank: number;
  uid: string;
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
