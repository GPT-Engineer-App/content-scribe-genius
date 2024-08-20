import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [prompt, setPrompt] = useState('');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [image, setImage] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [scheduledDate, setScheduledDate] = useState(null);
  const [isScheduleConfirmOpen, setIsScheduleConfirmOpen] = useState(false);
  const [calendarData, setCalendarData] = useState([]);

  const handleScheduleConfirm = async () => {
    setIsLoading(true);
    try {
      const response = await axios.put('https://hook.eu1.make.com/kn986l8l6n8lod1vxti2wfgjoxntmsya', {
        action: 'add_item',
        date: format(scheduledDate, 'yyyy-MM-dd'),
        content: draft || (data && data.result_text) || '',
        image_url: image || '',
        title: 'Scheduled Post',
      });
      
      if (response.data && response.data.result === 'success') {
        setScheduledDate(null);
        setIsScheduleConfirmOpen(false);
        handleTabChange("calendar");
      }
    } catch (error) {
      console.error('Error scheduling post:', error);
    } finally {
      setIsLoading(false);
      await handleGetCalendar();
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === 'calendar') {
      handleGetCalendar();
    }
  };

  const handleGetCalendar = async () => {
    try {
      const response = await axios.get('https://hook.eu1.make.com/kn986l8l6n8lod1vxti2wfgjoxntmsya?action=get_items');
      setCalendarData(response.data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="editor">
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button onClick={() => {/* Handle generate content */}}>
              Generate Content
            </Button>
            {data && (
              <div>
                <ReactMarkdown>{data.result_text}</ReactMarkdown>
              </div>
            )}
            <Textarea
              placeholder="Edit your draft here..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Image URL"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
            <Button onClick={() => setIsScheduleConfirmOpen(true)}>
              Schedule Post
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="calendar">
          <div>
            <CalendarComponent
              mode="single"
              selected={scheduledDate}
              onSelect={setScheduledDate}
              className="rounded-md border"
            />
            {calendarData.map((item, index) => (
              <div key={index} className="mt-2 p-2 border rounded">
                <p>Date: {item.date}</p>
                <p>Content: {item.content}</p>
                {item.image_url && <img src={item.image_url} alt="Scheduled post" className="mt-2 max-w-xs" />}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={isScheduleConfirmOpen} onOpenChange={setIsScheduleConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Scheduling</DialogTitle>
            <DialogDescription>
              Are you sure you want to schedule this post for {scheduledDate && format(scheduledDate, 'PPP')}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleConfirm} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;