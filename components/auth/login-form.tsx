"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Clock, Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginValues } from "@/lib/validations/auth.schema";
import { createClient } from "@/lib/supabase/client";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FloatField } from "@/components/ui/float-field";
import { CardContent } from "@/components/ui/card";
import { Panel } from "@/components/shared/panel";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const signedOutIdle = searchParams.get("reason") === "idle";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      logError("login", error);
      toast.error(toFriendlyMessage(error, "Couldn't log in. Please check your credentials."));
      setSubmitting(false);
      return;
    }

    router.push(searchParams.get("redirectTo") || "/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to see where your money went.</p>
      </div>

      {signedOutIdle && (
        <p className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2.5 text-xs text-muted-foreground">
          <Clock className="size-3.5 shrink-0" />
          You were signed out after a while away, to keep your numbers private.
        </p>
      )}

      <Panel>
        <CardContent className="py-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FloatField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12"
                {...register("email")}
              />
            </FloatField>

            <FloatField label="Password" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-12 pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </FloatField>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" className="group w-full rounded-xl" disabled={submitting}>
              {submitting ? (
                "Signing in…"
              ) : (
                <>
                  Sign in
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Panel>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-semibold text-foreground hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
