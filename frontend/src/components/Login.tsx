import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../hooks/useCrmData";
import { Button } from "./ui/Button";

export function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useLogin();
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await login.mutateAsync(password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <form onSubmit={submit} className="crm-card w-full max-w-sm p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/api/logo" className="mb-4 h-20 w-20 object-contain" alt="Chip Mong Bank" />
          <h1 className="text-xl font-extrabold text-bank">CUSTOMER MANAGEMENT SYSTEM</h1>
          <p className="mt-2 text-sm text-muted">Enter your password to access the system</p>
        </div>
        <label className="label">Password</label>
        <div className="relative">
          <LockKeyhole className="absolute left-3 top-2.5 h-5 w-5 text-muted" />
          <input className="input-control pl-10" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button className="mt-5 w-full" disabled={login.isPending || !password}>
          {login.isPending ? "Signing in..." : "Login"}
        </Button>
      </form>
    </div>
  );
}
