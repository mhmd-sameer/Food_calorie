# test.py
import requests
import base64

# 🔐 Your PAT
PAT = "6abcc6badcf94b04a0cf1172397a0a66"

# ✅ Correct endpoint
url = "https://api.clarifai.com/v2/models/food-item-recognition/outputs"

# Headers
headers = {
    "Authorization": f"Key {PAT}",
    "Content-Type": "application/json"
}

# 🖼️ Use a reliable public food image (no restrictions)
# This one is from Wikipedia — works reliably
image_url = "https://upload.wikimedia.org/wikipedia/commons/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg"

try:
    # Download image safely
    print("Downloading image...")
    img_response = requests.get(image_url, timeout=10)
    img_response.raise_for_status()

    # ✅ Encode image as base64
    image_base64 = base64.b64encode(img_response.content).decode('utf-8')

    # ✅ Payload with user_app_id + base64 image
    data = {
        "user_app_id": {
            "user_id": "clarifai",
            "app_id": "main"
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "base64": image_base64  # ✅ Send raw bytes
                    }
                }
            }
        ]
    }

    # Send to Clarifai
    print("Sending to Clarifai...")
    response = requests.post(url, headers=headers, json=data)

    # Print result
    print("Status Code:", response.status_code)
    if response.status_code == 200:
        result = response.json()
        if result['status']['code'] == 30000:
            print("✅ Success! Detected foods:")
            for concept in result['outputs'][0]['data']['concepts']:
                print(f"  {concept['name']}: {concept['value']:.2f}")
        else:
            print("❌ API Error:", result['status']['description'])
            print("Details:", result['status']['details'])
    else:
        print("HTTP Error:", response.text)

except requests.exceptions.RequestException as e:
    print("Download failed:", e)
except Exception as e:
    print("Error:", e)