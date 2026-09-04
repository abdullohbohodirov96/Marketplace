import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="container flex h-16 items-center">
          <Logo />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
