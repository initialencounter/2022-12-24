import uvicorn
from transformers import ViTForImageClassification
from transformers import ViTImageProcessor
import numpy as np
from requests import req_get
import io
from PIL import Image
from fastapi import FastAPI
from pydantic import BaseModel

feature_extractor = ViTImageProcessor.from_pretrained("./vit-base-dress-detection")
model = ViTForImageClassification.from_pretrained("./vit-base-dress-detection")

def predict(image):
    inputs = feature_extractor(images=image, return_tensors="pt")
    outputs = model(**inputs)
    logits = outputs.logits
    predicted_class_idx = logits.argmax(-1).item()
    return model.config.id2label[predicted_class_idx]


app = FastAPI()
class Item(BaseModel):
    image: str

@app.post("/predict")
def create_item(item: Item):
    url = item.image
    response = req_get(url, headers={'responseType': 'arraybuffer'})
    image = Image.open(io.BytesIO(response.content)).convert("RGB")
    image_array = np.array(image)
    result = predict(image_array)
    return result
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=32335)
