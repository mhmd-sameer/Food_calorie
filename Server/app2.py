# final app.py
import os
import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.models import resnet18
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from collections.abc import Iterable

from PIL import Image
import ngrok
import uvicorn

import nest_asyncio
import uvicorn

nest_asyncio.apply() 

# ------------------------------
# Config (can be overridden with env vars)
# ------------------------------
CLASSIFIER_STATE = os.getenv("CLASSIFIER_STATE", "./classifier.pth")
CALORIE_STATE = os.getenv("CALORIE_STATE", "./calorie_model.pth")
CLASS_NAMES_PATH = os.getenv("CLASS_NAMES_PATH", "./classes.txt")
NUM_CLASSES = int(os.getenv("NUM_CLASSES", "101"))

# ------------------------------
# FastAPI + CORS
# ------------------------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # replace with your frontend origin(s) for production
    allow_methods=["*"],
    allow_headers=["*"],
)
ngrok.set_auth_token("2a1iGE4Q5SDAF4mhdAVXeNptwJd_2GBcW2ACMaj2JoAJy8Gtt")
listener = ngrok.forward("127.0.0.1:8000", authtoken_from_env=True, domain="apparent-wolf-obviously.ngrok-free.app")

# ------------------------------
# Device
# ------------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ------------------------------
# Load class names (safe)
# ------------------------------
if not os.path.exists(CLASS_NAMES_PATH):
    raise FileNotFoundError(f"Class names file not found: {CLASS_NAMES_PATH}")
with open(CLASS_NAMES_PATH, "r") as f:
    class_names = [ln.strip() for ln in f.readlines()]

if len(class_names) != NUM_CLASSES:
    print(f"Warning: class_names length ({len(class_names)}) != NUM_CLASSES ({NUM_CLASSES})")

# ------------------------------
# Classifier wrapper and loader
# ------------------------------
class FoodClassifier(nn.Module):
    def __init__(self, num_classes):
        super(FoodClassifier, self).__init__()
        self.model = resnet18(pretrained=False)
        self.model.fc = nn.Linear(self.model.fc.in_features, num_classes)
    def forward(self, x):
        return self.model(x)

classifier = FoodClassifier(NUM_CLASSES).to(device)
if not os.path.exists(CLASSIFIER_STATE):
    raise FileNotFoundError(f"Classifier state file not found: {CLASSIFIER_STATE}")

state_dict_cls = torch.load(CLASSIFIER_STATE, map_location="cpu")

# Prefix normalization: if keys don't start with 'model.' add it (wrapper uses self.model)
first_key = list(state_dict_cls.keys())[0]
if not first_key.startswith("model."):
    state_dict_cls = {"model." + k: v for k, v in state_dict_cls.items()}

# If final fc has different out_features, skip loading it (we'll keep randomly-initialized final layer)
ck_fc_w = state_dict_cls.get("model.fc.weight")
if ck_fc_w is not None and ck_fc_w.shape[0] != classifier.model.fc.weight.shape[0]:
    print(f"Classifier checkpoint fc out_features {ck_fc_w.shape[0]} != target {classifier.model.fc.weight.shape[0]}. Skipping fc params.")
    state_dict_cls.pop("model.fc.weight", None)
    state_dict_cls.pop("model.fc.bias", None)

state_dict_cls = {k: v.to(device) for k, v in state_dict_cls.items()}
classifier.load_state_dict(state_dict_cls, strict=False)
classifier.eval()
print("Classifier loaded.")

# ------------------------------
# Calorie model auto-loader (handles Sequential-style checkpoints)
# ------------------------------
if not os.path.exists(CALORIE_STATE):
    raise FileNotFoundError(f"Calorie state file not found: {CALORIE_STATE}")

state_dict_cal_raw = torch.load(CALORIE_STATE, map_location="cpu")

# normalize prefix
if list(state_dict_cal_raw.keys())[0].startswith("model."):
    normalized = {k.replace("model.", ""): v for k, v in state_dict_cal_raw.items()}
else:
    normalized = dict(state_dict_cal_raw)

