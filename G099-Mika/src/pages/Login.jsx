import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
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

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

          <div className="text-right">
            <Link
              to="/ForgotPassword"
              className="text-sm text-white hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
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
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-sm mt-4 text-center text-white">
          Don’t have an account?{" "}
          <Link
            to="/Register"
            className="font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}