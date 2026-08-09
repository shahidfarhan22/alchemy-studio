"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { registerSchema } from "@/lib/auth-schemas";
import { ApiError } from "@/lib/api-client";

// See login/page.tsx -- useSearchParams() requires a Suspense boundary.
export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = registerSchema.safeParse({ displayName, email, password });
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""]),
      ));
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await register(parsed.data.email, parsed.data.password, parsed.data.displayName);
      router.push(redirectTo);
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setFieldErrors(Object.fromEntries(err.details.map((d) => [d.field, d.issue])));
      }
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4" noValidate>
        <h1 className="text-2xl font-semibold">Create an account</h1>

        {formError && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
            {formError}
          </p>
        )}

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium mb-1">Name</label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
            aria-invalid={!!fieldErrors.displayName}
          />
          {fieldErrors.displayName && <p className="text-sm text-red-600 mt-1">{fieldErrors.displayName}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
            aria-invalid={!!fieldErrors.email}
          />
          {fieldErrors.email && <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
            aria-invalid={!!fieldErrors.password}
          />
          {fieldErrors.password && <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>}
          <p className="text-xs text-gray-500 mt-1">At least 10 characters.</p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-black text-white py-2 disabled:opacity-50"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>

        <p className="text-sm text-gray-600">
          Already have an account? <Link href={`/login${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`} className="underline">Log in</Link>
        </p>
      </form>
    </main>
  );
}
