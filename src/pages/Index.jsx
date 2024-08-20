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
  // ... (keep all existing state and other function declarations)

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
        await handleGetCalendar();
      }
    } catch (error) {
      console.error('Error scheduling post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ... (keep all other existing code)

  return (
    // ... (keep the existing JSX)
  );
};

export default Index;