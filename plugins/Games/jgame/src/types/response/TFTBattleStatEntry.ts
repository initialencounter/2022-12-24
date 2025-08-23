/**
 * ApifoxModel
 */
export interface TFTBattleStatEntryResponse {
    data: Data;
    err_msg: string;
    msg: string;
    req_id: string;
    result: number;
}

export interface Data {
    badge_list: BadgeList[];
    err_msg: string;
    game_rank: GameRank;
    result: number;
    stat: Stat;
}

export interface BadgeList {
    badge_id: number;
    count: number;
    desc: string;
    has_acquired: boolean;
    name: string;
}

export interface GameRank {
    full_rank_title: string;
    rank_url: string;
}

export interface Stat {
    top1: number;
    top3: number;
    top4: number;
    top_four_rate: number;
    top_three_rate: number;
    total: number;
    win_rate: number;
}
