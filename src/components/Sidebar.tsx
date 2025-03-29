import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Briefcase, Zap, Key, Settings, ChevronRight, ChevronLeft, LogOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { slideFromLeftAnimation, slideFromRightAnimation, easeTransition } from '@/lib/transitions';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}

const sidebarVariants = {
  open: { width: '16rem', transition: { duration: 0.3 } },
  closed: { width: '4.5rem', transition: { duration: 0.3 } },
  mobileOpen: { x: 0, transition: { duration: 0.3 } },
  mobileClosed: { x: '-100%', transition: { duration: 0.3 } },
};

const Sidebar = ({ isOpen, setIsOpen, isMobile }: SidebarProps) => {
  const location = useLocation();
  const { theme } = useTheme();
  
  const navItems = [
    { title: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { title: 'Job Tracker', path: '/job-tracker', icon: <Briefcase size={20} /> },
    { title: 'Job Search', path: '/auto-apply', icon: <Search size={20} /> },
    { title: 'Credentials', path: '/credentials', icon: <Key size={20} /> },
    { title: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const variants = isMobile ? 
    (isOpen ? 'mobileOpen' : 'mobileClosed') : 
    (isOpen ? 'open' : 'closed');

  const sidebarClasses = cn(
    "flex flex-col fixed h-screen z-50 py-6 transition-all duration-300 ease-in-out",
    isMobile ? "left-0 top-0 bottom-0 shadow-xl" : "",
    theme === 'dark' ? 'bg-card border-r border-border' : 'bg-background border-r border-border'
  );

  const overlayClasses = cn(
    "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
    isMobile && isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
  );

  return (
    <>
      <div className={overlayClasses} onClick={() => setIsOpen(false)} />
      
      <motion.aside
        className={sidebarClasses}
        variants={sidebarVariants}
        animate={variants}
        initial={false}
      >
        <div className="px-4 mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div 
                  key="full-logo"
                  className="flex items-center"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={slideFromLeftAnimation}
                  transition={easeTransition}
                >
                  <span className="text-xl font-semibold">Job<span className="text-primary">Pilot</span></span>
                </motion.div>
              ) : (
                <motion.div 
                  key="icon-logo"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={slideFromLeftAnimation}
                  transition={easeTransition}
                >
                  <span className="text-xl font-semibold">J</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hover:bg-muted"
            >
              {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </Button>
          )}
        </div>
        
        <div className="flex-1 px-3 space-y-1 overflow-y-auto">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center px-3 py-2.5 rounded-lg hover-effect",
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground",
                  isOpen ? "justify-start" : "justify-center"
                )}
              >
                <span className="flex items-center justify-center">
                  {item.icon}
                </span>
                
                <AnimatePresence mode="wait">
                  {isOpen && (
                    <motion.span
                      className="ml-3 whitespace-nowrap"
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={slideFromRightAnimation}
                      transition={easeTransition}
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
                
                {/* Show badge only for Job Tracker and only when sidebar is open */}
                {item.path === '/job-tracker' && isOpen && (
                  <Badge variant="outline" className="ml-auto bg-muted">4</Badge>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="px-3 mt-6">
          <Button
            variant="ghost"
            className={cn(
              "w-full text-muted-foreground hover:text-foreground",
              isOpen ? "justify-start" : "justify-center"
            )}
          >
            <LogOut size={20} />
            
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.span
                  className="ml-3"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={slideFromRightAnimation}
                  transition={easeTransition}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
