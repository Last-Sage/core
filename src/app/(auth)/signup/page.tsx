"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth/hooks";
import { getSupabaseClient } from "@/lib/supabase/client";
import { UserPlus, Mail, Lock, User, Building2, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const [step, setStep] = useState<"account" | "organization">("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signUp } = useAuth();
  const router = useRouter();
  const supabase = getSupabaseClient();

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else if (data.user) {
      setStep("organization");
      setLoading(false);
    }
  };

  // Sanitize slug: lowercase, alphanumeric and dashes only, no consecutive dashes
  const sanitizeSlug = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")       // Remove consecutive dashes
      .replace(/^-|-$/g, "");    // Remove leading/trailing dashes
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Call onboarding function
      const { error: rpcError } = await supabase.rpc("onboard_user", {
        p_org_name: orgName,
        p_org_slug: sanitizeSlug(orgSlug),
        p_user_full_name: fullName,
      });

      if (rpcError) throw rpcError;
      
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create organization";
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Auto-generate slug from org name
  const handleOrgNameChange = (value: string) => {
    setOrgName(value);
    if (!orgSlug || orgSlug === sanitizeSlug(orgName)) {
      setOrgSlug(sanitizeSlug(value));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
            {step === "account" ? (
              <UserPlus className="w-8 h-8 text-[var(--color-dark)]" />
            ) : (
              <Building2 className="w-8 h-8 text-[var(--color-dark)]" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {step === "account" ? "Create Account" : "Setup Organization"}
          </CardTitle>
          <p className="text-[var(--color-text-secondary)] body-sm mt-2">
            {step === "account"
              ? "Start your journey with NIXITO"
              : "Set up your organization to get started"}
          </p>
        </CardHeader>

        <CardContent>
          {step === "account" ? (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] text-[var(--color-error)] text-sm">
                  {error}
                </div>
              )}

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                <Input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-11"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                <Input
                  type="password"
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11"
                  minLength={8}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={loading}
                icon={ArrowRight}
                iconPosition="right"
              >
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOrgSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] text-[var(--color-error)] text-sm">
                  {error}
                </div>
              )}

              <Input
                label="Organization Name"
                type="text"
                placeholder="Acme Inc."
                value={orgName}
                onChange={(e) => handleOrgNameChange(e.target.value)}
                required
              />

              <Input
                label="URL Slug"
                type="text"
                placeholder="acme-inc"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                required
              />
              <p className="text-xs text-[var(--color-text-muted)] -mt-2">
                Your workspace will be at: nixito.app/{orgSlug || "your-slug"}
              </p>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={loading}
                icon={ArrowRight}
                iconPosition="right"
              >
                Create Organization
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-[var(--color-text-secondary)] body-sm">
              Already have an account?{" "}
              <a href="/login" className="text-[var(--color-primary-hover)] font-semibold hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
