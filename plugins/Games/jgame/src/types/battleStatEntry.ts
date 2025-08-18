/**
 * ApifoxModel
 */
export interface BattleStatEntryResponse {
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
    stat_list: StatList;
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
    tier_rank_text: string;
}

export interface StatList {
    top1: number;
    top4: number;
    top_four_rate: number;
    total: number;
    win_rate: number;
}
