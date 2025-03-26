
import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Menu, X, Sun, Moon, Bell, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { slideFromTopAnimation, easeTransition } from '@/lib/transitions';
import { useLocation } from 'react-router-dom';

interface NavbarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Navbar = ({ isSidebarOpen, toggleSidebar }: NavbarProps) => {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  // Get current page name from path
  const getPageName = () => {
    const path = location.pathname;
    
    if (path === '/') return 'Dashboard';
    if (path === '/job-tracker') return 'Job Tracker';
    if (path === '/auto-apply') return 'Auto Apply';
    if (path === '/credentials') return 'Saved Credentials';
    if (path === '/settings') return 'Settings';
    
    return path.substring(1).charAt(0).toUpperCase() + path.substring(2);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <motion.header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        scrolled ? 'backdrop-blur-md bg-background/80 shadow-sm' : 'bg-background'
      }`}
      initial="hidden"
      animate="visible"
      variants={slideFromTopAnimation}
      transition={easeTransition}
    >
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          <h1 className="text-xl font-medium hidden md:block">{getPageName()}</h1>
        </div>

        <div className="hidden md:flex items-center bg-muted rounded-full px-3 w-96 h-10">
          <Search size={18} className="text-muted-foreground mr-2" />
          <Input 
            type="text" 
            placeholder="Search..." 
            className="border-0 bg-transparent h-9 focus-visible:ring-0 focus-visible:ring-offset-0" 
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-foreground">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
          
          <Button variant="ghost" size="icon" className="text-foreground relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                  <AvatarFallback>US</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
