import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import JobCard from '@/components/JobCard';
import { BarChart, LineChart, Zap, ArrowRight, Briefcase, Building, Calendar, CheckCircle, Clock, Award, X } from 'lucide-react';
import { JobApplication, JobStatus } from '@/utils/types';
import { scaleAnimation, slideFromBottomAnimation, staggeredContainer } from '@/lib/transitions';
import { getJobApplications } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Define status colors
const statusColors = {
  'Applied': 'bg-blue-500',
  'Interview Scheduled': 'bg-amber-500',
  'Offer Received': 'bg-green-500',
  'Rejected': 'bg-red-500',
  'Saved': 'bg-purple-500'
};

const Dashboard = () => {
  const [recentJobs, setRecentJobs] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([
    { title: 'Applications', value: 0, icon: <Briefcase className="h-5 w-5" />, color: 'blue' },
    { title: 'Interviews', value: 0, icon: <Calendar className="h-5 w-5" />, color: 'amber' },
    { title: 'Offers', value: 0, icon: <Award className="h-5 w-5" />, color: 'green' },
    { title: 'Rejections', value: 0, icon: <X className="h-5 w-5" />, color: 'red' },
  ]);
  const [applicationsByStatus, setApplicationsByStatus] = useState([
    { status: 'Applied', count: 0, color: statusColors['Applied'] },
    { status: 'Interview Scheduled', count: 0, color: statusColors['Interview Scheduled'] },
    { status: 'Offer Received', count: 0, color: statusColors['Offer Received'] },
    { status: 'Rejected', count: 0, color: statusColors['Rejected'] },
    { status: 'Saved', count: 0, color: statusColors['Saved'] },
  ]);
  const { toast } = useToast();

  // Fetch job applications when component mounts
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setIsLoading(true);
        const jobs = await getJobApplications();
        
        // Sort by date (newest first) and take the most recent ones
        const sortedJobs = [...jobs].sort((a, b) => 
          new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
        );
        
        // Set recent jobs (latest 5)
        setRecentJobs(sortedJobs.slice(0, 5));
        
        // Update statistics
        updateStatistics(jobs);
      } catch (error) {
        console.error('Error fetching job data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch job application data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobData();
  }, [toast]);

  // Update statistics based on job data
  const updateStatistics = (jobs: JobApplication[]) => {
    // Count applications by status
    const totalApplications = jobs.length;
    const interviewCount = jobs.filter(job => job.status === 'Interview Scheduled').length;
    const offerCount = jobs.filter(job => job.status === 'Offer Received').length;
    const rejectionCount = jobs.filter(job => job.status === 'Rejected').length;
    const appliedCount = jobs.filter(job => job.status === 'Applied').length;
    const savedCount = jobs.filter(job => job.status === 'Saved').length;

    // Update stats
    setStats([
      { title: 'Applications', value: totalApplications, icon: <Briefcase className="h-5 w-5" />, color: 'blue' },
      { title: 'Interviews', value: interviewCount, icon: <Calendar className="h-5 w-5" />, color: 'amber' },
      { title: 'Offers', value: offerCount, icon: <Award className="h-5 w-5" />, color: 'green' },
      { title: 'Rejections', value: rejectionCount, icon: <X className="h-5 w-5" />, color: 'red' },
    ]);

    // Update applications by status
    setApplicationsByStatus([
      { status: 'Applied', count: appliedCount, color: statusColors['Applied'] },
      { status: 'Interview Scheduled', count: interviewCount, color: statusColors['Interview Scheduled'] },
      { status: 'Offer Received', count: offerCount, color: statusColors['Offer Received'] },
      { status: 'Rejected', count: rejectionCount, color: statusColors['Rejected'] },
      { status: 'Saved', count: savedCount, color: statusColors['Saved'] },
    ]);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your job search overview.</p>
          </div>
          
          <div className="flex space-x-2">
            <Button asChild variant="default">
              <Link to="/auto-apply" className="flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Auto Apply
              </Link>
            </Button>
          </div>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={staggeredContainer}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={scaleAnimation}>
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`bg-${stat.color}-100 text-${stat.color}-700 p-2 rounded-full dark:bg-${stat.color}-900/30 dark:text-${stat.color}-400`}>
                    {stat.icon}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.section 
          variants={slideFromBottomAnimation}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Applications by Status</CardTitle>
              <CardDescription>Distribution of your job applications</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-4">
                {applicationsByStatus.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${item.color}`}></div>
                        <span>{item.status}</span>
                      </div>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <Progress 
                      value={stats[0].value > 0 ? (item.count / stats[0].value) * 100 : 0} 
                      className={item.color} 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" asChild className="ml-auto">
                <Link to="/job-tracker" className="flex items-center">
                  View details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.section>
        
        <motion.section 
          variants={slideFromBottomAnimation}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Recent Applications</CardTitle>
              <CardDescription>Your latest job applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">Loading recent applications...</div>
              ) : recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <div key={job._id} className="border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{job.jobTitle}</h4>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Building className="h-3 w-3 mr-1" />
                          {job.companyName}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 text-xs rounded-full ${statusColors[job.status]} bg-opacity-20 text-${job.status === 'Applied' ? 'blue' : job.status === 'Interview Scheduled' ? 'amber' : job.status === 'Offer Received' ? 'green' : job.status === 'Rejected' ? 'red' : 'purple'}-700`}>
                          {job.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">No applications found. Start tracking your job applications!</div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" asChild className="ml-auto">
                <Link to="/job-tracker" className="flex items-center">
                  View all applications
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.section>
      </div>
      
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          variants={slideFromBottomAnimation}
          initial="hidden"
          animate="visible"
          className="w-full"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart className="h-5 w-5" />
                <span>Weekly Applications</span>
              </CardTitle>
              <CardDescription>Applications sent in the past weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Chart will be added in the next phase
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          variants={slideFromBottomAnimation}
          initial="hidden"
          animate="visible"
          className="w-full"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="h-5 w-5" />
                <span>Response Rate</span>
              </CardTitle>
              <CardDescription>Interview success over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Chart will be added in the next phase
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
};

export default Dashboard;
