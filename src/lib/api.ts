// This file would be used for making API calls to your backend service
// that connects to MongoDB

import { JobApplication, JobPortalCredential, UserSettings, UserProfile } from '@/utils/types';
import { useAuth } from '../context/AuthContext';

// Mock implementation for client-side usage
// In a real app, you would make API calls to your backend

const API_URL = 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }
  return token;
};

// Helper function to handle token refresh when needed
const refreshTokenIfNeeded = async (error: any) => {
  // Check if error is due to invalid token
  if (error.message === 'Token is not valid' || error.response?.data?.error === 'Token is not valid') {
    // Get the auth context
    const auth = window.authContext;
    if (auth && auth.refreshToken) {
      // Try to refresh the token
      const newToken = await auth.refreshToken();
      if (newToken) {
        return newToken;
      }
    }
    // If refresh failed or auth context not available, throw authentication error
    throw new Error('Authentication required. Please log in again.');
  }
  // If error is not token-related, rethrow it
  throw error;
};

// Job Applications API
export async function getJobApplications(): Promise<JobApplication[]> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/jobs`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch job applications');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching job applications:', error);
    try {
      // Try to refresh token if needed
      const newToken = await refreshTokenIfNeeded(error);
      if (newToken) {
        // Retry the request with new token
        const response = await fetch(`${API_URL}/jobs`, {
          headers: {
            'x-auth-token': newToken
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch job applications');
        }
        
        return response.json();
      }
    } catch (refreshError) {
      throw refreshError;
    }
    throw error;
  }
}

export async function addJobApplication(jobApplication: JobApplication): Promise<JobApplication> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(jobApplication),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add job application');
    }
    return response.json();
  } catch (error) {
    console.error('Error adding job application:', error);
    try {
      // Try to refresh token if needed
      const newToken = await refreshTokenIfNeeded(error);
      if (newToken) {
        // Retry the request with new token
        const response = await fetch(`${API_URL}/jobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': newToken
          },
          body: JSON.stringify(jobApplication),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add job application');
        }
        
        return response.json();
      }
    } catch (refreshError) {
      throw refreshError;
    }
    throw error;
  }
}

