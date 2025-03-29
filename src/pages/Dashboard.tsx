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
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Define status colors
const statusColors = {
  'Applied': 'bg-blue-500',
  'Interview Scheduled': 'bg-amber-500',
  'Offer Received': 'bg-green-500',
  'Rejected': 'bg-red-500',
  'Saved': 'bg-purple-500'
};

// Chart color palette
const chartColors = {
  blue: 'rgba(59, 130, 246, 0.8)',
  amber: 'rgba(245, 158, 11, 0.8)',
  green: 'rgba(34, 197, 94, 0.8)',
  red: 'rgba(239, 68, 68, 0.8)',
  purple: 'rgba(168, 85, 247, 0.8)',
  blueBorder: 'rgb(59, 130, 246)',
  amberBorder: 'rgb(245, 158, 11)',
  greenBorder: 'rgb(34, 197, 94)',
  redBorder: 'rgb(239, 68, 68)',
  purpleBorder: 'rgb(168, 85, 247)',
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
  const [weeklyApplicationData, setWeeklyApplicationData] = useState({
    labels: [] as string[],
    datasets: [] as any[]
  });
  const [responseRateData, setResponseRateData] = useState({
    labels: [] as string[],
    datasets: [] as any[]
  });
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
        
        // Prepare chart data
        prepareWeeklyApplicationData(jobs);
        prepareResponseRateData(jobs);
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

  // Prepare data for weekly applications chart
  const prepareWeeklyApplicationData = (jobs: JobApplication[]) => {
    // Get the last 6 weeks
    const today = new Date();
    const weeks = [];
    const weekLabels = [];
    
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7 + today.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      weeks.push({ start: weekStart, end: weekEnd });
      
      // Format week label (e.g., "Apr 1-7")
      const startMonth = weekStart.toLocaleString('default', { month: 'short' });
      const endMonth = weekEnd.toLocaleString('default', { month: 'short' });
      const startDay = weekStart.getDate();
      const endDay = weekEnd.getDate();
      
      const weekLabel = startMonth === endMonth 
        ? `${startMonth} ${startDay}-${endDay}` 
        : `${startMonth} ${startDay}-${endMonth} ${endDay}`;
      
      weekLabels.push(weekLabel);
    }
    
    // Count applications per week by status
    const appliedData = weeks.map(week => 
      jobs.filter(job => 
        job.status === 'Applied' && 
        new Date(job.applicationDate) >= week.start && 
        new Date(job.applicationDate) <= week.end
      ).length
    );
    
    const interviewData = weeks.map(week => 
      jobs.filter(job => 
        job.status === 'Interview Scheduled' && 
        new Date(job.applicationDate) >= week.start && 
        new Date(job.applicationDate) <= week.end
      ).length
    );
    
    const offerData = weeks.map(week => 
      jobs.filter(job => 
        job.status === 'Offer Received' && 
        new Date(job.applicationDate) >= week.start && 
        new Date(job.applicationDate) <= week.end
      ).length
    );
    
    const rejectionData = weeks.map(week => 
      jobs.filter(job => 
        job.status === 'Rejected' && 
        new Date(job.applicationDate) >= week.start && 
        new Date(job.applicationDate) <= week.end
      ).length
    );
    
    // Set chart data
    setWeeklyApplicationData({
      labels: weekLabels,
      datasets: [
        {
          label: 'Applied',
          data: appliedData,
          backgroundColor: chartColors.blue,
          borderColor: chartColors.blueBorder,
          borderWidth: 1
        },
        {
          label: 'Interview',
          data: interviewData,
          backgroundColor: chartColors.amber,
          borderColor: chartColors.amberBorder,
          borderWidth: 1
        },
        {
          label: 'Offer',
          data: offerData,
          backgroundColor: chartColors.green,
          borderColor: chartColors.greenBorder,
          borderWidth: 1
        },
        {
          label: 'Rejected',
          data: rejectionData,
          backgroundColor: chartColors.red,
          borderColor: chartColors.redBorder,
          borderWidth: 1
        }
      ]
    });
  };

  // Prepare data for response rate chart
  const prepareResponseRateData = (jobs: JobApplication[]) => {
    // Get the last 6 months
    const today = new Date();
    const months = [];
    const monthLabels = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      months.push({ start: monthStart, end: monthEnd });
      monthLabels.push(monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }));
    }
    
    // Calculate response rates (interviews / applications) per month
    const responseRates = months.map(month => {
      const applicationsInMonth = jobs.filter(job => 
        new Date(job.applicationDate) >= month.start && 
        new Date(job.applicationDate) <= month.end
      ).length;
      
      const interviewsInMonth = jobs.filter(job => 
        job.status === 'Interview Scheduled' && 
        new Date(job.applicationDate) >= month.start && 
        new Date(job.applicationDate) <= month.end
      ).length;
      
      return applicationsInMonth > 0 
        ? Math.round((interviewsInMonth / applicationsInMonth) * 100) 
        : 0;
    });
    
    // Calculate success rates (offers / applications) per month
    const successRates = months.map(month => {
      const applicationsInMonth = jobs.filter(job => 
        new Date(job.applicationDate) >= month.start && 
        new Date(job.applicationDate) <= month.end
      ).length;
      
      const offersInMonth = jobs.filter(job => 
        job.status === 'Offer Received' && 
        new Date(job.applicationDate) >= month.start && 
        new Date(job.applicationDate) <= month.end
      ).length;
      
      return applicationsInMonth > 0 
        ? Math.round((offersInMonth / applicationsInMonth) * 100) 
        : 0;
    });
    
    // Set chart data
    setResponseRateData({
      labels: monthLabels,
      datasets: [
        {
          label: 'Interview Rate (%)',
          data: responseRates,
          borderColor: chartColors.amberBorder,
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Offer Rate (%)',
          data: successRates,
          borderColor: chartColors.greenBorder,
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    });
  };

  // Chart options
  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      },
    },
  };

  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      },
    },
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
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Loading chart data...
                </div>
              ) : weeklyApplicationData.datasets[0]?.data.some(val => val > 0) ? (
                <div className="h-[200px]">
                  <Bar data={weeklyApplicationData} options={barChartOptions} />
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No application data available for chart visualization
                </div>
              )}
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
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Loading chart data...
                </div>
              ) : responseRateData.datasets[0]?.data.some(val => val > 0) ? (
                <div className="h-[200px]">
                  <Line data={responseRateData} options={lineChartOptions} />
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No response data available for chart visualization
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
};

export default Dashboard;
