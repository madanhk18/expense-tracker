"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { profileFormSchema, type ProfileFormValues } from "@/lib/validations/settings.schema";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Profile } from "@/types/domain";

const DATE_FORMATS = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"] as const;

export function ProfileForm({
  profile,
  email,
  onSave,
}: {
  profile: Profile;
  email: string;
  onSave: (values: { displayName: string; dateFormat: string }) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: profile.display_name ?? "",
      dateFormat: profile.date_format as ProfileFormValues["dateFormat"],
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    setSubmitting(true);
    try {
      await onSave({ displayName: values.displayName ?? "", dateFormat: values.dateFormat });
      toast.success("Profile updated");
    } catch (error) {
      logError("profile-update", error);
      toast.error(toFriendlyMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="displayName">Name</Label>
        <Input id="displayName" {...register("displayName")} />
      </div>
      <div className="space-y-2">
        <Label>Date format</Label>
        <Controller
          control={control}
          name="dateFormat"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
