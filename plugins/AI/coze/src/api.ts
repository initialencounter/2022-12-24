// curl --location --request POST 'https://api.coze.com/open_api/v2/chat' \

import { Quester } from "koishi"
import { ChatHistory, ChatRespose } from "./type";


export async function chat(
    http: Quester,
    chat_history: ChatHistory,
    bot_id: string,
    user: string,
    query: string,
    conversation_id: string = null
): Promise<ChatRespose> {
    let data = {
        bot_id, conversation_id, user, query, chat_history, stream: false
    }
    // console.log(data);
    return await http.post("/open_api/v2/chat", JSON.stringify(data))
}