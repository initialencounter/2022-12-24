import { Context, Session, h, Dict } from 'koishi'
import StarRail from ".";
export const name = 'star-rail-atlas'
import { resolve } from "path";
import { pathToFileURL } from "url";
import fs from 'fs';
export class Atlas {
    path_data: Dict
    path_dict: Dict
    name_list: string[]
    constructor(private ctx: Context, private config: StarRail.Config) {
        ctx.on('ready', async () => {
            this.path_data = require('./path.json');
            this.path_dict = {}
            let keys = ['relic', 'role', 'lightcone', 'material for role'];
            let keyMapping = {
                'material for role': '材料'
            };
            this.name_list = [];
            for (let key of keys) {
                let list = Object.keys(this.path_data[key]);
                list.map(i => {
                    this.path_dict[i + (keyMapping[key] || '')] = this.path_data[key][i];
                });
                Array.prototype.push.apply(this.name_list, list);
            }
        })
        ctx.middleware((session, next) => {
            const path = this.findpath(session.content);
            if (path == '') return next();
            let img_url: string
            if (config.engine) {
                img_url = this.config.repo + path
            } else {
                img_url = pathToFileURL(resolve(__dirname, this.config.src_path + path)).href
            }
            return h.image(img_url);
        })
        ctx.command('update', '更新图鉴索引').action(({ session }) => this.update(session))
    }
    async update(session: Session) {
        const res = await this.ctx.http.get('https://gitee.com/Nwflower/star-rail-atlas/raw/master/path.json', { responseType: 'arraybuffer' })
        fs.writeFileSync('./node_modules/koishi-plugin-star-rail-atlas/lib/path.json', res)
        return session.text('commands.update.messages.success')
    }
    findpath(cmd: string): string {
        if (!(cmd.startsWith(this.config.prefix))) return ""
        const name = cmd.replace(this.config.prefix, '')
        const path = this.path_dict[name]
        return path ? path : ""
    }
}