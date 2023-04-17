const log = console.log
export const rot = (arr: number[][], derect: boolean) => {
    const res = []
    for (var i = 0; i < arr[0].length; i++) {
        const temp = []
        for (var j = 0; j < arr.length; j++) {
            temp.push(null)
        }
        res.push(temp)
    }
    if (!derect) {
        let i_ = 0
        for (var i = arr.length - 1; i > -1; i--) {
            let j_ = 0
            for (var j = 0; j < arr[i].length; j++) {
                res[j_][i_] = arr[i][j]
                j_++
            }
            i_++
        }
    }
    else {
        let i_ = 0
        for (var i = 0; i < arr.length; i++) {
            let j_ = 0
            for (var j = arr[i].length - 1; j > -1; j--) {
                res[j_][i_] = arr[i][j]
                j_++
            }
            i_++
        }
    }
    return res
};
export const rot90 = (arr: number[][], time: number = 1) => {
    let resp = []
    if (time < 0) {
        let temp: number[][] = arr
        for (var i = time; i < 0; i++) {
            const res = rot(temp, false)
            temp = res
        }
        resp = temp
    } else {
        let temp: number[][] = arr
        for (var i = 0; i < time; i++) {
            const res = rot(temp, true)
            temp = res
        }
        resp = temp
    }
    return resp
}

