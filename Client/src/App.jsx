import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import CalorieCalc from "../src/Components/CalorieCalc";
import Chatbot from "../src/Components/Chatbot";
import Login from "../src/Components/Login";
import { FaUserCircle } from "react-icons/fa";
import Register from "../src/Components/Register";
import { AuthProvider, useAuth } from "../src/Components/AuthContext";
import PrivateRoute from "../src/Components/PrivateRoute";
import Profile from "../src/Components/Profile";
const AppContent = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-8 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="text-2xl font-bold text-blue-600">Calorie Tracker</div>

            <div className="hidden md:flex space-x-6 items-center">
              <Link
                to="/calorie"
                className="text-gray-700 hover:text-blue-600 font-medium transition duration-200"
              >
                Calorie Tracker
              </Link>
              <Link
                to="/chatbot"
                className="text-gray-700 hover:text-blue-600 font-medium transition duration-200"
              >
                Chatbot
              </Link>

              {user ? (
                <>
                  {/* Profile Icon with Dropdown */}
                  <div className="relative group">
                    <FaUserCircle className="text-2xl text-gray-700 cursor-pointer" />
                    <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md opacity-0 group-hover:opacity-100 transition duration-200 z-10">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        {user.name}'s Profile
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 font-medium transition duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-gray-700 hover:text-blue-600 font-medium transition duration-200"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 px-4 sm:px-6 lg:px-8">
        <Routes location={location} key={location.pathname}>
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
                <div className="h-[calc(100vh-6rem)]">
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