# If looks like Sequential with keys '0','2','4' build matching Sequential
if all(k in normalized for k in ("0.weight", "2.weight", "4.weight")):
    w0_shape = normalized["0.weight"].shape   # (out0, in0)
    w2_shape = normalized["2.weight"].shape
    w4_shape = normalized["4.weight"].shape

    input_dim_ck = w0_shape[1]
    calorie_model = nn.Sequential(
        nn.Linear(input_dim_ck, w0_shape[0]),
        nn.ReLU(),
        nn.Linear(w2_shape[1], w2_shape[0]),
        nn.ReLU(),
        nn.Linear(w4_shape[1], w4_shape[0])
    ).to(device)

    state_dict_for_load = {k: v.to(device) for k, v in normalized.items() if k in calorie_model.state_dict()}
    calorie_model.load_state_dict(state_dict_for_load, strict=False)
    calorie_model.eval()
    print("Calorie Sequential model built and loaded.")
else:
    # fallback: try loading the full model object (if saved with torch.save(model))
    try:
        calorie_model = torch.load(CALORIE_STATE, map_location=device)
        calorie_model.to(device)
        calorie_model.eval()
        print("Calorie full model loaded.")
    except Exception as e:
        print("Calorie checkpoint format not recognized. Available keys (sample):", list(normalized.keys())[:20])
        raise RuntimeError("Could not load calorie_model checkpoint automatically. Inspect keys above.") from e

# ------------------------------
# Transforms + helpers
# ------------------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

def get_dummy_portion_value():
    return 100.0

def portion_tensor_from_value(value_grams):
    return torch.tensor([[float(value_grams)]]).to(device)

