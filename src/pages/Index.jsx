import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Trash2, Loader2, Copy, RefreshCw, Send, Image, Upload, Repeat, Calendar, X, Sparkles, Mic, Spotlight } from "lucide-react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import JSON5 from 'json5';
import { toast } from "sonner";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, parse, isValid, addDays } from "date-fns";

const Index = () => {
  const [formData, setFormData] = useState({ news: '', personal: '', controversial: '', projects: '' });
  const [draft, setDraft] = useState('');
  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState('');
  const [imageUploaded, setImageUploaded] = useState(false);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeButton, setActiveButton] = useState(null);
  const [scheduledDate, setScheduledDate] = useState(null);
  const [isScheduleConfirmOpen, setIsScheduleConfirmOpen] = useState(false);
  const [isReGenerateDialogOpen, setIsReGenerateDialogOpen] = useState(false);
  const [reGenerateOptions, setReGenerateOptions] = useState({});
  const [isDictateDialogOpen, setIsDictateDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState("generator");
  const mediaRecorderRef = useRef(null);

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
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setFileName(file.name);
        setImageUploaded(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const makeWebhookCall = async (action = 'generate') => {
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
          parsedData = JSON.parse(response.data);
        }
        
        if (Array.isArray(parsedData)) {
          parsedData = parsedData[0];
        }
        
        const sanitizeText = (text) => {
          if (typeof text !== 'string') return text;
          return text.replace(/\\n/g, '\n').replace(/\\/g, '');
        };
        
        let sanitizedText = sanitizeText(parsedData.result_text);
        let is_news = parsedData.is_news;
        
        if (sanitizedText === undefined || is_news === undefined) {
          throw new Error('Missing required data in server response');
        }
        
        const result_image = parsedData.result_image || '';
        setData({ result_text: sanitizedText, is_news, result_image });
        
        if (is_news) {
          setFormData(prevData => ({ ...prevData, news: sanitizedText }));
        } else {
          setDraft(sanitizedText);
        }

        if (result_image && result_image.trim() !== '') {
          setImage(result_image);
        }

        sessionStorage.setItem('generatedContent', JSON.stringify({ result_text: sanitizedText, is_news, result_image }));

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
    }
  };

  const handleSubmit = (action = 'generate') => {
    setActiveButton(action);
    makeWebhookCall(action);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft || (data && data.result_text) || '')
      .then(() => toast.success("Content copied to clipboard!"))
      .catch(() => toast.error("Failed to copy content"));
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "calendar") {
      handleGetCalendar();
    }
  };

  const handleGetCalendar = async () => {
    // Implement calendar fetching logic here
  };

  const renderButtons = () => (
    <div className="flex flex-wrap justify-center gap-2 mb-2">
      <Button 
        onClick={() => setIsReGenerateDialogOpen(true)}
        className={`w-full sm:w-auto text-sm sm:text-base py-1 sm:py-2 px-2 sm:px-4 ${isReGenerateDialogOpen ? 'bg-green-500 hover:bg-green-600' : ''}`}
      >
        <Repeat className="mr-2 h-4 w-4" />
        Re-generate
      </Button>
      <Button 
        onClick={() => handleSubmit('generate_image')}
        className="w-full sm:w-auto text-sm sm:text-base py-1 sm:py-2 px-2 sm:px-4"
      >
        {activeButton === 'generate_image' && isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Image className="mr-2 h-4 w-4" />
            Generate Image
          </>
        )}
      </Button>
      <Button 
        onClick={() => document.getElementById('imageUpload').click()}
        className="w-full sm:w-auto text-sm sm:text-base py-1 sm:py-2 px-2 sm:px-4"
      >
        <Upload className="mr-2 h-4 w-4" />
        Upload Image
      </Button>
      <Button 
        onClick={() => handleSubmit('post_linkedin')}
        className="flex-grow sm:flex-grow-0 text-sm sm:text-base py-1 sm:py-2 px-2 sm:px-4 bg-[#0A66C2] hover:bg-[#004182]"
      >
        {activeButton === 'post_linkedin' && isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Post on LinkedIn
          </>
        )}
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`ml-2 w-10 h-10 p-0 ${
              scheduledDate 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-[#0A66C2] hover:bg-[#004182]'
            } text-white`}
            onClick={(e) => {
              if (scheduledDate) {
                e.preventDefault();
                setScheduledDate(null);
              }
            }}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <CalendarComponent
            mode="single"
            selected={scheduledDate}
            onSelect={(date) => {
              if (date === scheduledDate) {
                setScheduledDate(null);
              } else {
                setScheduledDate(date);
                setIsScheduleConfirmOpen(true);
              }
            }}
            initialFocus
            disabled={(date) => date < addDays(new Date(), -1)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="container mx-auto p-4 pb-40 min-h-screen overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4 text-center sm:text-left">Content Generation App</h1>
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
                <Trash2 className="mr-2 h-4 w-4" />
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
          {/* Calendar content */}
        </TabsContent>
      </Tabs>
      {((draft && draft.trim() !== '') || (data && data.result_text && data.result_text.trim() !== '')) && activeTab === "generator" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-60 backdrop-blur-sm p-4 shadow-md">
          {renderButtons()}
          <div className="container mx-auto text-center mt-2 h-6">
            {scheduledDate ? (
              <p className="text-sm">Scheduled for: {format(scheduledDate, 'PPP')}</p>
            ) : (
              <p className="text-sm text-transparent">Placeholder</p>
            )}
          </div>
        </div>
      )}
      <input
        type="file"
        id="imageUpload"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
    </div>
  );
};

export default Index;