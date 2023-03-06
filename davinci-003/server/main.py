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
        {"role": "system", "content": config_data['chatgpt']['preset']}
    ]
}

sessions = {}

openai.api_base = "https://chat-gpt.aurorax.cloud/v1"

def chat_with_gpt(messages):
    try:
        if not config_data['openai']['api_key']:
            return "请设置Api Key"
        else:
            openai.api_key = config_data['openai']['api_key']
        resp = openai.ChatCompletion.create(
            model=config_data['chatgpt']['model'],
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

def chat(msg, sessionid):
    try:
        if msg.strip() == '':
            return {"msg":[{"role":"","content":{'您好，我是人工智能助手，如果您有任何问题，请随时告诉我，我将尽力回答。\n如果您需要重置我们的会话，请回复`重置会话`'}}],"id":1}
        # 获得对话session
        session = get_chat_session(sessionid)
        if '重置会话' == msg.strip():
            # 清除对话内容但保留人设
            del session['msg'][1:len(session['msg'])]
            return {"msg":[{"role":"","content":{'会话已重置'}}],"id":1}
        if '重置人格' == msg.strip():
            # 清空对话内容并恢复预设人设
            session['msg'] = [
                {"role": "system", "content": config_data['chatgpt']['preset']}
            ]
            return {"msg":[{"role":"","content":{'人格重置'}}],"id":1}
        if '指令说明' == msg.strip():
            return {"msg":[{"role":"","content":{"指令如下(群内需@机器人)：\n1.[重置会话] 请发送 重置会话\n2.[设置人格] 请发送 设置人格+人格描述\n3.[重置人格] 请发送 重置人格\n4.[指令说明] 请发送 " \
                   "指令说明\n注意：\n重置会话不会清空人格,重置人格会重置会话!\n设置人格后人格将一直存在，除非重置人格或重启逻辑端!"}}],"id":1}
        if msg.strip().startswith('设置人格'):
            # 清空对话并设置人设
            session['msg'] = [
                {"role": "system", "content": msg.strip().replace('设置人格', '')}
            ]
            return {"msg":[{"role":"","content":{'人格设置成功'}}],"id":1}
        # 设置本次对话内容
        session['msg'].append({"role": "user", "content": msg})
        # 与ChatGPT交互获得对话内容
        message = chat_with_gpt(session['msg'])
        # 查看是否出错
        if message.__contains__("This model's maximum context length is 4096 token"):
            # 出错就清理一条
            del session['msg'][1:2]
            # 去掉最后一条
            del session['msg'][len(session['msg']) - 1:len(session['msg'])]
            # 重新交互
            message = chat(msg, sessionid)
        # 记录上下文
        session['msg'].append({"role": "assistant", "content": message})
        print("会话ID: " + str(sessionid))
        print("ChatGPT返回内容: ")
        print(message,'\n',session)
        return session
    except Exception as error:
        traceback.print_exc()
        return {"msg":[{"role":"","content":{str('异常: ' + str(error))}}],"id":1}


class Item(BaseModel):
    msg: str
    id: int

app = FastAPI()
@app.post("/chat")
def create_item(item:Item):
    msg = chat(item.msg,item.id)
    print(sessions)
    return msg

uvicorn.run(app, host="0.0.0.0", port=32336)
