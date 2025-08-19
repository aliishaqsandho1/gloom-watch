import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Lock, Shield } from 'lucide-react';

interface PinEntryProps {
  onCorrectPin: (userName: string) => void;
}

const PinEntry = ({ onCorrectPin }: PinEntryProps) => {
  const [pin, setPin] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');

  const handleSubmit = () => {
    if (!selectedUser) {
      toast({
        title: "Authentication Required",
        description: "Please select your identity to continue",
        variant: "destructive"
      });
      return;
    }

    if (pin === '2269188') {
      toast({
        title: "Access Granted",
        description: `Welcome back, ${selectedUser}`,
      });
      onCorrectPin(selectedUser);
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid authentication code",
        variant: "destructive"
      });
      setPin('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-6">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="glass-effect border-border/20 shadow-elegant">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="bg-primary/10 p-6 rounded-2xl shadow-glow">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Private Access
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Secure Communication Portal
            </p>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* User Selection */}
            <div className="space-y-4">
            
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={selectedUser === 'Ali' ? 'default' : 'outline'}
                  onClick={() => setSelectedUser('Ali')}
                  className={`h-14 font-medium transition-all duration-300 ${
                    selectedUser === 'Ali' 
                      ? 'gradient-primary shadow-glow border-0' 
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                >
                  2
                </Button>
                <Button
                  variant={selectedUser === 'Amna' ? 'default' : 'outline'}
                  onClick={() => setSelectedUser('Amna')}
                  className={`h-14 font-medium transition-all duration-300 ${
                    selectedUser === 'Amna' 
                      ? 'gradient-primary shadow-glow border-0' 
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                >
                  1
                </Button>
              </div>
            </div>

            {/* PIN Entry */}
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter secure code"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  className="pl-12 h-14 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                  maxLength={7}
                />
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              className="w-full h-14 gradient-primary shadow-glow border-0 font-medium text-base transition-all duration-300 hover:shadow-glow"
              disabled={!pin || !selectedUser}
            >
              Access Portal
            </Button>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PinEntry;