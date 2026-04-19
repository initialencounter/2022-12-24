export interface SchulteCareerResponse {
    code: number;
    data: Data;
    msg: null;
    url: null;
}

export interface Data {
    countTotal: number;
    rank: number;
    time: number;
}
