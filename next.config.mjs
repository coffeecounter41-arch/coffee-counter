import withPWAInit from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // إضافة هذا الكائن الفارغ يخبر المحرك الجديد أنك تدير الإعدادات يدوياً
  turbopack: {}, 
  webpack: (config) => {
    return config;
  },
};

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default withPWA(nextConfig);