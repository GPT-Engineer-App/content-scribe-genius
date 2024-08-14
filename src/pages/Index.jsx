import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Image as ImageIcon, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { toPng } from 'html-to-image';

const Index = () => {
  const [formData, setFormData] = useState({
    news: '',
    personal: '',
    controversial: '',
    projects: ''
  });
  const [draft, setDraft] = useState('');
  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState('');
  const [imageUploaded, setImageUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);
  const [activeButton, setActiveButton] = useState(null);
  const [activeTab, setActiveTab] = useState("generate");
  const [calendarData, setCalendarData] = useState([]);
  const [calendarResponse, setCalendarResponse] = useState('');
  const [showStickyLog, setShowStickyLog] = useState(false);
  const { toast } = useToast();
  const imageRef = useRef(null);

  const [reGenerateOptions, setReGenerateOptions] = useState({
    length: 'same',
    style: 'default'
  });

  useEffect(() => {
    const savedContent = sessionStorage.getItem('generatedContent');
    if (savedContent) {
      setDraft(savedContent);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setFileName(file.name);
      setImageUploaded(true);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setFileName('');
    setImageUploaded(false);
  };

  const handleReset = () => {
    setFormData({
      news: '',
      personal: '',
      controversial: '',
      projects: ''
    });
    setDraft('');
    setImage(null);
    setFileName('');
    setImageUploaded(false);
    setData(null);
    sessionStorage.removeItem('generatedContent');
  };

  const handleSubmit = async (action) => {
    setActiveButton(action);
    setIsLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append('action', action);
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });
    if (image) {
      formDataToSend.append('image', image);
    }
    if (draft) {
      formDataToSend.append('draft', draft);
    }
    
    try {
      const response = await axios.post('https://hook.eu1.make.com/7afo50lm5cw0nq5x9yzwcmxvr8lhbmw2', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setData(response.data);
      if (response.data && response.data.generated_text) {
        setDraft(response.data.generated_text);
        sessionStorage.setItem('generatedContent', response.data.generated_text);
      }
      toast({
        title: "Success!",
        description: "Content generated successfully.",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReGenerate = async () => {
    setIsLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append('action', 're_generate');
    formDataToSend.append('draft', draft);
    formDataToSend.append('length', reGenerateOptions.length);
    formDataToSend.append('style', reGenerateOptions.style);
    
    try {
      const response = await axios.post('https://hook.eu1.make.com/7afo50lm5cw0nq5x9yzwcmxvr8lhbmw2', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setData(response.data);
      if (response.data && response.data.generated_text) {
        setDraft(response.data.generated_text);
        sessionStorage.setItem('generatedContent', response.data.generated_text);
      }
      toast({
        title: "Success!",
        description: "Content re-generated successfully.",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to re-generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCalendar = async () => {
    setActiveButton('get_calendar');
    setIsLoading(true);
    setActiveTab("calendar");
    try {
      const response = await axios.get('https://hook.eu1.make.com/kn986l8l6n8lod1vxti2wfgjoxntmsya?action=get_2weeks');
      const data = response.data;
      setCalendarResponse(JSON.stringify(data, null, 2));
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
        setCalendarResponse(JSON.stringify(error, null, 2));
        setShowStickyLog(true);
        setCalendarData([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(draft).then(() => {
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast({
        title: "Error",
        description: "Failed to copy content. Please try again.",
        variant: "destructive",
      });
    });
  };

  const handleDownloadImage = async () => {
    if (imageRef.current === null) {
      return;
    }

    try {
      const dataUrl = await toPng(imageRef.current, { quality: 0.95 });
      
      const link = document.createElement('a');
      link.download = 'generated-content.png';
      link.href = dataUrl;
      link.click();

      toast({
        title: "Success!",
        description: "Image downloaded successfully.",
      });
    } catch (err) {
      console.error('Error downloading image:', err);
      toast({
        title: "Error",
        description: "Failed to download image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-indigo-500 data-[state=active]:text-white hover:bg-blue-100 transition-all duration-200">
            Generate
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
        <TabsContent value="generate" className="mt-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="news">News</Label>
              <Textarea
                name="news"
                id="news"
                value={formData.news}
                onChange={handleInputChange}
                placeholder="Enter news.."
                className="flex-grow"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="personal">Personal</Label>
                <Input
                  name="personal"
                  id="personal"
                  value={formData.personal}
                  onChange={handleInputChange}
                  placeholder="Personal thoughts.."
                />
              </div>
              <div>
                <Label htmlFor="controversial">Controversial</Label>
                <Input
                  name="controversial"
                  id="controversial"
                  value={formData.controversial}
                  onChange={handleInputChange}
                  placeholder="Controversial thoughts.."
                />
              </div>
              <div>
                <Label htmlFor="projects">Projects</Label>
                <Input
                  name="projects"
                  id="projects"
                  value={formData.projects}
                  onChange={handleInputChange}
                  placeholder="Project updates.."
                />
              </div>
            </div>
            <div>
              <Label htmlFor="image">Image</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  id="image"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image').click()}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                {imageUploaded && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleRemoveImage}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
                {fileName && <span className="text-sm text-gray-500">{fileName}</span>}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={() => handleSubmit('generate')}
                disabled={isLoading}
                className={`bg-gradient-to-r from-blue-400 to-indigo-500 text-white ${activeButton === 'generate' ? 'ring-2 ring-blue-400' : ''}`}
              >
                {isLoading && activeButton === 'generate' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Generate
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit('improve')}
                disabled={isLoading}
                className={`bg-gradient-to-r from-green-400 to-emerald-500 text-white ${activeButton === 'improve' ? 'ring-2 ring-green-400' : ''}`}
              >
                {isLoading && activeButton === 'improve' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Improve
              </Button>
              <Button
                type="button"
                onClick={handleReset}
                variant="outline"
              >
                Reset
              </Button>
            </div>
          </div>
          {draft && (
            <div className="mt-8">
              <Label htmlFor="draft">Generated Content</Label>
              <div className="relative">
                <Textarea
                  id="draft"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="min-h-[200px]"
                />
                <div className="absolute bottom-2 right-2 space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCopyToClipboard}
                  >
                    Copy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDownloadImage}
                  >
                    Download as Image
                  </Button>
                </div>
              </div>
              <div ref={imageRef} className="mt-4 p-4 bg-white rounded shadow">
                <div className="prose max-w-none">
                  {draft.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex space-x-2">
                  <Label htmlFor="length">Length:</Label>
                  <select
                    id="length"
                    value={reGenerateOptions.length}
                    onChange={(e) => setReGenerateOptions(prev => ({ ...prev, length: e.target.value }))}
                    className="border rounded px-2 py-1"
                  >
                    <option value="same">Same</option>
                    <option value="Shorty">Shorty</option>
                    <option value="Extender">Extender</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Label htmlFor="style">Style:</Label>
                  <select
                    id="style"
                    value={reGenerateOptions.style}
                    onChange={(e) => setReGenerateOptions(prev => ({ ...prev, style: e.target.value }))}
                    className="border rounded px-2 py-1"
                  >
                    <option value="default">Default</option>
                    <option value="myStory">myStory</option>
                    <option value="WisdomDrop">WisdomDrop</option>
                  </select>
                </div>
                <Button
                  type="button"
                  onClick={handleReGenerate}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-400 to-pink-500 text-white"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Re-Generate
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          {/* Calendar content goes here */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;