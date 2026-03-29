import { Link, useSearchParams } from "react-router-dom";
import { AuthForm } from "../../components/auth/AuthForm";

export function SignupConfirmPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "your email";

  return (
    <AuthForm title="Verify Your Email" description="Account created successfully.">
      <div className="space-y-3 text-sm text-slate-300">
        <p>
          We sent a verification link to <span className="font-medium text-slate-100">{email}</span>.
        </p>
        <p>Please verify your email before continuing to login.</p>
        <Link to="/auth/login" className="text-brand-200 underline">
          Go to login
        </Link>
      </div>
    </AuthForm>
  );
}
