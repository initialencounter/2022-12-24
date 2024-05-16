export type ChatRespose = {
    messages: {
        role: Role,
        type: AnswerType,
        content: string,
        content_type: "text",
        extra_info: any
    }[],
    conversation_id: string,
    code: number,
    msg: "success"
}
export type AnswerType = "answer" | "function_call" | "tool_response" | "follow_up"
export type Role = "assistant" | "user"
export type ChatHistory = { role: Role, type: AnswerType, content: string, content_type: string }[]

export type Request = {
    "Content-Type": "Application/json"
    Authorization: string
    Connection: "Keep-alive"
    Accept: "*/*"
}