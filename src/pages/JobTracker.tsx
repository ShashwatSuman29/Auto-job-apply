import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { JobCard } from '@/components';
import { Plus, Search, FileDown, FileUp, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { JobApplication, JobStatus } from '@/utils/types';
import { staggeredContainer, slideFromTopAnimation } from '@/lib/transitions';
import { getJobApplications, addJobApplication, updateJobApplication, deleteJobApplication, searchJobApplications, JobSearchParams } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const JobTracker = () => {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState<Date | undefined>(undefined);
  const [dateToFilter, setDateToFilter] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Fetch jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // Effect to handle search when filters change
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search to avoid too many API calls
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, statusFilter, companyFilter, dateFromFilter, dateToFilter, activeTab]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const fetchedJobs = await getJobApplications();
      console.log('Fetched jobs:', fetchedJobs);
      setJobs(fetchedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch job applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      
      // Prepare search parameters
      const searchParams: JobSearchParams = {};
      
      if (searchQuery.trim()) {
        searchParams.query = searchQuery.trim();
        console.log('Searching for:', searchQuery.trim());
      }
      
      // Only add status filter if it's not 'all' or if the active tab is not 'all'
      if (activeTab !== 'all') {
        searchParams.status = activeTab;
      } else if (statusFilter !== 'all') {
        searchParams.status = statusFilter;
      }
      
      if (companyFilter.trim()) {
        searchParams.company = companyFilter.trim();
      }
      
      if (dateFromFilter) {
        searchParams.dateFrom = dateFromFilter.toISOString();
      }
      
      if (dateToFilter) {
        searchParams.dateTo = dateToFilter.toISOString();
      }
      
      console.log('Search params:', searchParams);
      
      // If no search parameters, fetch all jobs
      if (Object.keys(searchParams).length === 0) {
        await fetchJobs();
        return;
      }
      
      // Execute search
      const searchResults = await searchJobApplications(searchParams);
      console.log('Search results:', searchResults);
      
      // If no results from the API search but we have a query, try client-side filtering as fallback
      if (searchResults.length === 0 && searchQuery.trim() && jobs.length > 0) {
        console.log('No server results, trying client-side search as fallback');
        const query = searchQuery.toLowerCase().trim();
        
        // Split query into words for better matching
        const searchTerms = query.split(/\s+/).filter(term => term.length > 0);
        
        // Try client-side search as a fallback
        const clientResults = jobs.filter(job => {
          // Check if any search term matches any field
          return searchTerms.some(term => 
            (job.jobTitle ? job.jobTitle.toLowerCase().includes(term) : false) || 
            (job.companyName ? job.companyName.toLowerCase().includes(term) : false) || 
            (job.notes ? job.notes.toLowerCase().includes(term) : false) || 
            (job.location ? job.location.toLowerCase().includes(term) : false) ||
            (job.contactPerson ? job.contactPerson.toLowerCase().includes(term) : false) ||
            (job.contactEmail ? job.contactEmail.toLowerCase().includes(term) : false) ||
            // Check for acronyms like SDE (Software Development Engineer)
            (term.toUpperCase() === term && (
              (job.jobTitle ? job.jobTitle.toUpperCase().includes(term) : false) || 
              (job.notes ? job.notes.toUpperCase().includes(term) : false)
            ))
          );
        });
        
        console.log('Client-side search results:', clientResults);
        if (clientResults.length > 0) {
          setJobs(clientResults);
          return;
        }
      }
      
      setJobs(searchResults);
    } catch (error) {
      console.error('Error searching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to search job applications",
        variant: "destructive",
      });
      
      // On error, try to show all jobs
      fetchJobs();
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddJob = async (newJob: JobApplication) => {
    try {
      if (currentJob && currentJob._id) {
        // Update existing job
        const updatedJob = await updateJobApplication(currentJob._id, newJob);
        setJobs(jobs.map(job => job._id === currentJob._id ? updatedJob : job));
        toast({
          title: "Success",
          description: "Job application updated successfully",
        });
      } else {
        // Add new job
        const addedJob = await addJobApplication(newJob);
        setJobs([...jobs, addedJob]);
        toast({
          title: "Success",
          description: "Job application added successfully",
        });
      }
      setCurrentJob(null);
      setIsDialogOpen(false);
      
      // Refresh job list to ensure we have the latest data
      fetchJobs();
    } catch (error) {
      toast({
        title: "Error",
        description: currentJob ? "Failed to update job application" : "Failed to add job application",
        variant: "destructive",
      });
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await deleteJobApplication(id);
      setJobs(jobs.filter(job => job._id !== id));
      toast({
        title: "Success",
        description: "Job application deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete job application",
        variant: "destructive",
      });
    }
  };

  const handleEditJob = (job: JobApplication) => {
    setCurrentJob(job);
    setIsDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCompanyFilter('');
    setDateFromFilter(undefined);
    setDateToFilter(undefined);
    fetchJobs();
  };

  const filteredJobs = jobs.filter(job => {
    // This is now handled by the backend search, but we keep this for client-side filtering
    // when switching tabs without making a new API call
    const matchesTab = activeTab === 'all' || job.status === activeTab;
    return matchesTab;
  });

  const statusCounts = {
    all: jobs.length,
    Applied: jobs.filter(job => job.status === 'Applied').length,
    'Interview Scheduled': jobs.filter(job => job.status === 'Interview Scheduled').length,
    'Offer Received': jobs.filter(job => job.status === 'Offer Received').length,
    Rejected: jobs.filter(job => job.status === 'Rejected').length,
    Saved: jobs.filter(job => job.status === 'Saved').length,
  };

  return (
    <div className="space-y-6">
      <JobFormDialog 
        isOpen={isDialogOpen} 
        setIsOpen={setIsDialogOpen} 
        onSubmit={handleAddJob} 
        job={currentJob}
      />
      
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={slideFromTopAnimation}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Tracker</h1>
          <p className="text-muted-foreground">Track and manage your job applications</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => {
            setCurrentJob(null);
            setIsDialogOpen(true);
          }} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Job
          </Button>
        </div>
      </motion.section>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search jobs by title, company, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Applications</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Interview Scheduled">Interview</SelectItem>
                    <SelectItem value="Offer Received">Offer</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Saved">Saved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Filter by company"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <div className="w-[150px]">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateFromFilter && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFromFilter ? format(dateFromFilter, "PPP") : "From date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFromFilter}
                        onSelect={setDateFromFilter}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="w-[150px]">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateToFilter && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateToFilter ? format(dateToFilter, "PPP") : "To date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateToFilter}
                        onSelect={setDateToFilter}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-1">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs 
            defaultValue="all" 
            className="w-full"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
          >
            <div className="px-6">
              <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
                <TabsTrigger value="all">
                  All <span className="ml-1 text-xs bg-muted rounded-full px-1.5">{statusCounts.all}</span>
                </TabsTrigger>
                <TabsTrigger value="Applied">
                  Applied <span className="ml-1 text-xs bg-muted rounded-full px-1.5">{statusCounts.Applied}</span>
                </TabsTrigger>
                <TabsTrigger value="Interview Scheduled">
                  Interview <span className="ml-1 text-xs bg-muted rounded-full px-1.5">{statusCounts['Interview Scheduled']}</span>
                </TabsTrigger>
                <TabsTrigger value="Offer Received">
                  Offer <span className="ml-1 text-xs bg-muted rounded-full px-1.5">{statusCounts['Offer Received']}</span>
                </TabsTrigger>
                <TabsTrigger value="Rejected">
                  Rejected <span className="ml-1 text-xs bg-muted rounded-full px-1.5">{statusCounts.Rejected}</span>
                </TabsTrigger>
                <TabsTrigger value="Saved">
                  Saved <span className="ml-1 text-xs bg-muted rounded-full px-1.5">{statusCounts.Saved}</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="m-0">
              <motion.div 
                variants={staggeredContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6"
              >
                {isLoading || isSearching ? (
                  <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <h3 className="text-lg font-medium">Loading job applications...</h3>
                  </div>
                ) : filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      onEdit={handleEditJob}
                      onDelete={handleDeleteJob}
                    />
                  ))
                ) : (
                  <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No jobs found</h3>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">
                      {searchQuery || statusFilter !== 'all' || companyFilter || dateFromFilter || dateToFilter
                        ? `No jobs matching your search criteria`
                        : "Start tracking your job applications"}
                    </p>
                    <Button onClick={() => {
                      setCurrentJob(null);
                      setIsDialogOpen(true);
                    }}>
                      Add your first job
                    </Button>
                  </div>
                )}
              </motion.div>
            </TabsContent>
            
            {/* Duplicate the TabsContent for each status to ensure proper filtering */}
            {['Applied', 'Interview Scheduled', 'Offer Received', 'Rejected', 'Saved'].map((status) => (
              <TabsContent key={status} value={status} className="m-0">
                <motion.div 
                  variants={staggeredContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6"
                >
                  {isLoading || isSearching ? (
                    <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                      <h3 className="text-lg font-medium">Loading job applications...</h3>
                    </div>
                  ) : filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <JobCard
                        key={job._id}
                        job={job}
                        onEdit={handleEditJob}
                        onDelete={handleDeleteJob}
                      />
                    ))
                  ) : (
                    <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                      <div className="rounded-full bg-muted p-3 mb-4">
                        <Search className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium">No {status} jobs found</h3>
                      <p className="text-muted-foreground text-sm mt-1 mb-4">
                        {searchQuery || companyFilter || dateFromFilter || dateToFilter
                          ? `No ${status} jobs matching your search criteria`
                          : `You don't have any ${status} job applications yet`}
                      </p>
                      <Button onClick={() => {
                        setCurrentJob(null);
                        setIsDialogOpen(true);
                      }}>
                        Add job application
                      </Button>
                    </div>
                  )}
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

interface JobFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSubmit: (job: JobApplication) => void;
  job: JobApplication | null;
}

