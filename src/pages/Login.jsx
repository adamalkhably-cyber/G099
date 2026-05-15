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
        from-pink-300
        via-purple-300
        to-indigo-400
        p-4
      "
    >
      <div
        className="
          w-full
          max-w-sm
          p-8
          rounded-3xl

          bg-white/20
          backdrop-blur-xl

          border
          border-white/30

          shadow-2xl
        "
      >
        <h2
          className="
            text-3xl
            font-bold
            text-white
            text-center
            mb-6
          "
        >
          Welcome Back
        </h2>

        <form className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="
              p-3
              rounded-xl
              bg-white/80
              outline-none
              focus:ring-2
              focus:ring-blue-300
              transition
            "
          />

          <input
            type="password"
            placeholder="Password"
            className="
              p-3
              rounded-xl
              bg-white/80
              outline-none
              focus:ring-2
              focus:ring-blue-300
              transition
            "
          />

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-white hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            className="
              bg-white
              text-blue-600
              font-semibold
              p-3
              rounded-xl
              hover:bg-blue-100
              transition
              duration-300
              shadow-md
            "
          >
            Login
          </button>
        </form>

        <p className="text-sm mt-4 text-center text-white">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}