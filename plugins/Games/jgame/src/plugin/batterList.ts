import { Context, h, Schema } from "koishi";
import { render } from "../utils/renderBattleList";
import { } from '../service/api';
import { validateAndFormatDate } from "../utils";
import { writeFileSync } from "fs";
import { renderTFT } from "../utils/renderTFTBattleList";


declare module 'koishi' {
  interface User {
    jgameScene: string
    lolAppNum: string
    tftScene: string
    lolUuid: string
    tftUuid: string
    tftAreaId: number
  }
}


class BattleList {
  static inject = ['jgameImageCache', 'canvas', 'database', 'jgameAPI'];
  private readonly pluginConfig: any; // Define your config type here
  constructor(private ctx: Context, config: any) {
    this.pluginConfig = config;
    ctx.model.extend('user', {
      jgameScene: 'string',
      lolAppNum: 'string',
      tftScene: 'string',
      lolUuid: 'string',
      tftUuid: 'string',
      tftAreaId: 'integer',
    })

    // ctx.on('ready', async () => {
    //   const scene = 'v3_ucoL3BN_EgTfuZ2vCuWHZC_cgqtjVkJXiCeJxo-g2JgKODIGiyvAc62HAZFhb1ObLJ2d6jVagvzWoAHWEFC--8k9ifYQy2wOGGqTSMVyFPlsM5FHlNQrpnNiQHgQ5RXsuwJfmwahsPRVLkKVxnXXSw=='
    //   const battleList = await ctx.jgameAPI.fetchBattleList(scene);
    //   const basicInfo = await ctx.jgameAPI.fetchBasicInfo(scene);
    //   const battleStatEntry = await ctx.jgameAPI.fetchBattleStatEntry(scene);
    //   const img = await render(battleList, ctx.canvas, ctx.jgameImageCache, basicInfo, battleStatEntry);
    //   writeFileSync('battleList.png', img);
    // })
    // ctx.on('ready', async () => {
    //   const scene = 'v3_MvA2eDP8xKmoZu5lyMNdz-rOk4Nc6ebl46ucGv8LpaOCgr7Qam5Zx-Ru3ZonXA6DXmrBOfzaY27xXNCyUTk95JLVEhdzu9MSM8Ah82qeI3yZfrmODuwZ5b9jjJjCHDhl'
    //   const lolUuid = '76b5ffb1-b5c7-46ee-a97a-fdaa787a51fd';
    //   const area_id = 14;
    //   const battleList = await ctx.jgameAPI.fetchTFTBattleList(lolUuid, area_id);
    //   const basicInfo = await ctx.jgameAPI.fetchTFTBasicInfo(scene);
    //   const battleStatEntry = await ctx.jgameAPI.fetchTFTBattleStatEntry(lolUuid, area_id);
    //   const img = await renderTFT(battleList, ctx.canvas, ctx.jgameImageCache, basicInfo, battleStatEntry);
    //   writeFileSync('tftBattleList.png', img);
    // })
    ctx.command('铲铲战绩', '查询金铲铲战绩')
      .option('date', '-d <date:string> 开始日期, 格式2025-08-17T14:12:19')
      .userFields(['jgameScene'])
      .action(async ({ session, options }) => {
        if (!session) return;
        const scene = session.user?.jgameScene;
        if (!scene) {
          return h.quote(session.messageId) + '' + h.at(session.userId) + '未绑定掌盟, 请使用 `绑定掌盟 [掌盟ID]` 命令进行绑定';
        }
        let baton: string | undefined = undefined
        if (options?.date) {
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

        const basicInfo = await ctx.jgameAPI.fetchBasicInfo(scene);
        const battleStatEntry = await ctx.jgameAPI.fetchBattleStatEntry(scene);
        const img = await render(battleList, ctx.canvas, ctx.jgameImageCache, basicInfo, battleStatEntry);
        return h.image(img, 'image/png');
      });

    ctx.command('云顶战绩', '查询云顶之弈战绩')
      .option('date', '-d <date:string> 开始日期, 格式2025-08-17T14:12:19')
      .userFields(['lolUuid', 'tftScene', 'lolAppNum', 'tftAreaId', 'tftUuid'])
      .action(async ({ session, options }) => {
        if (!session) return;
        const tftUuid = session.user?.tftUuid;
        const scene = session.user?.tftScene;
        const area_id = session.user?.tftAreaId;
        const lolAppNum = session.user?.lolAppNum;
        if (!lolAppNum || !tftUuid || !scene || area_id == null) {
          return h.quote(session.messageId) + '' + h.at(session.userId) + '未绑定掌盟, 请使用 `绑定掌盟 [掌盟ID]` 命令进行绑定';
        }
        let baton: string | undefined = undefined
        if (options?.date) {
          const validatedBaton = validateAndFormatDate(options.date + 'z')
          if (!validatedBaton) {
            return h.quote(session.messageId) + '' + h.at(session.userId) + '日期格式错误, 请使用 `YYYY-MM-DDTHH:MM:SS` 格式';
          }
          baton = validatedBaton;
        }
        const battleList = await ctx.jgameAPI.fetchTFTBattleList(tftUuid, area_id, baton);
        if (!battleList || !battleList.data.exploit_list) {
          return h.quote(session.messageId) + '' + h.at(session.userId) + '未查询到战绩';
        }

        const basicInfo = await ctx.jgameAPI.fetchTFTBasicInfo(scene);
        const battleStatEntry = await ctx.jgameAPI.fetchTFTBattleStatEntry(tftUuid, area_id);
        const img = await renderTFT(battleList, ctx.canvas, ctx.jgameImageCache, basicInfo, battleStatEntry);
        return h.image(img, 'image/png');
      });

    ctx.command('绑定掌盟 [id:string]', '绑定掌盟ID 068075508')
      .userFields(['jgameScene', 'lolAppNum', 'tftScene', 'lolUuid', 'tftAreaId', 'tftUuid'])
      .action(async ({ session }, prompt) => {
        if (!session?.user) return;
        const appNum = session.user.lolAppNum;
        if (appNum) {
          await session.send(`当前绑定掌盟ID: ${appNum} 是否覆盖?[Y/n]`);
          const confirm = await session.prompt(60000);
          if (confirm && confirm.toLowerCase() !== 'y') {
            await session.send('已取消绑定');
            return;
          }
        }
        if (!prompt) {
          await session.send('请输入掌盟ID');
          prompt = await session.prompt(60000)
          if (!prompt) {
            return;
          }
        }
        session.user.lolAppNum = prompt;
        const scene = await ctx.jgameAPI.getSceneByAppNum(prompt);
        if (scene.jgameScene) session.user.jgameScene = scene.jgameScene;
        if (scene.tftScene) session.user.tftScene = scene.tftScene;
        if (scene.uuid) session.user.lolUuid = scene.uuid;
        if (scene.tftAreaId) session.user.tftAreaId = scene.tftAreaId;
        if (scene.tftUuid) session.user.tftUuid = scene.tftUuid;
        return h.quote(session.messageId) + '' + h.at(session.userId) + '绑定成功';
      })
  }
}

namespace BattleList {
  export interface Config { }

  export const Config: Schema<Config> = Schema.object({})

}

export default BattleList;
