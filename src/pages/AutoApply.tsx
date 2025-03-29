import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MongoDBStatus } from '@/components';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  startAutoApplySession, 
  getAutoApplySessionStatus, 
  getAutoApplySessions, 
  stopAutoApplySession,
  getUserSettings
} from '@/lib/api';
import { 
  Search, 
  Briefcase, 
  Clock, 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  Building,
  MapPin,
  Calendar,
  ArrowRight
} from 'lucide-react';

// Define types for auto-apply sessions
interface AutoApplyJob {
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  status: 'found' | 'applied' | 'skipped' | 'error';
  foundAt: Date;
  updatedAt?: Date;
}

interface AutoApplyLog {
  time: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AutoApplySession {
  _id: string;
  userId: string;
  status: 'running' | 'completed' | 'stopped' | 'error';
  jobTitles: string[];
  locations: string[];
  salaryRange: {
    min: number;
    max: number;
  };
  excludeCompanies: string[];
  includeRemote: boolean;
  jobsFound: number;
  applicationsSubmitted: number;
  applicationsSkipped: number;
  startTime: Date;
  lastUpdateTime: Date;
  logs: AutoApplyLog[];
  jobs: AutoApplyJob[];
}

const AutoApply = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  // State for job search criteria
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState<number>(0);
  const [maxSalary, setMaxSalary] = useState<number>(0);
  const [excludeCompanies, setExcludeCompanies] = useState<string[]>([]);
  const [includeRemote, setIncludeRemote] = useState<boolean>(true);
  
