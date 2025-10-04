import { useState } from "react";
import { FcCamera } from "react-icons/fc";
import axios from 'axios';

const CalorieCalc = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Track daily sugar rise
    const [dailySugarRise, setDailySugarRise] = useState(0);
    const dailySugarLimit = 25; // WHO recommendation in grams

    // Handle image change (preview)
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Upload image to Flask API
    const handleImageUpload = async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        setIsLoading(true);

        try {
            const response = await axios.post("https://poachier-shiftable-robert.ngrok-free.dev/predict", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setIsLoading(false);
            console.log("Response from API:", response.data);
            if (response.data.error) {
                setAnalysisResult({ error: response.data.error });
            } else {
                setAnalysisResult(response.data);

                // Update daily sugar total
                if (response.data.approx_sugar_rise) {
                    setDailySugarRise(prev => prev + parseFloat(response.data.approx_sugar_rise));
                }
            }
        } catch (error) {
            setIsLoading(false);
            console.error("Upload error:", error);
            setAnalysisResult({ error: "An error occurred during image analysis." });
        }
    };

    // Handle Calculate button
    const handleCalculateCalorie = () => {
        if (selectedImage) {
            const imageFile = document.getElementById("file-upload").files[0];
            if (imageFile) {
                handleImageUpload(imageFile);
            } else {
                alert("Please select an image.");
            }
        } else {
            alert("Please select an image.");
        }
    };

    return (
        <div>
            

            <div className="bg-blue-200 flex flex-col min-h-screen justify-center items-center gap-15 py-4">
                {/* Header */}
                <div className="space-y-2 text-center">
  <h1 className="text-5xl font-bold font-poppins">
    Discover your Food <span className="text-blue-600">Calorie</span>
  </h1>
  <p className="text-lg">Upload any food image and get instant, AI-powered calorie and nutrition analysis</p>
</div>


                {/* Image Upload */}
                <div className="flex flex-col bg-gray-100 h-90 w-2xl justify-center items-center rounded-2xl gap-4 hover:shadow-2xl transition duration-300 ease-in-out p-4">
                    <div>
                        {selectedImage ? (
                            <img src={selectedImage} alt="Selected Food" className="w-full h-32 object-cover rounded-lg" />
                        ) : (
                            <FcCamera size={80} />
                        )}
                    </div>
                    <div className="flex flex-col items-center justify-center text-center">
                        <h1 className="font-bold font-poppins text-2xl">Upload Food Image</h1>
                        <p>Snap a photo or upload an image for instant nutrition analysis</p>
                    </div>
                    <div className="p-2 rounded-2xl">
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <button
                            className="text-white bg-blue-500 font-semibold hover:bg-blue-600 transition duration-200 ease-in-out p-2 rounded-lg cursor-pointer"
                            onClick={() => document.getElementById("file-upload").click()}
                        >
                            Choose Image
                        </button>
                    </div>

                    <div className="flex flex-col gap-6 justify-center items-center w-full max-w-lg">
                        <div>
                            <button
                                className="p-2 bg-blue-500 text-white rounded-2xl cursor-pointer hover:bg-blue-600 transition duration-200 ease-in-out"
                                onClick={handleCalculateCalorie}
                            >
                                Calculate Calorie
                            </button>
                        </div>
                    </div>
                </div>

                {/* Show Results */}
                {isLoading && <p>Loading...</p>}
                {analysisResult && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-2xl w-full max-w-2xl">
                        {analysisResult.error ? (
                            <p className="text-red-500">{analysisResult.error}</p>
                        ) : (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold">Analysis Result</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <p><span className="font-semibold">Food:</span> {analysisResult.food}</p>
                                    <p><span className="font-semibold">Calories:</span> {analysisResult.calories} kcal</p>
                                    <p><span className="font-semibold">Portion Used:</span> {analysisResult.portion_used_g} g</p>
                                    <p><span className="font-semibold">Protein:</span> {analysisResult.protein_g} g</p>
                                    <p><span className="font-semibold">Carbs:</span> {analysisResult.carbs_g} g</p>
                                    <p><span className="font-semibold">Fat:</span> {analysisResult.fat_g} g</p>
                                    <p><span className="font-semibold">Glycemic Index:</span> {analysisResult.glycemic_index}</p>
                                    <p><span className="font-semibold">Approx. Sugar Rise:</span> {analysisResult.approx_sugar_rise} g</p>
                                </div>

                                <div>
                                    <h3>Top Predictions</h3>
                                    <ul>
                                        {analysisResult.top_predictions?.map((item, index) => (
                                            <li key={index}>
                                                {item.class} - {(item.prob * 100).toFixed(1)}%
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Daily Sugar Summary */}
                <div className="mt-6 p-4 bg-white shadow rounded-2xl w-full max-w-2xl text-center">
                    <h2 className="text-xl font-semibold">Daily Sugar Summary</h2>
                    <p><b>Total Sugar Rise Today:</b> {dailySugarRise.toFixed(2)} g</p>
                    <p><b>Remaining Safe Limit:</b> {Math.max(0, (dailySugarLimit - dailySugarRise)).toFixed(2)} g</p>
                    {dailySugarRise > dailySugarLimit && (
                        <p className="text-red-500 font-semibold">⚠️ You have exceeded the daily sugar limit!</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CalorieCalc;
