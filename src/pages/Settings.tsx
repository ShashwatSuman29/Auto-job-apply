import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/context/ThemeContext';
import { slideFromTopAnimation } from '@/lib/transitions';
import { Bell, User, Cog, Mail, Moon, Sun, Upload, Trash2, Palette, ChevronRight, Loader2 } from 'lucide-react';
import { UserSettings, UserProfile } from '@/utils/types';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, updateUserProfile, uploadResume, deleteResume, updateUserSettings } from '@/lib/api';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    title: '',
    skills: [],
    experience: [],
    education: [],
  });
  
  const [settings, setSettings] = useState<UserSettings>({
    _id: '',
    userId: '',
    darkMode: theme === 'dark',
    emailNotifications: true,
    autoApplyPreferences: {
      jobTitles: ['Frontend Developer', 'UI Engineer', 'Web Developer'],
      locations: ['San Francisco', 'Remote'],
      salaryRange: {
        min: 80000,
        max: 150000,
      },
      excludeCompanies: ['TechGiant Inc'],
      includeRemote: true,
    },
    resumeUrl: '',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isSettingsUpdating, setIsSettingsUpdating] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [isResumeUploading, setIsResumeUploading] = useState(false);
  
  // Fetch user profile and settings when component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);
  
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching user profile...');
      
      const profileData = await getUserProfile();
      console.log('Profile data:', profileData);
      
      if (profileData) {
        setProfile(profileData);
      }
      
      // TODO: Fetch user settings when that API is implemented
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to update your profile",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsProfileUpdating(true);
      
      // Ensure required fields are filled
      if (!profile.name || !profile.email) {
        toast({
          title: "Missing Information",
          description: "Name and email are required",
          variant: "destructive",
        });
        return;
      }
      
      const updatedProfile = await updateUserProfile(profile);
      setProfile(updatedProfile);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      
      let errorMessage = "Failed to update profile";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProfileUpdating(false);
    }
  };
  
  const updateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved",
    });
  };
  
  const updatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully",
    });
  };
  
  const handleThemeToggle = () => {
    toggleTheme();
    setSettings(prev => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsResumeUploading(true);
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Resume file must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!allowedTypes.includes(fileExt)) {
        toast({
          title: "Invalid File Type",
          description: "Only PDF, DOC, DOCX, and TXT files are allowed",
          variant: "destructive",
        });
        return;
      }
      
      const result = await uploadResume(file);
      
      setProfile(prev => ({
        ...prev,
        resumeUrl: result.resumeUrl,
        resumeOriginalName: result.resumeOriginalName
      }));
      
      toast({
        title: "Resume Uploaded",
        description: "Your resume has been successfully uploaded",
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      
      let errorMessage = "Failed to upload resume";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsResumeUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleDeleteResume = async () => {
    try {
      setIsResumeUploading(true);
      
      await deleteResume();
      
      setProfile(prev => ({
        ...prev,
        resumeUrl: undefined,
        resumeOriginalName: undefined
      }));
      
      toast({
        title: "Resume Deleted",
        description: "Your resume has been successfully deleted",
      });
    } catch (error) {
      console.error('Error deleting resume:', error);
      
      let errorMessage = "Failed to delete resume";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsResumeUploading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your profile...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <motion.div
        variants={slideFromTopAnimation}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </motion.div>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full md:w-fit">
          <TabsTrigger value="profile" className="flex gap-2 items-center">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex gap-2 items-center">
            <Cog className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex gap-2 items-center">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex gap-2 items-center">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and career details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={updateProfile} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 md:items-center">
                  <div className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                    {profile.profilePictureUrl ? (
                      <img 
                        src={profile.profilePictureUrl} 
                        alt={profile.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-muted-foreground" />
                    )}
                    
                    <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1 flex-1">
                    <h3 className="font-medium text-lg">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground">{profile.title}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Professional Title</Label>
                    <Input
                      id="title"
                      value={profile.title || ''}
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="resume">Resume</Label>
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        id="resume"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.txt"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-muted-foreground"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isResumeUploading}
                      >
                        {isResumeUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {profile.resumeUrl ? 'Replace current resume' : 'Upload resume'}
                          </>
                        )}
                      </Button>
                    </div>
                    {profile.resumeUrl && profile.resumeOriginalName && (
                      <div className="flex items-center justify-between text-sm mt-2 p-2 border rounded bg-muted">
                        <span className="text-muted-foreground truncate">{profile.resumeOriginalName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={handleDeleteResume}
                          disabled={isResumeUploading}
                        >
                          {isResumeUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma separated)</Label>
                  <Textarea
                    id="skills"
                    value={profile.skills?.join(', ') || ''}
                    onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()) })}
                    placeholder="React, JavaScript, TypeScript..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience</Label>
                  <Textarea
                    id="experience"
                    value={profile.experience?.join('\n') || ''}
                    onChange={(e) => setProfile({ ...profile, experience: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                    placeholder="Job title at Company (Year-Year)"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Textarea
                    id="education"
                    value={profile.education?.join('\n') || ''}
                    onChange={(e) => setProfile({ ...profile, education: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                    placeholder="Degree, Institution (Year-Year)"
                    rows={3}
                  />
                </div>
                
                <Button 
                  type="submit"
                  disabled={isProfileUpdating}
                >
                  {isProfileUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account details and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <form onSubmit={updateSettings} className="space-y-4">
                <h3 className="text-lg font-medium">Auto Apply Preferences</h3>
                <div className="space-y-2">
                  <Label htmlFor="jobTitles">Target Job Titles (comma separated)</Label>
                  <Textarea
                    id="jobTitles"
                    value={settings.autoApplyPreferences.jobTitles.join(', ')}
                    onChange={(e) => setSettings({
                      ...settings,
                      autoApplyPreferences: {
                        ...settings.autoApplyPreferences,
                        jobTitles: e.target.value.split(',').map(s => s.trim()),
                      }
                    })}
                    placeholder="e.g. Frontend Developer, Web Developer"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="locations">Preferred Locations (comma separated)</Label>
                  <Textarea
                    id="locations"
                    value={settings.autoApplyPreferences.locations.join(', ')}
                    onChange={(e) => setSettings({
                      ...settings,
                      autoApplyPreferences: {
                        ...settings.autoApplyPreferences,
                        locations: e.target.value.split(',').map(s => s.trim()),
                      }
                    })}
                    placeholder="e.g. New York, San Francisco, Remote"
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minSalary">Minimum Salary</Label>
                    <Input
                      id="minSalary"
                      type="number"
                      value={settings.autoApplyPreferences.salaryRange.min}
                      onChange={(e) => setSettings({
                        ...settings,
                        autoApplyPreferences: {
                          ...settings.autoApplyPreferences,
                          salaryRange: {
                            ...settings.autoApplyPreferences.salaryRange,
                            min: parseInt(e.target.value, 10),
                          }
                        }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxSalary">Maximum Salary</Label>
                    <Input
                      id="maxSalary"
                      type="number"
                      value={settings.autoApplyPreferences.salaryRange.max}
                      onChange={(e) => setSettings({
                        ...settings,
                        autoApplyPreferences: {
                          ...settings.autoApplyPreferences,
                          salaryRange: {
                            ...settings.autoApplyPreferences.salaryRange,
                            max: parseInt(e.target.value, 10),
                          }
                        }
                      })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="excludeCompanies">Companies to Exclude (comma separated)</Label>
                  <Input
                    id="excludeCompanies"
                    value={settings.autoApplyPreferences.excludeCompanies.join(', ')}
                    onChange={(e) => setSettings({
                      ...settings,
                      autoApplyPreferences: {
                        ...settings.autoApplyPreferences,
                        excludeCompanies: e.target.value.split(',').map(s => s.trim()),
                      }
                    })}
                    placeholder="e.g. Company A, Company B"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeRemote"
                    checked={settings.autoApplyPreferences.includeRemote}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      autoApplyPreferences: {
                        ...settings.autoApplyPreferences,
                        includeRemote: checked,
                      }
                    })}
                  />
                  <Label htmlFor="includeRemote">Include remote positions</Label>
                </div>
                
                <Button type="submit">
                  Save Preferences
                </Button>
              </form>
              
              <Separator />
              
              <form onSubmit={updatePassword} className="space-y-4">
                <h3 className="text-lg font-medium">Change Password</h3>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                
                <Button type="submit">
                  Update Password
                </Button>
              </form>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all of your data
                </p>
                <Button variant="destructive" type="button">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Theme</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    <Label htmlFor="theme">{theme === 'dark' ? 'Dark' : 'Light'} Mode</Label>
                  </div>
                  <Switch
                    id="theme"
                    checked={theme === 'dark'}
                    onCheckedChange={handleThemeToggle}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors ${theme === 'light' ? 'border-primary' : ''}`}
                    onClick={() => {
                      if (theme !== 'light') toggleTheme();
                    }}
                  >
                    <div className="bg-white border rounded-md p-2 mb-2">
                      <div className="w-full h-2 bg-gray-200 rounded mb-1" />
                      <div className="w-2/3 h-2 bg-gray-200 rounded" />
                    </div>
                    <span className="text-sm font-medium">Light</span>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors ${theme === 'dark' ? 'border-primary' : ''}`}
                    onClick={() => {
                      if (theme !== 'dark') toggleTheme();
                    }}
                  >
                    <div className="bg-gray-900 border border-gray-700 rounded-md p-2 mb-2">
                      <div className="w-full h-2 bg-gray-700 rounded mb-1" />
                      <div className="w-2/3 h-2 bg-gray-700 rounded" />
                    </div>
                    <span className="text-sm font-medium">Dark</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Color Scheme</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Badge className="border border-primary block px-8 py-6 rounded-lg bg-primary/20 text-center">Default</Badge>
                  <Badge className="border block px-8 py-6 rounded-lg bg-purple-500/20 text-center" variant="outline">Purple</Badge>
                  <Badge className="border block px-8 py-6 rounded-lg bg-blue-500/20 text-center" variant="outline">Blue</Badge>
                  <Badge className="border block px-8 py-6 rounded-lg bg-green-500/20 text-center" variant="outline">Green</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={updateSettings} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your job applications
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        emailNotifications: checked,
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>Job Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive daily job recommendations based on your preferences
                      </p>
                    </div>
                    <Switch checked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>Interview Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive reminders before scheduled interviews
                      </p>
                    </div>
                    <Switch checked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>Application Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates when there's activity on your applications
                      </p>
                    </div>
                    <Switch checked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive promotional emails and newsletters
                      </p>
                    </div>
                    <Switch checked={false} />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Frequency</h3>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Email Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button type="submit">
                  Save Notification Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
