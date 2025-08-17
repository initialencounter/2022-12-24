import { Context, h, Schema } from "koishi";
import { render } from "../utils/renderBattleList";
import { } from '../service/api';
import { validateAndFormatDate } from "../utils";


declare module 'koishi' {
  interface User {
    jgameScene: string
  }
}


class BattleList {
  static inject = ['jgameImageCache', 'canvas', 'database', 'jgameAPI'];
  private readonly pluginConfig: any; // Define your config type here
  constructor(private ctx: Context, config: any) {
    this.pluginConfig = config;
    ctx.model.extend('user', {
      jgameScene: 'string',
    })

    ctx.command('金铲铲战绩', '查询金铲铲战绩')
      .option('date', '-d <date:string> 开始日期, 格式2025-08-17T14:12:19')
      .alias('jgame scene')
      .userFields(['jgameScene'])
      .action(async ({ session, options }) => {
        const scene = session.user.jgameScene;
        if (!scene) {
          return h.quote(session.messageId) + '' + h.at(session.userId) + '未绑定战绩 scene, 请使用 `金铲铲战绩绑定 [scene:string]` 命令进行绑定';
        }
        let baton: null | string = null
        if (options.date) {
          const validatedBaton = validateAndFormatDate(options.date + 'z')
          if (!validatedBaton) {
            return h.quote(session.messageId) + '' + h.at(session.userId) + '日期格式错误, 请使用 `YYYY-MM-DDTHH:MM:SS` 格式';
          }
          baton = validatedBaton;
        }
        const battleList = await ctx.jgameAPI.fetchBattleList(scene, baton);
        if (!battleList || !battleList.data.battle_list.length) {
          return h.quote(session.messageId) + '' + h.at(session.userId) + '未查询到战绩';
        }

        const img = await render(battleList, ctx.canvas, ctx.jgameImageCache);
        return h.image(img, 'image/png');
      });

    ctx.command('金铲铲战绩绑定 [scene:string]')
      .userFields(['jgameScene'])
      .action(async ({ session }, prompt) => {
        const scene = session.user.jgameScene;
        if (scene) {
          session.send(`当前绑定的战绩 scene: ${scene} 是否覆盖?[Y/n]`);
          const confirm = await session.prompt(60000);
          if (confirm && confirm.toLowerCase() !== 'y') {
            session.send('已取消绑定');
            return;
          }
        }
        if (!prompt) {
          session.send('请输入战绩绑定的 scene');
          prompt = await session.prompt(60000)
          if (!prompt) {
            return;
          }
        }
        session.user.jgameScene = prompt;
        return h.quote(session.messageId) + '' + h.at(session.userId) + '绑定成功';
      })
  }
}

namespace BattleList {
  export interface Config { }

  export const Config: Schema<Config> = Schema.object({})

}

export default BattleList;
