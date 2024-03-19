import { Session, segment } from "koishi";

/**
 * 撤回消息
 * @param session 
 * @param messageId 
 * @param time 
 */
export async function recall(session: Session, messageId: string, time: number) {
    new Promise(resolve => setTimeout(() => {
        session.bot.deleteMessage(session.channelId, messageId)
    }
        , time));

}

/**
* 发送选择菜单
* @param session 
* @param type_arr 
* @param name 
* @returns 
*/
export async function switch_menu(session: Session, type_arr: string[], name: string): Promise<string> {
    let type_str: string = '\n' + name + '\n'
    let count = 0
    const result = segment('figure')
    type_arr.forEach((i, id) => {
        if (count > 50) {
            count = 0
            result.children.push(
                segment('message', {
                    userId: '1114039391',
                    nickname: 'AI',
                }, type_str))
            type_str = ''
        }
        type_str += String(id + 1) + ' ' + i + '\n'
        count++
    })
    result.children.push(
        segment('message', {
            userId: '1114039391',
            nickname: 'AI',
        }, type_str))
    await session.send(result)
    const input = await session.prompt()
    if (!input || Number.isNaN(+input)) return ''
    const index: number = parseInt(input) - 1
    if ((index < 0) || (index > type_arr.length - 1)) return ''
    return type_arr[index]
}

/**
   * grid布局
   * @param session 
   * @param type_arr 
   * @param name 
   * @returns 
   */
export async function switch_menu_grid(session: Session, type_arr: string[], name: string): Promise<string[]> {
    let type_str: string = '\n' + name + '\n\n'
    let count = 0
    function getActualLength(str) {
        let actualLength = 0;

        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);

            // 如果字符编码在全角范围内，长度加2，否则加1
            if ((charCode >= 0xff01 && charCode <= 0xff5e) || (charCode >= 0x3000 && charCode <= 0x303f)) {
                actualLength += 2;
            } else {
                actualLength += 1;
            }
        }

        return actualLength;
    }
    function multiplyStrings(str, n) {
        return Array.from({ length: n }, () => str).join('');
    }
    const result = segment('figure')
    for (let id = 0; id < type_arr.length; id += 2) {
        if (count > 50) {
            count = 0
            result.children.push(
                segment('message', {
                    userId: '1114039391',
                    nickname: 'AI',
                }, type_str))
            type_str = ''
        }
        const firstLen = getActualLength(String(id + 1) + ' ' + type_arr[id])
        const spaceString = multiplyStrings('   ', 20 - firstLen)
        type_str += String(id + 1) + ' ' + type_arr[id] + spaceString + String(id + 2) + ' ' + type_arr[id + 1] + '\n'
        count++
    }

    result.children.push(
        segment('message', {
            userId: '1114039391',
            nickname: 'AI',
        }, type_str))
    await session.send(result)
    let input:string = await session.prompt()
    input = input.trim()
    let res = []
    for(var i of input.split(" ")){
        if (!i || Number.isNaN(+i)){
            continue
        }
        const index: number = parseInt(i) - 1
        if ((index < 0) || (index > type_arr.length - 1)) continue
        res.push(type_arr[index])
    }
    return res
}

