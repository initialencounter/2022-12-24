export interface WebHookResponse {
    created_at: number,
    detail: Detail,
    from_uid: number,
    mid: number,
    target: { gid: number }
}

export interface Detail {
    content: string,
    content_type: string,
    expires_in?: any,
    properties?: any,
    type: string
}