
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { JobCard } from '@/components';
import { Plus, Search, FileDown, FileUp, Filter } from 'lucide-react';
import { JobApplication, JobStatus } from '@/utils/types';
import { staggeredContainer, slideFromTopAnimation } from '@/lib/transitions';

const JobTracker = () => {
  const [jobs, setJobs] = useState<JobApplication[]>([
    {
      _id: '1',
      companyName: 'Apple Inc.',
      jobTitle: 'Frontend Developer',
      applicationDate: '2023-06-15',
      status: 'Interview Scheduled',
      location: 'San Francisco, CA',
      salary: '$120,000 - $150,000',
      notes: 'Interview scheduled for June 20th at 10:00 AM PST with the hiring manager. Need to prepare portfolio presentation.',
      successPrediction: 85,
    },
    {
      _id: '2',
      companyName: 'Google',
      jobTitle: 'UI/UX Designer',
      applicationDate: '2023-06-10',
      status: 'Applied',
      location: 'Remote',
      salary: '$100,000 - $130,000',
      notes: 'Applied through referral from John. Follow up after 1 week.',
      successPrediction: 65,
    },
    {
      _id: '3',
      companyName: 'Microsoft',
      jobTitle: 'Full Stack Developer',
      applicationDate: '2023-06-05',
      status: 'Rejected',
      location: 'Seattle, WA',
      salary: '$130,000 - $160,000',
      notes: 'Received rejection email on June 12th. Recruiter mentioned lack of experience with specific technologies.',
      successPrediction: 30,
    },
    {
      _id: '4',
      companyName: 'Amazon',
      jobTitle: 'Senior React Developer',
      applicationDate: '2023-06-01',
      status: 'Offer Received',
      location: 'New York, NY',
      salary: '$140,000 - $170,000',
      notes: 'Received offer on June 14th. Need to respond by June 21st. Negotiation possible.',
      successPrediction: 95,
    },
  ]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState<JobApplication | null>(null);
  
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const handleAddJob = (newJob: JobApplication) => {
    if (currentJob && currentJob._id) {
      // Update existing job
      setJobs(jobs.map(job => 
        job._id === currentJob._id ? { ...newJob, _id: job._id } : job
      ));
    } else {
      // Add new job
      const id = Math.random().toString(36).substr(2, 9);
      setJobs([...jobs, { ...newJob, _id: id }]);
    }
    
    setCurrentJob(null);
    setIsDialogOpen(false);
  };
  
  const handleDeleteJob = (id: string) => {
    setJobs(jobs.filter(job => job._id !== id));
  };
  
  const handleEditJob = (job: JobApplication) => {
    setCurrentJob(job);
    setIsDialogOpen(true);
  };

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="all" className="w-full">
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
                {filteredJobs.length > 0 ? (
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
                      {searchQuery
                        ? `No jobs matching "${searchQuery}" found`
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
            
            {(['Applied', 'Interview Scheduled', 'Offer Received', 'Rejected', 'Saved'] as JobStatus[]).map((status) => (
              <TabsContent key={status} value={status} className="m-0">
                <motion.div 
                  variants={staggeredContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6"
                >
                  {filteredJobs.filter(job => job.status === status).length > 0 ? (
                    filteredJobs
                      .filter(job => job.status === status)
                      .map((job) => (
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
                      <h3 className="text-lg font-medium">No {status.toLowerCase()} jobs found</h3>
                      <p className="text-muted-foreground text-sm mt-1 mb-4">
                        {searchQuery
                          ? `No ${status.toLowerCase()} jobs matching "${searchQuery}" found`
                          : `Start tracking your ${status.toLowerCase()} applications`}
                      </p>
                      <Button onClick={() => {
                        setCurrentJob(null);
                        setIsDialogOpen(true);
                      }}>
                        Add a job
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
  useState(() => {
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
  });
  
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
