import type { PostCommentListResponse } from "@/types/response/PostCommentListResponse";
import type { PostGetResponse } from "@/types/response/PostGetResponse";
import type { PostList } from "@/types";
import type { PostListGoodUserResponse } from "@/types/response/PostListGoodUserResponse";
import type { RecordGetResponse } from "@/types/response/RecordGet";
import type { UserHomeResponse } from "@/types/response/userHomeResponse";
import type { SchulteRecordGetResponse } from "@/types/response/SchulteRecordGetResponse";
import type { PuzzleRecordGetResponse } from "@/types/response/PuzzleRecordGetResponse";

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
