import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Loader2, Copy, RefreshCw, Send, Image, Upload, Repeat, Calendar, X, Sparkles, Mic, Spotlight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO, addDays } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const Index = () => {
  // ... (keep all existing state variables)

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleReset = () => {
    setFormData({ news: '', personal: '', controversial: '', projects: '' });
    setDraft('');
    setImage(null);
    setFileName('');
    setImageUploaded(false);
    setData(null);
    sessionStorage.removeItem('generatedContent');
  };

  const handleImageUpload = async (e) => {
    // ... (keep existing image upload logic)
  };

  const makeWebhookCall = async (action = 'generate') => {
    console.log(`Starting webhook call for action: ${action}`);
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        action,
        draft,
        image_url: data?.result_image || image || null,
        scheduled_date: scheduledDate ? format(scheduledDate, 'yyyy-MM-dd') : null,
      };

      if (action === 're-generate') {
        payload.reGenerateOptions = reGenerateOptions;
      }

      console.log('Payload prepared:', payload);
      setImageUploaded(false);

      const response = await axios.post('https://hook.eu1.make.com/7hok9kqjre31fea5p7yi9ialusmbvlkc', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
      
      if (response.status === 200 && response.data) {
        let parsedData = response.data;
        
        if (typeof response.data === 'string') {
          try {
            parsedData = JSON.parse(response.data);
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            throw new Error('Failed to parse server response');
          }
        }
        
        if (Array.isArray(parsedData)) {
          parsedData = parsedData[0];
        }
        
        console.log('Parsed response data:', parsedData);
        
        const sanitizeText = (text) => {
          if (typeof text !== 'string') return text;
          return text.replace(/\\n/g, '\n').replace(/\\/g, '');
        };
        
        let sanitizedText, is_news;
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          const firstItem = parsedData[0];
          sanitizedText = sanitizeText(firstItem.result_text);
          is_news = firstItem.is_news;
        } else if (typeof parsedData === 'object' && parsedData !== null) {
          sanitizedText = sanitizeText(parsedData.result_text);
          is_news = parsedData.is_news;
        } else {
          throw new Error('Unexpected response format from server');
        }
        
        if (sanitizedText === undefined || is_news === undefined) {
          throw new Error('Missing required data in server response');
        }
        
        const result_image = parsedData.result_image || '';
        setData({ result_text: sanitizedText, is_news, result_image });
        console.log('Extracted data:', { result_text: sanitizedText, is_news, result_image });
        
        if (is_news) {
          setFormData(prevData => ({ ...prevData, news: sanitizedText }));
        } else {
          setDraft(sanitizedText);
        }

        if (result_image && result_image.trim() !== '') {
          setImage(result_image);
        }

        sessionStorage.setItem('generatedContent', JSON.stringify({ result_text: sanitizedText, is_news, result_image }));
        console.log('Content stored in sessionStorage');

        if (action === 'post_linkedin') {
          toast.success("Post successfully sent to LinkedIn!");
        } else if (action === 'add_item') {
          toast.success("Post successfully scheduled!");
        }
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (err) {
      console.error('Error in makeWebhookCall:', err);
      let errorMessage = err.message || 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('Webhook call completed');
    }
  };

  const handleSubmit = (action = 'generate') => {
    setActiveButton(action);
    makeWebhookCall(action);
  };

  const copyToClipboard = () => {
    // ... (keep existing copyToClipboard logic)
  };

  const handleGetCalendar = async () => {
    // ... (keep existing handleGetCalendar logic)
  };

  const handleRemovePost = async (post) => {
    // ... (keep existing handleRemovePost logic)
  };

  const handleReschedulePost = async (post) => {
    setSelectedPost(post);
    setDialogOpen(true);
  };

  const handleScheduleConfirm = async () => {
    // ... (keep existing handleScheduleConfirm logic)
  };

  const handleRescheduleConfirm = async (newDate) => {
    // ... (keep existing handleRescheduleConfirm logic)
  };

  const handleRecordingStart = (type) => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(type);
    }
  };

  const startRecording = async (type) => {
    // ... (keep existing startRecording logic)
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsDictateDialogOpen(false);
    }
  };

  const sendAudioToWebhook = async (audioBlob, type) => {
    // ... (keep existing sendAudioToWebhook logic)
  };

  // UI Components
  const RescheduleDialog = () => {
    // ... (keep existing RescheduleDialog component)
  };

  const PostDialog = () => {
    // ... (keep existing PostDialog component)
  };

  const CalendarDialog = () => {
    // ... (keep existing CalendarDialog component)
  };

  return (
    <div className="container mx-auto p-4 pb-40 min-h-screen overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4 text-center sm:text-left">Content Generation App</h1>
      <RescheduleDialog />
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sticky top-0 z-10 bg-white">
          <TabsTrigger value="generator" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-yellow-300 data-[state=active]:text-white hover:bg-orange-100 transition-all duration-200">
            <Sparkles className="w-4 h-4 mr-2" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="calendar" onClick={handleGetCalendar} className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-yellow-300 data-[state=active]:text-white hover:bg-orange-100 transition-all duration-200">
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="generator">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Textarea
                name="news"
                id="news"
                value={formData.news}
                onChange={handleInputChange}
                placeholder="Enter news..."
                className="flex-grow"
                rows={3}
              />
              <Button 
                onClick={() => handleSubmit('get_news')} 
                className="h-12 sm:h-24 sm:w-24 bg-gradient-to-r from-[#A062F9] to-[#1A77DA] hover:from-[#8A4EE8] hover:to-[#1665C0] transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {activeButton === 'get_news' && isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Get News"
                )}
              </Button>
            </div>
            <Input
              name="personal"
              id="personal"
              value={formData.personal}
              onChange={handleInputChange}
              placeholder="Personal thoughts.."
            />
            <Input
              name="controversial"
              id="controversial"
              value={formData.controversial}
              onChange={handleInputChange}
              placeholder="Controversial thoughts.."
            />
            <Input
              name="projects"
              id="projects"
              value={formData.projects}
              onChange={handleInputChange}
              placeholder="Project updates.."
            />
            <div className="flex space-x-2">
              <Button 
                onClick={() => handleSubmit('generate')} 
                disabled={isLoading}
                className="bg-gradient-to-r from-[#A062F9] to-[#1A77DA] hover:from-[#8A4EE8] hover:to-[#1665C0] transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {activeButton === 'generate' && isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsDictateDialogOpen(true)}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-400 to-lime-500 hover:from-green-500 hover:to-lime-600 transition-all duration-300 shadow-md hover:shadow-lg text-white"
              >
                <Mic className="mr-2 h-4 w-4" />
                Dictate
              </Button>
              <Button
                onClick={() => handleSubmit('spotlight')}
                disabled={isLoading}
                className="bg-gradient-to-r from-teal-400 to-green-500 hover:from-teal-500 hover:to-green-600 transition-all duration-300 shadow-md hover:shadow-lg text-white"
              >
                {activeButton === 'spotlight' && isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Spotlight className="mr-2 h-4 w-4" />
                    Spotlight
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                disabled={isLoading}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                <X className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {isLoading && (
            <div className="mt-4 flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <p>Processing request, please wait...</p>
            </div>
          )}
          {error && <p className="mt-4 text-red-500">Error: {error}</p>}

          {data && (
            <div className="mt-8 pb-20">
              <h2 className="text-xl font-semibold mb-2">Generated Content:</h2>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  {image && (
                    <div className="mb-4 relative">
                      <img src={image} alt="Generated" className="max-w-full h-auto rounded-md" />
                      <Button
                        className="absolute top-2 right-2 p-2 bg-white bg-opacity-70 rounded-full hover:bg-opacity-100 transition-all duration-200"
                        onClick={() => handleSubmit('generate_image')}
                      >
                        <RefreshCw className="h-4 w-4 text-black" />
                      </Button>
                    </div>
                  )}
                  {(draft || (data && data.result_text)) && (
                    <div className="bg-gray-100 p-4 rounded-md">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-4">{children}</p>,
                          h1: ({ children }) => <h1 className="text-2xl font-bold mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-semibold mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-medium mb-2">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc pl-5 mb-4">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5 mb-4">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">{children}</blockquote>,
                          code: ({ node, inline, className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            )
                          },
                        }}
                      >
                        {draft || (data && data.result_text) || ''}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="calendar">
          {/* ... (keep existing calendar content) */}
        </TabsContent>
      </Tabs>
      <PostDialog />
      {/* ... (keep existing dialogs and bottom fixed bar) */}
    </div>
  );
};

export default Index;