export async function updateJobApplication(id: string, jobApplication: JobApplication): Promise<JobApplication> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/jobs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(jobApplication),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update job application');
    }
    return response.json();
  } catch (error) {
    console.error('Error updating job application:', error);
    try {
      // Try to refresh token if needed
      const newToken = await refreshTokenIfNeeded(error);
      if (newToken) {
        // Retry the request with new token
        const response = await fetch(`${API_URL}/jobs/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': newToken
          },
          body: JSON.stringify(jobApplication),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update job application');
        }
        
        return response.json();
      }
    } catch (refreshError) {
      throw refreshError;
    }
    throw error;
  }
}

export async function deleteJobApplication(id: string): Promise<void> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/jobs/${id}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token
      }
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete job application');
    }
  } catch (error) {
    console.error('Error deleting job application:', error);
    try {
      // Try to refresh token if needed
      const newToken = await refreshTokenIfNeeded(error);
      if (newToken) {
        // Retry the request with new token
        const response = await fetch(`${API_URL}/jobs/${id}`, {
          method: 'DELETE',
          headers: {
            'x-auth-token': newToken
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete job application');
        }
      }
    } catch (refreshError) {
      throw refreshError;
    }
    throw error;
  }
}

// Job Portal Credentials API
export async function getJobPortalCredentials(): Promise<JobPortalCredential[]> {
  try {
    const token = await getAuthToken();
    console.log('Fetching credentials with token:', token.substring(0, 10) + '...');
    
    const response = await fetch(`${API_URL}/credentials`, {
      headers: {
        'x-auth-token': token
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from server:', errorData);
      throw new Error(errorData.error || 'Failed to fetch credentials');
    }
    
    const data = await response.json();
    console.log(`Retrieved ${data.length} credentials from API`);
    
    // Ensure the data is properly formatted
    const formattedData = data.map((cred: any) => ({
      _id: cred._id,
      userId: cred.userId,
      portalName: cred.portalName,
      username: cred.username,
      password: cred.password,
      url: cred.url || '',
      notes: cred.notes || '',
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt
    }));
    
    return formattedData;
  } catch (error) {
    console.error('Error fetching credentials:', error);
    try {
      // Try to refresh token if needed
      const newToken = await refreshTokenIfNeeded(error);
      if (newToken) {
        console.log('Token refreshed, retrying credential fetch');
        // Retry the request with new token
        const response = await fetch(`${API_URL}/credentials`, {
          headers: {
            'x-auth-token': newToken
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch credentials');
        }
        
        const data = await response.json();
        console.log(`Retrieved ${data.length} credentials after token refresh`);
        
        // Ensure the data is properly formatted
        const formattedData = data.map((cred: any) => ({
          _id: cred._id,
          userId: cred.userId,
          portalName: cred.portalName,
          username: cred.username,
          password: cred.password,
          url: cred.url || '',
          notes: cred.notes || '',
          createdAt: cred.createdAt,
          updatedAt: cred.updatedAt
        }));
        
        return formattedData;
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      throw refreshError;
    }
    throw error;
  }
}

export async function addJobPortalCredential(credential: JobPortalCredential): Promise<JobPortalCredential> {
  try {
    const token = await getAuthToken();
    console.log('Adding credential with token:', token.substring(0, 10) + '...');
    console.log('Credential data being sent:', { 
      ...credential, 
      password: credential.password ? '[REDACTED]' : '[EMPTY]' 
    });
    
    // Ensure all required fields are present and in the correct format
    if (!credential.portalName || !credential.username || !credential.password) {
      throw new Error('Portal name, username, and password are required');
    }
    
    // Format the credential object to match server expectations
    const formattedCredential = {
      portalName: credential.portalName,
      username: credential.username,
      password: credential.password,
      url: credential.url || '',
      notes: credential.notes || ''
    };
    
    const response = await fetch(`${API_URL}/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(formattedCredential)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from server:', errorData);
      throw new Error(errorData.error || 'Failed to add credential');
    }
    
    const data = await response.json();
    console.log('Credential added successfully:', { ...data, password: '[REDACTED]' });
    return data;
  } catch (error) {
    console.error('Error adding credential:', error);
    try {
      // Try to refresh token if needed
      const newToken = await refreshTokenIfNeeded(error);
      if (newToken) {
        // Format the credential object again to ensure consistency
        const formattedCredential = {
          portalName: credential.portalName,
          username: credential.username,
          password: credential.password,
          url: credential.url || '',
          notes: credential.notes || ''
        };
        
        // Retry the request with new token
        const response = await fetch(`${API_URL}/credentials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': newToken
          },
          body: JSON.stringify(formattedCredential)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add credential');
        }
        
        return response.json();
      }
    } catch (refreshError) {
      throw refreshError;
    }
    throw error;
  }
}

export async function updateJobPortalCredential(id: string, credential: JobPortalCredential): Promise<JobPortalCredential> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/credentials/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(credential)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update credential');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating credential:', error);
    try {
      // Try to refresh token if needed
      const newToken = await refreshTokenIfNeeded(error);
      if (newToken) {
        // Retry the request with new token
        const response = await fetch(`${API_URL}/credentials/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': newToken
          },
          body: JSON.stringify(credential)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update credential');
        }
        
        return response.json();
      }
    } catch (refreshError) {
      throw refreshError;
    }
    throw error;
  }
}