const JobFormDialog = ({ isOpen, setIsOpen, onSubmit, job }: JobFormDialogProps) => {
  const [formData, setFormData] = useState<JobApplication>({
    companyName: '',
    jobTitle: '',
    applicationDate: new Date().toISOString().split('T')[0],
    status: 'Applied',
    location: '',
    salary: '',
    notes: '',
  });
  
  // Update form when job is set for editing
  useEffect(() => {
    if (job) {
      setFormData({
        ...job,
        applicationDate: job.applicationDate instanceof Date 
          ? job.applicationDate.toISOString().split('T')[0] 
          : job.applicationDate,
      });
    } else {
      setFormData({
        companyName: '',
        jobTitle: '',
        applicationDate: new Date().toISOString().split('T')[0],
        status: 'Applied',
        location: '',
        salary: '',
        notes: '',
      });
    }
  }, [job]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as JobStatus }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    
    // Reset form
    setFormData({
      companyName: '',
      jobTitle: '',
      applicationDate: new Date().toISOString().split('T')[0],
      status: 'Applied',
      location: '',
      salary: '',
      notes: '',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{job ? 'Edit Job Application' : 'Add New Job Application'}</DialogTitle>
          <DialogDescription>
            {job 
              ? 'Update the details of your job application below' 
              : 'Enter the details of your job application below'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title *</Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicationDate">Application Date *</Label>
              <Input
                id="applicationDate"
                name="applicationDate"
                type="date"
                value={formData.applicationDate.toString()}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Applied">Applied</SelectItem>
                  <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="Offer Received">Offer Received</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Saved">Saved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="salary">Salary Range</Label>
              <Input
                id="salary"
                name="salary"
                placeholder="e.g. $100K-$130K"
                value={formData.salary || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Add any additional details about the application"
              className="min-h-24"
            />
          </div>
          
          <DialogFooter>
            <Button type="submit">
              {job ? 'Update Application' : 'Save Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JobTracker;
