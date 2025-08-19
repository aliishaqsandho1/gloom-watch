import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useVoiceRecording = (currentUser: string) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      console.log('Starting voice recording...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      console.log('Got media stream:', stream);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing...');
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('Audio blob size:', audioBlob.size);
          
          if (audioBlob.size > 0) {
            await uploadVoiceNote(audioBlob);
          } else {
            toast({
              title: "Recording Error",
              description: "No audio data recorded",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error processing voice note:', error);
          toast({
            title: "Upload Error",
            description: "Failed to process voice note",
            variant: "destructive"
          });
        } finally {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      toast({
        title: "Recording Voice Note",
        description: "Tap the mic again to stop recording"
      });
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceNote = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const uploadVoiceNote = async (audioBlob: Blob) => {
    console.log('Uploading voice note, size:', audioBlob.size);
    setIsLoading(true);
    
    try {
      const fileName = `voice_${Date.now()}.webm`;
      console.log('Uploading file:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, audioBlob);

      console.log('Upload result:', { uploadData, uploadError });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_name: currentUser,
          content: null,
          message_type: 'audio',
          media_url: publicUrl,
          media_name: 'Voice Note'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Voice Note Sent",
        description: "Your voice message was sent successfully"
      });
    } catch (error) {
      console.error('Voice note upload error:', error);
      toast({
        title: "Send Failed",
        description: `Could not send voice note: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isRecording,
    isLoading,
    handleVoiceNote
  };
};