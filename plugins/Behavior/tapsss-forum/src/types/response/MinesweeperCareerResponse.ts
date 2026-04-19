export interface MinesweeperCareerResponse {
  code: number;
  data: Data;
  msg: null;
  url: null;
}

export interface Data {
  begBvsRank: null;
  begTimeRank: BegTimeRank;
  expBvsRank: null;
  expTimeRank: ExpTimeRank;
  intBvsRank: null;
  intTimeRank: IntTimeRank;
  statistics: null;
  totalBvsRank: null;
  totalTimeRank: TotalTimeRank;
  user: null;
}

export interface BegTimeRank {
  bvs: number;
  createTime: number;
  exp: number;
  level: number;
  lose: number;
  movesArray: null;
  rank: number;
  rankHistory: number;
  record: BegTimeRankRecord;
  recordId: number;
  score: number;
  stage: number;
  time: number;
  timeArray: null;
  timeBeg: number;
  timeExp: number;
  timeInt: number;
  timePro: number;
  uid: string;
  user: BegTimeRankUser;
  win: number;
}

export interface BegTimeRankRecord {
  bvs: number;
  column: number;
  createTime: number;
  finished: boolean;
  id: number;
  mine: number;
  row: number;
  time: number;
}

export interface BegTimeRankUser {
  avatar: string;
  background: string;
  chaosInGame: boolean;
  chaosInView: boolean;
  country: string;
  id: number;
  mark: string;
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

export interface ExpTimeRank {
  bvs: number;
  createTime: number;
  exp: number;
  level: number;
  lose: number;
  movesArray: null;
  rank: number;
  rankHistory: number;
  record: ExpTimeRankRecord;
  recordId: number;
  score: number;
  stage: number;
  time: number;
  timeArray: null;
  timeBeg: number;
  timeExp: number;
  timeInt: number;
  timePro: number;
  uid: string;
  user: ExpTimeRankUser;
  win: number;
}

export interface ExpTimeRankRecord {
  bvs: number;
  column: number;
  createTime: number;
  finished: boolean;
  id: number;
  mine: number;
  row: number;
  time: number;
}

export interface ExpTimeRankUser {
  avatar: string;
  background: string;
  chaosInGame: boolean;
  chaosInView: boolean;
  country: string;
  id: number;
  mark: string;
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

export interface IntTimeRank {
  bvs: number;
  createTime: number;
  exp: number;
  level: number;
  lose: number;
  movesArray: null;
  rank: number;
  rankHistory: number;
  record: IntTimeRankRecord;
  recordId: number;
  score: number;
  stage: number;
  time: number;
  timeArray: null;
  timeBeg: number;
  timeExp: number;
  timeInt: number;
  timePro: number;
  uid: string;
  user: IntTimeRankUser;
  win: number;
}

export interface IntTimeRankRecord {
  bvs: number;
  column: number;
  createTime: number;
  finished: boolean;
  id: number;
  mine: number;
  row: number;
  time: number;
}

export interface IntTimeRankUser {
  avatar: string;
  background: string;
  chaosInGame: boolean;
  chaosInView: boolean;
  country: string;
  id: number;
  mark: string;
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

export interface TotalTimeRank {
  bvs: number;
  createTime: null;
  exp: number;
  level: number;
  lose: number;
  movesArray: null;
  rank: number;
  rankHistory: number;
  record: TotalTimeRankRecord;
  recordId: number;
  score: number;
  stage: number;
  time: number;
  timeArray: null;
  timeBeg: number;
  timeExp: number;
  timeInt: number;
  timePro: number;
  uid: string;
  user: TotalTimeRankUser;
  win: number;
}

export interface TotalTimeRankRecord {
  bvs: number;
  column: number;
  createTime: null;
  finished: boolean;
  id: number;
  mine: number;
  row: number;
  time: number;
}

export interface TotalTimeRankUser {
  avatar: string;
  background: string;
  chaosInGame: boolean;
  chaosInView: boolean;
  country: string;
  id: number;
  mark: string;
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
