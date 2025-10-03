from flask import Flask, request, jsonify, send_from_directory

from flask_cors import CORS
from clarifai.client.model import Model
from clarifai.client.input import Inputs
from clarifai_grpc.grpc.api.status import status_code_pb2
from groq import Groq
import base64
import os
import requests
app = Flask(__name__)
CORS(app)

# Load API keys
CLARIFAI_API_KEY = os.getenv("CLARIFAI_API_KEY")
SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY","groq_api")

# clarifai_model = Model("clarifai/main/models/food-item-recognition/versions/dfebc169854e429086aceb8368662641", api_key=CLARIFAI_API_KEY)
groq_client = Groq(api_key=GROQ_API_KEY)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/upload", methods=["POST"])
def upload_file():
    file = request.files['file']
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)
    return {"url": f"http://localhost:5000/uploads/{file.filename}"}

@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route("/api/analyze", methods=["POST"])
def analyze_food():
    try:
        
        file = request.files["image"]
        user_text = request.form.get("message", "")

        # Save uploaded file locally
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        # Create a public URL for Groq
        image_url_from_upload = f"http://localhost:5000/uploads/{file.filename}"

        # -------- Clarifai REST API --------
        with open(filepath, "rb") as f:
            image_b64 = base64.b64encode(f.read()).decode("utf-8")

    


        # -------- Clarifai REST API --------
        url = "https://api.clarifai.com/v2/models/food-item-recognition/outputs"
        headers = {
            "Authorization": f"Key {CLARIFAI_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "user_app_id": {"user_id": "clarifai", "app_id": "main"},
            "inputs": [{"data": {"image": {"base64": image_b64}}}]
        }

        response = requests.post(url, headers=headers, json=data)
        result = response.json()

        if "outputs" not in result or not result["outputs"]:
            return jsonify({"error": "Clarifai prediction failed"}), 500

        # Extract food labels
        food_labels = []
        # for concept in result["outputs"][0]["data"]["concepts"]:
        #     food_labels.append(f"{concept['name']} ({round(concept['value']*100,2)}%)")

        # -------- Groq Chatbot --------
    
        # -------- Groq Chatbot with Food Context + Image --------
        
        # The user uploaded a food image. Clarifai detected these items:
        # {', '.join(food_labels)}.
        prompt = f"""
        I am uploading an image of a meal or food item. Please act as a food calorie estimator and intelligent nutrition advisor. Your task is to analyze the image and identify all visible food components, including main ingredients, side items, sauces, garnishes, and beverages if present. Use visual cues such as portion size, cooking method (e.g., fried, grilled, baked, steamed), and ingredient composition to estimate the total calorie content of the meal. Provide a detailed breakdown of calories per item and include macronutrient estimates—carbohydrates, proteins, and fats—where possible.
        Once the calorie estimation is complete, tailor your dietary suggestions to one of the following goals: weight loss, muscle gain, or specific dietary restrictions. If the goal is not specified, ask for clarification. For dietary restrictions, consider common categories such as vegetarian, vegan, gluten-free, diabetic-friendly, low-sodium, or lactose-intolerant. Your suggestions should be practical, health-conscious, and specific to the food shown in the image.
        For weight loss, recommend lighter alternatives to calorie-dense items, portion control strategies, and foods that promote satiety without excess calories. Suggest nutrient-dense options that are low in added sugars and unhealthy fats. Include tips on hydration, meal timing, and how to balance energy intake with physical activity. If the uploaded meal is high in calories, provide actionable adjustments or substitutions to reduce the overall intake while preserving flavor and satisfaction.
        For muscle gain, prioritize protein-rich foods, healthy fats, and complex carbohydrates that support muscle recovery and growth. Suggest optimal post-workout meals, protein intake per serving, and foods that help replenish glycogen stores. Include guidance on meal frequency, timing, and how to distribute macronutrients throughout the day to maximize anabolic response and performance.

        For dietary restrictions, ensure your recommendations respect the user’s limitations. For example, if the user is vegetarian, avoid meat-based proteins and suggest plant-based alternatives like legumes, tofu, tempeh, or quinoa. If the user is diabetic, prioritize low-glycemic foods and avoid refined sugars. If the user requires low-sodium options, suggest herbs and spices for flavor enhancement instead of salt-heavy condiments. Always explain your reasoning and offer alternatives that are both nutritious and satisfying.

        Additionally, provide daily intake suggestions based on the uploaded meal. Assume a default 2,000-calorie daily limit unless otherwise specified. Recommend what the user should eat for the rest of the day to meet their nutritional goals without exceeding their target. Highlight any nutritional gaps—such as low fiber, insufficient protein, or excess saturated fat—and suggest foods to fill those gaps. Include snack ideas, hydration tips, and meal combinations that complement the uploaded food.

        Your tone should be informative, supportive, and personalized. Avoid generic advice and tailor your response to the image content and user goals. If the image is unclear or ambiguous, ask for a better angle or additional context. The goal is to help the user make smarter food choices using visual input and personalized health objectives.

        Please describe the food, nutritional facts, and possible recipes, list out the ingredients as well as the calories.

        And the important it should be within 3 lines as the response and take this input also {user_text}
        
        """
        # I detected: {', '.join(food_labels)}. Estimate calories.
        groq_response = groq_client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {"role": "system", "content": "You are a helpful food nutrition assistant. Always respond in plain text without Markdown, lists, or asterisks."},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}}
                ]
            }
        ],
        temperature=0.6,
        max_tokens=500
    )


        try:
            chatbot_reply = groq_response.choices[0].message.content
        except Exception as e:
            print("Groq response:", groq_response)
            raise e



        print(chatbot_reply)
        return jsonify({
            "detected_food": food_labels,
            "chatbot_response": chatbot_reply
        })

    except Exception as e:
        print("ERROR TRACEBACK:")
        traceback.print_exc()   # <-- prints full error details in terminal
        return jsonify({"error": str(e)}), 500


        

    #     groq_response = groq_client.chat.completions.create(
    #         model="llama-3.1-8b-instant",  # use Groq LLaMA model
    #         messages=[
    #             {"role": "system", "content": "You are a helpful food nutrition assistant."},
    #             {"role": "user", "content": prompt},
    #             {"role": "user", "content": f"[Image in Base64] {image_b64[:100]}... (truncated)"}
    #         ],
    #         temperature=0.6,
    #         max_tokens=500
    #     )

    #     chatbot_reply = groq_response.choices[0].message["content"]

    #     return jsonify({
    #         "detected_food": food_labels,
    #         "chatbot_response": chatbot_reply
    #     })

    # except Exception as e:
    #     return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)