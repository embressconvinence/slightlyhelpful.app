"use client";

import { useRef, useEffect, useState, useCallback, ChangeEvent } from 'react';
import { Toolbar } from '@/components/app/toolbar';
import { ObjectToolbar } from '@/components/app/object-toolbar';
import { LayersPanel } from '@/components/app/layers-panel';
import { useToast } from "@/hooks/use-toast";
import { checkCorsAndGetErrorMessage } from '@/ai/flows/cors-image-error-handling';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export type Tool = 'brush' | 'arrow' | 'circle';
export type ObjectTool = 'pan' | 'resize';
export type Color = 'white' | 'red' | 'green' | 'blue' | 'yellow';

type Point = { x: number; y: number };

type ImageLayer = {
  id: number;
  image: HTMLImageElement;
  offset: Point;
  visible: boolean;
  name: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
};

type BrushStroke = {
  type: 'brush';
  points: Point[];
  color: string;
  size: number;
};

type Arrow = {
  type: 'arrow';
  start: Point;
  end: Point;
  color: string;
  size: number;
};

type CircleShape = {
  type: 'circle';
  center: Point;
  radiusX: number;
  radiusY: number;
  color: string;
  size: number;
};

type Shape = BrushStroke | Arrow | CircleShape;

const colorMap: Record<Color, string> = {
  white: '#FFFFFF',
  red: '#EF4444',
  green: '#22C55E',
  blue: '#3B82F6',
  yellow: '#EAB308',
};

const HANDLE_SIZE = 8;
type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'right' | 'bottom' | 'left';


