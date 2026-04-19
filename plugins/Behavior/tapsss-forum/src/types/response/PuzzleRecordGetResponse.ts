export interface PuzzleRecordGetResponse {
    code: number;
    data: Data;
    msg: null;
    url: null;
}

export interface Data {
    action: string;
    blind: boolean;
    collect: boolean;
    column: number;
    createTime: number;
    id: number;
    map: string;
    observeTime: number;
    playCount: number;
    postId: number;
    rank: number;
    rankPercent: number;
    row: number;
    step: number;
    swipe: boolean;
    time: number;
    uid: null;
    user: User;
}

export interface User {
    avatar: string;
    background: string;
    chaosInGame: boolean;
    chaosInView: boolean;
    country: string;
    id: number;
    mark: null;
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

export interface PuzzleActionRecord {
  column: number;
  row: number;
  time: number; // ms
}
