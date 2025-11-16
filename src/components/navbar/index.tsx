import Logo from "./Logo";
import NavItems from "./NavItems";
import NavUser from "./NavUser";

const Navbar = () => {
  return (
    <nav className="flex items-center z-50 justify-between mx-auto py-4 px-6 bg-background shadow-md opacity-90 sticky top-0">
      <Logo />

      <NavItems />

      <NavUser />
    </nav>
  );
};
export default Navbar;
