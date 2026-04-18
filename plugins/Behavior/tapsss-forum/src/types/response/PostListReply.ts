export interface PostListReplyResponse {
  code: number;
  data: Datum[];
  msg: null;
  url: null;
}

export interface Datum {
    comment?: string;
    createTime?: number;
    device?: string;
    goodCount?: number;
    hasGood?: boolean;
    id?: number;
    parentId?: number;
    picture?: string;
    postId?: number;
    replyCount?: number;
    replyList?: null;
    stick?: boolean;
    uid?: string;
    user?: User;
}


export interface User {
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
