export interface WebHookResponse {
    created_at: number
    detail: Detail
    from_uid: number
    mid: number
    target: { gid: number }
}

export interface Detail {
    content: string,
    content_type: string
    expires_in?: any
    properties?: {
        content_type: string
        height?: number
        width?: number
        local_id: number
        name: string
        size: number
    },
    type: string
}