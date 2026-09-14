"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth.schema";
import { createClient } from "@/lib/supabase/client";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FloatField } from "@/components/ui/float-field";
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
      <CardContent className="space-y-6 py-2">
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            aria-label="Back to login"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <h1 className="flex-1 pr-8 text-center font-heading text-xl font-bold tracking-tight">Sign up</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FloatField label="Name" htmlFor="fullName" error={errors.fullName?.message}>
            <Input id="fullName" autoComplete="name" placeholder="Your name" {...register("fullName")} />
          </FloatField>
          <FloatField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
          </FloatField>
          <FloatField label="Password" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" {...register("password")} />
          </FloatField>
          <FloatField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••" {...register("confirmPassword")} />
          </FloatField>
          <div className="flex justify-center pt-1">
            <Button type="submit" size="lg" className="w-40 rounded-full" disabled={submitting}>
              {submitting ? "Creating…" : "Register"}
            </Button>
          </div>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Panel>
  );
}
