import { Context, h } from "koishi"
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs"
import { resolve } from "path";
import { ChatHistory } from "./type";

export function getChatHistory(ctx: Context): ChatHistory {
    let history = [
        { "role": "user", "content": "你好", "content_type": "text" },

        { "role": "assistant", "type": "answer", "content": "你好，请问有什么可以帮助你的吗？", "content_type": "text" },

        { "role": "user", "content": "帮我查一下今天的科技新闻", "content_type": "text" },

        { "role": "assistant", "type": "function_call", "content": "{\"name\": \"news-getToutiaoNews\", \"arguments\": {\"q\": \"科技\"}}", "content_type": "text" },

        { "role": "assistant", "type": "tool_response", "content": "{\"news\":[{\"title\":\"数字经济产业有哪些最新科技？来这里沉浸式体验→\",\"cover\":\"https://p3-sign.toutiaoimg.com/tos-cn-i-6w9my0ksvp/329cad0cd3c748649d79abd6575fac75~tplv-26tn0yjwph-cspd-v1:450:294.jpg?_iz=102390\\u0026from=search\\u0026x-expires=1706227200\\u0026x-signature=N%2BF2zxVEjl6Wpe55hYfiPE%2FZoFk%3D\",\"time\":\"2023-10-15 09:29\",\"url\":\"https://toutiao.com/group/7289988774761841208/\",\"summary\":\"2023世界数字经济大会目前正在浙江宁波举行，“上天入海”的高科技新产品让众多观众驻足体验。会上，我国的6G和5.5G等前沿技术以及相关产品纷纷亮相。\",\"media_name\":\"央视新闻\",\"categories\":[\"video_tech\"]},{\"title\":\"中国这4大科技，领先世界，就连欧美国家都只能甘拜下风\",\"cover\":\"http://p3-tt.byteimg.com/list/190x124/tos-cn-i-qvj2lq49k0/b2ced972108e43449dfe1ba5206f7190\",\"time\":\"2023-07-20 09:20\",\"url\":\"https://toutiao.com/group/7257677757801529856/\",\"summary\":\"中国这些年，科技在飞速发展当中，如今已经掌握了不少领先世界的科技，今天就来说说其中的四大科技，让我们一起来骄傲一把。\",\"media_name\":\"科学知识点\",\"categories\":[\"news_tech/other\",\"news_tech\"]},{\"title\":\"中国4大领先全球顶尖科技，日美也不得不服，形成垄断趋势\",\"cover\":\"http://p3-tt.byteimg.com/list/190x124/tos-cn-i-qvj2lq49k0/1fe180833aef48f9a024bc55e5f3f986\",\"time\":\"2023-07-11 08:58\",\"url\":\"https://toutiao.com/group/7254338599884177935/\",\"summary\":\"中国科技这些年可以说取得了不少的成就，在逐渐的突破下，中国在科技领域上有着越来越多的改变，更甚至从落后他国，到领先世界，那么作为中国人，你知道多少中国领先世界的技术呢?\",\"media_name\":\"科学知识点\",\"categories\":[\"news_tech/communication/other\",\"news_tech/communication\",\"news_tech\"]},{\"title\":\"中国20大顶尖科技→\",\"cover\":\"http://p3-tt.byteimg.com/list/190x124/tos-cn-i-qvj2lq49k0/c93ff82cad664bd2a1aed88696653ef4\",\"time\":\"2023-09-18 17:07\",\"url\":\"https://toutiao.com/group/7280056614185386559/\",\"summary\":\"经过努力，目前，中国已在不少领域建立起技术优势。本文梳理了中国在世界上处于领先地位的顶尖技术，以飨读者。\",\"media_name\":\"中国工业报\",\"categories\":[\"news_tech/other\",\"science_all/science\",\"news_tech\",\"science_all\"]},{\"title\":\"中国领先全球的5大顶尖科技，日美也不得不服，你知道多少呢？\",\"cover\":\"http://p3-tt.byteimg.com/list/190x124/tos-cn-i-qvj2lq49k0/108a537e736a4e94b32abeed23c32f69\",\"time\":\"2023-04-25 08:29\",\"url\":\"https://toutiao.com/group/7225758002144592416/\",\"summary\":\"虽然中国在不少领域还比不上西方国家，但是经过自己的努力，也已经有了不少属于自己的拿手戏，就有不少科技领先世界，成为顶尖技术，就是日美也不得不服，今天就来讲讲中国领先世界的5大顶尖科技。\",\"media_name\":\"科学知识点\",\"categories\":[\"news_tech/other\",\"science_all/bio_technology\",\"news_tech\",\"science_all\"]}]}", "content_type": "text" },

        { "role": "assistant", "type": "answer", "content": "以下是今天的一些科技新闻：\n\n1. 数字经济产业有哪些最新科技？来这里沉浸式体验→：2023世界数字经济大会目前正在浙江宁波举行，“上天入海”的高科技新产品让众多观众驻足体验。会上，我国的6G和5.5G等前沿技术以及相关产品纷纷亮相。来源：央视新闻。\n\n2. 中国这4大科技，领先世界，就连欧美国家都只能甘拜下风：中国这些年，科技在飞速发展当中，如今已经掌握了不少领先世界的科技。来源：科学知识点。\n\n3. 中国4大领先全球顶尖科技，日美也不得不服，形成垄断趋势：中国科技这些年可以说取得了不少的成就，在逐渐的突破下，中国在科技领域上有着越来越多的改变，更甚至从落后他国，到领先世界。来源：科学知识点。\n\n4. 中国20大顶尖科技→：经过努力，目前，中国已在不少领域建立起技术优势。本文梳理了中国在世界上处于领先地位的顶尖技术。来源：中国工业报。\n\n5. 中国领先全球的5大顶尖科技，日美也不得不服，你知道多少呢？：虽然中国在不少领域还比不上西方国家，但是经过自己的努力，也已经有了不少属于自己的拿手戏，就有不少科技领先世界，成为顶尖技术，就是日美也不得不服。来源：科学知识点。", "content_type": "text" }
    ]
    let history_dir = resolve(ctx.baseDir, 'data/coze')
    if (!existsSync(history_dir)) {
        mkdirSync(history_dir, { recursive: true })
    }
    let history_path = resolve(ctx.baseDir, 'data/coze/history.json')
    try {
        history = JSON.parse(readFileSync(history_path, 'utf-8'));
    } catch (e) {
        writeFileSync(history_path, JSON.stringify(history, null, 2));
    }
    return history as ChatHistory
}