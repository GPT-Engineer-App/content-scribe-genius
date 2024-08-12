import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Loader2, Copy, RefreshCw, Send, Image, Upload, Repeat, Calendar } from "lucide-react"
import JSON5 from 'json5';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"

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
  const [calendarData, setCalendarData] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false);

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
    try {
      const response = await axios.get('https://hook.eu1.make.com/kn986l8l6n8lod1vxti2wfgjoxntmsya?action=get_2weeks');
      const data = response.data;
      if (Array.isArray(data) && data.length > 0 && data[0].result === 'success') {
        const calendarList = data.map(item => item.calendar_list).flat();
        setCalendarData(calendarList);
        setIsCalendarDialogOpen(true);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to fetch calendar data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePost = (post) => {
    // Implement remove functionality
    console.log('Removing post:', post);
    setSelectedPost(null);
  };

  const handleReschedulePost = (post) => {
    // Implement reschedule functionality
    console.log('Rescheduling post:', post);
    setSelectedPost(null);
  };

  const CalendarDialog = () => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <Dialog open={isCalendarDialogOpen} onOpenChange={setIsCalendarDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Calendar</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-bold">{day}</div>
            ))}
            {days.map(day => {
              const posts = calendarData.flat().filter(item => format(parseISO(item.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
              let className = "text-center p-2 rounded-full cursor-pointer";
              if (posts.length > 0) {
                if (posts.some(post => post.status === 'planned')) {
                  className += " bg-orange-500 text-white font-bold";
                } else if (posts.every(post => post.status === 'done')) {
                  className += " bg-green-800 text-white font-bold";
                }
              }
              return (
                <div
                  key={day.toString()}
                  className={className}
                  onClick={() => posts.length > 0 && setSelectedPost(posts[0])}
                >
                  {format(day, 'd')}
                  {posts.length > 1 && <span className="ml-1 text-xs">({posts.length})</span>}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const PostDialog = () => (
    <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{selectedPost?.title || 'Post Details'}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <p><strong>Date:</strong> {selectedPost?.date ? format(parseISO(selectedPost.date), 'PPP') : 'N/A'}</p>
          <p><strong>Status:</strong> {selectedPost?.status || 'N/A'}</p>
          {selectedPost?.image_url && (
            <img src={selectedPost.image_url} alt="Post" className="mt-2 max-w-full h-auto" />
          )}
          <p className="mt-2"><strong>Content:</strong> {selectedPost?.content || 'No content available'}</p>
        </div>
        <DialogFooter>
          <Button onClick={() => handleRemovePost(selectedPost)}>Remove</Button>
          <Button onClick={() => handleReschedulePost(selectedPost)}>Reschedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container mx-auto p-4 pb-40 min-h-screen overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4 text-center sm:text-left">Content Generation App</h1>
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
            onClick={handleGetCalendar}
            disabled={isLoading}
            className="bg-gradient-to-r from-[#FFA500] to-[#FF6347] hover:from-[#FF8C00] hover:to-[#FF4500] transition-all duration-300 shadow-md hover:shadow-lg"
          >
            {activeButton === 'get_calendar' && isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </>
            )}
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
      {draft && (
        <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-60 backdrop-blur-sm p-4 shadow-md">
          <div className="container mx-auto flex flex-wrap justify-center gap-2 mb-2">
            <div className="w-full sm:w-auto">
              <Button 
                onClick={() => handleSubmit('re-generate')}
                className="w-full sm:w-auto text-sm sm:text-base py-1 sm:py-2 px-2 sm:px-4"
              >
              {activeButton === 're-generate' && isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Repeat className="mr-2 h-4 w-4" />
                  Re-generate
                </>
              )}
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
                      }
                    }}
                    initialFocus
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

const CalendarDialog = () => {
  // ... (CalendarDialog component implementation)
};

const PostDialog = () => {
  // ... (PostDialog component implementation)
};

export default Index;
