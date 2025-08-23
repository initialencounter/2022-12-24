/**
 * ApifoxModel
 */
export interface TFTBattleListResponse {
    data: Data;
    err_msg: string;
    msg: string;
    req_id: string;
    result: number;
}

export interface Data {
    err_msg: string;
    exploit_list: ExploitList[];
    is_hide_battle: number;
    next_baton: string;
    result: number;
}

export interface ExploitList {
    buff_version: string;
    duration: number;
    end_time: number;
    exploit_id: number;
    game_match_type: number;
    game_match_type_name: string;
    specific_user_exploit: SpecificUserExploit;
}

export interface SpecificUserExploit {
    achievement_list?: AchievementList[];
    area_id: number;
    blood: number;
    buff_version: string;
    game_level: string;
    game_rank_list: GameRankList[];
    head_icon: string;
    head_icon_id: string;
    login_account_type: number;
    nickname: string;
    piece_list: PieceList[];
    piece_list_price: number;
    ranking: number;
    relationship: number;
    score: string;
    statistical_data: StatisticalData;
    user_id: string;
}

export interface AchievementList {
    achievement_id: number;
}

export interface GameRankList {
    full_rank_title: string;
    hight_value: number;
    league_points: number;
    queue: number;
    rank: number;
    rank_url: string;
    tier: number;
}

export interface PieceList {
    equip_list: number[];
    equips: Equip[];
    hero_name: string;
    jump_url: string;
    picture: string;
    piece_en_name: string;
    piece_id: number;
    piece_price: number;
    piece_special_info: { [key: string]: any };
    price_color: string;
    star_num: number;
    tft_hero_id: number;
}

export interface Equip {
    equip_effect: string;
    equip_id: number;
    equip_img: string;
    equip_name: string;
    formula1: string;
    formula2: string;
}

export interface StatisticalData {
    activated_trait_num: number;
    companion_name: string;
    damage_to_players: number;
    knockout_player_num: number;
    level: number;
    mini_hero: string;
    remaining_gold_coins: string;
    survival_duration: number;
    survival_round: string;
    unactivated_trait_num: number;
}
