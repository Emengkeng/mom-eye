import React, { useState } from 'react';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/actions/user.actions';
import Header from '@/components/shared/Header';
import ObjectDetector from '@/components/shared/ObjectDetector'; //
import UltraOptimizedDetector from '@/components/shared/UltraOptimizedDetector'; // New real-time component
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Zap, Upload, Settings } from 'lucide-react';

const ObjectDetectionPage = async () => {
  const { userId } = auth();
  
  if (!userId) redirect('/sign-in');

  const user = await getUserById(userId);

  return (
    <>
      <Header 
        title="AI Object Detection Suite"
        subtitle="Advanced spatial understanding with real-time streaming and static image analysis"
      />
      
      <section className="mt-6">
        <Tabs defaultValue="realtime" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Zap size={16} />
              Ultra Real-time Detection
              <span className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                NEW
              </span>
            </TabsTrigger>
            <TabsTrigger value="static" className="flex items-center gap-2">
              <Upload size={16} />
              Static Image Detection
            </TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="mt-6">
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Zap className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">Ultra Real-time Detection</h3>
                  <p className="text-sm text-purple-700 mt-1">
                    Stream your camera feed and detect objects in real-time with advanced AI optimizations. 
                    Features smart tracking, adaptive quality, and frame difference detection to minimize API costs.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                      🧠 Smart Object Tracking
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      ⚡ Adaptive Quality
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      🎯 Frame Difference Detection
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                      💰 Cost Optimized
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <UltraOptimizedDetector 
              userId={user._id}
              creditBalance={user.creditBalance}
            />
          </TabsContent>

          <TabsContent value="static" className="mt-6">
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Camera className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Static Image Detection</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Upload images or take photos for detailed object detection analysis. 
                    Perfect for thorough examination of static scenes with multiple detection types.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      📦 2D Bounding Boxes
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      🎯 Point Detection
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                      🔍 Segmentation Masks
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                      📐 3D Bounding Boxes
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <ObjectDetector 
              userId={user._id}
              creditBalance={user.creditBalance}
            />
          </TabsContent>
        </Tabs>
      </section>

      {/* Feature Comparison Section */}
      <section className="mt-12 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4 text-center">Feature Comparison</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Feature</th>
                  <th className="text-center p-3">
                    <div className="flex items-center justify-center gap-1">
                      <Zap size={16} />
                      Real-time
                    </div>
                  </th>
                  <th className="text-center p-3">
                    <div className="flex items-center justify-center gap-1">
                      <Upload size={16} />
                      Static
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b">
                  <td className="p-3">Live camera streaming</td>
                  <td className="text-center p-3">✅</td>
                  <td className="text-center p-3">❌</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Object tracking & prediction</td>
                  <td className="text-center p-3">✅</td>
                  <td className="text-center p-3">❌</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Adaptive quality control</td>
                  <td className="text-center p-3">✅</td>
                  <td className="text-center p-3">❌</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Multiple detection types</td>
                  <td className="text-center p-3">🎯 Points only</td>
                  <td className="text-center p-3">✅ All types</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Cost optimization</td>
                  <td className="text-center p-3">✅ Advanced</td>
                  <td className="text-center p-3">⚠️ Basic</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Best for</td>
                  <td className="text-center p-3">Room scanning, live search</td>
                  <td className="text-center p-3">Detailed analysis, documentation</td>
                </tr>
                <tr>
                  <td className="p-3">Typical cost per minute</td>
                  <td className="text-center p-3">6-18 credits</td>
                  <td className="text-center p-3">5-8 credits per image</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Performance Tips */}
      <section className="mb-8">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
          <h3 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
            <Settings size={20} />
            Pro Tips for Maximum Efficiency
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6 text-sm text-amber-800">
            <div>
              <h4 className="font-medium mb-2">🚀 Real-time Mode:</h4>
              <ul className="space-y-1">
                <li>• Enable all AI optimizations for 70% cost reduction</li>
                <li>• Use 2-3 second intervals for balanced performance</li>
                <li>• Keep device steady for better object tracking</li>
                <li>• Orange dots show AI predictions (free!)</li>
                <li>• Cyan dots are live detections (costs credits)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">📸 Static Mode:</h4>
              <ul className="space-y-1">
                <li>• Use for detailed analysis and documentation</li>
                <li>• Try different detection types for various needs</li>
                <li>• 3D bounding boxes work best with depth info</li>
                <li>• Segmentation masks for precise boundaries</li>
                <li>• Take clear, well-lit photos for best results</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ObjectDetectionPage;