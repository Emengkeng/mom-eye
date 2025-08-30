"use client"

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, Search, X, Loader2 } from 'lucide-react';

interface Point {
  x: number;
  y: number;
  label: string;
}

const ObjectDetector: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [detectedImage, setDetectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<{ points?: Point[] }>({});
  const [showLabels, setShowLabels] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string);
        setDetectedImage(null);
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
        setOriginalImage(dataURL);
        setDetectedImage(null);
        setResults({});
        
        stream.getTracks().forEach(track => track.stop());
      });
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  // Generate prompt for point detection
  const generatePrompt = (query: string): string => {
    const searchTerm = query.trim() || 'objects';
    return `Point to the ${searchTerm} with no more than 10 items. The answer should follow the json format: [{"point": <point>, "label": <label>}, ...]. The points are in [y, x] format normalized to 0-1000.`;
  };

  // Process detection results
  const processResults = (response: any) => {
    return {
      points: response.map((item: any) => ({
        x: item.point[1] / 1000,
        y: item.point[0] / 1000,
        label: item.label
      }))
    };
  };

  // Perform object detection
  const handleDetection = async () => {
    if (!originalImage) {
      alert('Please upload an image or take a photo first.');
      return;
    }

    if (!searchQuery.trim()) {
      alert('Please specify what you want to find in the image.');
      return;
    }

    setIsLoading(true);
    try {
      const prompt = generatePrompt(searchQuery);
      
      const response = await fetch('/api/gemini-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: originalImage,
          prompt: prompt,
          detectionType: 'Points',
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error('Detection failed');
      }

      const data = await response.json();
      
      if (data.success && data.results) {
        const processedResults = processResults(data.results);
        setResults(processedResults);
        setDetectedImage(originalImage); // For now, same as original
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
    setOriginalImage(null);
    setDetectedImage(null);
    setResults({});
    setSearchQuery('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const ResultsList = () => {
    if (!results.points?.length) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Found Objects</h3>
          <span className="text-sm text-gray-600">
            {results.points.length} items detected
          </span>
        </div>
        
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {results.points.map((point, index) => (
            <div 
              key={index}
              className="flex items-center justify-between text-sm p-3 bg-white rounded border hover:bg-blue-50"
            >
              <span className="font-medium flex-1">{point.label}</span>
              <span className="text-gray-500 text-xs">
                Position: {Math.round(point.x * 100)}%, {Math.round(point.y * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ImageDisplay = ({ image, title, showOverlay = false }: { 
    image: string; 
    title: string; 
    showOverlay?: boolean;
  }) => (
    <div className="flex flex-col gap-4">
      <div className="flex-between">
        <h3 className="h3-bold text-dark-600">{title}</h3>
        {showOverlay && results.points?.length && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="rounded"
            />
            Show labels
          </label>
        )}
      </div>

      <div className="relative inline-block max-w-full">
        <img
          src={image}
          alt={title}
          className="w-full h-auto rounded-lg shadow-sm max-h-96 object-contain"
        />

        {/* Points Overlay */}
        {showOverlay && results.points && (
          <div className="absolute inset-0">
            {results.points.map((point, index) => {
              const truncatedLabel = point.label.length > 20 
                ? `${point.label.substring(0, 20)}...` 
                : point.label;
              
              return (
                <div
                  key={index}
                  className="absolute group"
                  style={{
                    left: `${point.x * 100}%`,
                    top: `${point.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="relative">
                    {/* Glowing ring animation */}
                    <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    {/* Main detection point */}
                    <div className="relative w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-all duration-200 animate-pulse"></div>
                  </div>
                  
                  {showLabels && (
                    <div className="bg-green-500 text-white text-xs px-2 py-1 absolute -top-8 left-1/2 transform -translate-x-1/2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                      {truncatedLabel}
                    </div>
                  )}
                  
                  {point.label.length > 20 && (
                    <div className="bg-gray-900 text-white text-xs px-3 py-2 absolute -top-14 left-1/2 transform -translate-x-1/2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 max-w-xs whitespace-normal">
                      {point.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
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

          {originalImage && (
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

        {/* Search Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            What would you like to find in the image?
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., books, keys, tools, people, cars, etc."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleDetection()}
            />
            <Button 
              onClick={handleDetection}
              disabled={!originalImage || isLoading || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Images Section */}
      {originalImage && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Original Image */}
            <ImageDisplay image={originalImage} title="Original" />

            {/* Detected Image */}
            {detectedImage ? (
              <ImageDisplay 
                image={detectedImage} 
                title="Detected" 
                showOverlay={true}
              />
            ) : (
              <div className="flex flex-col gap-4">
                <h3 className="h3-bold text-dark-600">Detected</h3>
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-500">Detection results will appear here</p>
                </div>
              </div>
            )}
          </div>

          {/* Results List */}
          <ResultsList />
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Quick Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific in your search (e.g., "red book" instead of "object")</li>
          <li>• The AI will point to and label the objects it finds</li>
          <li>• Hover over the red dots to see object labels</li>
          <li>• Works best with clear, well-lit images</li>
        </ul>
      </div>
    </div>
  );
};

export default ObjectDetector;