import uvicorn
from transformers import ViTForImageClassification
from transformers import ViTImageProcessor
import numpy as np
from requests import get
import io
import torch
from PIL import Image
from fastapi import FastAPI
from pydantic import BaseModel


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
feature_extractor = ViTImageProcessor.from_pretrained("./vit-base-dress-detection",torchscript=True)
model = ViTForImageClassification.from_pretrained("./vit-base-dress-detection",torchscript=True)
model.to(device)

def predict(image):
    inputs = feature_extractor(images=image, return_tensors="pt")
    res = {}
    for k, v in inputs.items():
        res[k] = v.to(device)
    outputs = model(**res)
    logits = outputs[0]
    predicted_class_idx = logits.argmax(-1).item()
    return model.config.id2label[predicted_class_idx]

app = FastAPI()

class Item(BaseModel):
    image: str

@app.post("/predict")
def create_item(item:Item):
    url = item.image
    image = get(url, headers={'responseType': 'arraybuffer'})
    image = Image.open(io.BytesIO(image.content)).convert("RGB")
    image = np.array(image)
    result = predict(image)
    return result


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=32335)
