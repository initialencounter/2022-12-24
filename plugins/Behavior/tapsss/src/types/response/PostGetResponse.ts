export interface PostGetResponse {
    code: number;
    data: Data;
    msg: null;
    url: null;
}

export interface Data {
    collect: boolean;
    commentCount: number;
    commentTime: number;
    createTime: number;
    device: string;
    essence: boolean;
    forum: string;
    goodCount: number;
    goodTime: number;
    goodUser: null;
    hasGood: boolean;
    id: number;
    lastComment: null;
    minesweeperThemeId: number;
    minesweeperThemeScore: number;
    nonoRecord: null;
    nonoThemeId: number;
    nonoThemeScore: number;
    puzzleRecord: null;
    record: Record;
    recordId: number;
    recordType: number;
    schulteRecord: null;
    sourceUid: null;
    status: number;
    stick: number;
    text: string;
    title: string;
    tzfeRecord: null;
    uid: string;
    user: User;
    userStick: boolean;
    viewCount: number;
}

export interface Record {
    bvs: number;
    column: number;
    createTime: number;
    finished: boolean;
    id: number;
    mine: number;
    row: number;
    time: number;
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
