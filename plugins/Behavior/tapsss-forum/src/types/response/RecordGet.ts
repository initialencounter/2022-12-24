export interface RecordGetResponse {
    code: number;
    data: Data;
    msg: null;
    url: null;
}

export interface Data {
    bv: number;
    bvs: number;
    collect: boolean;
    column: number;
    createTime: number;
    effectiveTap: number;
    estimatedTime: number;
    finished: boolean;
    handle: string;
    id: number;
    map: string;
    mapStatus: string;
    mine: number;
    mode: number;
    playCount: number;
    postId: number;
    rank: number;
    rankPercent: number;
    row: number;
    solvedBv: number;
    tap: number;
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
    sign: string;
    timingLevel: number;
    timingRank: number;
    uid: string;
    vip: boolean;
}

export interface ActionRecord {
  action: number;
  column: number;
  row: number;
  time: number;
}

export interface ReplyData {
  bv: number;
    bvs: number;
    collect: boolean;
    column: number;
    createTime: number;
    effectiveTap: number;
    estimatedTime: number;
    finished: boolean;
    handle: string;
    id: number;
    map: string;
    mapStatus: string;
    mine: number;
    mode: number;
    playCount: number;
    postId: number;
    rank: number;
    rankPercent: number;
    row: number;
    solvedBv: number;
    tap: number;
    themeId: number;
    time: number;
    type: number;
    uid: string;
    upload: boolean;
    user: User;
    actions: ActionRecord[];
}
