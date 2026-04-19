export interface PuzzleCareerResponse {
  code: number;
  data: Data;
  msg: null;
  url: null;
}

export interface Data {
  info3: Info3;
  info4: Info4;
  info5: Info5;
  infoTotal: InfoTotal;
  user: null;
}

export interface Info3 {
  bvs: number;
  createTime: null;
  exp: number;
  level: number;
  lose: number;
  movesArray: null;
  rank: number;
  rankHistory: number;
  record: Info3Record;
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
  user: Info3User;
  win: number;
}

export interface Info3Record {
  bvs: number;
  column: number;
  createTime: null;
  finished: boolean;
  id: number;
  mine: number;
  row: number;
  time: number;
}

export interface Info3User {
  avatar: null;
  background: null;
  chaosInGame: boolean;
  chaosInView: boolean;
  country: null;
  id: number;
  mark: null;
  nickName: null;
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

export interface Info4 {
  bvs: number;
  createTime: null;
  exp: number;
  level: number;
  lose: number;
  movesArray: null;
  rank: number;
  rankHistory: number;
  record: Info4Record;
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
  user: Info4User;
  win: number;
}

export interface Info4Record {
  bvs: number;
  column: number;
  createTime: null;
  finished: boolean;
  id: number;
  mine: number;
  row: number;
  time: number;
}

export interface Info4User {
  avatar: null;
  background: null;
  chaosInGame: boolean;
  chaosInView: boolean;
  country: null;
  id: number;
  mark: null;
  nickName: null;
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

export interface Info5 {
  bvs: number;
  createTime: null;
  exp: number;
  level: number;
  lose: number;
  movesArray: null;
  rank: number;
  rankHistory: number;
  record: Info5Record;
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
  user: Info5User;
  win: number;
}

export interface Info5Record {
  bvs: number;
  column: number;
  createTime: null;
  finished: boolean;
  id: number;
  mine: number;
  row: number;
  time: number;
}

export interface Info5User {
  avatar: null;
  background: null;
  chaosInGame: boolean;
  chaosInView: boolean;
  country: null;
  id: number;
  mark: null;
  nickName: null;
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

export interface InfoTotal {
  bvs: number;
  createTime: null;
  exp: number;
  level: number;
  lose: number;
  movesArray: null;
  rank: number;
  rankHistory: number;
  record: InfoTotalRecord;
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
  user: InfoTotalUser;
  win: number;
}

export interface InfoTotalRecord {
  bvs: number;
  column: number;
  createTime: null;
  finished: boolean;
  id: number;
  mine: number;
  row: number;
  time: number;
}

export interface InfoTotalUser {
  avatar: null;
  background: null;
  chaosInGame: boolean;
  chaosInView: boolean;
  country: null;
  id: number;
  mark: null;
  nickName: null;
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
