
import { useState, useEffect } from 'react';
import { testConnection } from '@/lib/mongodb';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const MongoDBStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true);
        const connected = await testConnection();
        setIsConnected(connected);
      } catch (error) {
        console.error('Error checking MongoDB connection:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">MongoDB:</span>
      {isLoading ? (
        <Badge variant="outline" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Connecting...
        </Badge>
      ) : isConnected ? (
        <Badge variant="default" className="bg-green-500">Connected</Badge>
      ) : (
        <Badge variant="destructive">Disconnected</Badge>
      )}
    </div>
  );
};

export default MongoDBStatus;
