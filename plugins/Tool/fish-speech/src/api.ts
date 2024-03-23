import { Quester } from "koishi"
import FishSpeech, { logger } from ".";
import { InvokeRequest, LoadModelRequest, getModelsResponse } from "./type";

export async function putModel(http: Quester, config: FishSpeech.Config, name: string = "default"): Promise<boolean> {
    const data: LoadModelRequest = {
        device: config.device,
        llama: {
            config_name: "text2semantic_finetune",
            checkpoint_path: config.llama_path,
            precision: "bfloat16",
            tokenizer: config.tokenizer,
            compile: true
        },
        vqgan: {
            config_name: "vqgan_pretrain",
            checkpoint_path: config.vqgan_path
        }
    };
    return await http.put(`${config.endpoint}/v1/models/${name}`, data, {
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(response => {
        logger.success(response)
        return true
    }).catch(error => {
        logger.info(error)
        return false
    });
}

export async function invoke(http: Quester, text: string, endpoint: string, speaker: string, name: string = "default") {
    const data: InvokeRequest = {
        "text": text,
        "prompt_text": null,
        "prompt_tokens": null,
        "max_new_tokens": 0,
        "top_k": null,
        "top_p": 0.5,
        "repetition_penalty": 1.5,
        "temperature": 0.7,
        "order": "zh,jp,en",
        "use_g2p": true,
        "seed": null,
        "speaker": speaker,
    }
    const res = await http.post(
        `${endpoint}/v1/models/${name}/invoke`,
        data,
        {
            responseType: "arraybuffer"
        }
    )
    return res
}

export async function getModels(http: Quester, endpoint: string): Promise<getModelsResponse> {
    return await http.get(`${endpoint}/v1/models`)
}

export async function deleteModels(http: Quester, endpoint: string, name: string = "default") {
    let url = `${endpoint}/v1/models/${name}`
    let models = await http.get(`${endpoint}/v1/models`)
    if (models?.models?.length === 0) {
        return
    }
    await http.delete(url)
}