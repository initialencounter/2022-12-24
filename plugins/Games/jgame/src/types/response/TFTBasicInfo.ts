/**
 * ApifoxModel
 */
export interface TFTBasicInfoResponse {
    data: Data;
    err_msg: string;
    msg: string;
    req_id: string;
    result: number;
}

export interface Data {
    area_id: number;
    area_name: string;
    gender: number;
    icon_url: string;
    level: number;
    nickname: string;
    rank_color_id: number;
    tier: string;
}
