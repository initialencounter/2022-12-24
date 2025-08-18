/**
 * ApifoxModel
 */
export interface OnLineStateResponse {
    data: Data;
    err_msg: string;
    msg: string;
    req_id: string;
    result: number;
}

export interface Data {
    online_color: string;
    online_state: number;
    online_text: string;
}
