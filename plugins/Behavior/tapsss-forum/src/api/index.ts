import type { PostCommentListResponse } from "@/types/response/PostCommentListResponse";
import type { PostGetResponse } from "@/types/response/PostGetResponse";
import type { PostList } from "@/types";

// Replace base URL with your actual backend or proxy endpoint
const BASE_URL = '/api/Minesweeper';

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
