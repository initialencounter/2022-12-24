export interface SudokuCareerResponse {
  code: number;
  data: Data;
  msg: null;
  url: null;
}

export interface Data {
  countEasy: number;
  countHard: number;
  countHell: number;
  countNormal: number;
  rank: number;
  scoreEasy: number;
  scoreHard: number;
  scoreHell: number;
  scoreNormal: number;
  user: null;
}
