export declare class Klotsk {
    cmd_strs: string;
    theme: object[];
    drctn_dist: object;
    drctn_list: string[];
    mode: number;
    klotsk: number[][];
    num: number;
    crtpuzzle: number[][];
    start_time: number;
    end_time: number;
    constructor(mode: number);
    find_0(): number[];
    move(derect: string): string;
    check(): boolean;
    move_sqnc(sqnc: string): boolean;
    shfl(): void;
    logf(): void;
    duration(): string;
    strftime(num_time: number): string;
}