  // State for auto-apply sessions
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeSession, setActiveSession] = useState<AutoApplySession | null>(null);
  const [pastSessions, setPastSessions] = useState<AutoApplySession[]>([]);
  const [isStartingSession, setIsStartingSession] = useState<boolean>(false);
  const [isStoppingSession, setIsStoppingSession] = useState<boolean>(false);
  
  // Ref for polling interval
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load user settings when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      loadUserSettings();
      loadSessions();
    }
    
    return () => {
      // Clean up polling interval on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isAuthenticated]);
  
  // Start polling for active session updates
  useEffect(() => {
    if (activeSession && activeSession.status === 'running') {
      startPolling(activeSession._id);
    } else if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, [activeSession]);
  
  // Load user settings
  const loadUserSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await getUserSettings();
      
      if (settings && settings.autoApplyPreferences) {
        const { jobTitles, locations, salaryRange, excludeCompanies, includeRemote } = settings.autoApplyPreferences;
        
        setJobTitles(jobTitles || []);
        setLocations(locations || []);
        setMinSalary(salaryRange?.min || 0);
        setMaxSalary(salaryRange?.max || 0);
        setExcludeCompanies(excludeCompanies || []);
        setIncludeRemote(includeRemote !== undefined ? includeRemote : true);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load auto-apply sessions
  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const sessions = await getAutoApplySessions();
      
      if (sessions && sessions.length > 0) {
        // Sort sessions by start time (newest first)
        const sortedSessions = [...sessions].sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        
        // Check if there's an active (running) session
        const runningSession = sortedSessions.find(session => session.status === 'running');
        
        if (runningSession) {
          setActiveSession(runningSession);
          startPolling(runningSession._id);
        } else {
          setActiveSession(null);
        }
        
        setPastSessions(sortedSessions.filter(session => session.status !== 'running'));
      } else {
        setActiveSession(null);
        setPastSessions([]);
      }
    } catch (error) {
      console.error('Error loading auto-apply sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your auto-apply sessions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start polling for session updates
  const startPolling = (sessionId: string) => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const updatedSession = await getAutoApplySessionStatus(sessionId);
        
        if (updatedSession) {
          setActiveSession(updatedSession);
          
          // If session is no longer running, stop polling and refresh sessions
          if (updatedSession.status !== 'running') {
            clearInterval(pollingIntervalRef.current!);
            pollingIntervalRef.current = null;
            loadSessions();
          }
        }
      } catch (error) {
        console.error('Error polling session status:', error);
      }
    }, 5000);
  };
  
  // Start a new auto-apply session
  const startNewSession = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to use the auto-apply feature.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate inputs
    if (!jobTitles.length || !locations.length) {
      toast({
        title: 'Missing Information',
        description: 'Please specify at least one job title and location.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsStartingSession(true);
      
      // Log the request details for debugging
      console.log('Auto-apply request details:', {
        jobTitles,
        locations,
        salaryRange: { min: minSalary, max: maxSalary },
        excludeCompanies,
        includeRemote
      });
      
      const result = await startAutoApplySession({
        jobTitles,
        locations,
        salaryRange: { min: minSalary, max: maxSalary },
        excludeCompanies,
        includeRemote
      });
      
      toast({
        title: 'Auto-Apply Session Started',
        description: 'Your automated job search and application process has begun.',
      });
      
      // Refresh sessions to get the new active session
      await loadSessions();
      
    } catch (error) {
      console.error('Error starting auto-apply session:', error);
      
      let errorMessage = 'Failed to start auto-apply session';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Show a more detailed error message
      toast({
        title: 'Error Starting Auto-Apply Session',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsStartingSession(false);
    }
  };
  
  // Stop the active auto-apply session
  const stopActiveSession = async () => {
    if (!activeSession) return;
    
    try {
      setIsStoppingSession(true);
      
      await stopAutoApplySession(activeSession._id);
      
      toast({
        title: 'Auto-Apply Session Stopped',
        description: 'Your automated job application process has been stopped.',
      });
      
      // Refresh sessions
      await loadSessions();
      
    } catch (error) {
      console.error('Error stopping auto-apply session:', error);
      
      let errorMessage = 'Failed to stop auto-apply session';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsStoppingSession(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'stopped':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'applied':
        return 'bg-green-500';
      case 'skipped':
        return 'bg-yellow-500';
      case 'found':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Get log icon based on type
  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'info':
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };
  
  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auto Apply</h1>
          <p className="text-muted-foreground">
            Automate your job application process
          </p>
        </div>
        <MongoDBStatus />
      </div>

      {!isAuthenticated && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to use the auto-apply feature.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="search">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Search Jobs
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Briefcase className="h-4 w-4 mr-2" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Search Criteria</CardTitle>
              <CardDescription>
                Set your job preferences and search criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitles">Target Job Titles (comma separated)</Label>
                <Textarea
                  id="jobTitles"
                  value={jobTitles.join(', ')}
                  onChange={(e) => setJobTitles(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="e.g. Frontend Developer, Web Developer"
                  disabled={isLoading || !!activeSession}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="locations">Preferred Locations (comma separated)</Label>
                <Textarea
                  id="locations"
                  value={locations.join(', ')}
                  onChange={(e) => setLocations(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="e.g. New York, San Francisco, Remote"
                  disabled={isLoading || !!activeSession}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minSalary">Minimum Salary</Label>
                  <Input
                    id="minSalary"
                    type="number"
                    value={minSalary}
                    onChange={(e) => setMinSalary(parseInt(e.target.value, 10) || 0)}
                    disabled={isLoading || !!activeSession}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxSalary">Maximum Salary</Label>
                  <Input
                    id="maxSalary"
                    type="number"
                    value={maxSalary}
                    onChange={(e) => setMaxSalary(parseInt(e.target.value, 10) || 0)}
                    disabled={isLoading || !!activeSession}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="excludeCompanies">Companies to Exclude (comma separated)</Label>
                <Input
                  id="excludeCompanies"
                  value={excludeCompanies.join(', ')}
                  onChange={(e) => setExcludeCompanies(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="e.g. Company A, Company B"
                  disabled={isLoading || !!activeSession}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeRemote"
                  checked={includeRemote}
                  onCheckedChange={setIncludeRemote}
                  disabled={isLoading || !!activeSession}
                />
                <Label htmlFor="includeRemote">Include remote positions</Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {activeSession ? (
                <div className="w-full">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Active Session In Progress</AlertTitle>
                    <AlertDescription>
                      You have an active auto-apply session running. Please stop it before starting a new one.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <Button 
                  onClick={startNewSession} 
                  disabled={isLoading || isStartingSession || !isAuthenticated}
                  className="w-full"
                >
                  {isStartingSession ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Auto-Apply
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="automation" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Active Automation</CardTitle>
                  <CardDescription>
                    Monitor your current auto-apply session
                  </CardDescription>
                </div>
                {activeSession && (
                  <Badge className={`${getStatusBadgeColor(activeSession.status)} text-white`}>
                    {activeSession.status.toUpperCase()}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activeSession ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <h3 className="text-sm font-medium text-muted-foreground">Jobs Found</h3>
                      <p className="text-2xl font-bold">{activeSession.jobsFound}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <h3 className="text-sm font-medium text-muted-foreground">Applications Submitted</h3>
                      <p className="text-2xl font-bold">{activeSession.applicationsSubmitted}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <h3 className="text-sm font-medium text-muted-foreground">Applications Skipped</h3>
                      <p className="text-2xl font-bold">{activeSession.applicationsSkipped}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Search Criteria</h3>
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Job Titles: {activeSession.jobTitles.join(', ')}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Locations: {activeSession.locations.join(', ')}</span>
                      </div>
                      {activeSession.excludeCompanies.length > 0 && (
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">Excluding: {activeSession.excludeCompanies.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Recent Activity</h3>
                      <span className="text-xs text-muted-foreground">
                        Last updated: {formatDate(activeSession.lastUpdateTime)}
                      </span>
                    </div>
                    <div className="bg-muted rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                      {activeSession.logs.slice().reverse().map((log, index) => (
                        <div key={index} className="flex items-start space-x-2 text-sm">
                          {getLogIcon(log.type)}
                          <div>
                            <span className="text-xs text-muted-foreground">{formatDate(log.time)}</span>
                            <p>{log.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {activeSession.status === 'running' && (
                    <Button 
                      variant="destructive" 
                      onClick={stopActiveSession} 
                      disabled={isStoppingSession}
                      className="w-full"
                    >
                      {isStoppingSession ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Stopping...
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Stop Auto-Apply
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active automation session</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Go to the Search tab to start a new auto-apply session
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {activeSession && activeSession.jobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Found Jobs</CardTitle>
                <CardDescription>
                  Jobs found during the current auto-apply session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeSession.jobs.slice().reverse().map((job, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                        </div>
                        <Badge className={`${getStatusBadgeColor(job.status)} text-white`}>
                          {job.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Source: {job.source}</span>
                        <span>Found: {formatDate(job.foundAt)}</span>
                      </div>
                      <a 
                        href={job.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline flex items-center"
                      >
                        View Job <ArrowRight className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Apply History</CardTitle>
              <CardDescription>
                View your past automated application sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pastSessions.length > 0 ? (
                <div className="space-y-4">
                  {pastSessions.map((session, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-medium">Session {session._id.substring(0, 8)}</h3>
                            <Badge className={`ml-2 ${getStatusBadgeColor(session.status)} text-white`}>
                              {session.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(session.startTime)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{session.applicationsSubmitted} Applied</p>
                          <p className="text-xs text-muted-foreground">{session.jobsFound} Jobs Found</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="truncate">{session.jobTitles.join(', ')}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="truncate">{session.locations.join(', ')}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Duration: {
                          Math.round((new Date(session.lastUpdateTime).getTime() - new Date(session.startTime).getTime()) / 60000)
                        } minutes</span>
                        <span>{session.logs.length} log entries</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No auto-apply history found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start your first auto-apply session to see results here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoApply;
