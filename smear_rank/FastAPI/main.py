from fastapi import FastAPI
import sqlite3

app = FastAPI()

@app.get("/")
def read_root():
    return {"data": "tapsss.com"}

@app.get("/upload/{item}")
async def read_item(item:str):
    print(item)
    with open('./database.txt','w+') as f:
        f.write(item)
    return 'success!'


@app.get("/get")
async def send_rank():                                     # 发送群排名
    text = ''
    with open('./database.txt','r') as f:
        text += f.read()
    return text



#usage 
#uvicorn main:app --reload --host 0.0.0.0 --port 8080
