export interface WebHookResponse {
    created_at: number;
    detail: Detail;
    from_uid: number;
    mid: number;
    target: { gid: number };
}

export interface Detail {
    content: string;
    content_type: string;
    expires_in?: any;
    properties?: {
        content_type: string;
        height?: number;
        width?: number;
        local_id: number;
        name: string;
        size: number;
    };
    mid?: number
    type: string;
}

export interface MediaBuffer {
    data: Buffer;
    type: {
        fileName: string;
        mime: string;
    };
}

export interface MediaPath {
    path: string;
}

export interface UploadResponse {
    hash: string
    image_properties?: {
        height?: number,
        width?: number
    }
    path: string
    size: number
}

export interface TokenRefeshConfig {
    expired_in?: number
    refresh_token: string
    token: string
}