export interface PostListResponse {
  code: number;
  data: Datum[];
  msg: null | string;
  url: null | string;
}

export interface Datum {
  id: number;
  title: null | string;
  text: null | string;
  createTime: number;
  device: null | string;
  user: User;
  commentCount: number;
  goodCount: number;
  recordId: number;
  recordType: number;
  record: any; // Record type depends on game
  puzzleRecord: any;
  schulteRecord: any;
  tzfeRecord: any;
  nonoRecord: any;
  lastComment?: LastComment | null;
  stick: number;
}

export interface User {
  avatar: string | null;
  nickName: string;
  timingLevel: number;
  timingRank: number;
}

export interface LastComment {
  id: number;
  comment: string;
  createTime: number;
  user: User;
}

export interface PostGetResponse {
  code: number;
  data: Datum;
  msg: null | string;
  url: null | string;
}

export interface PostCommentListResponse {
  code: number;
  data: CommentDatum[];
  msg: null | string;
  url: null | string;
}

export interface CommentDatum {
  id: number;
  comment: string;
  createTime: number;
  device: string | null;
  goodCount: number;
  user: User;
  replyList?: CommentDatum[] | null;
}