export async function deleteJobPortalCredential(id: string): Promise<void> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/credentials/${id}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete credential');
    }
  } catch (error) {
    console.error('Error deleting credential:', error);
    try {
      // Try to refresh token if needed
      const newToken = await refreshTokenIfNeeded(error);
      if (newToken) {
        // Retry the request with new token
        const response = await fetch(`${API_URL}/credentials/${id}`, {
          method: 'DELETE',
          headers: {
            'x-auth-token': newToken
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete credential');
        }
      }
    } catch (refreshError) {
      throw refreshError;
    }
    throw error;
  }
}

// User Settings API
export async function getUserSettings(): Promise<UserSettings> {
  try {
    const token = await getAuthToken();
    console.log('Fetching user settings with token:', token.substring(0, 10) + '...');
    
    const response = await fetch(`${API_URL}/settings`, {
      headers: {
        'x-auth-token': token
      }
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to parse error message if possible
      let errorMessage = 'Failed to fetch settings';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Retrieved settings from API:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    
    // Return default settings on error
    return {
      userId: '',
      darkMode: false,
      emailNotifications: true,
      autoApplyPreferences: {
        jobTitles: [],
        locations: [],
        salaryRange: {
          min: 0,
          max: 0
        },
        excludeCompanies: [],
        includeRemote: true
      }
    };
  }
}

export async function updateUserSettings(settingsData: UserSettings): Promise<UserSettings> {
  try {
    const token = await getAuthToken();
    console.log('Updating user settings:', settingsData);
    
    const response = await fetch(`${API_URL}/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(settingsData)
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to parse error message if possible
      let errorMessage = 'Failed to update settings';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Settings updated successfully:', data);
    
    return data;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}

// User Profile API
export async function getUserProfile(): Promise<UserProfile> {
  try {
    const token = await getAuthToken();
    console.log('Fetching user profile with token:', token.substring(0, 10) + '...');
    
    const response = await fetch(`${API_URL}/profile`, {
      headers: {
        'x-auth-token': token
      }
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // If profile not found (404), return empty profile
      if (response.status === 404) {
        console.log('Profile not found, returning empty profile');
        return {
          name: '',
          email: '',
          title: '',
          skills: [],
          experience: [],
          education: []
        };
      }
      
      // Try to parse error message if possible
      let errorMessage = 'Failed to fetch profile';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Retrieved profile from API:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    
    // Return empty profile on error
    return {
      name: '',
      email: '',
      title: '',
      skills: [],
      experience: [],
      education: []
    };
  }
}

export async function updateUserProfile(profileData: UserProfile): Promise<UserProfile> {
  try {
    const token = await getAuthToken();
    console.log('Updating user profile:', profileData);
    
    const response = await fetch(`${API_URL}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(profileData)
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to parse error message if possible
      let errorMessage = 'Failed to update profile';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Profile updated successfully:', data);
    
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

export async function uploadResume(file: File): Promise<{ resumeUrl: string, resumeOriginalName: string }> {
  try {
    const token = await getAuthToken();
    console.log('Uploading resume:', file.name);
    
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await fetch(`${API_URL}/profile/resume`, {
      method: 'POST',
      headers: {
        'x-auth-token': token
        // Don't set Content-Type header when using FormData, browser will set it automatically with boundary
      },
      body: formData
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to parse error message if possible
      let errorMessage = 'Failed to upload resume';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Resume uploaded successfully:', data);
    
    return {
      resumeUrl: data.resumeUrl,
      resumeOriginalName: data.resumeOriginalName
    };
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw error;
  }
}

export async function deleteResume(): Promise<void> {
  try {
    const token = await getAuthToken();
    console.log('Deleting resume');
    
    const response = await fetch(`${API_URL}/profile/resume`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token
      }
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to parse error message if possible
      let errorMessage = 'Failed to delete resume';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    console.log('Resume deleted successfully');
  } catch (error) {
    console.error('Error deleting resume:', error);
    throw error;
  }
}

// Auto Apply API
export async function startAutoApplySession(searchCriteria: {
  jobTitles: string[];
  locations: string[];
  salaryRange: { min: number; max: number };
  excludeCompanies: string[];
  includeRemote: boolean;
}) {
  try {
    const token = await getAuthToken();
    console.log('Starting auto-apply session with criteria:', searchCriteria);
    
    // Fix the URL to match server route configuration
    const response = await fetch(`${API_URL}/auto-apply/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(searchCriteria)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to start auto-apply session';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Auto-apply session started:', data);
    
    return data;
  } catch (error) {
    console.error('Error starting auto-apply session:', error);
    throw error;
  }
}

export async function getAutoApplySessionStatus(sessionId: string) {
  try {
    const token = await getAuthToken();
    console.log('Getting auto-apply session status for session:', sessionId);
    
    // Fix the URL to match server route configuration
    const response = await fetch(`${API_URL}/auto-apply/status/${sessionId}`, {
      headers: {
        'x-auth-token': token
      }
    });

    if (!response.ok) {
      let errorMessage = 'Failed to get auto-apply session status';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting auto-apply session status:', error);
    throw error;
  }
}

export async function getAutoApplySessions() {
  try {
    const token = await getAuthToken();
    console.log('Getting all auto-apply sessions');
    
    // Fix the URL to match server route configuration
    const response = await fetch(`${API_URL}/auto-apply/sessions`, {
      headers: {
        'x-auth-token': token
      }
    });

    if (!response.ok) {
      let errorMessage = 'Failed to get auto-apply sessions';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting auto-apply sessions:', error);
    throw error;
  }
}

export async function stopAutoApplySession(sessionId: string) {
  try {
    const token = await getAuthToken();
    console.log('Stopping auto-apply session:', sessionId);
    
    // Fix the URL to match server route configuration
    const response = await fetch(`${API_URL}/auto-apply/stop/${sessionId}`, {
      method: 'POST',
      headers: {
        'x-auth-token': token
      }
    });

    if (!response.ok) {
      let errorMessage = 'Failed to stop auto-apply session';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error stopping auto-apply session:', error);
    throw error;
  }
}
