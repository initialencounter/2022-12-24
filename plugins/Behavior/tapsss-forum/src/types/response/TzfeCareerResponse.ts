export interface TzfeCareerResponse {
  code: number;
  data: Data;
  msg: null;
  url: null;
}

export interface Data {
  countTotal: number;
  level: number;
  rankScore: number;
  rankTime: number;
  score: number;
  scoreRecordId: number;
  time: number;
  timeRecordId: number;
  value: number;
}
