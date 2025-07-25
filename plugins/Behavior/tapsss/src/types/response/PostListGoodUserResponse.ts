export interface PostListGoodUserResponse {
    code: number;
    data: Datum[];
    msg: null;
    url: null;
}

export interface Datum {
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
