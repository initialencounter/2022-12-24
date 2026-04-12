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
    face_token: string
    face_probability: number
    angle: Angle
    location: Location
    beauty: number
    gender: Gender
}

export interface Angle {
    pitch: number;
    roll: number;
    yaw: number;
}

export interface Result {
    face_num: number
    face_list: Face_info[]
}
export interface FaceResponse {
    error_code: number
    error_msg: string
    log_id: number
    timestamp: number
    cached: number
    result: Result
}
