const startRecording = async (type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
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

  // Add this line near the end of the component, before the closing return statement
  return (
    <div className="container mx-auto p-4 pb-40 min-h-screen overflow-y-auto">
      {/* ... existing code ... */}
      <DictateDialog />
      {/* ... rest of the existing code ... */}
    </div>
  );