export default function DarkCanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const { toast } = useToast();

  // State
  const [tool, setTool] = useState<Tool>('brush');
  const [objectTool, setObjectTool] = useState<ObjectTool | null>(null);
  const [color, setColor] = useState<Color>('white');
  const [brushSize, setBrushSize] = useState(5);
  
  const [layers, setLayers] = useState<ImageLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<number | null>(null);
  
  const [history, setHistory] = useState<Shape[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const shapes = history[historyIndex];

  // Interaction state
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(true);

  const getCanvasContext = () => canvasRef.current?.getContext('2d');

  const getMousePos = (evt: MouseEvent | React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'nativeEvent' in evt ? evt.nativeEvent.clientX : evt.clientX;
    const clientY = 'nativeEvent' in evt ? evt.nativeEvent.clientY : evt.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };
  
  const updateHistory = (newShapes: Shape[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newShapes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  const setShapes = (updater: Shape[] | ((prevShapes: Shape[]) => Shape[])) => {
    const currentShapes = history[historyIndex];
    const newShapes = typeof updater === 'function' ? updater(currentShapes) : updater;
    updateHistory(newShapes);
  };

  const getLayerRect = (layer: ImageLayer) => {
    const canvas = canvasRef.current;
    if(!canvas) return { x: 0, y: 0, width: 0, height: 0};
    
    const hRatio = canvas.width / layer.originalWidth;
    const vRatio = canvas.height / layer.originalHeight;
    const ratio = Math.min(hRatio, vRatio, 1);

    const scaledWidth = layer.width * ratio;
    const scaledHeight = layer.height * ratio;
    
    const initialX = (canvas.width - layer.originalWidth * ratio) / 2;
    const initialY = (canvas.height - layer.originalHeight * ratio) / 2;

    const x = initialX + layer.offset.x;
    const y = initialY + layer.offset.y;

    return { x, y, width: scaledWidth, height: scaledHeight, ratio };
  };

  const getHandleRects = (layerRect: ReturnType<typeof getLayerRect>) => {
      const { x, y, width, height } = layerRect;
      const hs = HANDLE_SIZE;
      return {
          'top-left': { x: x - hs / 2, y: y - hs / 2, width: hs, height: hs },
          'top': { x: x + width / 2 - hs / 2, y: y - hs / 2, width: hs, height: hs },
          'top-right': { x: x + width - hs / 2, y: y - hs / 2, width: hs, height: hs },
          'right': { x: x + width - hs / 2, y: y + height / 2 - hs / 2, width: hs, height: hs },
          'bottom-right': { x: x + width - hs / 2, y: y + height - hs / 2, width: hs, height: hs },
          'bottom': { x: x + width / 2 - hs / 2, y: y + height - hs / 2, width: hs, height: hs },
          'bottom-left': { x: x - hs / 2, y: y + height - hs / 2, width: hs, height: hs },
          'left': { x: x - hs / 2, y: y + height / 2 - hs / 2, width: hs, height: hs },
      };
  };

  const getCursorForHandle = (handle: ResizeHandle) => {
    switch (handle) {
      case 'top-left':
      case 'bottom-right':
        return 'nwse-resize';
      case 'top-right':
      case 'bottom-left':
        return 'nesw-resize';
      case 'top':
      case 'bottom':
        return 'ns-resize';
      case 'left':
      case 'right':
        return 'ew-resize';
      default:
        return 'default';
    }
  };

  const drawAll = useCallback(() => {
    const ctx = getCanvasContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    layers.forEach(layer => {
      if (layer.visible && layer.image) {
        const {x, y, width, height} = getLayerRect(layer);
        ctx.drawImage(layer.image, x, y, width, height);
      }
    });

    if (objectTool === 'resize' && activeLayerId) {
        const activeLayer = layers.find(l => l.id === activeLayerId);
        if (activeLayer) {
            const layerRect = getLayerRect(activeLayer);
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 1;
            ctx.strokeRect(layerRect.x, layerRect.y, layerRect.width, layerRect.height);

            const handles = getHandleRects(layerRect);
            ctx.fillStyle = '#3B82F6';
            Object.values(handles).forEach(handle => {
                ctx.fillRect(handle.x, handle.y, handle.width, handle.height);
            });
        }
    }
    
    shapes.forEach(shape => {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (shape.type === 'brush') {
        ctx.beginPath();
        shape.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      } else if (shape.type === 'arrow') {
        drawArrow(ctx, shape.start.x, shape.start.y, shape.end.x, shape.end.y);
      } else if (shape.type === 'circle') {
        ctx.beginPath();
        ctx.ellipse(shape.center.x, shape.center.y, shape.radiusX, shape.radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    if (isDrawing && startPoint && currentPoint) {
      ctx.strokeStyle = colorMap[color];
      ctx.lineWidth = brushSize;
      if (tool === 'arrow') {
        drawArrow(ctx, startPoint.x, startPoint.y, currentPoint.x, currentPoint.y);
      } else if (tool === 'circle') {
        ctx.beginPath();
        const radiusX = Math.abs(currentPoint.x - startPoint.x) / 2;
        const radiusY = Math.abs(currentPoint.y - startPoint.y) / 2;
        const centerX = (startPoint.x + currentPoint.x) / 2;
        const centerY = (startPoint.y + currentPoint.y) / 2;
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  }, [layers, shapes, isDrawing, startPoint, currentPoint, tool, objectTool, color, brushSize, activeLayerId]);

  function drawArrow(ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number) {
    const headlen = Math.max(10, ctx.lineWidth * 2.5);
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const mainEl = mainRef.current;
    if (!canvas || !mainEl) return;
    
    const handleResize = () => {
      setTimeout(() => {
        if(mainEl) {
            canvas.width = mainEl.clientWidth;
            canvas.height = mainEl.clientHeight;
            drawAll();
        }
      }, 50);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mainEl);
    
    handleResize();

    return () => {
      resizeObserver.unobserve(mainEl);
    };
  }, [drawAll, isLayersPanelOpen]);
  
  useEffect(() => {
    drawAll();
  }, [drawAll]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setStartPoint(pos);
    setCurrentPoint(pos);
  
    // If we're using a drawing tool, immediately start drawing and skip layer interactions.
    if (tool === 'brush' || tool === 'arrow' || tool === 'circle') {
      setIsDrawing(true);
      if (tool === 'brush') {
        const newShapes = [...shapes, { type: 'brush', points: [pos], color: colorMap[color], size: brushSize }];
        updateHistory(newShapes);
      }
      return; // Exit early
    }
    
    let interactedWithLayer = false;

    // Check if clicking inside an active layer for pan/resize
    if (activeLayerId) {
      const activeLayer = layers.find(l => l.id === activeLayerId);
      if (activeLayer) {
        const layerRect = getLayerRect(activeLayer);
        const isInside = pos.x >= layerRect.x && pos.x <= layerRect.x + layerRect.width && pos.y >= layerRect.y && pos.y <= layerRect.y + layerRect.height;
  
        if (isInside) {
          interactedWithLayer = true;
          // Interaction is inside the active layer
          if (objectTool === 'resize') {
            const handles = getHandleRects(layerRect);
            for (const [handle, rect] of Object.entries(handles)) {
              if (pos.x >= rect.x && pos.x <= rect.x + rect.width && pos.y >= rect.y && pos.y <= rect.y + rect.height) {
                setIsResizing(true);
                setActiveHandle(handle as ResizeHandle);
                return;
              }
            }
          }
  
          if (objectTool === 'pan') {
            setIsPanning(true);
            return;
          }
        }
      }
    }
  
    // Check if clicking any layer to activate it
    // Iterate from top layer to bottom
    for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (layer.visible) {
            const layerRect = getLayerRect(layer);
            const isInside = pos.x >= layerRect.x && pos.x <= layerRect.x + layerRect.width && pos.y >= layerRect.y && pos.y <= layerRect.y + layerRect.height;
            if (isInside) {
                interactedWithLayer = true;
                if (layer.id !== activeLayerId) {
                    setActiveLayerId(layer.id);
                    setObjectTool('pan');
                }
                // If it's the same layer, let pan/resize logic handle it.
                if (objectTool === 'pan') {
                  setIsPanning(true);
                  return;
                }
                // Prevent falling through to drawing tools if a layer is clicked
                return; 
            }
        }
    }
  
    // If no layer was interacted with, deselect and prepare for drawing
    if (!interactedWithLayer && activeLayerId !== null) {
      setActiveLayerId(null);
      setObjectTool(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Optimization: Check for interaction states first
    if (isResizing && startPoint && activeLayerId && activeHandle) {
        const dx = pos.x - startPoint.x;
        const dy = pos.y - startPoint.y;

        setLayers(prevLayers => prevLayers.map(layer => {
            if (layer.id === activeLayerId) {
                const { ratio } = getLayerRect(layer);
                let { width, height, offset } = { ...layer };
                
                let dw = dx / ratio;
                let dh = dy / ratio;
                let newOffset = { ...offset };

                const aspect = layer.originalWidth / layer.originalHeight;

                if (['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(activeHandle)) {
                    if (Math.abs(dw) > Math.abs(dh)) {
                        dh = (activeHandle.includes('top') ? -1 : 1) * Math.abs(dw / aspect);
                    } else {
                        dw = (activeHandle.includes('left') ? -1 : 1) * Math.abs(dh * aspect);
                    }
                }

                if (activeHandle.includes('right')) { width += dw; }
                if (activeHandle.includes('left')) { width -= dw; newOffset.x += dx; }
                if (activeHandle.includes('bottom')) { height += dh; }
                if (activeHandle.includes('top')) { height -= dh; newOffset.y += dy; }
                
                return { ...layer, width, height, offset: newOffset };
            }
            return layer;
        }));
        
        setStartPoint(pos);
        return; // Exit early
    }

    if (isPanning && startPoint && activeLayerId !== null) {
      const dx = pos.x - startPoint.x;
      const dy = pos.y - startPoint.y;
      setLayers(prevLayers =>
        prevLayers.map(layer =>
          layer.id === activeLayerId
            ? { ...layer, offset: { x: layer.offset.x + dx, y: layer.offset.y + dy } }
            : layer
        )
      );
      setStartPoint(pos);
      return; // Exit early
    }
    
    if (isDrawing) {
        setCurrentPoint(pos);
        if (tool === 'brush') {
            setHistory(prevHistory => {
                const newHistory = [...prevHistory];
                const currentShapes = newHistory[historyIndex];
                const lastShape = currentShapes[currentShapes.length - 1];
                if (lastShape?.type === 'brush') {
                  const updatedShape = { ...lastShape, points: [...lastShape.points, pos] };
                  currentShapes[currentShapes.length - 1] = updatedShape;
                  newHistory[historyIndex] = [...currentShapes];
                }
                return newHistory;
            });
        }
        return;
    }

    if (tool !== 'brush' && tool !== 'arrow' && tool !== 'circle') {
        // Cursor checks if no interaction is active
        if (objectTool === 'resize' && activeLayerId) {
            const activeLayer = layers.find(l => l.id === activeLayerId);
            if (activeLayer) {
                const layerRect = getLayerRect(activeLayer);
                const handles = getHandleRects(layerRect);
                for (const [handle, rect] of Object.entries(handles)) {
                    if (pos.x >= rect.x && pos.x <= rect.x + rect.width && pos.y >= rect.y && pos.y <= rect.y + rect.height) {
                        canvas.style.cursor = getCursorForHandle(handle as ResizeHandle);
                        return;
                    }
                }
            }
        }

        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (layer.visible) {
                const layerRect = getLayerRect(layer);
                if (pos.x >= layerRect.x && pos.x <= layerRect.x + layerRect.width && pos.y >= layerRect.y && pos.y <= layerRect.y + layerRect.height) {
                    canvas.style.cursor = 'move';
                    return;
                }
            }
        }
    }
    
    canvas.style.cursor = 'crosshair';
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (isResizing) {
        setIsResizing(false);
        setStartPoint(null);
    }
    if (activeHandle) setActiveHandle(null);

    if (isDrawing && startPoint && currentPoint) {
      if (tool === 'arrow') {
        setShapes(prev => [...prev, { type: 'arrow', start: startPoint, end: currentPoint, color: colorMap[color], size: brushSize }]);
      } else if (tool === 'circle') {
        const radiusX = Math.abs(currentPoint.x - startPoint.x) / 2;
        const radiusY = Math.abs(currentPoint.y - startPoint.y) / 2;
        const centerX = (startPoint.x + currentPoint.x) / 2;
        const centerY = (startPoint.y + currentPoint.y) / 2;
        setShapes(prev => [...prev, { type: 'circle', center: {x: centerX, y: centerY}, radiusX, radiusY, color: colorMap[color], size: brushSize }]);
      }
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };
  
  const addImageLayer = (src: string, name: string, isFromUrl = false) => {
    if (layers.length >= 5) {
      toast({
        variant: "destructive",
        title: "Layer Limit Reached",
        description: "You can only have up to 5 image layers.",
      });
      return;
    }

    const img = new Image();
    if (isFromUrl) {
      img.crossOrigin = "Anonymous";
    }
    img.src = src;
    img.onload = () => {
      const newLayer: ImageLayer = {
        id: Date.now(),
        image: img,
        offset: { x: 0, y: 0 },
        visible: true,
        name: name,
        width: img.width,
        height: img.height,
        originalWidth: img.width,
        originalHeight: img.height,
      };
      setLayers(prev => [...prev, newLayer]);
      setActiveLayerId(newLayer.id);
      setObjectTool('pan');
      setTool(null as any); // Deselect drawing tool
      if (layers.length === 0) {
        setHistory([[]]);
        setHistoryIndex(0);
      }
      setIsLayersPanelOpen(true);
    };
    img.onerror = async () => {
      if(isFromUrl) {
        const { errorMessage } = await checkCorsAndGetErrorMessage({ imageUrl: src });
        toast({
            variant: "destructive",
            title: "Image Load Error",
            description: errorMessage || "Could not load image. It might be due to server restrictions (CORS) or an invalid URL.",
        });
      } else {
        toast({
            variant: "destructive",
            title: "Image Load Error",
            description: "The selected file could not be loaded as an image.",
        });
      }
    };
  };

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (layers.length + i >= 5) {
          toast({
            variant: "destructive",
            title: "Layer Limit Reached",
            description: `You can only have up to 5 image layers. Some files were not loaded.`,
          });
          break;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          if(event.target?.result) {
            addImageLayer(event.target.result as string, file.name);
          }
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    }
  };

  const handleUrlLoad = (url: string) => {
    const urlName = url.substring(url.lastIndexOf('/') + 1) || 'Image from URL';
    addImageLayer(url, urlName, true);
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
            const url = URL.createObjectURL(blob);
            addImageLayer(url, 'Pasted image');
        }
        e.preventDefault();
        break;
      }
    }
  }, [layers]); // eslint-disable-line react-hooks/exhaustive-deps
  
  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);
  
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history.length]);
  
  const deleteLayer = useCallback((id: number) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) {
        const newLayers = layers.filter(l => l.id !== id);
        setActiveLayerId(newLayers.length > 0 ? newLayers[newLayers.length-1].id : null);
        setObjectTool(null);
    }
  }, [activeLayerId, layers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
        return;
      }
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeLayerId !== null) {
          const target = e.target as HTMLElement;
          // Prevent deleting text in an input field
          if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') {
              return;
          }
          e.preventDefault();
          deleteLayer(activeLayerId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo, activeLayerId, deleteLayer]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Temporarily deactivate object tool for clean export
    const currentObjectTool = objectTool;
    const currentActiveLayerId = activeLayerId;
    setObjectTool(null);
    setActiveLayerId(null);

    // Redraw canvas without any object tool indicators
    requestAnimationFrame(() => {
        drawAll();

        const link = document.createElement('a');
        link.download = 'dark-canvas.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Restore object tool and active layer
        setActiveLayerId(currentActiveLayerId);
        setObjectTool(currentObjectTool);
    });
  };

  const toggleLayerVisibility = (id: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };
  
  const handleSetActiveLayerId = (id: number | null) => {
    setActiveLayerId(id);
    if (id !== null) {
        setObjectTool('pan');
        setTool(null as any);
    } else {
        setObjectTool(null);
        if (!tool) setTool('brush');
    }
  }

  const toggleLayersPanel = () => setIsLayersPanelOpen(prev => !prev);
  
  const handleSetTool = (newTool: Tool) => {
      setTool(newTool);
      if (activeLayerId) {
          setActiveLayerId(null);
          setObjectTool(null);
      }
  }

  const getCanvasCursor = () => {
    if (isPanning) return 'grabbing';
    if (isResizing) return activeHandle ? getCursorForHandle(activeHandle) : 'default';

    if (activeLayerId !== null && tool === null) {
        if (objectTool === 'pan') return 'move';
        if (objectTool === 'resize') return 'default';
    }
    return 'crosshair';
  }

  return (
    <SidebarProvider>
      <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
        <Toolbar
          tool={tool}
          setTool={handleSetTool}
          color={color}
          setColor={setColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          onUpload={handleUpload}
          onUrlLoad={handleUrlLoad}
          onExport={handleExport}
          isLayersPanelOpen={isLayersPanelOpen}
          toggleLayersPanel={toggleLayersPanel}
        />
        <div className="flex flex-1 overflow-hidden">
            <SidebarInset>
                <main ref={mainRef} className="flex-1 relative bg-[#121212] h-full">
                    {activeLayerId !== null && (
                      <ObjectToolbar
                          objectTool={objectTool}
                          setObjectTool={setObjectTool}
                      />
                    )}
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="absolute top-0 left-0"
                        style={{ cursor: getCanvasCursor() }}
                    />
                </main>
            </SidebarInset>
            
            {isLayersPanelOpen && (
                <aside className="w-64 bg-[#0E0E0E] border-l border-zinc-800/50 flex flex-col transition-all duration-300">
                    <LayersPanel
                        layers={layers}
                        activeLayerId={activeLayerId}
                        setActiveLayerId={handleSetActiveLayerId}
                        toggleLayerVisibility={toggleLayerVisibility}
                        deleteLayer={deleteLayer}
                    />
                </aside>
            )}
        </div>
        <footer className="bg-[#0E0E0E] border-t border-zinc-800/50 p-2 text-center text-xs text-zinc-500">
            as easy as it gets
        </footer>
      </div>
    </SidebarProvider>
  );
}
