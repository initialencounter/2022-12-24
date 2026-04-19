export interface UserConfigGetResponse {
  code: number;
  data: Data;
  msg: null;
  url: null;
}

export interface Data {
  invisible: boolean;
  minesweeperStyle: string;
  puzzleStyle: string;
  uid: string;
}
