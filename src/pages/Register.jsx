import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div className=
    "flex items-center justify-center h-screen
    bg-gradient-to-b
     from-teal-500
        via-teal-300
        to-cyan-300>">
      <div className="p-8 text-center rounded-2xl shadow-md w-80 bg-white">
        <h2>Register</h2> 

        <form className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Username"
            className="p-2 border rounded-lg"
          />

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

          <input
            type="password"
            placeholder="Confirm Password"
            className="p-2 border rounded-lg"
          />

          <button className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600">
            Register
          </button>
        </form>

        <p className="text-sm mt-4 text-center">
          Already have an account?{" "}
          <Link to="/" className="text-blue-500">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
