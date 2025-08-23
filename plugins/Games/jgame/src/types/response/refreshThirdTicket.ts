/**
 * ApifoxModel
 */
export interface RefreshThirdTicket {
    data: Data;
    err_msg: string;
    errMsg: string;
    msg: string;
    result: number;
}

export interface Data {
    bind_info: BindInfo[];
    ct_info: CtInfo;
}

export interface BindInfo {
    checkTs: number;
    deviceId: string;
    eventTime: string;
    iconUrl: string;
    isRegisterUin: number;
    isSyncAttention: number;
    isVerification: number;
    nickName: string;
    openid: string;
    selfUuid: string;
    sex: string;
    thirdType: number;
    type: number;
    uin: string;
    uuid: string;
}

export interface CtInfo {
    ct: string;
    errmsg: string;
    expires: number;
    is_new_user: number;
    is_timeout: number;
    login_uuid: string;
    main_account_type: number;
    openid: string;
    refresh_ct_span: number;
    refresh_wt_span: number;
    result: number;
    uin: number;
    user_id: string;
    wt: string;
}
