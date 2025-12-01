"use client";

import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type ImageLayer = {
  id: number;
  name: string;
  visible: boolean;
};

type LayersPanelProps = {
  layers: ImageLayer[];
  activeLayerId: number | null;
  setActiveLayerId: (id: number | null) => void;
  toggleLayerVisibility: (id: number) => void;
  deleteLayer: (id: number) => void;
};

export function LayersPanel({
  layers,
  activeLayerId,
  setActiveLayerId,
  toggleLayerVisibility,
  deleteLayer,
}: LayersPanelProps) {
  
  return (
    <div className="h-full flex flex-col">
        <h2 className="text-lg font-semibold text-white p-4 pb-2">Layers</h2>
        {layers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-sm text-zinc-400 p-4">
                <p>Upload or paste an image to start.</p>
            </div>
        ) : (
            <ScrollArea className="flex-1">
                <div className="p-4 pt-2 space-y-2">
                {[...layers].reverse().map((layer) => (
                <div
                    key={layer.id}
                    onClick={() => setActiveLayerId(layer.id === activeLayerId ? null : layer.id)}
                    className={cn(
                    'flex items-center p-2 rounded-md cursor-pointer transition-colors text-sm',
                    activeLayerId === layer.id
                        ? 'bg-zinc-700 text-white'
                        : 'hover:bg-zinc-800 text-zinc-300'
                    )}
                >
                    <span className="flex-1 truncate" title={layer.name}>
                    {layer.name}
                    </span>
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(layer.id);
                    }}
                    aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                    >
                    {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-zinc-500" />}
                    </Button>
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500/80 hover:text-red-500"
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteLayer(layer.id);
                    }}
                    aria-label="Delete layer"
                    >
                    <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                ))}
                </div>
            </ScrollArea>
        )}
    </div>
  );
}
