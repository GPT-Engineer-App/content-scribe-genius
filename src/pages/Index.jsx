import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Loader2, Copy, RefreshCw, Send, Image, Upload, Repeat, Calendar, X, Sparkles } from "lucide-react"
import JSON5 from 'json5';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, parse, isValid, addDays } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

const Index = () => {
  const [formData, setFormData] = useState({
    news: '',
    personal: '',
    controversial: '',
    inspiring: '',
  });
  const [draft, setDraft] = useState('');
  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState('');
  const [imageUploaded, setImageUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState(null);
  const [activeButton, setActiveButton] = useState(null);
  const [scheduledDate, setScheduledDate] = useState(null);
  const [isScheduleConfirmOpen, setIsScheduleConfirmOpen] = useState(false);
  const [calendarData, setCalendarData] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("generator");
  const [calendarResponse, setCalendarResponse] = useState(null);
  const [showStickyLog, setShowStickyLog] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isReGenerateDialogOpen, setIsReGenerateDialogOpen] = useState(false);

  const stickyLogRef = useRef(null);

  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
  }, []);

  useEffect(() => {
    const savedContent = sessionStorage.getItem('generatedContent');
    if (savedContent) {
      const parsedContent = JSON.parse(savedContent);
      setData(parsedContent);
      if (parsedContent.result_text) {
        setDraft(parsedContent.result_text);
      }
      if (parsedContent.result_image) {
        setImage(parsedContent.result_image);
      }
    }
  }, []);

  useEffect(() => {
    if (data && data.result_image && data.result_image.trim() !== '') {
      setImage(data.result_image);
    }
  }, [data]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
      news: '',
      personal: '',
      controversial: '',
      inspiring: '',
    });
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
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result;
        setImage(imageData);
        setImageUploaded(true);
        
        // Trigger webhook with image data
        await makeWebhookCall({
          upload_image: true,
          image: imageData,
          file_name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const makeWebhookCall = async (action = 'generate') => {
    console.log(`Starting webhook call for action: ${action}`);
    setIsLoading(true);
    setError(null);
    let webhookSuccess = false;
    try {
      const payload = {
        ...formData,
        action,
        draft,
        image: image || null,
        file_name: fileName || null,
        image_url: data?.result_image || null,
        scheduled_date: scheduledDate ? format(scheduledDate, 'yyyy-MM-dd') : null,
      };
      console.log('Payload prepared:', payload);
      setImageUploaded(false); // Reset the flag after sending the request

      const response = await axios.put('https://hook.eu1.make.com/7hok9kqjre31fea5p7yi9ialusmbvlkc', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
      webhookSuccess = true;
      
      console.log("Raw webhook response:", response.data);
      
      if (response.status === 200 && response.data) {
        let parsedData = response.data;
        
        // Check if the response is a string, if so, try to parse it
        if (typeof response.data === 'string') {
          try {
            parsedData = JSON.parse(response.data);
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            throw new Error('Failed to parse server response');
          }
        }
        
        // If parsedData is an array, take the first item
        if (Array.isArray(parsedData)) {
          parsedData = parsedData[0];
        }
        
        console.log('Parsed response data:', parsedData);
        
        // Function to sanitize text
        const sanitizeText = (text) => {
          if (typeof text !== 'string') return text;
          return text.replace(/\\n/g, '\n').replace(/\\/g, '');
        };
        
        // Extract and sanitize the result_text and is_news
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

        // Store the generated content in sessionStorage
        sessionStorage.setItem('generatedContent', JSON.stringify({ result_text: sanitizedText, is_news, result_image }));
        console.log('Content stored in sessionStorage');

      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (err) {
      console.error('Error in makeWebhookCall:', err);
      let errorMessage;
      if (err.response) {
        errorMessage = `Server error: ${err.response.status} ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage = 'No response received from the server. Please check your network connection.';
      } else {
        errorMessage = err.message || 'An unknown error occurred';
      }
      setError(errorMessage);
      setDialogContent({ error: errorMessage });
      setDialogOpen(true);
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
    const content = draft || (data && data.result_text) || '';
    const formattedContent = content
      .replace(/^#+\s/gm, '') // Remove Markdown headers
      .replace(/\*\*/g, '') // Remove bold formatting
      .replace(/\*/g, '') // Remove italic formatting
      .replace(/`/g, '') // Remove code formatting
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .trim();

    const textArea = document.createElement("textarea");
    textArea.value = formattedContent;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      toast.success("Content copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy content: ', err);
      toast.error("Failed to copy content. Please try again.");
    }

    document.body.removeChild(textArea);
  };

  const handleGetCalendar = async () => {
    setActiveButton('get_calendar');
    setIsLoading(true);
    setActiveTab("calendar");
    try {
      const response = await axios.get('https://hook.eu1.make.com/kn986l8l6n8lod1vxti2wfgjoxntmsya?action=get_2weeks');
      const data = response.data;
      setCalendarResponse(JSON.stringify(data, null, 2)); // Store the raw response
      setShowStickyLog(true);
      if (Array.isArray(data) && data.length > 0) {
        let calendarList = data.flatMap(item => {
          if (item.calendar_list && typeof item.calendar_list === 'object') {
            return [{
              ...item.calendar_list,
              date: item.calendar_list.date ? parseISO(item.calendar_list.date) : null,
              formatted_date: item.calendar_list.date ? format(parseISO(item.calendar_list.date), 'MMM dd, yyyy') : 'No date'
            }];
          }
          return [];
        });
        // Sort the calendar data by date
        calendarList.sort((a, b) => (a.date && b.date) ? a.date - b.date : 0);
        setCalendarData(calendarList);
        console.log('Calendar data set:', calendarList);
      } else {
        setCalendarData([]);
        console.log('No calendar data found or invalid format');
        toast.warning('No scheduled posts found.');
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      // Check if the error response contains valid calendar data
      if (error.response && Array.isArray(error.response.data) && error.response.data.length > 0) {
        const calendarList = error.response.data.map(item => ({
          ...item,
          date: item.date ? parseISO(item.date) : null,
          formatted_date: item.date ? format(parseISO(item.date), 'MMM dd, yyyy') : 'No date'
        }));
        calendarList.sort((a, b) => (a.date && b.date) ? a.date - b.date : 0);
        setCalendarData(calendarList);
        console.log('Calendar data set from error response:', calendarList);
      } else {
        toast.error('Failed to fetch calendar data. Please try again.');
        setCalendarResponse(JSON.stringify(error, null, 2)); // Store the error response
        setShowStickyLog(true);
        setCalendarData([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePost = async (post) => {
    setIsLoading(true);
    await axios.put('https://hook.eu1.make.com/kn986l8l6n8lod1vxti2wfgjoxntmsya', {
      action: 'remove',
      date: post.date instanceof Date ? format(post.date, 'yyyy-MM-dd') : post.date
    });
    setIsLoading(false);
    handleGetCalendar(); // Refresh the calendar data
  };

  const handleReschedulePost = async (post) => {
    setSelectedPost(post);
    setDialogOpen(true);
  };

  const handleScheduleConfirm = async () => {
    try {
      setIsLoading(true);
      const response = await axios.put('https://hook.eu1.make.com/kn986l8l6n8lod1vxti2wfgjoxntmsya', {
        action: 'add_item',
        date: format(scheduledDate, 'yyyy-MM-dd'),
        content: draft || (data && data.result_text) || '',
        image_url: image || '',
        title: 'Scheduled Post', // You might want to generate a title or let the user input one
      });
      if (response.data && response.data.result === 'success') {
        toast.success('Post scheduled successfully');
        setScheduledDate(null);
        setIsScheduleConfirmOpen(false);
        handleTabChange("calendar");
        // Only call handleGetCalendar if the webhook was successful
        if (webhookSuccess) {
          handleGetCalendar();
        }
      } else {
        throw new Error('Failed to schedule post');
      }
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast.error('Failed to schedule post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRescheduleConfirm = async (newDate) => {
    let webhookSuccess = false;
    try {
      setIsLoading(true);
      const response = await axios.put('https://hook.eu1.make.com/kn986l8l6n8lod1vxti2wfgjoxntmsya', {
        action: 'reschedule',
        date: selectedPost.date instanceof Date ? format(selectedPost.date, 'yyyy-MM-dd') : selectedPost.date,
        new_date: format(newDate, 'yyyy-MM-dd')
      });
      if (response.data && Array.isArray(response.data)) {
        const updatedPosts = response.data.map(post => ({
          ...post,
          date: parseISO(post.date),
          formatted_date: format(parseISO(post.date), 'MMM dd, yyyy')
        }));
        setCalendarData(updatedPosts);
        const rescheduledPost = updatedPosts.find(post => format(post.date, 'yyyy-MM-dd') === format(newDate, 'yyyy-MM-dd'));
        if (rescheduledPost) {
          toast.success('Post rescheduled successfully');
          console.log('Updated calendar data:', updatedPosts);
          webhookSuccess = true;
        } else {
          throw new Error('Rescheduled post not found in the response');
        }
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error rescheduling post:', error);
      toast.error('Failed to reschedule post. Please try again.');
    } finally {
      setIsLoading(false);
      setDialogOpen(false);
      if (webhookSuccess) {
        handleGetCalendar(); // Refresh the calendar data only if webhook was successful
      }
    }
  };

  const getPostColor = (status) => {
    switch (status) {
      case 'planned':
        return 'bg-yellow-500';
      case 'done':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const CalendarDialog = () => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
    const parseDate = (dateString) => {
      return parse(dateString, 'yyyy-MM-dd', new Date());
    };

    return (
      <Dialog open={isCalendarDialogOpen} onOpenChange={setIsCalendarDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Content Calendar</DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-bold">{day}</div>
              ))}
              {days.map(day => {
                const posts = calendarData.filter(item => item.date && format(parseISO(item.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
                return (
                  <div
                    key={day.toString()}
                    className="border p-1 h-24 overflow-y-auto"
                  >
                    <div className="text-right text-xs">{format(day, 'd')}</div>
                    {posts.map((post, index) => (
                      <div
                        key={index}
                        className={`${getPostColor(post.status)} text-white text-xs p-1 mb-1 rounded cursor-pointer`}
                        onClick={() => {
                          setSelectedPost(post);
                          setIsPostDialogOpen(true);
                        }}
                      >
                        <div>{post.title || 'Untitled'}</div>
                        <div className="text-[10px] mt-1">{post.formatted_date}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          {!isLoading && calendarData.length === 0 && (
            <div className="text-center py-4">
              <p>No calendar data available.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  const PostDialog = () => {
    if (!selectedPost) return null;

    const postsForDay = calendarData.filter(post => post.date === selectedPost.date);

    // Safely parse the date
    const safeParseDate = (dateString) => {
      if (typeof dateString === 'string') {
        return parseISO(dateString);
      }
      return new Date(); // Return current date as fallback
    };

    return (
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Posts for {format(safeParseDate(selectedPost.date), 'MMMM d, yyyy')}</DialogTitle>
            <DialogDescription>
              {postsForDay.length} post{postsForDay.length !== 1 ? 's' : ''} scheduled
            </DialogDescription>
          </DialogHeader>
          {postsForDay.map((post, index) => (
            <div key={index} className="mt-4 border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">{post.title || 'Untitled Post'}</h3>
              <p className="text-sm text-gray-500 mb-2">Status: {post.status}</p>
              {post.image_url && (
                <img src={post.image_url} alt="Post" className="w-full h-auto object-cover rounded-md mb-4" />
              )}
              <div className="prose max-w-none">
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
                  {post.content || 'No content available'}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          <DialogFooter>
            <Button onClick={() => setIsPostDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const RescheduleDialog = () => {
    const [newDate, setNewDate] = useState(null);
    const safeParseDate = (dateString) => {
      if (typeof dateString === 'string') {
        return parseISO(dateString);
      } else if (dateString instanceof Date) {
        return dateString;
      }
      return new Date(); // Fallback to current date
    };

    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Post</DialogTitle>
            <DialogDescription>
              Choose a new date for this post.
            </DialogDescription>
          </DialogHeader>
          <CalendarComponent
            mode="single"
            selected={newDate || (selectedPost ? safeParseDate(selectedPost.date) : undefined)}
            onSelect={setNewDate}
            initialFocus
          />
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (newDate) {
                handleRescheduleConfirm(newDate);
              }
            }} disabled={!newDate}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto p-4 pb-40 min-h-screen overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4 text-center sm:text-left">Content Generation App</h1>
      <RescheduleDialog />
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sticky top-0 z-10 bg-white">
          <TabsTrigger 
            value="generator"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-yellow-300 data-[state=active]:text-white hover:bg-orange-100 transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generator
          </TabsTrigger>
          <TabsTrigger 
            value="calendar" 
            onClick={handleGetCalendar}
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-yellow-300 data-[state=active]:text-white hover:bg-orange-100 transition-all duration-200"
          >
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
              placeholder="Personal"
            />
            <Input
              name="controversial"
              id="controversial"
              value={formData.controversial}
              onChange={handleInputChange}
              placeholder="Controversial"
            />
            <Input
              name="inspiring"
              id="inspiring"
              value={formData.inspiring}
              onChange={handleInputChange}
              placeholder="Inspiring"
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
          <div className="mt-8 pb-20">
            <h2 className="text-xl font-semibold mb-2">Calendar</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="bg-white p-4 rounded-md shadow-md">
                <CalendarComponent
                  mode="multiple"
                  selected={calendarData.filter(post => post.status !== 'removed' && post.date).map(post => {
                    if (typeof post.date === 'string') {
                      try {
                        return parseISO(post.date);
                      } catch (error) {
                        console.error('Error parsing date:', post.date, error);
                        return null;
                      }
                    } else if (post.date instanceof Date) {
                      return post.date;
                    } else {
                      console.error('Invalid date format:', post.date);
                      return null;
                    }
                  }).filter(Boolean)}
                  className="rounded-md border"
                  weekStartsOn={1}
                  modifiers={{
                    done: calendarData.filter(post => post.status === 'done' && post.date).map(post => new Date(post.date)),
                    ready: calendarData.filter(post => post.status === 'ready' && post.date).map(post => new Date(post.date)),
                  }}
                  modifiersStyles={{
                    done: { backgroundColor: '#10B981', color: 'white' },
                    ready: { backgroundColor: '#3B82F6', color: 'white' },
                  }}
                  onDayClick={(day) => {
                    const clickedDate = format(day, 'yyyy-MM-dd');
                    const postsForDay = calendarData.filter(post => {
                      if (!post.date) return false;
                      const postDate = post.date instanceof Date ? post.date : parseISO(post.date);
                      return isValid(postDate) && format(postDate, 'yyyy-MM-dd') === clickedDate;
                    });
                    if (postsForDay.length > 0) {
                      setSelectedPost(postsForDay[0]);
                      setIsPostDialogOpen(true);
                    }
                  }}
                />
              </div>
              <div className="mt-4 md:mt-0 bg-white p-4 rounded-md shadow-md flex-grow">
                <h3 className="text-lg font-semibold mb-2">Scheduled Posts</h3>
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : calendarData.length > 0 ? (
                  <ul className="space-y-4 max-h-96 overflow-y-auto">
                    {calendarData.filter(post => post.status !== 'removed').map((post, index) => (
                      <li key={index} className={`bg-white shadow-md rounded-lg p-4 cursor-pointer ${post.status === 'done' ? 'opacity-70' : ''}`} onClick={() => {
                        setSelectedPost(post);
                        setIsPostDialogOpen(true);
                      }}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">{post.title || 'Untitled'}</h4>
                            <p className="text-sm text-gray-500">{post.formatted_date}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                            post.status === 'ready' ? 'bg-blue-500 text-white' :
                            post.status === 'done' ? 'bg-green-500 text-white' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                            {post.status}
                          </span>
                        </div>
                        {post.status === 'ready' && (
                          <>
                            <p className="text-sm text-gray-700 mb-2 line-clamp-2">{post.summary || 'No summary available'}</p>
                            {post.image_url && (
                              <img src={post.image_url} alt="Post" className="w-full h-32 object-cover rounded-md mb-2" />
                            )}
                          </>
                        )}
                        {post.status !== 'done' && (
                          <div className="flex justify-end space-x-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPost(post);
                                setDialogOpen(true);
                              }}
                              className="text-xs"
                              variant="outline"
                              size="sm"
                            >
                              <Calendar className="mr-1 h-3 w-3" />
                              Reschedule
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemovePost(post);
                              }}
                              className="text-xs"
                              variant="destructive"
                              size="sm"
                            >
                              <X className="mr-1 h-3 w-3" />
                              Remove
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No scheduled posts found.</p>
                    <Button
                      onClick={handleGetCalendar}
                      className="mt-4"
                    >
                      Refresh Calendar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <PostDialog />
      <Dialog open={isScheduleConfirmOpen} onOpenChange={setIsScheduleConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Scheduling</DialogTitle>
            <DialogDescription>
              Are you sure you want to schedule this post for {scheduledDate ? format(scheduledDate, 'PPP') : 'the selected date'}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsScheduleConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleConfirm} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {((draft && draft.trim() !== '') || (data && data.result_text && data.result_text.trim() !== '')) && activeTab === "generator" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-60 backdrop-blur-sm p-4 shadow-md">
          <div className="container mx-auto flex flex-wrap justify-center gap-2 mb-2">
            <div className="w-full sm:w-auto">
              <Button 
                onClick={() => {
                  console.log("Re-generate button clicked");
                  setIsReGenerateDialogOpen(true);
                }}
                className="w-full sm:w-auto text-sm sm:text-base py-1 sm:py-2 px-2 sm:px-4"
              >
                <Repeat className="mr-2 h-4 w-4" />
                Re-generate
              </Button>
            </div>
            <div className="w-full sm:w-auto">
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
            </div>
            <div className="w-full sm:w-auto">
              <Button 
                onClick={() => document.getElementById('imageUpload').click()}
                className="w-full sm:w-auto text-sm sm:text-base py-1 sm:py-2 px-2 sm:px-4"
              >
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
              </Button>
            </div>
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="w-full sm:w-auto flex">
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
          </div>
          <div className="container mx-auto text-center mt-2 h-6">
            {scheduledDate ? (
              <p className="text-sm">Scheduled for: {format(scheduledDate, 'PPP')}</p>
            ) : (
              <p className="text-sm text-transparent">Placeholder</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
