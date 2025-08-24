/**
 * ApifoxModel
 */
export interface GameCardResponse {
    data: Data;
    err_msg: string;
    msg: string;
    req_id: string;
    result: number;
}

export interface Data {
    cardsSort: string[];
    emptyCardList: EmptyCardList[];
    jgCard: JgCard;
    lgCard: LgCard;
    lolCard: LolCard;
    tftCard: TftCard;
    [property: string]: any;
}

export interface EmptyCardList {
    cardId?: string;
    gameIconUrl?: string;
    gameId?: string;
    gameName?: string;
    intent?: string;
    subText?: string;
    topBgColor?: string;
    topBgColorDark?: string;
}

export interface JgCard {
    areaId: number;
    areaName: string;
    bottomBgColor: string;
    bottomBgColorDark: string;
    content: string;
    fullRankTitle: string;
    gameHead: string;
    gameIconUrl: string;
    gameId: string;
    gameName: string;
    gameNickName: string;
    intent: string;
    isMainRole: number;
    level: number;
    listItems: JgCardListItem[];
    online_color: string;
    online_state: number;
    online_text: string;
    rankUrl: string;
    roleNum: number;
    showTips: number;
    tag1Content: string;
    tag1Title: string;
    tag2Content: string;
    tag2Title: string;
    tag3Content: string;
    tag3Title: string;
    tag4Content: string;
    tag4Title: string;
    tags: JgCardTag[];
    tips: string;
    topBgColor: string;
    topBgColorDark: string;
    uuid: string;
}

export interface JgCardListItem {
    battleId: string;
    endTime: number;
    gameType: string;
    intent: string;
    rank: string;
    set_name: string;
    starItems: PurpleStarItem[];
}

export interface PurpleStarItem {
    heroIcon: string;
    heroId: string;
    starNum: number;
}

export interface JgCardTag {
    tag: string;
    value: string;
}

export interface LgCard {
    areaId: number;
    areaName: string;
    bottomBgColor: string;
    bottomBgColorDark: string;
    content: string;
    fullRankTitle: string;
    gameHead: string;
    gameIconUrl: string;
    gameId: string;
    gameName: string;
    gameNickName: string;
    intent: string;
    isMainRole: number;
    level: number;
    listItems: string[];
    online_color: string;
    online_state: number;
    online_text: string;
    onlineStatus: number;
    rankUrl: string;
    roleNum: number;
    showTips: number;
    tag1Content: string;
    tag1Title: string;
    tag2Content: string;
    tag2Title: string;
    tag3Content: string;
    tag3Title: string;
    tag4Content: string;
    tag4Title: string;
    tags: LgCardTag[];
    tips: string;
    topBgColor: string;
    topBgColorDark: string;
    uuid: string;
}

export interface LgCardTag {
    tag: string;
    value: string;
}

export interface LolCard {
    areaId: number;
    areaName: string;
    bottomBgColor: string;
    bottomBgColorDark: string;
    content: string;
    fullRankTitle: string;
    gameHead: string;
    gameIconUrl: string;
    gameId: string;
    gameName: string;
    gameNickName: string;
    heroNum: string;
    intent: string;
    isMainRole: number;
    legendary: string;
    level: number;
    listItems: LolCardListItem[];
    online_color: string;
    online_state: number;
    online_text: string;
    rankUrl: string;
    roleNum: number;
    showTips: number;
    skinNum: string;
    sumMatchNum: string;
    tag1Content: string;
    tag1Title: string;
    tag2Content: string;
    tag2Title: string;
    tag3Content: string;
    tag3Title: string;
    tag4Content: string;
    tag4Title: string;
    tags: LolCardTag[];
    tips: string;
    topBgColor: string;
    topBgColorDark: string;
    uuid: string;
    winRate: string;
}

export interface LolCardListItem {
    achievements: null;
    battleId: number;
    championBattleUrl: string;
    gameId: string;
    gameResult: number;
    gameResultColor: string;
    gameResultTitle: string;
    gameType: string;
    heroHead: number;
    heroHeadUrl: string;
    intent: string;
    isChampionBattle: number;
    isMvp: number;
    isSvp: number;
    kda: string;
}

export interface LolCardTag {
    tag: string;
    value: string;
}

export interface TftCard {
    areaId: number;
    areaName: string;
    averageRank: string;
    bottomBgColor: string;
    bottomBgColorDark: string;
    content: string;
    firstRankNum: string;
    fullRankTitle: string;
    gameHead: string;
    gameIconUrl: string;
    gameId: string;
    gameName: string;
    gameNickName: string;
    intent: string;
    isMainRole: number;
    level: number;
    listItems: TftCardListItem[];
    nearlyTenGamesRank: string;
    online_color: string;
    online_state: number;
    online_text: string;
    rankUrl: string;
    roleNum: number;
    showTips: number;
    tag1Content: string;
    tag1Title: string;
    tag2Content: string;
    tag2Title: string;
    tag3Content: string;
    tag3Title: string;
    tag4Content: string;
    tag4Title: string;
    tags: TftCardTag[];
    tips: string;
    topBgColor: string;
    topBgColorDark: string;
    topThreeRankNum: string;
    uuid: string;
}

export interface TftCardListItem {
    endTime: number;
    exploitId: number;
    gameType: string;
    intent: string;
    rank: string;
    starItems: FluffyStarItem[];
}

export interface FluffyStarItem {
    heroIcon: string;
    heroId: string;
    starNum: number;
}

export interface TftCardTag {
    tag: string;
    value: string;
}
