// ====== GLOBALS ======
let poseDetector = null;
let u2net = null;

// DOM Elements
const imageUpload = document.getElementById("imageUpload");
const preview = document.getElementById("preview");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultDiv = document.getElementById("result");
const voiceBtn = document.getElementById("voiceBtn");
const manualFood = document.getElementById("manualFood");

// Fallback calorie DB (calories per 100g)
const calorieDatabase = {
  "pizza": 266, "burger": 295, "rice": 130, "chicken": 239,
  "salad": 150, "fries": 312, "pasta": 131, "apple": 52,
  "banana": 89, "bread": 265, "cheese": 402, "egg": 155,
  "yogurt": 59, "milk": 42, "steak": 271, "sushi": 168
};

// Food density in g/cm³ (for volume → weight)
const foodDensity = {
  "rice": 0.8, "pasta": 0.7, "chicken": 1.05, "steak": 1.02,
  "fish": 1.0, "salad": 0.3, "fries": 0.5, "pizza": 0.6,
  "soup": 1.0, "potato": 0.62
};

// ====== LOAD MODELS ======
async function loadModels() {
  try {
    // Load Pose Detection (MoveNet)
    const poseModel = poseDetection.SupportedModels.MoveNet;
    poseDetector = await poseDetection.createDetector(poseModel);
    console.log("✅ Pose Detection loaded");
  } catch (e) {
    console.warn("⚠️ Failed to load Pose Detection", e);
  }

  try {
    // Load U²-Net for food segmentation
    u2net = new U2Net();
    await u2net.init();
    console.log("✅ U²-Net Segmentation loaded");
  } catch (e) {
    console.warn("⚠️ Failed to load U²-Net", e);
  }
}

// Load on start
loadModels();

// ====== IMAGE PREVIEW ======
imageUpload.addEventListener("change", () => {
  const file = imageUpload.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    preview.src = e.target.result;
    preview.style.display = "block";
    analyzeBtn.disabled = false;
  };
  reader.readAsDataURL(file);
});

// ====== VOICE INPUT ======
if ('webkitSpeechRecognition' in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript.trim();
    manualFood.value = transcript;
    voiceBtn.textContent = `🎤 "${transcript}"`;
  };

  recognition.onerror = () => {
    voiceBtn.textContent = "🎤 Voice Error";
    setTimeout(() => (voiceBtn.textContent = "🎤 Say Food Name"), 2000);
  };

  recognition.onend = () => {
    voiceBtn.textContent = "🎤 Say Food Name";
  };

  voiceBtn.addEventListener("click", () => {
    recognition.start();
    voiceBtn.textContent = "🛑 Listening...";
  });
} else {
  voiceBtn.disabled = true;
  voiceBtn.title = "Browser does not support speech recognition";
}

// ====== PARSE CLARIFAI RESPONSE ======
function parseFoods(data) {
  const concepts = data?.outputs?.[0]?.data?.concepts || [];
  const foods = [];

  for (let concept of concepts) {
    const name = concept.name.toLowerCase().trim();
    const confidence = concept.value;

    // Only include if in our DB or has decent confidence
    if (confidence > 0.2) {
      foods.push({
        food: name,
        confidence
      });
    }
  }

  // Fallback to manual input
  if (foods.length === 0) {
    const manual = manualFood.value.trim().toLowerCase();
    if (manual) foods.push({ food: manual, confidence: 1.0 });
  }

  return foods.length ? foods : [{ food: "unknown", confidence: 1.0 }];
}

// ====== GET NUTRITION FROM SPOONACULAR ======
async function getNutrition(foodName) {
  try {
    const res = await fetch(`/api/nutrition?food=${encodeURIComponent(foodName)}`);
    const data = await res.json();
    return data.calories_per_100g || 200;
  } catch (e) {
    console.error("Nutrition fetch failed:", e);
    return 200;
  }
}

// ====== SEGMENT FOOD AREA WITH U²-Net ======
async function getFoodArea(imgElement) {
  if (!u2net) {
    console.log("⚠️ U²-Net not loaded, using full image area");
    return imgElement.naturalWidth * imgElement.naturalHeight;
  }

  try {
    const canvas = await u2net.inference(imgElement);
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let pixelCount = 0;

    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 10) pixelCount++; // alpha > 0
    }

    // Scale back to original image
    const scale = imgElement.naturalWidth / canvas.width;
    return pixelCount * (scale * scale);
  } catch (e) {
    console.error("Segmentation failed:", e);
    return imgElement.naturalWidth * imgElement.naturalHeight;
  }
}

