import { Quester } from "koishi"
import FishSpeech from ".";
import { InvokeRequest, LoadModelRequest, getModelsResponse } from "./type";

export async function putModel(http: Quester, config: FishSpeech.Config): Promise<boolean> {
    const data: LoadModelRequest = {
        device: "cuda",
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
    return await http.put('http://127.0.0.1:7860/v1/models/default', data, {
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(response => {
        return true
    }).catch(error => {
        return false
    });
}

export async function invoke(http: Quester, text: string, endpoint: string, speaker_id: string = null, name: string = "default") {
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
        "speaker": speaker_id,
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
    const res = await http.delete(`${endpoint}/v1/models/${name}`)
}