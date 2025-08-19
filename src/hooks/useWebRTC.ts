import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface CallUser {
  id: string;
  name: string;
}

interface UseWebRTCProps {
  currentUser: string;
  onCallEnd?: () => void;
}

export const useWebRTC = ({ currentUser, onCallEnd }: UseWebRTCProps) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [incomingCall, setIncomingCall] = useState<{ from: string; roomId: string; isVideo: boolean } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef<string>('');
  const channelRef = useRef<any>(null);
  const callStartTimeRef = useRef<number>(0);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // ICE servers for WebRTC (using more reliable STUN servers)
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ];

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const peerConnection = new RTCPeerConnection({ 
      iceServers,
      iceCandidatePoolSize: 10
    });
    peerConnectionRef.current = peerConnection;

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      console.log('ICE candidate generated:', event.candidate);
      if (event.candidate && roomIdRef.current) {
        const chatPartner = currentUser === 'Ali' ? 'Amna' : 'Ali';
        supabase.from('call_signals').insert({
          room_id: roomIdRef.current,
          sender: currentUser,
          receiver: chatPartner,
          signal_type: 'ice-candidate',
          signal_data: event.candidate.toJSON() as any
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        console.log('Set remote video source');
        
        // Auto-play remote video
        remoteVideoRef.current.play().catch(console.error);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state changed to:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setIsConnected(true);
        setIsConnecting(false);
        startCallTimer();
        toast({
          title: "Call Connected",
          description: "You are now connected!",
        });
      } else if (peerConnection.connectionState === 'disconnected' || 
                 peerConnection.connectionState === 'failed') {
        setIsConnected(false);
        stopCallTimer();
        console.log('Connection failed or disconnected');
      }
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'connected' || 
          peerConnection.iceConnectionState === 'completed') {
        setIsConnected(true);
        setIsConnecting(false);
        startCallTimer();
      }
    };

    return peerConnection;
  }, [currentUser]);

  // Call timer functions
  const startCallTimer = useCallback(() => {
    callStartTimeRef.current = Date.now();
    setCallDuration(0);
    
    callTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      setCallDuration(elapsed);
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallDuration(0);
  }, []);

  // Get user media with better audio settings
  const getUserMedia = useCallback(async (video: boolean = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Prevent echo
      }
      
      console.log('Got user media:', stream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Media Access Error",
        description: "Please allow camera and microphone access",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  // Start call
  const startCall = useCallback(async (isVideo: boolean = true) => {
    try {
      setIsConnecting(true);
      const chatPartner = currentUser === 'Ali' ? 'Amna' : 'Ali';
      const roomId = `${currentUser}_${chatPartner}_${Date.now()}`;
      roomIdRef.current = roomId;

      // Notify the other user about incoming call
      await supabase.from('call_signals').insert({
        room_id: roomId,
        sender: currentUser,
        receiver: chatPartner,
        signal_type: 'call-start',
        signal_data: { isVideo }
      });

      // Get user media
      const stream = await getUserMedia(isVideo);
      
      // Create peer connection and add tracks
      const peerConnection = createPeerConnection();
      stream.getTracks().forEach(track => {
        console.log('Adding track:', track.kind, track.enabled);
        peerConnection.addTrack(track, stream);
      });

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer
      await supabase.from('call_signals').insert({
        room_id: roomId,
        sender: currentUser,
        receiver: chatPartner,
        signal_type: 'offer',
        signal_data: offer as any
      });

      setIsInCall(true);
      setIsVideoEnabled(isVideo);
      setIsConnecting(false);
      
      toast({
        title: "Calling...",
        description: `Calling ${chatPartner}`,
      });
    } catch (error) {
      console.error('Error starting call:', error);
      setIsConnecting(false);
      toast({
        title: "Call Failed",
        description: "Unable to start call",
        variant: "destructive"
      });
    }
  }, [currentUser, getUserMedia, createPeerConnection, toast]);

  // Reject call
  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;

    await supabase.from('call_signals').insert({
      room_id: incomingCall.roomId,
      sender: currentUser,
      receiver: incomingCall.from,
      signal_type: 'call-end',
      signal_data: { reason: 'rejected' }
    });

    setIncomingCall(null);
  }, [incomingCall, currentUser]);

  // Accept call
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      setIsConnecting(true);
      roomIdRef.current = incomingCall.roomId;

      // Get user media first
      const stream = await getUserMedia(incomingCall.isVideo);
      
      // Create peer connection and add tracks
      const peerConnection = createPeerConnection();
      stream.getTracks().forEach(track => {
        console.log('Adding track on accept:', track.kind, track.enabled);
        peerConnection.addTrack(track, stream);
      });

      setIsInCall(true);
      setIsVideoEnabled(incomingCall.isVideo);
      setIncomingCall(null);
      setIsConnecting(false);
      
      // Now process any pending offers that arrived before we were ready
      console.log('Ready to process offers for room:', roomIdRef.current);
      
    } catch (error) {
      console.error('Error accepting call:', error);
      setIsConnecting(false);
      rejectCall();
    }
  }, [incomingCall, getUserMedia, createPeerConnection, rejectCall]);

  // End call
  const endCall = useCallback(async () => {
    try {
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Notify other user
      if (roomIdRef.current) {
        const chatPartner = currentUser === 'Ali' ? 'Amna' : 'Ali';
        await supabase.from('call_signals').insert({
          room_id: roomIdRef.current,
          sender: currentUser,
          receiver: chatPartner,
          signal_type: 'call-end',
          signal_data: { reason: 'ended' }
        });
      }

      // Stop call timer
      stopCallTimer();

      // Reset state
      setIsInCall(false);
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      setIsConnecting(false);
      setIsConnected(false);
      roomIdRef.current = '';

      // Clear video elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      onCallEnd?.();
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [currentUser, onCallEnd]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Setup realtime listener for call signals
  useEffect(() => {
    const chatPartner = currentUser === 'Ali' ? 'Amna' : 'Ali';
    
    const channel = supabase
      .channel('call-signals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `receiver=eq.${currentUser}`
        },
        async (payload) => {
          const signal = payload.new;
          console.log('Received signal:', signal.signal_type, 'from:', signal.sender);

          try {
            switch (signal.signal_type) {
              case 'call-start':
                console.log('Incoming call from:', signal.sender);
                setIncomingCall({
                  from: signal.sender,
                  roomId: signal.room_id,
                  isVideo: signal.signal_data.isVideo
                });
                break;

            case 'offer':
              console.log('Received offer from:', signal.sender, 'for room:', signal.room_id);
              console.log('Current room:', roomIdRef.current, 'Peer connection exists:', !!peerConnectionRef.current);
              
              if (peerConnectionRef.current && roomIdRef.current === signal.room_id) {
                console.log('Processing offer:', signal.signal_data);
                try {
                  await peerConnectionRef.current.setRemoteDescription(signal.signal_data);
                  console.log('Remote description set successfully');
                  
                  const answer = await peerConnectionRef.current.createAnswer();
                  console.log('Answer created:', answer);
                  
                  await peerConnectionRef.current.setLocalDescription(answer);
                  console.log('Local description set successfully');
                  
                  console.log('Sending answer');
                  await supabase.from('call_signals').insert({
                    room_id: signal.room_id,
                    sender: currentUser,
                    receiver: signal.sender,
                    signal_type: 'answer',
                    signal_data: answer as any
                  });
                  console.log('Answer sent successfully');
                } catch (error) {
                  console.error('Error processing offer:', error);
                }
              } else {
                console.log('Offer received but not ready to process yet');
              }
              break;

            case 'answer':
              console.log('Received answer from:', signal.sender);
              if (peerConnectionRef.current && roomIdRef.current === signal.room_id) {
                console.log('Processing answer:', signal.signal_data);
                try {
                  await peerConnectionRef.current.setRemoteDescription(signal.signal_data);
                  console.log('Answer processed successfully');
                } catch (error) {
                  console.error('Error processing answer:', error);
                }
              }
              break;

            case 'ice-candidate':
              console.log('Received ICE candidate from:', signal.sender);
              if (peerConnectionRef.current && roomIdRef.current === signal.room_id) {
                console.log('Adding ICE candidate:', signal.signal_data);
                try {
                  await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.signal_data));
                  console.log('ICE candidate added successfully');
                } catch (error) {
                  console.error('Error adding ICE candidate:', error);
                }
              }
              break;

            case 'call-end':
              console.log('Call ended by:', signal.sender);
              endCall();
              toast({
                title: "Call Ended",
                description: `Call with ${signal.sender} ended`,
              });
              break;
          }
          } catch (error) {
            console.error('Error processing signal:', error);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, endCall, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    isInCall,
    isVideoEnabled,
    isAudioEnabled,
    incomingCall,
    isConnecting,
    isConnected,
    callDuration,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio
  };
};