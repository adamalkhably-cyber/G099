import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <div
      className="
        flex
        items-center
        justify-center
        min-h-screen
        bg-linear-to-b
        from-teal-600
        via-teal-400
        to-cyan-400
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
            mb-4
          "
        >
          Forgot Password
        </h2>

        <p className="text-white text-sm text-center mb-6">
          Enter your email and we’ll send you a password reset link.
        </p>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            console.log("Reset link sent");
          }}
        >
          <input
            type="email"
            placeholder="Enter your email"
            required
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

          <button
            type="submit"
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
            Send Reset Link
          </button>
        </form>

        <p className="text-sm text-center text-white mt-6">
          Remember your password?{" "}
          <Link
            to="/" 
            className="font-semibold hover:underline"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}