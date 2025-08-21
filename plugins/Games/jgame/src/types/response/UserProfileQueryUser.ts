/**
 * ApifoxModel
 */
export interface UserProfileQueryUser {
    data: Datum[];
    err_msg: string;
    msg: string;
    req_id: string;
    result: number;
}

export interface Datum {
    age?: number;
    anchorId?: number;
    appNum?: string;
    appNumModifiedTime?: number;
    auth_color?: string;
    auth_full_icon?: string;
    auth_icon?: string;
    authColorType?: number;
    authDesc?: string;
    authType?: string;
    background_img_is_gif?: number;
    backgroundImgUrl?: string;
    cancelState?: number;
    cert_img?: string;
    community_level_info?: CommunityLevelInfo;
    communityLevel?: number;
    day?: number;
    dress_colors?: string;
    dress_up_download_url?: string;
    dress_up_id?: string;
    dress_up_level?: number;
    dress_up_update_md5?: string;
    gameInfoList?: GameInfoList[];
    gameNickName?: string;
    gender?: number;
    gender_hide?: number;
    genderModifyTimes?: number;
    head_box_small_url?: string;
    head_box_url?: string;
    headTimestamp?: number;
    headUrl?: string;
    intent?: string;
    ip_update_ts?: number;
    isVip?: boolean;
    lastLoginAreaId?: number;
    latestLocation?: string;
    lbsFlag?: number;
    level?: number;
    logoId?: number;
    mainAreaId?: number;
    medalList?: MedalList[];
    month?: number;
    moodState?: MoodState;
    nickName?: string;
    nickNameModifyTimes?: number;
    scene?: string;
    sig?: string;
    tier?: string;
    uuid?: string;
    year?: number;
}

export interface CommunityLevelInfo {
    desc: string;
    icon: string;
    icon_height: number;
    icon_width: number;
}

export interface GameInfoList {
    areaId: number;
    areaName: string;
    content: string;
    gameColor: string;
    gameHeadUrl: string;
    gameId: string;
    gameShortName: string;
    league_point: string;
    level: number;
    remarkName: string;
    role_identity: string;
    roleName: string;
    scene: string;
    tier: string;
    uuid: string;
}

export interface MedalList {
    endTime?: number;
    high?: number;
    medalDesc?: string;
    medalIntent?: string;
    medalUrl?: string;
    startTime?: number;
    width?: number;
}

export interface MoodState {
    icon: string;
    id: string;
    text: string;
}
