export interface UserInfo {
  code: number;
  data: Data;
  msg: null;
  url: null;
}

export interface Data {
  accountStatus: number;
  auth: number;
  avatar: string;
  background: string;
  birthday: number;
  chaosInGame: boolean;
  chaosInView: boolean;
  country: string;
  createTime: number;
  id: number;
  loginUserId: null;
  mail: string;
  mark: string;
  nickName: string;
  online: boolean;
  password: string;
  phone: null;
  province: string;
  puzzleRank: number;
  pvpInGame: boolean;
  pvpInWait: boolean;
  registerIp: string;
  relation: number;
  sex: number;
  sign: string;
  timingLevel: number;
  timingRank: number;
  token: string;
  uid: string;
  userId: string;
  vip: boolean;
  visits: number;
}
