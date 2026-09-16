"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PayPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/form/success");
  }, [router]);

  return <p className="py-20 text-center text-white/60">در حال انتقال...</p>;
}
