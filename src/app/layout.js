import { cookies } from "next/headers";
import Script from "next/script";
import { IBM_Plex_Sans } from "next/font/google";
import AppTopbar from "@/components/app-topbar";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import "./globals.css";

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata = {
  title: "Repair Desk Web",
  description: "Repair shop intake and ticketing starter app."
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await readSessionToken(sessionToken);

  return (
    <html lang="en">
      <body className={bodyFont.variable}>
        <Script src="/vendor/dymo.connect.framework.js" strategy="beforeInteractive" />
        <div className="app-frame">
          <AppTopbar session={session} />
          <div className="app-page">{children}</div>
        </div>
      </body>
    </html>
  );
}
