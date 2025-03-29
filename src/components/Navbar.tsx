import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, Sun, Moon, Bell, User, Search, LogOut, LogIn, Briefcase, Calendar, MapPin, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { slideFromTopAnimation, easeTransition } from '@/lib/transitions';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthModal } from './auth';
import { searchJobApplications, JobSearchParams } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { JobApplication } from '@/utils/types';

interface NavbarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Navbar = ({ isSidebarOpen, toggleSidebar }: NavbarProps) => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JobApplication[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Get current page name from path
  const getPageName = () => {
    const path = location.pathname;
    
    if (path === '/') return 'JobPilot Dashboard';
    if (path === '/job-tracker') return 'Job Tracker';
    if (path === '/auto-apply') return 'Job Search';
    if (path === '/credentials') return 'Saved Credentials';
    if (path === '/settings') return 'JobPilot Settings';
    
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

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clear search when changing routes
  useEffect(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  }, [location.pathname]);

  const openAuthModal = (tab: 'login' | 'signup') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    
    if (e.target.value.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Handle search submission
  const handleSearch = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      setIsSearching(true);
      const searchParams: JobSearchParams = {
        query: searchQuery
      };
      
      const results = await searchJobApplications(searchParams);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching job applications:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle key press in search input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Navigate to job details
  const navigateToJob = (jobId: string) => {
    navigate(`/job-tracker?jobId=${jobId}`);
    setShowResults(false);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'interview':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'offer':
        return 'bg-green-500 hover:bg-green-600';
      case 'rejected':
        return 'bg-red-500 hover:bg-red-600';
      case 'saved':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <>
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

          <div className="hidden md:flex items-center bg-muted rounded-full px-3 w-96 h-10 relative" ref={searchRef}>
            <Search 
              size={18} 
              className={`${isSearching ? 'animate-pulse' : ''} text-muted-foreground mr-2 cursor-pointer`} 
              onClick={handleSearch}
            />
            <Input 
              type="text" 
              placeholder="Search job applications..." 
              className="border-0 bg-transparent h-9 focus-visible:ring-0 focus-visible:ring-offset-0" 
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyPress}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowResults(true);
                }
              }}
            />
            
            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showResults && (
                <motion.div 
                  className="absolute top-full left-0 w-full mt-2 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {searchResults.length > 0 ? (
                    <div className="p-2 space-y-2">
                      <p className="text-xs text-muted-foreground px-2 py-1">
                        Found {searchResults.length} job application{searchResults.length !== 1 ? 's' : ''}
                      </p>
                      
                      {searchResults.map((job) => (
                        <Card 
                          key={job._id} 
                          className="p-3 cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => navigateToJob(job._id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{job.jobTitle}</h3>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Building className="h-3 w-3 mr-1" />
                                <span className="mr-2">{job.companyName}</span>
                                {job.location && (
                                  <>
                                    <MapPin className="h-3 w-3 mr-1" />
                                    <span>{job.location}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Badge className={`${getStatusColor(job.status)} text-white`}>
                              {job.status}
                            </Badge>
                          </div>
                          {job.applicationDate && (
                            <div className="flex items-center mt-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>Applied: {new Date(job.applicationDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-muted-foreground">No job applications found</p>
                      <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-foreground">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
            
            <Button variant="ghost" size="icon" className="text-foreground relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive"></span>
            </Button>
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                      <AvatarFallback>{user?.name?.substring(0, 2) || 'US'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <User size={16} />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openAuthModal('login')}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openAuthModal('signup')}>
                    <User className="mr-2 h-4 w-4" />
                    Sign Up
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </motion.header>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultTab={authModalTab} 
      />
    </>
  );
};

export default Navbar;
