import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
        newSocket.emit('join-user-room', user.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      // Listen for call processing events
      newSocket.on('call-uploaded', (data) => {
        toast.success(`File uploaded: ${data.fileName}`);
      });

      newSocket.on('transcription-started', (data) => {
        toast.loading('Transcription started...', { id: `transcription-${data.callId}` });
      });

      newSocket.on('transcription-completed', (data) => {
        toast.success('Transcription completed!', { id: `transcription-${data.callId}` });
      });

      newSocket.on('transcription-failed', (data) => {
        toast.error(`Transcription failed: ${data.error}`, { id: `transcription-${data.callId}` });
      });

      newSocket.on('analysis-started', (data) => {
        toast.loading('Analysis started...', { id: `analysis-${data.callId}` });
      });

      newSocket.on('analysis-completed', (data) => {
        toast.success('Analysis completed!', { id: `analysis-${data.callId}` });
      });

      newSocket.on('analysis-failed', (data) => {
        toast.error(`Analysis failed: ${data.error}`, { id: `analysis-${data.callId}` });
      });

      newSocket.on('coaching-generation-started', (data) => {
        toast.loading('Generating coaching plan...', { id: `coaching-${data.callId}` });
      });

      newSocket.on('coaching-generated', (data) => {
        toast.success('Coaching plan ready!', { id: `coaching-${data.callId}` });
      });

      newSocket.on('coaching-generation-failed', (data) => {
        toast.error(`Coaching generation failed: ${data.error}`, { id: `coaching-${data.callId}` });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      // Clean up socket when user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  const joinCallRoom = (callId) => {
    if (socket && connected) {
      socket.emit('join-call-room', callId);
    }
  };

  const leaveCallRoom = (callId) => {
    if (socket && connected) {
      socket.emit('leave-call-room', callId);
    }
  };

  const value = {
    socket,
    connected,
    joinCallRoom,
    leaveCallRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
