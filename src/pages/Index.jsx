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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

const Index = () => {
  const [formData, setFormData] = useState({
    news: '',
    personal: '',
    controversial: '',
    projects: '',
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
  const [reGenerateOptions, setReGenerateOptions] = useState({
    model: 'OpenAI',
    length: 'same',
    style: 'default'
  });

  const stickyLogRef = useRef(null);

  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
  }, []);

  const handleReGenerateOptionChange = (option, value) => {
    setReGenerateOptions(prev => ({ ...prev, [option]: value }));
  };

  const handleReGenerate = () => {
    console.log('Re-generate options:', reGenerateOptions);
    setIsReGenerateDialogOpen(false);
    makeWebhookCall('re-generate');
  };

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
      projects: '',
    });
    setDraft('');
    setImage(null);
    setFileName('');
    setImageUploaded(false);
    setData(null);
    sessionStorage.removeItem('generatedContent');
  };

  // ... rest of the component code ...

  return (
    <div className="container mx-auto p-4 pb-40 min-h-screen overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4 text-center sm:text-left">Content Generation App</h1>
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
                placeholder="Enter news.."
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

          {/* ... rest of the component JSX ... */}

        </TabsContent>
        {/* ... Calendar TabsContent ... */}
      </Tabs>
      {/* ... other dialogs and UI elements ... */}
    </div>
  );
};

export default Index;