# ------------------------------
# Predict endpoint (accepts optional 'portion' form field)
# ------------------------------
# Example food_nutrition dictionary
# Each tuple: (protein_g per 100g, carbs_g per 100g, fat_g per 100g, glycemic_index)
food_nutrition = {
    "grilled_cheese_sandwich": (12.0, 26.0, 11.0, 45 , 0),
    "apple_pie": (237, 2.1, 35.0, 12.0, 65),
    "baby_back_ribs": (302, 28.0, 0.0, 20.0, 0),
    "baklava": (420, 4.0, 45.0, 18.0, 75),
    "beef_carpaccio": (175, 30.0, 0.0, 5.0, 0),
    "beef_tartare": (189, 27.0, 0.0, 10.0, 0),
    "beet_salad": (107, 3.5, 15.0, 5.0, 42),
    "beignets": (300, 3.0, 35.0, 16.0, 70),
    "bibimbap": (294, 15.0, 42.0, 8.0, 60),
    "bread_pudding": (307, 10.0, 45.0, 10.0, 64),
    "breakfast_burrito": (400, 20.0, 35.0, 20.0, 55),
    "bruschetta": (220, 5.0, 25.0, 12.0, 60),
    "caesar_salad": (400, 10.0, 5.0, 35.0, 15),
    "cannoli": (450, 7.0, 40.0, 28.0, 70),
    "caprese_salad": (200, 10.0, 5.0, 15.0, 15),
    "carrot_cake": (350, 4.0, 45.0, 18.0, 65),
    "ceviche": (120, 20.0, 5.0, 2.0, 20),
    "cheese_plate": (500, 25.0, 10.0, 40.0, 20),
    "cheesecake": (320, 8.0, 30.0, 18.0, 55),
    "chicken_curry": (250, 25.0, 15.0, 10.0, 50),
    "chicken_wings": (200, 20.0, 5.0, 12.0, 0),
    "chocolate_cake": (380, 5.0, 50.0, 20.0, 68),
    "chocolate_mousse": (250, 5.0, 25.0, 15.0, 50),
    "churros": (300, 4.0, 40.0, 15.0, 80),
    "clam_chowder": (280, 15.0, 25.0, 12.0, 60),
    "club_sandwich": (500, 30.0, 40.0, 25.0, 60),
    "crab_cakes": (250, 15.0, 20.0, 12.0, 55),
    "creme_brulee": (350, 5.0, 30.0, 25.0, 60),
    "croque_madame": (450, 25.0, 35.0, 25.0, 65),
    "cup_cakes": (250, 3.0, 35.0, 12.0, 70),
    "deviled_eggs": (150, 10.0, 1.0, 12.0, 0),
    "donuts": (250, 3.0, 30.0, 15.0, 75),
    "dumplings": (200, 8.0, 25.0, 8.0, 55),
    "edamame": (120, 11.0, 9.0, 5.0, 15),
    "eggs_benedict": (350, 15.0, 25.0, 20.0, 60),
    "escargots": (100, 15.0, 1.0, 5.0, 0),
    "falafel": (333, 13.0, 32.0, 18.0, 60),
    "filet_mignon": (200, 28.0, 0.0, 10.0, 0),
    "fish_and_chips": (500, 25.0, 50.0, 25.0, 70),
    "foie_gras": (462, 5.0, 2.0, 50.0, 0),
    "french_fries": (312, 3.0, 41.0, 15.0, 75),
    "french_onion_soup": (200, 10.0, 15.0, 10.0, 30),
    "french_toast": (250, 8.0, 35.0, 10.0, 70),
    "fried_calamari": (300, 15.0, 20.0, 15.0, 55),
    "fried_rice": (250, 10.0, 40.0, 5.0, 60),
    "frozen_yogurt": (150, 5.0, 25.0, 3.0, 45),
    "garlic_bread": (350, 8.0, 40.0, 18.0, 68),
    "gnocchi": (250, 5.0, 45.0, 5.0, 65),
    "greek_salad": (150, 5.0, 10.0, 10.0, 15),
    "grilled_cheese_sandwich": (400, 20.0, 30.0, 25.0, 60),
    "grilled_salmon": (200, 25.0, 0.0, 12.0, 0),
    "guacamole": (150, 2.0, 8.0, 12.0, 15),
    "gyoza": (200, 8.0, 25.0, 8.0, 55),
    "hamburger": (500, 25.0, 35.0, 30.0, 65),
    "hot_dog": (300, 10.0, 25.0, 20.0, 70),
    "hot_and_sour_soup": (100, 5.0, 15.0, 2.0, 35),
    "huevos_rancheros": (300, 15.0, 25.0, 15.0, 55),
    "hummus": (166, 8.0, 15.0, 10.0, 25),
    "ice_cream": (250, 4.0, 30.0, 15.0, 60),
    "lasagna": (350, 20.0, 30.0, 18.0, 55),
    "lobster_bisque": (200, 10.0, 15.0, 10.0, 30),
    "lobster_roll_sandwich": (450, 20.0, 30.0, 25.0, 60),
    "macaroni_and_cheese": (350, 15.0, 35.0, 15.0, 65),
    "miso_soup": (50, 3.0, 5.0, 2.0, 20),
    "mussels": (100, 15.0, 5.0, 2.0, 25),
    "nachos": (450, 15.0, 40.0, 25.0, 65),
    "oysters": (50, 5.0, 5.0, 1.0, 15),
    "pad_thai": (400, 15.0, 50.0, 15.0, 65),
    "paella": (350, 20.0, 40.0, 10.0, 60),
    "pancakes": (200, 5.0, 30.0, 8.0, 60),
    "panna_cotta": (300, 5.0, 20.0, 20.0, 55),
    "peking_duck": (400, 30.0, 10.0, 25.0, 20),
    "pho": (250, 20.0, 30.0, 5.0, 50),
    "pizza": (250, 10.0, 30.0, 10.0, 60),
    "pork_chop": (250, 25.0, 0.0, 15.0, 0),
    "poutine": (450, 10.0, 45.0, 25.0, 70),
    "prime_rib": (350, 25.0, 0.0, 25.0, 0),
    "pulled_pork_sandwich": (400, 25.0, 35.0, 20.0, 60),
    "ramen": (400, 15.0, 50.0, 15.0, 65),
    "ravioli": (250, 10.0, 30.0, 10.0, 55),
    "red_velvet_cake": (400, 4.0, 50.0, 20.0, 68),
    "risotto": (300, 10.0, 40.0, 12.0, 65),
    "samosa": (250, 5.0, 30.0, 12.0, 60),
    "sashimi": (150, 20.0, 1.0, 5.0, 0),
    "scallops": (100, 15.0, 5.0, 2.0, 25),
    "shrimp_and_grits": (350, 20.0, 30.0, 15.0, 60),
    "spaghetti_bolognese": (300, 20.0, 35.0, 10.0, 55),
    "spaghetti_carbonara": (450, 25.0, 40.0, 20.0, 60),
    "spring_rolls": (250, 5.0, 30.0, 12.0, 60),
    "steak": (300, 30.0, 0.0, 20.0, 0),
    "strawberry_shortcake": (300, 5.0, 40.0, 15.0, 65),
    "sushi": (200, 10.0, 30.0, 5.0, 50),
    "tacos": (250, 15.0, 20.0, 12.0, 55),
    "takoyaki": (180, 8.0, 25.0, 5.0, 60),
    "tiramisu": (300, 5.0, 25.0, 20.0, 60),
    "tuna_tartare": (150, 20.0, 1.0, 8.0, 0),
    "waffles": (250, 5.0, 35.0, 10.0, 75),
    "wonton_soup": (150, 10.0, 20.0, 5.0, 40)
}

