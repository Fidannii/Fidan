import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <p className="font-display text-3xl text-[var(--ink)]">OpsFlow AI</p>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Demo-Login: Auth wird später über Supabase Auth angebunden. Für den MVP
          direkt ins Dashboard wechseln.
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" placeholder="makler@nordblick.de" />
          </div>
          <div>
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <Link href="/dashboard" className="block">
            <Button className="w-full" size="lg">
              Zum Demo-Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
