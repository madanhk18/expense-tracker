"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Lock, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth.schema";
import { createClient } from "@/lib/supabase/client";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Panel } from "@/components/shared/panel";

export function RegisterForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterValues) {
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      logError("register", error);
      toast.error(toFriendlyMessage(error, "Couldn't create your account. Please try again."));
      setSubmitting(false);
      return;
    }

    setDone(true);
    setSubmitting(false);
  }

  if (done) {
    return (
      <Panel>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a confirmation link to your inbox. Click it to activate your account, then log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to login
            </Button>
          </Link>
        </CardContent>
      </Panel>
    );
  }

  return (
    <Panel>
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">Create your account</CardTitle>
        <CardDescription>Start tracking your expenses in seconds.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Name</Label>
            <div className="relative">
              <UserRound className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="fullName" autoComplete="name" placeholder="Your name" className="pl-10" {...register("fullName")} />
            </div>
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="pl-10"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="pl-10"
                {...register("password")}
              />
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="pl-10"
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Sign up"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Panel>
  );
}
