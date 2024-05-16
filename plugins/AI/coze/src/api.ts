// curl --location --request POST 'https://api.coze.com/open_api/v2/chat' \



import { Quester } from "koishi"
import { ChatHistory, ChatRespose } from "./type";

export async function chat(
    http: Quester,
    history: ChatHistory,
    bot_id: string,
    userId: string,
    query: string,
    conversation_id: string = null
): Promise<ChatRespose> {
    return await http.post("/open_api/v2/chat", {
        conversation_id,
        bot_id,
        user: userId,
        query: query,
        chat_history: history,
        stream: false
    })
}