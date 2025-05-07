import { Inter } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/antd-registry";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "User Management System",
  description: "A simple user management system built with Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        // className={inter.className}
        className="bg-gradient-to-br from-blue-50 via-white to-purple-50"
      >
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}
