export interface userSearchResponse {
    code: number;
    data: Datum[];
    msg: null;
    url: null;
}

export interface Datum {
    avatar?: string;
    background?: string;
    chaosInGame?: boolean;
    chaosInView?: boolean;
    country?: string;
    id?: number;
    mark?: string;
    nickName?: string;
    online?: boolean;
    puzzleRank?: number;
    pvpInGame?: boolean;
    pvpInWait?: boolean;
    relation?: number;
    sex?: number;
    sign?: string;
    timingLevel?: number;
    timingRank?: number;
    uid?: string;
    vip?: boolean;
}
