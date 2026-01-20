import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-4 sm:py-6 max-w-7xl mx-auto w-full px-4 sm:px-6">{children}</main>
      <Footer />
    </div>
  );
}
