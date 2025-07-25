export interface SenMessageResponse {
    code: number;
    data: Data;
    msg: null;
    url: null;
}

export interface Data {
    conversationType: number;
    createTime: number;
    fromId: string;
    hasRead: boolean;
    id: number;
    messageBody: MessageBody;
    messageId: number;
    preId: number;
    sender: Sender;
    toId: string;
}

export interface MessageBody {
    createTime: number;
    id: number;
    message: string;
    messageType: number;
}

export interface Sender {
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