export class Cube{
    // """这是一个3阶魔方的类，可以6个方向旋转魔方"""
    start_time:number
    last_step:string[]
    face:number[][]
    back:number[][]
    right:number[][]
    left:number[][]
    up:number[][]
    down:number[][]
    color:any
    constructor() {

        // 前面=红色=1，后面=橙色=4，左面=蓝色=2，右边=绿色=5，上面=黄色=3，下面=白色=6

        this.start_time = 0
        this.last_step = []
        this.face = [[1, 1, 1], [1, 1, 1], [1, 1, 1]]
        this.back = [[4, 4, 4], [4, 4, 4], [4, 4, 4]]
        this.left = [[2, 2, 2], [2, 2, 2], [2, 2, 2]]
        this.right = [[5, 5, 5], [5, 5, 5], [5, 5, 5]]
        this.up = [[3, 3, 3], [3, 3, 3], [3, 3, 3]]
        this.down = [[6, 6, 6], [6, 6, 6], [6, 6, 6]]
        this.color = {1: 'red', 3: 'yellow', 6: 'white', 5: 'green', 4: 'orange', 2: 'blue'}
    }
    reset(this){
        this.face = [[1, 1, 1], [1, 1, 1], [1, 1, 1]]
        this.back = [[4, 4, 4], [4, 4, 4], [4, 4, 4]]
        this.left = [[2, 2, 2], [2, 2, 2], [2, 2, 2]]
        this.right = [[5, 5, 5], [5, 5, 5], [5, 5, 5]]
        this.up = [[3, 3, 3], [3, 3, 3], [3, 3, 3]]
        this.down = [[6, 6, 6], [6, 6, 6], [6, 6, 6]]

    }get_jiao(this){
        // """
        // 初始化8个角块的位置，调用时，使得列表重新指向当前魔方各个角块的位置
        // 角块的顺序（即为列表索引顺序）：
        // 正面向着自己，从顶面向下看：左下1，右下2，右上3，左上4，底面左下1，右下2，右上3，左上4
        // """
        this.jiao = [[this.face[0][0], this.left[0][2], this.up[2][0]],
                     [this.face[0][2], this.right[0][0], this.up[2][2]],
                     [this.back[0][0], this.right[0][2], this.up[0][2]],
                     [this.back[0][2], this.left[0][0], this.up[0][0]],
                     [this.face[2][0], this.left[2][2], this.down[0][0]],
                     [this.face[2][2], this.right[2][0], this.down[0][2]],
                     [this.back[2][0], this.right[2][2], this.down[2][2]],
                     [this.back[2][2], this.left[2][0], this.down[2][0]]]

    }get_colour(this){
        // """用this.colour列表的的索引代表相应的颜色,旋转后调用，使得各面颜色重新指向各个面的块"""
        this.colour = [this.face, this.left, this.up, this.back, this.right, this.down]

    }get_leng(this){
        // """
        // 初始化中层和上层8个棱块的位置，调用时，使得列表重新指向当前魔方各个棱块的位置
        // 棱块的顺序（即为列表索引顺序）：
        // 正面向着自己，从顶面向下看：第一个为上层和正面的棱块，逆时针旋转一圈数0123
        // 中层为正面和右面的棱块，逆时针旋转一圈数4567
        // """
        this.leng2 = [[this.face[0][1], this.up[2][1]],
                      [this.right[0][1], this.up[1][2]],
                      [this.back[0][1], this.up[0][1]],
                      [this.left[0][1], this.up[1][0]],
                      [this.face[1][2], this.right[1][0]],
                      [this.right[1][2], this.back[1][0]],
                      [this.back[1][2], this.left[1][0]],
                      [this.left[1][2], this.face[1][0]]]

    // # 魔方的旋转方法
    // # 默认为观察者看向该面时的顺时针为正向旋转，逆时针为反转
    // # 用大写字母 F 表示正面顺时针旋转，带下划线 F_ 表示正面逆时针旋转
    // # F 正面，L 左面，R 右面，U 上面， D 下面，B 背面
    // """
    //     以正面旋转为例，rot90(this.face, -1) 使得正面face的3阶矩阵顺时针旋转90度，即为正面 F 操作
    //     然后将与正面face 相邻的四个面需要旋转的行移动到第一层：
    //         left是第三竖行，逆时针90度旋转，
    //         up是第三横行，180度旋转，
    //         right是第一竖行，逆时针90旋转，
    //         down不需旋转
    //     此后所有旋转的格子都在第一行，进行相应的赋值，即完成魔方的 F 旋转
    //     其余面原理相同
    // """

    }
    F(){
        this.face = rot90(this.face, -1)
        this.left = rot90(this.left)
        this.up = rot90(this.up, 2)
        this.right = rot90(this.right, -1)
        const temp1: number[] = []
        for(var colo of this.left[0]){
            temp1.push(colo)
        }
        const temp2: number[] = []
        for(var colo of this.right[0]){
            temp2.push(colo)
        }
        this.left[0] = [].concat(this.down[0])
        this.right[0] = [].concat(this.up[0])
        this.up[0] = temp1
        this.down[0] = temp2
        this.left = rot90(this.left, -1)
        this.up = rot90(this.up, 2)
        this.right = rot90(this.right)
    }
    F_(){
        this.face = rot90(this.face)
        this.left = rot90(this.left)
        this.up = rot90(this.up, 2)
        this.right = rot90(this.right, -1)
        const temp1: number[] = []
        for(var colo of this.left[0]){
            temp1.push(colo)
        }
        const temp2: number[] = []
        for(var colo of this.right[0]){
            temp2.push(colo)
        }
        this.left[0] =[].concat(this.up[0])
        this.right[0] = [].concat(this.down[0])
        this.up[0] = temp2
        this.down[0] = temp1
        this.left = rot90(this.left, -1)
        this.up = rot90(this.up, 2)
        this.right = rot90(this.right)

    }B(){
        this.back = rot90(this.back, -1)
        this.left = rot90(this.left, -1)
        this.down = rot90(this.down, 2)
        this.right = rot90(this.right)
        const temp1: number[] = []
        for(var colo of this.left[0]){
            temp1.push(colo)
        }
        const temp2: number[] = []
        for(var colo of this.right[0]){
            temp2.push(colo)
        }
        this.left[0] = [].concat(this.up[0])
        this.right[0] = [].concat(this.down[0])
        this.up[0] = temp2
        this.down[0] = temp1
        this.left = rot90(this.left)
        this.down = rot90(this.down, 2)
        this.right = rot90(this.right, -1)

    }B_(){
        this.back = rot90(this.back)
        this.left = rot90(this.left, -1)
        this.down = rot90(this.down, 2)
        this.right = rot90(this.right)
        const temp1: number[] = []
        for(var colo of this.left[0]){
            temp1.push(colo)
        }
        const temp2: number[] = []
        for(var colo of this.right[0]){
            temp2.push(colo)
        }
        this.left[0] = [].concat(this.down[0])
        this.right[0] = [].concat(this.up[0])
        this.up[0] = temp1
        this.down[0] = temp2
        this.left = rot90(this.left)
        this.down = rot90(this.down, 2)
        this.right = rot90(this.right, -1)

    }L(){
        this.left = rot90(this.left, -1)
        this.back = rot90(this.back)
        this.up = rot90(this.up, -1)
        this.face = rot90(this.face, -1)
        this.down = rot90(this.down, -1)
        const temp1: number[] = []
        for(var colo of this.back[0]){
            temp1.push(colo)
        }
        const temp2: number[] = []
        for(var colo of this.face[0]){
            temp2.push(colo)
        }
        this.back[0] = [].concat(this.down[0])
        this.face[0] = [].concat(this.up[0])
        this.up[0] = temp1
        this.down[0] = temp2
        this.back = rot90(this.back, -1)
        this.up = rot90(this.up)
        this.face = rot90(this.face)
        this.down = rot90(this.down)

    }L_(){
        this.left = rot90(this.left)
        this.back = rot90(this.back)
        this.up = rot90(this.up, -1)
        this.face = rot90(this.face, -1)
        this.down = rot90(this.down, -1)
        const temp1: number[] = []
        for(var colo of this.back[0]){
            temp1.push(colo)
        }
        const temp2: number[] = []
        for(var colo of this.face[0]){
            temp2.push(colo)
        }
        this.back[0] = [].concat(this.up[0])
        this.face[0] = [].concat(this.down[0])
        this.up[0] = temp2
        this.down[0] = temp1
        this.back = rot90(this.back, -1)
        this.up = rot90(this.up)
        this.face = rot90(this.face)
        this.down = rot90(this.down)

    }R(){
        this.right = rot90(this.right, -1)
        this.back = rot90(this.back, -1)
        this.up = rot90(this.up)
        this.face = rot90(this.face)
        this.down = rot90(this.down)
        const temp1: number[] = []
        for(var colo of this.back[0]){
            temp1.push(colo)
        }
        const temp2: number[] = []
        for(var colo of this.face[0]){
            temp2.push(colo)
        }
        this.back[0] = [].concat(this.up[0])
        this.face[0] = [].concat(this.down[0])
        this.up[0] = temp2
        this.down[0] = temp1
        this.back = rot90(this.back)
        this.up = rot90(this.up, -1)
        this.face = rot90(this.face, -1)
        this.down = rot90(this.down, -1)

    }R_(){
        this.right = rot90(this.right)
        this.back = rot90(this.back, -1)
        this.up = rot90(this.up)
        this.face = rot90(this.face)
        this.down = rot90(this.down)
        const temp1: number[] = []
        for(var colo of this.back[0]){
            temp1.push(colo)
        }
        const temp2: number[] = []
        for(var colo of this.face[0]){
            temp2.push(colo)
        }
        this.back[0] = [].concat(this.down[0])
        this.face[0] = [].concat(this.up[0])
        this.up[0] = temp1
        this.down[0] = temp2
        this.back = rot90(this.back)
        this.up = rot90(this.up, -1)
        this.face = rot90(this.face, -1)
        this.down = rot90(this.down, -1)

    }U(){
        this.up = rot90(this.up, -1)
        const temp1: number[] = []
        for(var colo of this.left[0]){
            temp1.push(colo)
        }
        const temp2: number[] = []
        for(var colo of this.right[0]){
            temp2.push(colo)
        }
        this.left[0] = [].concat(this.face[0])
        this.right[0] = [].concat(this.back[0])
        this.back[0] = temp1
        this.face[0] = temp2

    }U_(){
        this.up = rot90(this.up)
        const temp1: number[] = []
        for(var colo of this.left[0]){
            temp1.push(colo)
        }
        const temp2: number[] = []
        for(var colo of this.right[0]){
            temp2.push(colo)
        }
        this.left[0] = [].concat(this.back[0])
        this.right[0] = [].concat(this.face[0])
        this.back[0] = temp2
        this.face[0] = temp1

    }D(){
        this.down = rot90(this.down, -1)
        this.left = rot90(this.left, 2)
        this.right = rot90(this.right, 2)
        this.face = rot90(this.face, 2)
        this.back = rot90(this.back, 2)
        const temp1: number[] = []
        for(var colo of this.left[0]){
            temp1.push(colo)
        }
        const temp2: number[] = []
        for(var colo of this.right[0]){
            temp2.push(colo)
        }
        this.left[0] = [].concat(this.back[0])
        this.right[0] = [].concat(this.face[0])
        this.back[0] = temp2
        this.face[0] = temp1
        this.left = rot90(this.left, 2)
        this.right = rot90(this.right, 2)
        this.face = rot90(this.face, 2)
        this.back = rot90(this.back, 2)

    }D_(){
        this.down = rot90(this.down)
        this.left = rot90(this.left, 2)
        this.right = rot90(this.right, 2)
        this.face = rot90(this.face, 2)
        this.back = rot90(this.back, 2)
        const temp1: number[] = []
        for(var colo of this.left[0]){
            temp1.push(colo)
        }
        const temp2: number[] = []
        for(var colo of this.right[0]){
            temp2.push(colo)
        }
        this.left[0] = [].concat(this.face[0])
        this.right[0] = [].concat(this.back[0])
        this.back[0] = temp1
        this.face[0] = temp2
        this.left = rot90(this.left, 2)
        this.right = rot90(this.right, 2)
        this.face = rot90(this.face, 2)
        this.back = rot90(this.back, 2)

    }check(){
        // """魔法的检查方法，魔方所有颜色均归位以后返回true,否则返回false"""
        for(var row of this.face){
            for(var colour of row){
                if ( colour != 1){
                    return false
                }
            }
        }
        for(var row of this.back){
            for(var colour of row){
                if ( colour != 4){
                    return false
                }
            }
        }
        for(var row of this.left){
            for(var colour of row){
                if ( colour != 2){
                    return false
                }
            }
        }
        for(var row of this.right){
            for(var colour of row){
                if ( colour != 5){
                    return false
                }
            }
        }
        for(var row of this.up){
            for(var colour of row){
                if ( colour != 3){
                    return false
                }
            }
        }
        for(var row of this.down){
            for(var colour of row){
                if ( colour != 6){
                    return false
                }
            }
        }
        return true

    }

    re_do(msg:string[]){
        for(var plain_text of msg){
            eval(`this.${plain_text}()`)
            if(this.check()){
                return true
            }
        }
        return false
    }
    
}
