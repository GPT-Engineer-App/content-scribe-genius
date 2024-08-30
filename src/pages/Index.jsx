import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    personal: '',
    project: '',
    controversial: ''
  });
  const [generatedContent, setGeneratedContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState(null);
  const [isDictateDialogOpen, setIsDictateDialogOpen] = useState(false);
  const mediaRecorderRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('https://hook.eu1.make.com/7hok9kqjre31fea5p7yi9ialusmbvlkc', formData);
      setGeneratedContent(response.data.generated_content);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async (type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        handleAudioUpload(blob, type);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingType(type);
    } catch (err) {
      console.error('Error starting recording:', err);
      toast.error('Failed to start recording. Please check your microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (blob, type) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('type', type);

    try {
      const response = await axios.post(
        'https://hook.eu1.make.com/7hok9kqjre31fea5p7yi9ialusmbvlkc',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data && response.data.transcription) {
        setFormData(prevData => ({
          ...prevData,
          [type]: response.data.transcription
        }));
        toast.success('Audio transcribed successfully!');
      } else {
        throw new Error('Transcription failed or invalid response');
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast.error('Failed to process audio. Please try again.');
    } finally {
      setIsLoading(false);
      setIsDictateDialogOpen(false);
    }
  };

  const DictateDialog = () => (
    <Dialog open={isDictateDialogOpen} onOpenChange={setIsDictateDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dictate Your Ideas</DialogTitle>
          <DialogDescription>
            Click on a button to start recording. Click again to stop.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4">
          {['personal', 'project', 'controversial'].map((type) => (
            <Button
              key={type}
              onClick={() => isRecording && recordingType === type ? stopRecording() : startRecording(type)}
              className={`rounded-full h-24 w-24 flex flex-col items-center justify-center ${
                isRecording && recordingType === type
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isRecording && recordingType === type ? (
                <StopCircle className="h-8 w-8 text-white" />
              ) : (
                <Mic className="h-8 w-8 text-white" />
              )}
              <span className="mt-2 text-xs text-white capitalize">{type}</span>
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
      <h1 className="text-3xl font-bold mb-6">Content Generation Dashboard</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="personal" className="block text-sm font-medium text-gray-700">Personal Experience</label>
          <Input
            type="text"
            id="personal"
            name="personal"
            value={formData.personal}
            onChange={handleInputChange}
            className="mt-1 block w-full"
            placeholder="Enter a personal experience"
          />
        </div>
        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700">Project Details</label>
          <Input
            type="text"
            id="project"
            name="project"
            value={formData.project}
            onChange={handleInputChange}
            className="mt-1 block w-full"
            placeholder="Enter project details"
          />
        </div>
        <div>
          <label htmlFor="controversial" className="block text-sm font-medium text-gray-700">Controversial Topic</label>
          <Input
            type="text"
            id="controversial"
            name="controversial"
            value={formData.controversial}
            onChange={handleInputChange}
            className="mt-1 block w-full"
            placeholder="Enter a controversial topic"
          />
        </div>
        <div className="flex space-x-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate'}
          </Button>
          <Button
            type="button"
            onClick={() => setIsDictateDialogOpen(true)}
            className="bg-gradient-to-r from-green-400 to-lime-500 hover:from-green-500 hover:to-lime-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          >
            <Mic className="mr-2" /> Dictate
          </Button>
        </div>
      </form>
      {generatedContent && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Generated Content</h2>
          <Textarea
            value={generatedContent}
            readOnly
            className="w-full h-64 p-2 border rounded"
          />
        </div>
      )}
      <DictateDialog />
    </div>
  );
};

export default Index;
