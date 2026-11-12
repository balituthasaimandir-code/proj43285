import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";

const font = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata = {
  title: "SafeRoutePlus: Emergency & Disaster Guide",
  description: "Emergency contacts, disaster action guides and a go-bag checklist.",
  manifest: "/manifest.json",
  applicationName: "SafeRoutePlus",
  appleWebApp: { capable: true, title: "SafeRoutePlus", statusBarStyle: "default" },
};
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#14785b" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  );
}
