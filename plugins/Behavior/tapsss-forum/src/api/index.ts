import type { PostCommentListResponse } from "@/types/response/PostCommentListResponse";
import type { PostGetResponse } from "@/types/response/PostGetResponse";
import type { PostList } from "@/types";
import type { PostListGoodUserResponse } from "@/types/response/PostListGoodUserResponse";
import type { RecordGetResponse } from "@/types/response/RecordGet";
import type { UserHomeResponse } from "@/types/response/userHomeResponse";
import type { SchulteRecordGetResponse } from "@/types/response/SchulteRecordGetResponse";
import type { PuzzleRecordGetResponse } from "@/types/response/PuzzleRecordGetResponse";
import type { userSearchResponse } from "@/types/response/userSearchResponse";
import type { MinesweeperRecordListResponse } from "@/types/response/MinesweeperRecordListResponse";
import type { SchulteRecordListFilterResponse } from "@/types/response/SchulteRecordListFilterResponse";
import type { PuzzleRecordListFilterResponse } from "@/types/response/PuzzleRecordListFilterResponse";
import type { TzfeRecordListFilterResponse } from "@/types/response/TzfeRecordListFilterResponse";
import type { NonoRecordListFilterResponse } from "@/types/response/NonoRecordListFilterResponse";
import type { UserConfigGetResponse } from "@/types/response/UserConfigGetResponse";
import type { MinesweeperCareerResponse } from "@/types/response/MinesweeperCareerResponse";
import type { SudokuCareerResponse } from "@/types/response/SudokuCareerResponse";
import type { PuzzleCareerResponse } from "@/types/response/PuzzleCareerResponse";
import type { NonoCareerResponse } from "@/types/response/NonoCareerResponse";
import type { TzfeCareerResponse } from "@/types/response/TzfeCareerResponse";
import type { SchulteCareerResponse } from "@/types/response/SchulteCareerResponse";

const isDev = import.meta.env.DEV;

// Replace base URL with your actual backend or proxy endpoint
const BASE_URL = isDev ? '/api/Minesweeper' : '/Minesweeper';

async function fetchJSON<T>(path: string, body?: any): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const formData = new URLSearchParams(body).toString();

  // Assuming the actual project will attach the token headers or use proxy,
  // Here we just provide simple fetch requests that match the provided API definitions.
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
    },
    body: formData
  });
  if (!res.ok) throw new Error('API fetch failed');
  return res.json() as Promise<T>;
}

export async function fetchPostList(type: number = 0, page: number = 0, count: number = 20): Promise<PostList> {
  return fetchJSON<PostList>('/post/list', { type, page, count });
}

export async function postGet(postId: number): Promise<PostGetResponse> {
  return fetchJSON<PostGetResponse>('/post/get', { postId });
}

export async function commentList(postId: number, sort: number = 0, page: number = 0, count: number = 20): Promise<PostCommentListResponse> {
  return fetchJSON<PostCommentListResponse>('/post/comment/list', { postId, sort, page, count });
}

export async function commentReplyList(commentId: number, page: number = 0, count: number = 20): Promise<any> {
  return fetchJSON<any>('/post/comment/list/reply', { commentId, page, count });
}

export async function postListSearch(keyword: string, page: number = 0, count: number = 20): Promise<PostList> {
  return fetchJSON<PostList>('/post/list/search', { keyword, page, count });
}

export async function postListGoodUser(postId: number, page: number = 0, count: number = 20): Promise<PostListGoodUserResponse> {
  return fetchJSON<PostListGoodUserResponse>('/post/list/good/user', { postId, page, count });
}

export async function minesweeperRecordGet(recordId: number): Promise<RecordGetResponse> {
  return fetchJSON<RecordGetResponse>('/minesweeper/record/get', { recordId });
}

export async function puzzleRecordGetResponse(recordId: number): Promise<PuzzleRecordGetResponse> {
  return fetchJSON<PuzzleRecordGetResponse>('/puzzle/record/get', { recordId });
}

export async function schulteRecordGet(recordId: number): Promise<SchulteRecordGetResponse> {
  return fetchJSON<SchulteRecordGetResponse>('/schulte/record/get', { recordId });
}

export async function userHome(targetUid?: number, targetName?: string): Promise<UserHomeResponse> {
  return fetchJSON<UserHomeResponse>('/user/home', { targetUid, targetName });
}

