/**
 * ApifoxModel
 */
export interface BattleList {
  data: Data;
  err_msg: string;
  msg: string;
  req_id: string;
  result: number;
}

export interface Data {
  battle_list: BattleListElement[];
  is_hide_battle: number;
  next_baton: string;
  picture_pre: string;
}

export interface BattleListElement {
  battle_id: string;
  buff_version: string;
  chess_hex: number;
  chess_url: string;
  end_time: number;
  game_match_type: number;
  game_match_type_name: string;
  game_variation_url: string;
  is_friend: number;
  set_name: string;
  specific_user_battle: SpecificUserBattle;
  tag_url: string;
}

export interface SpecificUserBattle {
  achievement_list: string[];
  game_level: string;
  head_icon_id: string;
  nickname: string;
  piece_list: PieceList[];
  ranking: number;
  relationship: number;
  user_id: string;
}

export interface PieceList {
  equip_list: EquipList[];
  full_picture: string;
  hero_name: string;
  is_c: number;
  picture: string;
  piece_id: number;
  piece_price: number;
  piece_special_info: PieceSpecialInfo;
  price_color: string;
  star_num: number;
}

export interface EquipList {
  equip_id: number;
  full_picture: string;
  picture: string;
}

export interface PieceSpecialInfo {
  height: number;
  image_url: string;
  width: number;
}

