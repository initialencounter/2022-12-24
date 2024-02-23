import { Schema } from "koishi"

export interface Gender {
    type: string
    probability: number
}
export interface Location {
    left: number
    top: number
    width: number
    height: number
    rotation: number
}
export interface Face_info {
    location: Location
    beauty: number
    gender: Gender
}
export interface Result {
    face_num: number
    face_list: Face_info[]
}
export interface Response {
    error_code: number
    error_msg: string
    log_id: number
    timestamp: number
    cached: number
    result: Result
}
