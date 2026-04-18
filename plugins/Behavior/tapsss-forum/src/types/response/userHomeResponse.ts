export interface UserHomeResponse {
  code: number;
  data: Data;
  msg: null;
  url: null;
}

export interface Data {
  distance: number;
  fansCount: number;
  followCount: number;
  saoleiOauth: null | SaoleiOauth;
  user: User;
  userMatchMedals: UserMatchMedal[];
}

export interface SaoleiOauth {
  avatar: string;
  createTime: string;
  id: number;
  name: string;
  openId: string;
  platform: number;
  uid: string;
}

export interface User {
  accountStatus: number;
  auth: number;
  avatar: string;
  background: string;
  birthday: number | null;
  chaosInGame: boolean;
  chaosInView: boolean;
  country: string;
  createTime: number;
  id: number;
  loginUserId: null;
  mark: null | string;
  nickName: string;
  online: boolean;
  province: string;
  puzzleRank: number;
  pvpInGame: boolean;
  pvpInWait: boolean;
  registerIp: string;
  relation: number;
  sex: number;
  sign: null | string;
  timingLevel: number;
  timingRank: number;
  uid: string;
  userId: string;
  vip: boolean;
  visits: number;
}

export interface UserMatchMedal {
  icon: null | string;
  id: number;
  rank: number;
  title: string;
  uid: string;
}
