import { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from "react-icons/fa";
import { Link } from "react-router-dom";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8000/api/register",
        { name, email, password }
      );

      login(res.data.user, res.data.token);

    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg mb-4 transform hover:rotate-12 transition-transform duration-300">
             <FaUserPlus className="text-white text-2xl" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Create Account</h2>
          <p className="text-slate-500 mt-2 font-medium">Join us to start your vitality journey.</p>
        </div>

        <form onSubmit={handleRegister} className="glass-card p-8 rounded-3xl shadow-2xl space-y-6 transform transition-all duration-500 hover:shadow-indigo-500/10">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <FaUser />
              </div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-slate-700 placeholder-slate-400 outline-none"
              />
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <FaEnvelope />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-slate-700 placeholder-slate-400 outline-none"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <FaLock />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-slate-700 placeholder-slate-400 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full glass-button py-3.5 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <span>Sign Up</span>
            )}
          </button>
          
          <div className="text-center pt-2">
            <p className="text-sm text-slate-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors">
                Log In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
