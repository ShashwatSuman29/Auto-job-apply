
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import JobCard from '@/components/JobCard';
import { BarChart, LineChart, Zap, ArrowRight, Briefcase, Building, Calendar, CheckCircle, Clock, Award, X } from 'lucide-react';
import { JobApplication } from '@/utils/types';
import { scaleAnimation, slideFromBottomAnimation, staggeredContainer } from '@/lib/transitions';

const Dashboard = () => {
  // Mock data for the dashboard
  const [recentJobs] = useState<JobApplication[]>([
    {
      _id: '1',
      companyName: 'Apple Inc.',
      jobTitle: 'Frontend Developer',
      applicationDate: '2023-06-15',
      status: 'Interview Scheduled',
      location: 'San Francisco, CA',
      salary: '$120,000 - $150,000',
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
  ]);

  const stats = [
    { title: 'Applications', value: 24, icon: <Briefcase className="h-5 w-5" />, color: 'blue' },
    { title: 'Interviews', value: 8, icon: <Calendar className="h-5 w-5" />, color: 'amber' },
    { title: 'Offers', value: 2, icon: <Award className="h-5 w-5" />, color: 'green' },
    { title: 'Rejections', value: 6, icon: <X className="h-5 w-5" />, color: 'red' },
  ];

  const applicationsByStatus = [
    { status: 'Applied', count: 8, color: 'bg-blue-500' },
    { status: 'Interview', count: 6, color: 'bg-amber-500' },
    { status: 'Offer', count: 2, color: 'bg-green-500' },
    { status: 'Rejected', count: 6, color: 'bg-red-500' },
    { status: 'Saved', count: 2, color: 'bg-purple-500' },
  ];

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
                      <span>{item.status}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <Progress value={(item.count / 24) * 100} className={item.color} />
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
              {recentJobs.map((job) => (
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
                      {job.status === 'Applied' && <Clock className="h-4 w-4 text-blue-500" />}
                      {job.status === 'Interview Scheduled' && <Calendar className="h-4 w-4 text-amber-500" />}
                      {job.status === 'Offer Received' && <Award className="h-4 w-4 text-green-500" />}
                      {job.status === 'Rejected' && <X className="h-4 w-4 text-red-500" />}
                      {job.status === 'Saved' && <CheckCircle className="h-4 w-4 text-purple-500" />}
                    </div>
                  </div>
                </div>
              ))}
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
