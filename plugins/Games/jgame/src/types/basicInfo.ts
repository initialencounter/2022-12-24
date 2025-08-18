/**
 * ApifoxModel
 */
export interface BasicInfoResponse {
    data: Data;
    err_msg: string;
    msg: string;
    req_id: string;
    result: number;
}

export interface Data {
    achievements: Achievement[];
    area_id: number;
    area_name: string;
    gender: number;
    icon_url: string;
    level: number;
    nickname: string;
    online_color: string;
    online_state: number;
    online_text: string;
    rank_color_id: number;
    tier: string;
}

export interface Achievement {
    icon: string;
    id: string;
    name: string;
    quality_icon: string;
    quality_id: number;
}
