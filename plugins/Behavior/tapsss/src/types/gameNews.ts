export interface GameNews {
  code: number;
  data: Datum[];
  msg: null;
  url: null;
}

export interface Datum {
  createTime: number;
  id: number;
  recordId: number;
  recordType: number;
  route: null | string;
  text: string;
  uid: string;
  user: User;
}

export interface User {
  avatar: string;
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
