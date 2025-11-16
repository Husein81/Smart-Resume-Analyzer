"use client";

import Link from "next/link";
import NavUser from "./NavUser";
import Image from "next/image";
import NavItems from "./NavItems";
import { useTheme } from "next-themes";
import { useEffect, useEffectEvent, useState } from "react";
import Logo from "./Logo";

const Navbar = () => {
  
  return (
    <nav className="flex items-center z-50 justify-between mx-auto py-4 px-6 bg-background shadow-md opacity-90 sticky top-0">
     <Logo  />
      <NavItems />

      <NavUser />
    </nav>
  );
};
export default Navbar;
