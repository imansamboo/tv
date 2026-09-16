import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  // Dev server only. `**` matches any leading labels and `*` the last one, so
  // this covers every host containing a dot; Next rejects a bare `*` or `**`.
  allowedDevOrigins: ["**.*", "[::1]"],
};

export default nextConfig;
