import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mic, StopCircle } from 'lucide-react';

const Index = () => {
  const [isDictateDialogOpen, setIsDictateDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    personal: '',
    projects: '',
    controversial: '',
  });

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async (type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendAudioToWebhook(audioBlob, type);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingType(type);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check your microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToWebhook = async (audioBlob, type) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('type', type);

    try {
      setIsLoading(true);
      const response = await axios.post('https://hook.eu1.make.com/7hok9kqjre31fea5p7yi9ialusmbvlkc', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.transcription) {
        setFormData(prevData => ({
          ...prevData,
          [type]: response.data.transcription,
        }));
        toast.success(`Transcription added to ${type} field`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error sending audio to webhook:', error);
      toast.error('Failed to process audio. Please try again.');
    } finally {
      setIsLoading(false);
      setIsDictateDialogOpen(false);
    }
  };

  const DictateDialog = () => (
    <Dialog open={isDictateDialogOpen} onOpenChange={setIsDictateDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Your Ideas</DialogTitle>
        </DialogHeader>
        <div className="flex justify-around">
          {['personal', 'projects', 'controversial'].map((type) => (
            <Button
              key={type}
              onClick={() => isRecording ? stopRecording() : startRecording(type)}
              className={`rounded-full w-20 h-20 flex items-center justify-center ${
                isRecording && recordingType === type
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-blue-500'
              }`}
            >
              {isRecording && recordingType === type ? (
                <StopCircle className="h-8 w-8 text-white" />
              ) : (
                <Mic className="h-8 w-8 text-white" />
              )}
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => setIsDictateDialogOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container mx-auto p-4 pb-40 min-h-screen overflow-y-auto">
      <DictateDialog />
      <div className="flex items-center space-x-2 mb-4">
        {/* Existing Generate button (assuming it's here) */}
        <Button
          onClick={() => setIsDictateDialogOpen(true)}
          className="bg-gradient-to-r from-green-400 to-lime-500 hover:from-green-500 hover:to-lime-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
        >
          Dictate <Mic className="ml-2 h-4 w-4" />
        </Button>
      </div>
      {/* Rest of your existing dashboard UI */}
    </div>
  );
};

export default Index;
