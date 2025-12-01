"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PanIcon, ScalingIcon } from "./icons";
import type { ObjectTool } from "@/app/page";

type ObjectToolbarProps = {
    objectTool: ObjectTool | null;
    setObjectTool: (tool: ObjectTool) => void;
};

export function ObjectToolbar({ objectTool, setObjectTool }: ObjectToolbarProps) {
    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-1 p-1 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-md">
                <Button 
                    variant={objectTool === 'pan' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    onClick={() => setObjectTool('pan')} 
                    aria-label="Pan Tool"
                >
                    <PanIcon className="h-5 w-5" />
                </Button>
                <Button 
                    variant={objectTool === 'resize' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    onClick={() => setObjectTool('resize')} 
                    aria-label="Resize Tool"
                >
                    <ScalingIcon className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
