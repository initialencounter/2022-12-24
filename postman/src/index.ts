export const name = 'postman'
import { Context,Session, Logger } from 'koishi'

class Postman {
  constructor(private ctx:Context){
    ctx.command('addcurl').action(()=>{
      
    })
  }
}
