import { FormEvent, useState } from "react";
import { Landmark, LockKeyhole, ShieldCheck } from "lucide-react";
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,132,61,0.13),transparent_32%),linear-gradient(135deg,#f8fcff_0%,#edf8f3_48%,#f4f7fb_100%)]" />
      <form onSubmit={submit} className="crm-card relative w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/70 bg-white/80 p-3 shadow-glass backdrop-blur">
            <img src="/api/logo" className="h-full w-full object-contain" alt="Chip Mong Bank" />
          </div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-bank/20 bg-bank-soft/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-bank-dark">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure Banking Workspace
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Customer Relationship Center</h1>
          <p className="mt-2 text-sm font-medium text-muted">Access the commercial banking CRM system</p>
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
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-muted">
          <Landmark className="h-4 w-4 text-bank" />
          Customer 360, pipeline, and market visit management
        </div>
      </form>
    </div>
  );
}
