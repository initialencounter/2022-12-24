import { Context, Schema } from 'koishi'
import * as crypto from 'crypto';
import axios from 'axios'
export const name = 'harbor'

export interface Config {
  AK: string
  SK: string
}

export const Config: Schema<Config> = Schema.object({
  AK: Schema.string().description('AK'),
  SK: Schema.string().description('SK'),
})

export function apply(ctx: Context,config:Config) {
  if((!config.AK) || (!config.SK)){
    return
  }
  ctx.command('harbor <prompt:text>','百川大模型 API').action(({session},prompt)=>{
    do_request(config.AK,config.SK,prompt)
  })
  // write your plugin here
}


function Md5V(str: string): string {
  const h = crypto.createHash('md5');
  h.update(str);
  return h.digest('hex');
}
async function do_request(AK:string,SK:string,prompt:string){
    const url = "https://api.baichuan-ai.com/v1/chat"
    const data = {
        "model": "Baichuan2-53B",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    const now: string = `${Math.floor(Date.now() / 1000)}`;
    var signature = Md5V(SK + JSON.stringify(data) + String(now))

    const headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + AK,
        "X-BC-Request-Id": "your requestId",
        "X-BC-Timestamp": String(now),
        "X-BC-Signature": signature,
        "X-BC-Sign-Algo": "MD5",
    }

    var response = await axios({
      url:url,
      headers: headers,
      data: data
    })
    return JSON.stringify(response.data)
  }
              