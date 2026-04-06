import Header from "./header";
import Footer from "./footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
        <Header />
        <main className="min-w-0 grow">{children}</main>
        <Footer />
      </div>
    </>
  );
}
