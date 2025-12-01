"use client";

import React, { useRef, useState } from 'react';
import { Brush, Circle, Download, Link2, Upload, PanelRightClose, PanelRightOpen, Folder, File, MousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArrowIcon, SlightlyHelpfulIcon } from './icons';
import type { Tool, Color } from '@/app/page';

type ToolbarProps = {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: Color;
  setColor: (color: Color) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlLoad: (url: string) => void;
  onExport: () => void;
  isLayersPanelOpen: boolean;
  toggleLayersPanel: () => void;
};

const colors: Color[] = ['white', 'red', 'green', 'blue', 'yellow'];
const colorHex: Record<Color, string> = {
  white: '#FFFFFF',
  red: '#EF4444',
  green: '#22C55E',
  blue: '#3B82F6',
  yellow: '#EAB308',
};

export function Toolbar({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  onUpload,
  onUrlLoad,
  onExport,
  isLayersPanelOpen,
  toggleLayersPanel
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUrlLoadClick = () => {
    if (url) {
      onUrlLoad(url);
      setUrl('');
    }
  };

  return (
    <header className="bg-[#0E0E0E] border-b border-zinc-800/50 p-2 shadow-md z-10">
      <div className="mx-auto flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
            <SlightlyHelpfulIcon className="h-8 w-8 text-white" />
            <h1 className="text-xl font-bold text-white">SlightlyHelpful</h1>
        </div>
        
        <div className='flex items-center gap-6'>
            <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-md">
                <Button variant={!tool ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool(null as any)} aria-label="Select Tool">
                    <MousePointer className="h-5 w-5" />
                </Button>
                <Button variant={tool === 'brush' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('brush')} aria-label="Brush Tool">
                    <Brush className="h-5 w-5" />
                </Button>
                <Button variant={tool === 'arrow' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('arrow')} aria-label="Arrow Tool">
                    <ArrowIcon className="h-5 w-5" />
                </Button>
                <Button variant={tool === 'circle' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('circle')} aria-label="Circle Tool">
                    <Circle className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
            {colors.map((c) => (
                <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                    'h-6 w-6 rounded-full border-2 transition-transform transform hover:scale-110',
                    color === c ? 'border-accent scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: colorHex[c] }}
                aria-label={`Select color ${c}`}
                />
            ))}
            </div>

            <div className="flex items-center gap-3 w-40">
                <Slider
                    min={1}
                    max={30}
                    step={1}
                    value={[brushSize]}
                    onValueChange={(value) => setBrushSize(value[0])}
                    aria-label="Brush Size"
                />
                <span className="text-sm font-mono w-6 text-right">{brushSize}px</span>
            </div>
        </div>

        <div className="flex items-center">
            <input
                type="file"
                ref={fileInputRef}
                onChange={onUpload}
                className="hidden"
                accept="image/*"
                multiple
            />
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                        <File className="h-4 w-4 mr-2" />
                        File
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={handleUploadClick}>
                        <Folder className="mr-2 h-4 w-4" />
                        <span>Upload from Computer</span>
                    </DropdownMenuItem>
                    <Popover>
                        <PopoverTrigger asChild>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Link2 className="mr-2 h-4 w-4" />
                                <span>Load from URL</span>
                            </DropdownMenuItem>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" side="right" align="start">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                            <h4 className="font-medium leading-none">Load from URL</h4>
                            <p className="text-sm text-muted-foreground">
                                Paste an image URL to load it onto the canvas.
                            </p>
                            </div>
                            <div className="flex gap-2">
                            <Input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com/image.png"
                                className="flex-1"
                                onKeyDown={(e) => e.key === 'Enter' && handleUrlLoadClick()}
                            />
                            <PopoverTrigger asChild>
                                <Button onClick={handleUrlLoadClick}>Load</Button>
                            </PopoverTrigger>
                            </div>
                        </div>
                        </PopoverContent>
                    </Popover>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={onExport}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Save as PNG</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

           <Button variant="ghost" size="icon" onClick={toggleLayersPanel} aria-label="Toggle Layers Panel">
            {isLayersPanelOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
