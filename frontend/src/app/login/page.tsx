"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { loginSchema } from "@/lib/auth-schemas";
import { ApiError } from "@/lib/api-client";
import { PageHeading } from "@/components/ui/PageHeading";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { FieldError } from "@/components/ui/FieldError";
import { Button } from "@/components/ui/Button";

// useSearchParams() requires a Suspense boundary in the App Router --
// without it, `next build` fails outright, not just a lint warning.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""]),
      ));
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login(parsed.data.email, parsed.data.password);
      router.push(redirectTo);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-20">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6" noValidate>
        <PageHeading>Log in</PageHeading>

        {formError && <ErrorBanner>{formError}</ErrorBanner>}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={!!fieldErrors.email}
          />
          <FieldError>{fieldErrors.email}</FieldError>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={!!fieldErrors.password}
          />
          <FieldError>{fieldErrors.password}</FieldError>
        </div>

        <Button type="submit" disabled={isSubmitting} fullWidth>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>

        <p className="text-sm text-muted font-sans">
          No account?{" "}
          <Link href={`/register${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`} className="text-gold hover:text-gold-hover">
            Register
          </Link>
        </p>
      </form>
    </main>
  );
}
