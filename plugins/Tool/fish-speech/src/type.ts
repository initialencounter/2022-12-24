export type InvokeRequest = {
    text: string,
    prompt_text?: string,
    prompt_tokens?: string,
    max_new_tokens: 0
    top_k: number
    top_p: number
    repetition_penalty: number
    temperature: number
    order: "zh,jp,en"
    use_g2p: boolean
    seed?: number
    speaker?: string
}
export type LoadModelRequest = {
    device: "cuda" | "cpu"
    llama: LoadLlamaModelRequest
    vqgan: LoadVQGANModelRequest
}
export type LoadLlamaModelRequest = {
    config_name: string
    checkpoint_path: string
    precision: "float16" | "bfloat16"
    tokenizer: string
    compile: boolean
}
export type LoadVQGANModelRequest = {
    config_name: string
    checkpoint_path: string
}

export type getModelsResponse = {
    models: string[]
}