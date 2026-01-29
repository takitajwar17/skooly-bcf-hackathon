import { ClerkProvider, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { light } from "@clerk/themes";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "@/app/components/theme-provider";
import { Loader2 } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import ClientLayout from "./components/ClientLayout";
import "./globals.css";

/**
 * Note: Vercel Analytics and SpeedInsights are already optimized for Next.js
 * They use efficient loading strategies internally
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Skooly - AI-Powered Student Hub",
  description: "Organize your course materials, chat with your lecture notes, and master your curriculum with Skooly.",
  openGraph: {
    type: "website",
    url: "https://skooly-app.vercel.app",
    title: "Skooly - AI-Powered Student Hub",
    description: "Your personalized AI tutor and course material organizer.",
    image: "/inherit.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: light,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta property="og:type" content={metadata.openGraph.type} />
          <meta property="og:url" content={metadata.openGraph.url} />
          <meta property="og:title" content={metadata.openGraph.title} />
          <meta
            property="og:description"
            content={metadata.openGraph.description}
          />
          <meta property="og:image" content={metadata.openGraph.image} />
          <script
            async
            crossOrigin="anonymous"
            src="https://tweakcn.com/live-preview.min.js"
          />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ClerkLoading>
              <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              </div>
            </ClerkLoading>
            <ClerkLoaded>
              <ClientLayout>
                {children}
              </ClientLayout>
            </ClerkLoaded>
            <ToastContainer />
          </ThemeProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
