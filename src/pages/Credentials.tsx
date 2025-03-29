import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { slideFromTopAnimation, staggeredContainer } from '@/lib/transitions';
import { AlertCircle, Copy, Edit, Eye, EyeOff, Key, Link2, Plus, Search, Shield, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { JobPortalCredential } from '@/utils/types';
import { getJobPortalCredentials, addJobPortalCredential, updateJobPortalCredential, deleteJobPortalCredential } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface CredentialFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSubmit: (credential: JobPortalCredential) => void;
  credential: JobPortalCredential | null;
}

const CredentialFormDialog = ({ isOpen, setIsOpen, onSubmit, credential }: CredentialFormDialogProps) => {
  const [formData, setFormData] = useState<JobPortalCredential>({
    portalName: '',
    username: '',
    password: '',
    url: '',
    notes: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update form when credential is set for editing
  useEffect(() => {
    if (credential) {
      setFormData(credential);
    } else {
      setFormData({
        portalName: '',
        username: '',
        password: '',
        url: '',
        notes: '',
      });
    }
    // Clear any previous errors
    setFormErrors({});
  }, [credential]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.portalName.trim()) {
      errors.portalName = 'Portal name is required';
    }
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!formData.password && !credential) {
      // Only require password for new credentials
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      
      // Reset form
      setFormData({
        portalName: '',
        username: '',
        password: '',
        url: '',
        notes: '',
      });
      setShowPassword(false);
    } catch (error) {
      console.error('Form submission error:', error);
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{credential ? 'Edit Credential' : 'Add New Credential'}</DialogTitle>
          <DialogDescription>
            {credential 
              ? 'Update login details for this job portal' 
              : 'Add login details for a new job portal'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="portalName">Portal Name *</Label>
            <Input
              id="portalName"
              name="portalName"
              placeholder="e.g. LinkedIn, Indeed"
              value={formData.portalName}
              onChange={handleChange}
              className={formErrors.portalName ? 'border-red-500' : ''}
              required
            />
            {formErrors.portalName && (
              <p className="text-sm text-red-500">{formErrors.portalName}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Username / Email *</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="your.email@example.com"
              value={formData.username}
              onChange={handleChange}
              className={formErrors.username ? 'border-red-500' : ''}
              required
            />
            {formErrors.username && (
              <p className="text-sm text-red-500">{formErrors.username}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password {credential ? '' : '*'}</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={credential ? "Leave blank to keep current password" : "Enter password"}
                value={formData.password}
                onChange={handleChange}
                className={formErrors.password ? 'border-red-500 pr-10' : 'pr-10'}
                required={!credential}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formErrors.password && (
              <p className="text-sm text-red-500">{formErrors.password}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="url">Website URL (Optional)</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              name="notes"
              placeholder="Any additional information"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : credential ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Credentials = () => {
  const [credentials, setCredentials] = useState<JobPortalCredential[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCredential, setCurrentCredential] = useState<JobPortalCredential | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // Fetch credentials when component mounts or auth state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User is authenticated, fetching credentials');
      fetchCredentials();
    } else {
      console.log('User is not authenticated, clearing credentials');
      setCredentials([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchCredentials = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view your saved credentials",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching credentials from server...');
      const data = await getJobPortalCredentials();
      console.log(`Retrieved ${data.length} credentials from server`);
      setCredentials(data);
      
      if (data.length === 0) {
        toast({
          title: "No Credentials Found",
          description: "You haven't saved any credentials yet. Add your first one!",
        });
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
      
      let errorMessage = "Failed to fetch credentials";
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          errorMessage = "Authentication failed. Please log in again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Clear credentials on error
      setCredentials([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCredentials = credentials.filter(cred => 
    cred.portalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cred.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text: string, type: 'username' | 'password') => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${type === 'username' ? 'Username' : 'Password'} copied!`,
      description: "Text has been copied to clipboard",
      duration: 3000,
    });
  };

  const handleAddCredential = async (credential: JobPortalCredential) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save credentials",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      if (currentCredential && currentCredential._id) {
        console.log('Updating credential with ID:', currentCredential._id);
        const updatedCredential = await updateJobPortalCredential(
          currentCredential._id, 
          credential
        );
        setCredentials(credentials.map(cred => 
          cred._id === currentCredential._id ? updatedCredential : cred
        ));
        toast({
          title: "Success",
          description: "Credential updated successfully",
        });
      } else {
        console.log('Adding new credential for portal:', credential.portalName);
        const newCredential = await addJobPortalCredential(credential);
        setCredentials([...credentials, newCredential]);
        toast({
          title: "Success",
          description: "Credential added successfully",
        });
      }
      
      setCurrentCredential(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving credential:', error);
      
      let errorMessage = "Failed to save credential";
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (error.message.includes('required')) {
          errorMessage = error.message; // Use validation error messages directly
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete credentials",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteJobPortalCredential(id);
      setCredentials(credentials.filter(cred => cred._id !== id));
      toast({
        title: "Success",
        description: "Credential deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting credential:', error);
      toast({
        title: "Error",
        description: "Failed to delete credential",
        variant: "destructive",
      });
    }
  };

  const handleEditCredential = (credential: JobPortalCredential) => {
    setCurrentCredential(credential);
    setIsDialogOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <motion.div
          variants={slideFromTopAnimation}
          initial="hidden"
          animate="visible"
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Saved Credentials</h1>
            <p className="text-muted-foreground">Securely manage your job portal login information</p>
          </div>
        </motion.div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to view and manage your saved credentials.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CredentialFormDialog 
        isOpen={isDialogOpen} 
        setIsOpen={setIsDialogOpen} 
        onSubmit={handleAddCredential} 
        credential={currentCredential}
      />
      
      <motion.div
        variants={slideFromTopAnimation}
        initial="hidden"
        animate="visible"
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved Credentials</h1>
          <p className="text-muted-foreground">Securely manage your job portal login information</p>
        </div>
        
        <Button onClick={() => {
          setCurrentCredential(null);
          setIsDialogOpen(true);
        }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Credential
        </Button>
      </motion.div>
      
      <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Security Notice</AlertTitle>
        <AlertDescription>
          Your credentials are encrypted before being stored. We never have access to your actual passwords.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Saved Job Portal Credentials</CardTitle>
          <CardDescription>
            Your login information for various job application portals
          </CardDescription>
          <div className="mt-2 relative">
            <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search credentials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading credentials...</div>
          ) : (
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list">
                {filteredCredentials.length > 0 ? (
                  <motion.div
                    variants={staggeredContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {filteredCredentials.map((credential) => (
                      <motion.div
                        key={credential._id}
                        variants={slideFromTopAnimation}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <Key className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="font-medium">{credential.portalName}</h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditCredential(credential)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteCredential(credential._id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Username</span>
                            <div className="flex items-center gap-1">
                              <span className="text-sm">{credential.username}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(credential.username, 'username')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Password</span>
                            <div className="flex items-center gap-1">
                              <span className="text-sm">
                                {showPassword[credential._id!] ? credential.password : '••••••••••'}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => togglePasswordVisibility(credential._id!)}
                              >
                                {showPassword[credential._id!] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(credential.password, 'password')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {credential.url && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Website</span>
                              <a
                                href={credential.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary flex items-center gap-1 hover:underline"
                              >
                                {credential.url.replace(/^https?:\/\//, '')}
                                <Link2 className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                          
                          {credential.notes && (
                            <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                              {credential.notes}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <Shield className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No credentials found</h3>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">
                      {searchQuery
                        ? `No credentials matching "${searchQuery}" found`
                        : "Start adding job portal credentials"}
                    </p>
                    <Button onClick={() => {
                      setCurrentCredential(null);
                      setIsDialogOpen(true);
                    }}>
                      Add your first credential
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="table">
                {filteredCredentials.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Portal</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Password</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCredentials.map((credential) => (
                          <TableRow key={credential._id}>
                            <TableCell className="font-medium">
                              {credential.url ? (
                                <a
                                  href={credential.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 hover:underline"
                                >
                                  {credential.portalName}
                                  <Link2 className="h-3 w-3" />
                                </a>
                              ) : (
                                credential.portalName
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span>{credential.username}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(credential.username, 'username')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span>
                                  {showPassword[credential._id!] ? credential.password : '••••••••••'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => togglePasswordVisibility(credential._id!)}
                                >
                                  {showPassword[credential._id!] ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(credential.password, 'password')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditCredential(credential)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleDeleteCredential(credential._id!)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <Shield className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No credentials found</h3>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">
                      {searchQuery
                        ? `No credentials matching "${searchQuery}" found`
                        : "Start adding job portal credentials"}
                    </p>
                    <Button onClick={() => {
                      setCurrentCredential(null);
                      setIsDialogOpen(true);
                    }}>
                      Add your first credential
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Credentials;
