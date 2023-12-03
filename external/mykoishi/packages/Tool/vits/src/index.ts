export const name = '@initencounter/vits'
import { Context, Service, h } from 'koishi'
declare module 'koishi' {
  interface Context {
    vits: Vits
  }
}
abstract class Vits extends Service {
  constructor(ctx: Context) {
    super(ctx, 'vits', true)
  }
  abstract say(options: Vits.Result): Promise<h>
}
namespace Vits {
  export interface Config { }
  export interface Result {
    input: string
    speaker_id?: number
    output?: h
  }
}
export default Vits