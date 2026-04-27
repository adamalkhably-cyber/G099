import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-80">
        <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>

        <form className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            className="p-2 border rounded-lg"
          />

          <input
            type="password"
            placeholder="Password"
            className="p-2 border rounded-lg"
          />

          <button className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600">
            Login
          </button>
        </form>

        <p className="text-sm mt-4 text-center">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-500">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}