export async function userSearch(name: string, page: number, count: string): Promise<userSearchResponse> {
  return fetchJSON<userSearchResponse>('/user/search', { name, page, count });
}

export async function minesweeperRecordList(userId: string, page: number, count: number): Promise<MinesweeperRecordListResponse> {
  const filter = `{"asc":false,"column":0,"finished":-1,"level":0,"maxBv":0,"maxBvs":0.0,"maxDate":0,"maxTime":0.0,"minBv":0,"minBvs":0.0,"minDate":0,"minTime":0.0,"mine":0,"mode":-1,"row":0,"sort":0,"targetId":0,"type":0,"userId":${userId}}`;
  return fetchJSON<MinesweeperRecordListResponse>('/minesweeper/record/list', { filter, page, count });
}

export async function schulteRecordListFilter(userId: string, page: number, count: number): Promise<SchulteRecordListFilterResponse> {
  const filter = `{"asc":false,"blind":-1,"level":0,"maxDate":0,"maxTime":0.0,"minDate":0,"minTime":0.0,"sort":0,"targetId":0,"type":-1,"userId":${userId}}`;
  return fetchJSON<SchulteRecordListFilterResponse>('/schulte/record/list/filter', { filter, page, count });
}

export async function puzzleRecordListFilter(userId: string, page: number, count: number): Promise<PuzzleRecordListFilterResponse> {
  const filter = `{"asc":false,"blind":-1,"level":0,"maxStep":0,"maxTime":0.0,"minStep":0,"minTime":0.0,"mode":-1,"sort":0,"targetId":0,"userId":${userId}}`;
  return fetchJSON<PuzzleRecordListFilterResponse>('/puzzle/record/list/filter', { filter, page, count });
}

export async function tzfeRecordListFilter(userId: string, page: number, count: number): Promise<TzfeRecordListFilterResponse> {
  const filter = `{"asc":false,"level":0,"maxScore":0,"maxTime":0.0,"minScore":0,"minTime":0.0,"sort":0,"targetId":0,"userId":${userId}}`;
  return fetchJSON<TzfeRecordListFilterResponse>('/tzfe/record/list/filter', { filter, page, count });
}

export async function nonoRecordListFilter(userId: string, page: number, count: number): Promise<NonoRecordListFilterResponse> {
  const filter = `{"asc":false,"column":0,"finished":-1,"level":0,"maxDate":0,"maxTime":0.0,"minDate":0,"minTime":0.0,"mine":0,"mode":-1,"row":0,"sort":0,"targetId":0,"type":0,"userId":${userId}}`;
  return fetchJSON<NonoRecordListFilterResponse>('/nono/record/list/filter', { filter, page, count });
}

export async function userConfigGet(uid: number): Promise<UserConfigGetResponse> {
  return fetchJSON<UserConfigGetResponse>('/user/config/get', { uid });
}

// '/Minesweeper/minesweeper/timing/career/simple',
// '/Minesweeper/sudoku/career',
// '/Minesweeper/puzzle/career/simple',
// '/Minesweeper/nono/career/simple',
// '/Minesweeper/tzfe/career',
// '/Minesweeper/schulte/career',
export async function minesweeperCareer(uid: number): Promise<MinesweeperCareerResponse> {
  return fetchJSON<MinesweeperCareerResponse>('/minesweeper/timing/career/simple', { uid });
}

export async function sudokuCareer(targetUid: number): Promise<SudokuCareerResponse> {
  return fetchJSON<SudokuCareerResponse>('/sudoku/career', { targetUid });
}

export async function puzzleCareer(uid: number): Promise<PuzzleCareerResponse> {
  return fetchJSON<PuzzleCareerResponse>('/puzzle/career/simple', { uid });
}

export async function nonoCareer(uid: number): Promise<NonoCareerResponse> {
  return fetchJSON<NonoCareerResponse>('/nono/career/simple', { uid });
}

export async function tzfeCareer(targetUid: number): Promise<TzfeCareerResponse> {
  return fetchJSON<TzfeCareerResponse>('/tzfe/career', { targetUid, row:4, column:4 });
}

export async function schulteCareer(targetUid: number): Promise<SchulteCareerResponse> {
  return fetchJSON<SchulteCareerResponse>('/schulte/career', { targetUid, level: 5, type: 0, blind: false });
}
