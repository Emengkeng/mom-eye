"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, Search, MapPin, Eye, X, Loader2 } from 'lucide-react';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence?: number;
}

interface Point {
  x: number;
  y: number;
  label: string;
}

interface SegmentationMask extends BoundingBox {
  imageData: string;
}

type DetectionType = '2D bounding boxes' | 'Segmentation masks' | 'Points' | '3D bounding boxes';

const ObjectDetector: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detectionType, setDetectionType] = useState<DetectionType>('2D bounding boxes');
  const [searchQuery, setSearchQuery] = useState('items');
  const [results, setResults] = useState<{
    boundingBoxes?: BoundingBox[];
    points?: Point[];
    masks?: SegmentationMask[];
  }>({});
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [temperature, setTemperature] = useState(0.5);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setResults({});
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera capture
  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      streamRef.current = stream;
      
      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        const dataURL = canvas.toDataURL('image/png');
        setImage(dataURL);
        setResults({});
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      });
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  // Generate prompts based on detection type
  const generatePrompt = (type: DetectionType, query: string): string => {
    switch (type) {
      case '2D bounding boxes':
        return `Detect ${query}, with no more than 20 items. Output a json list where each entry contains the 2D bounding box in "box_2d" and a descriptive text label in "label".`;
      
      case 'Segmentation masks':
        return `Give the segmentation masks for ${query}. Output a JSON list of segmentation masks where each entry contains the 2D bounding box in the key "box_2d", the segmentation mask in key "mask", and the text label in the key "label". Use descriptive labels.`;
      
      case 'Points':
        return `Point to the ${query} with no more than 10 items. The answer should follow the json format: [{"point": <point>, "label": <label>}, ...]. The points are in [y, x] format normalized to 0-1000.`;
      
      case '3D bounding boxes':
        return `Output in json. Detect the 3D bounding boxes of ${query}, output no more than 10 items. Return a list where each entry contains the object name in "label" and its 3D bounding box in "box_3d".`;
      
      default:
        return `Detect ${query} in this image and provide their locations.`;
    }
  };

  // Process detection results
  const processResults = (response: any, type: DetectionType) => {
    switch (type) {
      case '2D bounding boxes':
        return {
          boundingBoxes: response.map((item: any) => {
            const [ymin, xmin, ymax, xmax] = item.box_2d;
            return {
              x: xmin / 1000,
              y: ymin / 1000,
              width: (xmax - xmin) / 1000,
              height: (ymax - ymin) / 1000,
              label: item.label,
              confidence: item.confidence || 0.8
            };
          })
        };
      
      case 'Points':
        return {
          points: response.map((item: any) => ({
            x: item.point[1] / 1000,
            y: item.point[0] / 1000,
            label: item.label
          }))
        };
      
      case 'Segmentation masks':
        return {
          masks: response.map((item: any) => {
            const [ymin, xmin, ymax, xmax] = item.box_2d;
            return {
              x: xmin / 1000,
              y: ymin / 1000,
              width: (xmax - xmin) / 1000,
              height: (ymax - ymin) / 1000,
              label: item.label,
              imageData: item.mask
            };
          })
        };
      
      default:
        return {};
    }
  };

  // Perform object detection
  const handleDetection = async () => {
    if (!image) {
      alert('Please upload an image or take a photo first.');
      return;
    }

    setIsLoading(true);
    try {
      const prompt = generatePrompt(detectionType, searchQuery);
      
      const response = await fetch('/api/gemini-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: image,
          prompt: prompt,
          detectionType: detectionType,
          temperature: temperature,
        }),
      });

      if (!response.ok) {
        throw new Error('Detection failed');
      }

      const data = await response.json();
      
      if (data.success && data.results) {
        setResults(processResults(data.results, detectionType));
      } else {
        throw new Error(data.error || 'No results returned');
      }
    } catch (error) {
      console.error('Detection error:', error);
      alert('Detection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all results and image
  const clearAll = () => {
    setImage(null);
    setResults({});
    setSearchQuery('items');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Object Detection & Search</h1>
        <p className="text-gray-600">Find and identify objects in your images using AI-powered spatial understanding</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Upload/Camera Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload size={16} />
              Upload Image
            </Button>
            <Button 
              onClick={handleCameraCapture}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Camera size={16} />
              Take Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Clear Button */}
          {image && (
            <Button 
              onClick={clearAll}
              variant="outline"
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <X size={16} />
              Clear
            </Button>
          )}
        </div>

        {/* Detection Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Detection Type</label>
            <Select value={detectionType} onValueChange={(value) => setDetectionType(value as DetectionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2D bounding boxes">Bounding Boxes</SelectItem>
                <SelectItem value="Points">Point Detection</SelectItem>
                <SelectItem value="Segmentation masks">Segmentation</SelectItem>
                <SelectItem value="3D bounding boxes">3D Boxes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Search For</label>
            <Input
              placeholder="e.g., books, keys, tools, parts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Temperature</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-8">{temperature}</span>
            </div>
          </div>
        </div>

        {/* Detection Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleDetection}
            disabled={!image || isLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search size={16} />
                Detect Objects
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Image Display and Results */}
      {image && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="relative">
            {/* Controls for results display */}
            {(results.boundingBoxes?.length || results.points?.length || results.masks?.length) && (
              <div className="mb-4 flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                  />
                  <span className="text-sm">Show labels</span>
                </label>
                <div className="text-sm text-gray-600">
                  Found: {(results.boundingBoxes?.length || 0) + (results.points?.length || 0) + (results.masks?.length || 0)} items
                </div>
              </div>
            )}

            {/* Image Container */}
            <div className="relative inline-block max-w-full">
              <img
                ref={imageRef}
                src={image}
                alt="Detection target"
                className="max-w-full h-auto rounded-lg shadow-sm"
              />

              {/* Bounding Boxes Overlay */}
              {results.boundingBoxes && (
                <div className="absolute inset-0">
                  {results.boundingBoxes.map((box, index) => (
                    <div
                      key={index}
                      className={`absolute border-2 border-blue-500 ${
                        hoveredItem === index ? 'bg-blue-500/20' : ''
                      } transition-all duration-200`}
                      style={{
                        left: `${box.x * 100}%`,
                        top: `${box.y * 100}%`,
                        width: `${box.width * 100}%`,
                        height: `${box.height * 100}%`,
                      }}
                      onMouseEnter={() => setHoveredItem(index)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {showLabels && (
                        <div className="bg-blue-500 text-white text-xs px-2 py-1 absolute -top-6 left-0 rounded whitespace-nowrap">
                          {box.label}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Points Overlay */}
              {results.points && (
                <div className="absolute inset-0">
                  {results.points.map((point, index) => (
                    <div
                      key={index}
                      className="absolute"
                      style={{
                        left: `${point.x * 100}%`,
                        top: `${point.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                      {showLabels && (
                        <div className="bg-red-500 text-white text-xs px-2 py-1 absolute -top-8 left-1/2 transform -translate-x-1/2 rounded whitespace-nowrap">
                          {point.label}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Segmentation Masks Overlay */}
              {results.masks && (
                <div className="absolute inset-0">
                  {results.masks.map((mask, index) => (
                    <div
                      key={index}
                      className={`absolute border-2 border-green-500 ${
                        hoveredItem === index ? 'bg-green-500/30' : 'bg-green-500/10'
                      } transition-all duration-200`}
                      style={{
                        left: `${mask.x * 100}%`,
                        top: `${mask.y * 100}%`,
                        width: `${mask.width * 100}%`,
                        height: `${mask.height * 100}%`,
                      }}
                      onMouseEnter={() => setHoveredItem(index)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {showLabels && (
                        <div className="bg-green-500 text-white text-xs px-2 py-1 absolute -top-6 left-0 rounded whitespace-nowrap">
                          {mask.label}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results Summary */}
          {(results.boundingBoxes?.length || results.points?.length || results.masks?.length) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Detection Results</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {results.boundingBoxes?.map((box, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between text-sm p-2 bg-white rounded border hover:bg-blue-50 cursor-pointer"
                    onMouseEnter={() => setHoveredItem(index)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <span className="font-medium">{box.label}</span>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={14} />
                      <span>{Math.round(box.x * 100)}%, {Math.round(box.y * 100)}%</span>
                    </div>
                  </div>
                ))}
                {results.points?.map((point, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between text-sm p-2 bg-white rounded border hover:bg-red-50"
                  >
                    <span className="font-medium">{point.label}</span>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={14} />
                      <span>{Math.round(point.x * 100)}%, {Math.round(point.y * 100)}%</span>
                    </div>
                  </div>
                ))}
                {results.masks?.map((mask, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between text-sm p-2 bg-white rounded border hover:bg-green-50 cursor-pointer"
                    onMouseEnter={() => setHoveredItem(index)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <span className="font-medium">{mask.label}</span>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Eye size={14} />
                      <span>Segmented</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Usage Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Usage Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific in your search (e.g., "red book" instead of "object")</li>
          <li>• Use bounding boxes for general object detection</li>
          <li>• Use points for precise location marking</li>
          <li>• Use segmentation for detailed object boundaries</li>
          <li>• Try different temperature values for varied results</li>
        </ul>
      </div>
    </div>
  );
};

export default ObjectDetector;