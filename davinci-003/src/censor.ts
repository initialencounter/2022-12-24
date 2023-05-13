import { Context, Logger } from 'koishi'
const name = 'davinci-003-censor';
const logger = new Logger(name);


export class Censor {
    access_token: string
    AK: string
    SK: string
    constructor(private ctx: Context, AK?: string, SK?: string) {
        this.SK = SK
        this.AK = AK
        ctx.on('ready', async () => {
            this.access_token = await this.get_token()
        })
    }

    /**
   * 
   * @returns 百度审核令牌
   */
    async get_token(): Promise<string> {
        if (this.AK && this.SK) {
            try {
                let options = {
                    'method': 'POST',
                    'url': 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=' + this.AK + '&client_secret=' + this.SK
                }
                const resp: string = (await this.ctx.http.axios(options)).data.access_token
                return resp
            }
            catch (e) {
                logger.warn(e.toString())
                return ''
            }
        } else {
            return ''
        }
    }

    /**
   * 
   * @param text 要审查的文本
   * @param token 百度审核api的令牌
   * @returns 合规或不合规
   */

    async censor_request(text: string): Promise<boolean> {
        try {
            const option = {
                'method': 'POST',
                'url': 'https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined?access_token=' + this.access_token,
                'headers': {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                data: {
                    'text': text
                }
            }
            const resp = await this.ctx.http.axios(option)
            if (resp.data.conclusion == '不合规') {
                return false
            } else {
                return true
            }
        } catch (e) {
            logger.warn(String(e))
            return true
        }
    }
}