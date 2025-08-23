/**
 * ApifoxModel
 */
export interface SearchUserByKeyword {
    data: Data;
    err_msg: string;
    errMsg: string;
    msg: string;
    result: number;
}

export interface Data {
    next_start: string;
    userList: UserList[];
}

export interface UserList {
    author: number;
    chatIntent: string;
    focus: boolean;
    intent: string;
    isOnline: boolean;
    isVip: boolean;
    lolIntent: string;
    showIndex: number;
    tag: null;
    tftIntent: string;
    userAppNum: string;
    userDesc: string;
    userGender: number;
    userIcon: string;
    userId: string;
    userIntent: string;
    userName: string;
}
