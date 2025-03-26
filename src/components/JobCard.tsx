
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { slideFromBottomAnimation } from '@/lib/transitions';
import { Building, Calendar, MapPin, DollarSign, MoreVertical, Edit, Trash2, FileText, Check, BarChart, AlertTriangle, Award } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { JobApplication } from '@/utils/types';

interface JobCardProps {
  job: JobApplication;
  onEdit: (job: JobApplication) => void;
  onDelete: (id: string) => void;
}

const JobCard = ({ job, onEdit, onDelete }: JobCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'Interview Scheduled':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'Offer Received':
        return 'bg-green-500 hover:bg-green-600';
      case 'Rejected':
        return 'bg-red-500 hover:bg-red-600';
      case 'Saved':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };
  
  const getPredictionColor = (prediction: number | undefined) => {
    if (!prediction) return 'text-gray-500';
    if (prediction >= 80) return 'text-green-500';
    if (prediction >= 50) return 'text-amber-500';
    return 'text-red-500';
  };
  
  const getPredictionIcon = (prediction: number | undefined) => {
    if (!prediction) return <BarChart className="h-4 w-4" />;
    if (prediction >= 80) return <Check className="h-4 w-4" />;
    if (prediction >= 50) return <BarChart className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };
  
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <motion.div variants={slideFromBottomAnimation}>
        <Card className="h-full">
          <CardContent className="p-5 h-full flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{job.jobTitle}</h3>
                <div className="flex items-center text-muted-foreground mt-1">
                  <Building className="h-4 w-4 mr-1" />
                  <span>{job.companyName}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge className={`${getStatusColor(job.status)} text-white`}>
                  {job.status}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(job)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsOpen(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(job._id!)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                <span>{formatDate(job.applicationDate)}</span>
              </div>
              
              {job.location && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
              )}
              
              {job.salary && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                  <span>{job.salary}</span>
                </div>
              )}
              
              {job.successPrediction !== undefined && (
                <div className={`flex items-center text-sm ${getPredictionColor(job.successPrediction)}`}>
                  {getPredictionIcon(job.successPrediction)}
                  <span className="ml-1">{job.successPrediction}% match</span>
                </div>
              )}
            </div>
            
            {job.notes && (
              <p className="text-sm line-clamp-2 text-muted-foreground mt-auto">
                {job.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{job.jobTitle}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center text-foreground mt-1">
                <Building className="h-4 w-4 mr-1" />
                <span>{job.companyName}</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-between items-center">
            <Badge className={`${getStatusColor(job.status)} text-white`}>
              {job.status}
            </Badge>
            
            {job.successPrediction !== undefined && (
              <Badge variant="outline" className={`flex items-center ${getPredictionColor(job.successPrediction)}`}>
                {getPredictionIcon(job.successPrediction)}
                <span className="ml-1">{job.successPrediction}% match</span>
              </Badge>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Applied on {formatDate(job.applicationDate)}</span>
            </div>
            
            {job.location && (
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{job.location}</span>
              </div>
            )}
            
            {job.salary && (
              <div className="flex items-center text-sm">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{job.salary}</span>
              </div>
            )}
            
            {job.contactPerson && (
              <div className="flex items-center text-sm">
                <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Contact: {job.contactPerson}</span>
                {job.contactEmail && (
                  <span className="ml-1 text-primary">({job.contactEmail})</span>
                )}
              </div>
            )}
          </div>
          
          {job.notes && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {job.notes}
              </p>
            </div>
          )}
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onEdit(job)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => {
              onDelete(job._id!);
              setIsOpen(false);
            }}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JobCard;
