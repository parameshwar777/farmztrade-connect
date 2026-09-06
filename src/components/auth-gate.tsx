import { Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useCallback, useState } from "react";

import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";

/**
 * Browsing never requires an account. Actions do — this gate shows a
 * sign-in prompt instead of blocking the page.
 */
export function useAuthAction() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(false);

  const guard = useCallback(
    (action: () => void) => {
      if (!user) {
        setPrompt(true);
        return;
      }
      action();
    },
    [user],
  );

  return { guard, prompt, setPrompt, user };
}

export function SignInPrompt({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl text-center sm:max-w-sm">
        <DialogHeader className="items-center">
          <BrandMark className="h-12 w-12" />
          <DialogTitle className="font-display">Sign in to continue</DialogTitle>
          <DialogDescription>
            Verify your mobile number to chat with sellers, make offers and save animals. Browsing stays free.
          </DialogDescription>
        </DialogHeader>
        <Button asChild className="h-12 w-full rounded-full">
          <Link to="/auth">Continue with mobile number</Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-[55vh] place-items-center px-6 text-center">
        <div>
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-secondary text-primary">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-bold">Sign in required</h2>
          <p className="mt-1 text-sm text-muted-foreground">Verify your mobile number to open this page.</p>
          <Button className="mt-6 h-12 rounded-full px-8" onClick={() => navigate({ to: "/auth" })}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
