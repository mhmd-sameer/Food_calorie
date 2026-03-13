import { useState, useEffect } from "react";
import { FcCamera } from "react-icons/fc";
import axios from 'axios';
import { FaFire, FaTimesCircle, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const CalorieCalc = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Track daily sugar rise
    const [dailySugarRise, setDailySugarRise] = useState(0);
    const dailySugarLimit = 25; // WHO recommendation in grams

    // Fetch user's sugar history on load
    useEffect(() => {
        const fetchInitialSugar = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const res = await axios.get("http://localhost:8000/api/profile", {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    
                    if (res.data && res.data.foodLogs) {
                        const todayStr = new Date().toDateString();
                        let todaySugar = 0;
                        res.data.foodLogs.forEach(log => {
                            if (new Date(log.date).toDateString() === todayStr) {
                                todaySugar += (log.sugar_rise || 0);
                            }
                        });
                        setDailySugarRise(todaySugar);
                    }
                } catch (err) {
                    console.error("Failed to load initial sugar limit", err);
                }
            }
        };
        fetchInitialSugar();
    }, []);

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
            const response = await axios.post("https://apparent-wolf-obviously.ngrok-free.app/predict", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setIsLoading(false);
            if (response.data.error) {
                setAnalysisResult({ error: response.data.error });
            } else {
                console.log("Backend Response:", response.data);
                setAnalysisResult(response.data);

                // Safe variables for logging
                const sugarRise = response.data.nutrition?.estimated_sugar_rise || response.data.approx_sugar_rise || 0;
                const calories = response.data.calories || response.data.calories_kcal || 0;
                const protein = response.data.nutrition?.protein_g || response.data.protein_g || 0;
                const carbs = response.data.nutrition?.carbohydrates_g || response.data.carbs_g || 0;
                const fat = response.data.nutrition?.fat_g || response.data.fat_g || 0;
                const portion = response.data.portion_used_g || response.data.portion_g || 0;

                // Update daily sugar total locally
                if (sugarRise) {
                    setDailySugarRise(prev => prev + parseFloat(sugarRise));
                }

                // Push to user food log API if logged in
                const token = localStorage.getItem("token");
                if (token && response.data.food) {
                    try {
                        await axios.post("http://localhost:8000/api/foodlog", {
                            food: response.data.food,
                            calories: parseFloat(calories),
                            protein_g: parseFloat(protein),
                            carbs_g: parseFloat(carbs),
                            fat_g: parseFloat(fat),
                            sugar_rise: parseFloat(sugarRise),
                            portion_g: parseFloat(portion)
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        console.log("Food logged successfully to profile.");
                    } catch (logErr) {
                        console.error("Failed to log food:", logErr);
                    }
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
        <div className="flex flex-col items-center gap-10 py-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="space-y-4 text-center max-w-2xl px-4">
                <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 shadow-xl mb-4 animate-bounce">
                    <FaFire className="text-white text-3xl" />
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-slate-800 tracking-tight">
                    Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Calorie</span> Analysis
                </h1>
                <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
                    Upload any food image and let our AI provide instant, accurate nutrition insights and monitor your sugar intake.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
                {/* Left Column: Image Upload */}
                <div className="lg:col-span-5 h-full">
                    <div className="glass-card p-8 rounded-3xl h-full flex flex-col items-center justify-center text-center shadow-xl border border-white/50 transition-transform duration-500 hover:shadow-2xl">

                        <div className="relative group w-full aspect-square md:aspect-auto md:h-64 rounded-2xl overflow-hidden bg-white/40 border-2 border-dashed border-indigo-300 flex items-center justify-center mb-6 transition-colors group-hover:bg-white/60">
                            {selectedImage ? (
                                <>
                                    <img src={selectedImage} alt="Selected Food" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => document.getElementById("file-upload").click()}
                                            className="bg-white text-slate-800 px-4 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-transform"
                                        >
                                            Change Image
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 cursor-pointer transform group-hover:scale-110 transition-transform" onClick={() => document.getElementById("file-upload").click()}>
                                    <FcCamera size={80} className="mb-4 drop-shadow-md" />
                                    <h3 className="font-bold text-xl text-slate-700">Snap or Upload</h3>
                                    <p className="text-sm text-slate-500 mt-2">Tap to browse files</p>
                                </div>
                            )}
                        </div>

                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />

                        <button
                            className={`w-full glass-button py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            onClick={handleCalculateCalorie}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Analyzing...</span>
                                </div>
                            ) : (
                                <span>Analyze Nutrition</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Column: Results & Sugar Log */}
                <div className="lg:col-span-7 flex flex-col space-y-8">
                    {/* Sugar Log Summary */}
                    <div className="glass-card p-6 md:p-8 rounded-3xl shadow-xl flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                                <span>Daily Sugar Monitor</span>
                            </h2>
                            <p className="text-slate-500 font-medium mt-1">WHO Recommended Limit: {dailySugarLimit}g</p>
                        </div>

                        <div className="text-right">
                            <div className="text-3xl font-extrabold text-indigo-600">
                                {dailySugarRise.toFixed(1)}<span className="text-lg text-slate-500 font-medium">g</span>
                            </div>
                            <div className="mt-2 flex justify-end">
                                {dailySugarRise > dailySugarLimit ? (
                                    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold shadow-sm">
                                        <FaExclamationTriangle />
                                        <span>Limit Exceeded!</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold shadow-sm">
                                        <FaCheckCircle />
                                        <span>{Math.max(0, (dailySugarLimit - dailySugarRise)).toFixed(1)}g left</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Analysis Result Box */}
                    {analysisResult && (
                        <div className="glass-card p-6 md:p-8 rounded-3xl shadow-xl animate-fade-in flex-grow">
                            {analysisResult.error ? (
                                <div className="flex items-center text-red-600 p-4 bg-red-50 rounded-xl space-x-3">
                                    <FaTimesCircle className="text-2xl flex-shrink-0" />
                                    <p className="font-medium text-lg">{analysisResult.error}</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start border-b border-indigo-100 pb-4">
                                        <div>
                                            <h2 className="text-sm font-bold tracking-wider text-indigo-500 uppercase">Analysis Complete</h2>
                                            <h3 className="text-3xl font-extrabold text-slate-800 capitalize mt-1">{analysisResult.food}</h3>
                                        </div>
                                        <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-center shadow-sm">
                                            <span className="block text-2xl font-bold">{analysisResult.calories_kcal}</span>
                                            <span className="text-xs uppercase font-bold tracking-wider">Kcal</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Protein</p>
                                            <p className="text-xl font-bold text-slate-800">{analysisResult.nutrition?.protein_g} <span className="text-sm font-medium text-slate-500">g</span></p>
                                        </div>
                                        <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Carbs</p>
                                            <p className="text-xl font-bold text-slate-800">{analysisResult.nutrition?.carbohydrates_g} <span className="text-sm font-medium text-slate-500">g</span></p>
                                        </div>
                                        <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Fat</p>
                                            <p className="text-xl font-bold text-slate-800">{analysisResult.nutrition?.fat_g} <span className="text-sm font-medium text-slate-500">g</span></p>
                                        </div>
                                        <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Sugar Rise</p>
                                            <p className="text-xl font-bold text-slate-800">{analysisResult.nutrition?.estimated_sugar_rise} <span className="text-sm font-medium text-slate-500">g</span></p>
                                        </div>
                                        <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Glycemic Idx</p>
                                            <p className="text-xl font-bold text-slate-800">{analysisResult.nutrition?.glycemic_index}</p>
                                        </div>
                                        <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Portion</p>
                                            <p className="text-xl font-bold text-slate-800">{analysisResult.portion_g} <span className="text-sm font-medium text-slate-500">g</span></p>
                                        </div>
                                    </div>

                                    {analysisResult.top_predictions && analysisResult.top_predictions.length > 0 && (
                                        <div className="mt-6 pt-4 border-t border-indigo-100">
                                            <h4 className="text-sm font-bold text-slate-600 mb-3">AI Confidence Scores</h4>
                                            <div className="space-y-2">
                                                {analysisResult.top_predictions.map((item, index) => (
                                                    <div key={index} className="flex items-center justify-between text-sm">
                                                        <span className="capitalize font-medium text-slate-700">{item.class}</span>
                                                        <div className="flex items-center gap-3 flex-1 ml-4 border-b border-dotted border-slate-300"></div>
                                                        <span className="font-bold text-indigo-600 ml-4 group relative">
                                                            {(item.prob * 100).toFixed(1)}%
                                                            <div className="absolute top-0 right-full mr-2 w-32 h-2 bg-gray-200 rounded-full overflow-hidden transform translate-y-1.5 hidden md:block">
                                                                <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" style={{ width: `${(item.prob * 100)}%` }}></div>
                                                            </div>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CalorieCalc;
