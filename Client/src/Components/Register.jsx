import { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const handleRegister = async () => {
    try {
      const res = await axios.post("http://localhost:8000/api/register", { name, email, password });

      // Pass user data and token to context
      login(res.data.user, res.data.token);

    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full mb-3 px-4 py-2 border rounded"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-3 px-4 py-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-3 px-4 py-2 border rounded"
      />
      <button
        onClick={handleRegister}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        Register
      </button>
    </div>
  );
};

export default Register;
