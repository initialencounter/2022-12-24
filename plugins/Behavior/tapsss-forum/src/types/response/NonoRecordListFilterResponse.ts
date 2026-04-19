export interface NonoRecordListFilterResponse {
  code: number;
  data: Datum[];
  msg: null;
  url: null;
}

export interface Datum {
  collect: boolean;
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
  rank: number;
  rankPercent: number;
  row: number;
  themeId: number;
  time: number;
  type: number;
  uid: string;
  upload: boolean;
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
