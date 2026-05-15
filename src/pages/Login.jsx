import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div
      className="
        flex
        items-center
        justify-center
        min-h-screen
        bg-gradient-to-br
        from-blue-500
        via-indigo-500
        to-purple-600
        p-4
      "
    >
      <div
        className="
          backdrop-blur-lg
          bg-white/20
          border
          border-white/30
          p-8
          rounded-3xl
          shadow-2xl
          w-full
          max-w-sm
        "
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">Welcome Back</h2>

        <form className="flex flex-col gap-4">
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
          
           <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-white hover:underline"
            >
              Forgot Password?
            </Link>
          </div>


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