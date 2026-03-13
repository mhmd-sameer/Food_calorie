import { useEffect, useState } from "react";
import axios from "axios";
import { FaUserCircle, FaEnvelope, FaHistory, FaExclamationTriangle } from "react-icons/fa";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [dailySugarLimit] = useState(25); // WHO recommendation 25g

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  if (!user) return (
    <div className="flex justify-center items-center h-[ca1c(100vh-10rem)]">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // Group food logs by date
  const groupedLogs = {};
  let todaySugar = 0;
  
  const todayStr = new Date().toDateString();

  if (user.foodLogs && user.foodLogs.length > 0) {
      user.foodLogs.forEach(log => {
          const logDate = new Date(log.date);
          const dateStr = logDate.toDateString();
          
          if (!groupedLogs[dateStr]) {
              groupedLogs[dateStr] = [];
          }
          groupedLogs[dateStr].push(log);

          if (dateStr === todayStr) {
              todaySugar += (log.sugar_rise || 0);
          }
      });
  }

  const sugarPercentage = Math.min(100, (todaySugar / dailySugarLimit) * 100);
  const isOverLimit = todaySugar > dailySugarLimit;

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* User Info Column */}
      <div className="lg:col-span-4 space-y-8">
          <div className="glass-card p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl rounded-tr-3xl"></div>
            <div className="flex flex-col items-center relative z-10">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl mb-6 transform hover:scale-110 transition-transform duration-300">
                <FaUserCircle className="text-white text-5xl" />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 mb-2">{user.name}</h2>
              <p className="text-indigo-600 font-medium mb-8 bg-indigo-50 px-4 py-1 rounded-full">{user.email}</p>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl shadow-xl">
             <h3 className="text-xl font-bold text-slate-800 mb-4">Today's Sugar Tracker</h3>
             <div className="flex justify-between text-sm font-medium mb-2 text-slate-600">
                 <span>{todaySugar.toFixed(1)}g Consumed</span>
                 <span>Limit: {dailySugarLimit}g</span>
             </div>
             <div className="h-4 bg-slate-200 rounded-full overflow-hidden mb-4">
                 <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isOverLimit ? 'bg-red-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`} 
                    style={{ width: `${sugarPercentage}%` }}
                 ></div>
             </div>
             {isOverLimit ? (
                 <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-xl">
                     <FaExclamationTriangle className="text-xl" />
                     <p className="text-sm font-bold">You've exceeded your daily sugar limit!</p>
                 </div>
             ) : (
                 <p className="text-sm text-slate-500 font-medium">You are staying within a healthy sugar range.</p>
             )}
          </div>
      </div>

      {/* Food History Column */}
      <div className="lg:col-span-8">
         <div className="glass-card p-6 md:p-10 rounded-3xl shadow-2xl h-full border border-white/50">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <FaHistory />
                </div>
                <span>Analysis History</span>
            </h2>

            {!user.foodLogs || user.foodLogs.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-500 mb-4">No food history available yet.</p>
                </div>
            ) : (
                <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2 scroll-smooth">
                    {Object.keys(groupedLogs).sort((a,b) => new Date(b) - new Date(a)).map(date => (
                        <div key={date}>
                            <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-4 border-b border-indigo-100 pb-2">
                                {date === todayStr ? 'Today' : date}
                            </h3>
                            <div className="space-y-3">
                                {groupedLogs[date].map((log, idx) => (
                                    <div key={idx} className="glass p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/60 transition-colors shadow-sm border border-white/40">
                                        <div className="mb-3 sm:mb-0">
                                            <p className="font-bold text-lg text-slate-800 capitalize">{log.food}</p>
                                            <p className="text-sm text-slate-500 font-medium">{log.portion_g}g portion</p>
                                        </div>
                                        <div className="flex space-x-4">
                                            <div className="text-center bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                                                <p className="text-xs font-bold text-orange-600 uppercase">Kcal</p>
                                                <p className="font-extrabold text-slate-800">{log.calories || 0}</p>
                                            </div>
                                            <div className="text-center bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                                                <p className="text-xs font-bold text-blue-600 uppercase">Sugar</p>
                                                <p className="font-extrabold text-slate-800">{log.sugar_rise?.toFixed(1) || 0}g</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
         </div>
      </div>

    </div>
  );
};

export default Profile;
