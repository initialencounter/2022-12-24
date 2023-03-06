import json
import traceback
import uvicorn
from copy import deepcopy
import openai
from fastapi import FastAPI
from pydantic import BaseModel


with open("config.json", "r",
          encoding='utf-8') as jsonfile:
    config_data = json.load(jsonfile)

session_config = {
    'msg': [
        {"role": "system", "content": config_data['preset']}
    ]
}

sessions = {}
#gpt后端参考自<a href="https://lucent.blog/?p=118">Lucent</a>，非官方api谨慎使用
openai.api_base = "https://chat-gpt.aurorax.cloud/v1"

def chat_with_gpt(messages,api_key):
    try:
        openai.api_key = api_key
        resp = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages
        )
        resp = resp['choices'][0]['message']['content']
    except openai.OpenAIError as e:
        print('openai 接口报错: ' + str(e))
        resp = str(e)
    return resp
def get_chat_session(sessionid):
    if sessionid not in sessions:
        config = deepcopy(session_config)
        config['id'] = sessionid
        sessions[sessionid] = config
    return sessions[sessionid]

def chat(msg, sessionid,api_key):
    try:
        if msg.strip() == '':
            return {"msg":[{"role":"system","content":{'您好，我是人工智能助手，如果您有任何问题，请随时告诉我，我将尽力回答。\n如果您需要重置我们的会话，请回复`重置会话`'}}],"id":1}
        # 获得对话session
        session = get_chat_session(sessionid)
        if '重置会话' == msg.strip():
            # 清除对话内容但保留人设
            del session['msg'][1:len(session['msg'])]
            return {"msg":[{"role":"system","content":{'会话已重置'}}],"id":1}
        if '重置人格' == msg.strip():
            # 清空对话内容并恢复预设人设
            session['msg'] = [
                {"role": "system", "content": config_data['preset']}
            ]
            return {"msg":[{"role":"system","content":{'人格重置'}}],"id":1}
        if msg.strip().startswith('设置人格'):
            # 清空对话并设置人设
            session['msg'] = [
                {"role": "system", "content": msg.strip().replace('设置人格', '')}
            ]
            return {"msg":[{"role":"system","content":{'人格设置成功'}}],"id":1}
        # 设置本次对话内容
        session['msg'].append({"role": "user", "content": msg})
        # 与ChatGPT交互获得对话内容
        message = chat_with_gpt(session['msg'],api_key)
        # 查看是否出错
        if message.__contains__("This model's maximum context length is 4096 token"):
            # 出错就清理一条
            del session['msg'][1:2]
            # 去掉最后一条
            del session['msg'][len(session['msg']) - 1:len(session['msg'])]
            # 重新交互
            message = chat(msg, sessionid,api_key)
        # 记录上下文
        session['msg'].append({"role": "assistant", "content": message})
        print("会话ID: " + str(sessionid))
        print("ChatGPT返回内容: ")
        print(message)
        return session
    except Exception as error:
        traceback.print_exc()
        return {"msg":[{"role":"","content":{str('异常: ' + str(error))}}],"id":1}


class Item(BaseModel):
    msg: str
    id: str
    api_key: str

app = FastAPI()
@app.post("/chat")
def create_item(item:Item):
    msg = chat(item.msg,item.id,item.api_key)
    print(sessions)
    return msg

uvicorn.run(app, host="0.0.0.0", port=32336)