@app.post("/predict")
async def predict(file: UploadFile = File(...), portion: float = Form(None)):
    # ------------------------------
    # Image preprocessing
    # ------------------------------
    image = Image.open(file.file).convert("RGB")
    img_tensor = transform(image).unsqueeze(0).to(device)

    # ------------------------------
    # Classifier prediction
    # ------------------------------
    with torch.no_grad():
        logits = classifier(img_tensor)
        probs = torch.softmax(logits, dim=1)
        pred_idx = int(torch.argmax(probs, dim=1).item())
        pred_name = class_names[pred_idx] if 0 <= pred_idx < len(class_names) else str(pred_idx)

    # ------------------------------
    # Portion handling
    # ------------------------------
    portion_val = portion if portion is not None else get_dummy_portion_value()

    # One-hot + portion tensor for calorie model
    one_hot = torch.zeros(1, NUM_CLASSES).to(device)
    one_hot[0, pred_idx] = 1.0
    portion_t = portion_tensor_from_value(portion_val)
    x_cal = torch.cat([one_hot, portion_t], dim=1)

    # ------------------------------
    # Calories prediction
    # ------------------------------
    with torch.no_grad():
        cal_pred = float(calorie_model(x_cal).item())

    # ------------------------------
    # Macronutrients + glycemic index safely
    # ------------------------------
    nutr = food_nutrition.get(pred_name, (0, 0, 0, 0, 0))  # 5-value tuple
    if len(nutr) != 5:
        prot_100g, carb_100g, fat_100g, gly_index = 0, 0, 0, 0
    else:
        # Ignore first value (calories), use protein, carbs, fat, GI
        _, prot_100g, carb_100g, fat_100g, gly_index = nutr

    # Scale nutrients to portion
    factor = portion_val / 100.0
    prot = round(prot_100g * factor, 2)
    carb = round(carb_100g * factor, 2)
    fat = round(fat_100g * factor, 2)

    # Approximate sugar rise (simplified)
    sugar_impact = round(carb * (gly_index / 100), 2)

    # ------------------------------
    # Top-3 predictions
    # ------------------------------
    topk = torch.topk(probs, k=min(3, probs.shape[1]), dim=1)
    topk_indices = topk.indices[0].cpu().tolist()
    topk_probs = topk.values[0].cpu().tolist()
    topk_list = [
        {"class": class_names[i] if 0 <= i < len(class_names) else str(i), "prob": round(float(p), 4)}
        for i, p in zip(topk_indices, topk_probs)
    ]

    # ------------------------------
    # Return response
    # ------------------------------
    return {
        "food": pred_name,
        "calories": round(cal_pred, 2),
        "portion_used_g": round(float(portion_val), 2),
        "protein_g": prot,
        "carbs_g": carb,
        "fat_g": fat,
        "glycemic_index": gly_index,
        "approx_sugar_rise": sugar_impact,
        "top_predictions": topk_list
    }




# ------------------------------
# Run the server when invoked as a script
if __name__ == "__main__":
    public_url = ngrok.connect(8000)
    print(f"Public URL: {public_url}")
    uvicorn.run(app, host="0.0.0.0", port=7000)