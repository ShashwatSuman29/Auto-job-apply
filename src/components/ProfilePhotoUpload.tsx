import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Camera, Loader2, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fileToBase64, validateImageFile, compressImage } from '@/lib/fileUpload';
import { useToast } from './ui/use-toast';
import axios from 'axios';

interface ProfilePhotoUploadProps {
  onPhotoUpdated?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showButton?: boolean;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({ 
  onPhotoUpdated, 
  size = 'md',
  showButton = false
}) => {
  const { user, token, updateProfilePhoto } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const API_URL = 'http://localhost:5000/api';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file, 5); // Allow up to 5MB
    if (!validation.valid) {
      toast({
        title: 'Invalid file',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);
      console.log('Starting profile photo upload process...');
      
      // Compress the image before uploading
      console.log('Compressing image...');
      const compressedImage = await compressImage(file, 800, 0.8);
      console.log('Image compressed, size:', Math.round(compressedImage.length / 1024), 'KB');
      
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      // Upload to server using the new endpoint
      console.log('Sending profile photo to server...');
      const response = await axios.put(
        `${API_URL}/profile/photo`,
        { photoUrl: compressedImage },
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Server response:', response.status);
      
      if (response.status !== 200) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      // Update local state
      await updateProfilePhoto(compressedImage);
      console.log('Profile photo updated in local state');
      
      toast({
        title: 'Success',
        description: 'Profile photo updated successfully',
      });
      
      if (onPhotoUpdated) {
        onPhotoUpdated();
      }
    } catch (error: any) {
      console.error('Error uploading profile photo:', error);
      let errorMessage = 'Failed to update profile photo. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        errorMessage = error.response.data?.error || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        errorMessage = 'No response received from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const buttonSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={user?.profilePhoto || ''} alt={user?.name || 'User'} />
          <AvatarFallback>
            {user?.name?.substring(0, 2) || <User className={iconSizeClasses[size]} />}
          </AvatarFallback>
        </Avatar>
        <Button 
          size="icon" 
          variant="secondary" 
          className={`absolute bottom-0 right-0 rounded-full ${buttonSizeClasses[size]}`}
          onClick={triggerFileInput}
          disabled={isUploading}
        >
          {isUploading ? 
            <Loader2 className={`${iconSizeClasses[size]} animate-spin`} /> : 
            <Camera className={iconSizeClasses[size]} />
          }
        </Button>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      
      {showButton && (
        <Button 
          variant="outline" 
          onClick={triggerFileInput}
          disabled={isUploading}
          className="mt-2"
          size="sm"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Change Photo'
          )}
        </Button>
      )}
    </div>
  );
};

export default ProfilePhotoUpload;
