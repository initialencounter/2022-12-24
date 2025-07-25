import { Schema } from "koishi";
import { Rule } from "./activeMsg";

export interface DailyStarConfig {
  rules: Rule[];
}

export const DailyStarConfig: Schema<DailyStarConfig> = Schema.object({
  rules: Schema.array(Rule).description('今日之星推送规则'),
}).description('今日之星配置');