// ====== ESTIMATE SCALE FROM HAND (MoveNet) ======
async function getScaleFromPose(imgElement) {
  if (!poseDetector) {
    console.log("⚠️ Pose model not loaded, using fallback scale");
    return 0.5; // fallback: 0.5 cm/px
  }

  try {
    const poses = await poseDetector.estimatePoses(imgElement, {
      flipHorizontal: false,
    });

    if (poses.length === 0) return 0.5;

    const keypoints = poses[0].keypoints;
    const wrist = keypoints[9];   // left wrist
    const elbow = keypoints[7];   // left elbow

    if (wrist.score < 0.5 || elbow.score < 0.5) return 0.5;

    const distPx = Math.hypot(wrist.x - elbow.x, wrist.y - elbow.y);
    return 30 / distPx; // 30 cm from elbow to wrist ≈ arm segment
  } catch (e) {
    console.error("Pose estimation failed:", e);
    return 0.5;
  }
}

// ====== MAIN ANALYSIS FUNCTION ======
analyzeBtn.addEventListener("click", async () => {
  const file = imageUpload.files[0];
  if (!file) {
    alert("Please upload an image");
    return;
  }

  resultDiv.style.display = "block";
  resultDiv.innerHTML = "🔍 Analyzing food, portion, and calories...";

  let formData = new FormData();
  formData.append("image", file);

  try {
    // 1. Send to Clarifai Food Model via Flask
    const res = await fetch("/api/analyze", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`API Error: ${err.status?.description || res.statusText}`);
    }

    const data = await res.json();

    // 2. Parse food items
    const foods = parseFoods(data);
    if (foods.length === 0) {
      resultDiv.innerHTML = "❌ No food recognized. Try a clearer image or type the food name.";
      return;
    }

    // 3. Estimate portion size
    const pixelArea = await getFoodArea(preview);
    const scaleFactor = await getScaleFromPose(preview);
    const areaCm2 = pixelArea * (scaleFactor ** 2);
    const volumeCm3 = areaCm2 * 3; // assume avg 3cm height
    const defaultDensity = 0.8;
    const totalWeight = volumeCm3 * defaultDensity; // total grams

    // 4. Calculate calories
    let totalCalories = 0;
    let resultHTML = "<h3>🍽️ Foods Detected:</h3><ul>";

    for (let item of foods) {
      const calsPer100g = await getNutrition(item.food);
      const density = foodDensity[item.food] || defaultDensity;
      const weight = (totalWeight * item.confidence) / foods.reduce((a, b) => a + b.confidence, 0);

      const calories = (weight / 100) * calsPer100g;
      totalCalories += calories;

      resultHTML += `
        <li>
          <strong>${item.food}</strong>: 
          ${weight.toFixed(0)}g → 
          ${calories.toFixed(0)} kcal 
          (${(item.confidence * 100).toFixed(0)}%)
        </li>`;
    }

    resultHTML += `
      </ul>
      <p><strong>Total Estimated Calories: ${Math.round(totalCalories)} kcal</strong></p>
      <p><small>💡 Tip: Include your hand or a plate for better size estimate.</small></p>
    `;

    resultDiv.innerHTML = resultHTML;

    // 5. Save to history
    fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        foods,
        calories: Math.round(totalCalories),
        image: preview.src,
        timestamp: new Date().toISOString()
      })
    }).catch(console.error);

  } catch (error) {
    resultDiv.innerHTML = `
      <p>❌ Analysis failed: <em>${error.message}</em></p>
      <p>Try a smaller image or check your internet connection.</p>
    `;
    console.error("Analysis error:", error);
  }
});

// ====== DASHBOARD: SHOW HISTORY ======
async function showDashboard() {
  try {
    const res = await fetch("/api/history");
    const history = await res.json();

    const ctx = document.getElementById("calorieChart").getContext("2d");
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: history.map(h => new Date(h.timestamp).toLocaleTimeString()),
        datasets: [{
          label: 'Calories',
          data: history.map(h => h.calories),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Daily Intake History' }
        }
      }
    });

    document.getElementById("dashboard").style.display = "block";
  } catch (e) {
    document.getElementById("dashboard").innerHTML = "<p>Failed to load history.</p>";
  }
}