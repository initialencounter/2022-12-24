/**
 * ApifoxModel
 */
export interface RefreshThirdToken {
    data: Data;
    err_msg: string;
    errMsg: string;
    msg: string;
    result: number;
}

export interface Data {
    access_token: string;
    expired: number;
    time_interval: number;
}
