export const name = '@initencounter/sst'
import { Context, Service, Session } from 'koishi'
declare module 'koishi' {
  interface Context {
    sst: Sst
  }
}
abstract class Sst extends Service {
  constructor(ctx: Context){
    super(ctx,'sst',true)
  }
  abstract audio2text(session: Session): Promise<string>
}
namespace Sst {
  export interface Config { }
}
export default Sst
