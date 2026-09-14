"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
    <Panel>
      <CardContent className="space-y-6 py-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Login</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FloatField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
          </FloatField>

          <FloatField label="Password" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
            />
          </FloatField>

          <div className="flex items-center justify-between text-xs">
            <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
              Forgot password?
            </Link>
            <Link href="/register" className="font-medium text-foreground hover:underline">
              Create an account
            </Link>
          </div>

          <div className="flex justify-center pt-1">
            <Button type="submit" size="lg" className="w-40 rounded-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Panel>
  );
}
