"use client";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";

const Logo = () => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const handleMounted = useEffectEvent(() => {
    setMounted(true);
  });

  useEffect(() => {
    handleMounted();
  }, []);

  const activeTheme = theme === "system" ? resolvedTheme : theme;
  const src =
    activeTheme === "dark" ? "/assets/logo.png" : "/assets/light-logo.png";

  return (
    <Link href="/" className="flex items-center">
      {mounted && (
        <Image
          src={src}
          className="w-10 h-10 mr-2"
          alt="logo"
          width={40}
          height={40}
        />
      )}
      <h1 className="text-xl font-bold">ResuAI</h1>
    </Link>
  );
};
export default Logo;
