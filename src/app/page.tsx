"use client";

import dynamic from "next/dynamic";

const LAOSLandingPage = dynamic(() => import("@/components/LAOSLandingPage"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-4xl text-pink-500 animate-pulse">Loading LAOS..</div>
    </div>
  ),
});

export default function Home() {
  return <LAOSLandingPage />;
}
