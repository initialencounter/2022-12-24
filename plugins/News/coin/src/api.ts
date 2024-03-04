import { Quester } from "koishi"

export async function getCoinHolders(http: Quester, coinType: string) {
    return await http.get(`https://dncapi.bostonteapartyevent.com/api/v3/coin/holders?code=${coinType}&webp=1`)
}