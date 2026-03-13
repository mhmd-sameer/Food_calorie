import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import CalorieCalc from "../src/Components/CalorieCalc";
import Chatbot from "../src/Components/Chatbot";
import Login from "../src/Components/Login";
import { FaUserCircle, FaLeaf, FaRobot, FaCalculator, FaSignInAlt, FaUserPlus } from "react-icons/fa";
import Register from "../src/Components/Register";
import { AuthProvider, useAuth } from "../src/Components/AuthContext";
import PrivateRoute from "../src/Components/PrivateRoute";
import Profile from "../src/Components/Profile";
import { Navigate } from "react-router-dom";


const AppContent = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="animated-bg font-poppins selection:bg-blue-300 selection:text-blue-900">
      {/* Decorative background blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[100px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navbar */}
      <nav className="glass fixed w-full z-50 top-0 left-0 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                <FaLeaf className="text-xl" />
              </div>
              <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                Vitality
              </span>
            </Link>

            <div className="hidden md:flex space-x-8 items-center">
              <Link
                to="/calorie"
                className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 font-semibold transition-colors duration-300 relative group"
              >
                <FaCalculator className="text-indigo-500 group-hover:animate-bounce" />
                <span>Tracker</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                to="/chatbot"
                className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 font-semibold transition-colors duration-300 relative group"
              >
                <FaRobot className="text-blue-500 group-hover:rotate-12 transition-transform" />
                <span>AI Coach</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>

              {user ? (
                <>
                  {/* Profile Icon with Dropdown */}
                  <div className="relative group">
                    <div className="flex items-center space-x-2 cursor-pointer p-2 rounded-full hover:bg-white/40 transition-colors">
                       <FaUserCircle className="text-3xl text-indigo-600 shadow-sm rounded-full" />
                       <span className="font-semibold text-slate-700">{user.name}</span>
                    </div>
                    <div className="absolute right-0 mt-3 w-48 glass rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right group-hover:scale-100 scale-95 z-10 overflow-hidden border border-white/40 shadow-xl">
                      <Link
                        to="/profile"
                        className="block px-5 py-3 text-slate-700 hover:bg-white/60 hover:text-indigo-600 font-medium transition-colors"
                      >
                        My Profile
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full text-left px-5 py-3 text-red-500 hover:bg-red-50 hover:text-red-600 font-medium transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 font-semibold transition-colors duration-300 px-3 py-2 rounded-lg hover:bg-white/30"
                  >
                    <FaSignInAlt />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center space-x-2 glass-button px-5 py-2.5 rounded-xl font-semibold"
                  >
                    <FaUserPlus />
                    <span>Get Started</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={user ? <Navigate to="/calorie" /> : <Navigate to="/login" />}
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/calorie"
            element={
              <PrivateRoute>
                <CalorieCalc />
              </PrivateRoute>
            }
            
          />
          <Route
            path="/chatbot"
            element={
              <PrivateRoute>
                <div className="h-[calc(100vh-8rem)]">
                  <Chatbot />
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

const App = () => (
  <Router>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </Router>
);

export default App;
