import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const ReGenerateDialog = ({ isOpen, onClose, onSubmit }) => {
  const [model, setModel] = React.useState('gpt-3.5-turbo');
  const [length, setLength] = React.useState('medium');
  const [style, setStyle] = React.useState('neutral');

  const handleSubmit = () => {
    onSubmit({ model, length, style });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Re-generate Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Length</Label>
            <RadioGroup value={length} onValueChange={setLength}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="short" id="short" />
                <Label htmlFor="short">Short</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="long" id="long" />
                <Label htmlFor="long">Long</Label>
              </div>
            </RadioGroup>
          </div>
          <div>
            <Label>Style</Label>
            <RadioGroup value={style} onValueChange={setStyle}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neutral" id="neutral" />
                <Label htmlFor="neutral">Neutral</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="formal" id="formal" />
                <Label htmlFor="formal">Formal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="casual" id="casual" />
                <Label htmlFor="casual">Casual</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Re-generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReGenerateDialog;