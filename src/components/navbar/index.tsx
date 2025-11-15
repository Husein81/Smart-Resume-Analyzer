"use client";

import Link from "next/link";
import NavUser from "./NavUser";
import Image from "next/image";
import NavItems from "./NavItems";

const Navbar = () => {
  return (
    <nav className="flex items-center z-50 justify-between mx-auto py-4 px-6 bg-white shadow-md opacity-90 sticky top-0">
      <Link href="/" className="flex items-center">
        <Image src="/favicon.ico" alt="" width={40} height={40} />
        <h1 className="text-xl font-bold">ResuAI</h1>
      </Link>
      <NavItems />
      <NavUser />
    </nav>
  );
};
export default Navbar;
