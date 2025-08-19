import { useState } from 'react';
import PinEntry from './PinEntry';
import Chat from './Chat';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');

  const handleCorrectPin = (userName: string) => {
    setCurrentUser(userName);
    setIsAuthenticated(true);
  };

  if (isAuthenticated) {
    return <Chat currentUser={currentUser} />;
  }

  return <PinEntry onCorrectPin={handleCorrectPin} />;
};

export default Index;
