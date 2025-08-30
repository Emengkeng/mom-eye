import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

type DetectionType = '2D bounding boxes' | 'Segmentation masks' | 'Points' | '3D bounding boxes';

interface DetectionRequest {
  imageData: string;
  prompt: string;
  detectionType: DetectionType;
  temperature?: number;
}

export async function POST(req: NextRequest) {
  try {
    const { imageData, prompt, detectionType, temperature = 0.5 }: DetectionRequest = await req.json();

    if (!imageData || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: imageData and prompt' },
        { status: 400 }
      );
    }

    // Choose the appropriate model based on detection type
    let model = 'models/gemini-2.5-flash';
    const config: {
      temperature: number;
      thinkingConfig?: { thinkingBudget: number };
    } = {
      temperature,
    };

    if (detectionType === '3D bounding boxes') {
      // 3D works better with 2.0 Flash
      model = 'models/gemini-2.0-flash';
    } else {
      // Disable thinking for 2.5 Flash for spatial understanding tasks
      config.thinkingConfig = { thinkingBudget: 0 };
    }

    // Clean the image data (remove data URL prefix if present)
    const cleanImageData = imageData.replace(/^data:image\/[^;]+;base64,/, '');

    // Make the request to Gemini
    const result = await genAI.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanImageData,
                mimeType: 'image/png',
              },
            },
            { text: prompt },
          ],
        },
      ],
      config,
    });

    let responseText = result.text;

    // Extract JSON from markdown code blocks if present
    if (responseText.includes('```json')) {
      responseText = responseText.split('```json')[1].split('```')[0];
    } else if (responseText.includes('```')) {
      // Handle other code block formats
      const codeBlocks = responseText.split('```');
      for (let i = 1; i < codeBlocks.length; i += 2) {
        try {
          JSON.parse(codeBlocks[i]);
          responseText = codeBlocks[i];
          break;
        } catch {
          continue;
        }
      }
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json(
        { 
          error: 'Failed to parse AI response', 
          details: 'The AI returned an invalid JSON format',
          rawResponse: responseText 
        },
        { status: 422 }
      );
    }

    // Validate the response structure based on detection type
    if (!Array.isArray(parsedResponse)) {
      return NextResponse.json(
        { error: 'Invalid response format: expected an array' },
        { status: 422 }
      );
    }

    // Basic validation for each detection type
    const isValidResponse = validateDetectionResponse(parsedResponse, detectionType);
    if (!isValidResponse) {
      return NextResponse.json(
        { 
          error: 'Invalid detection response structure', 
          detectionType,
          sampleItem: parsedResponse[0] 
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      detectionType,
      results: parsedResponse,
      count: parsedResponse.length,
      model: model,
      temperature,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Gemini detection error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('safety')) {
        return NextResponse.json(
          { error: 'Content filtered for safety reasons.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Detection failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Validate the detection response based on the detection type
 */
function validateDetectionResponse(response: any[], detectionType: DetectionType): boolean {
  if (response.length === 0) return true; // Empty response is valid

  const sampleItem = response[0];

  switch (detectionType) {
    case '2D bounding boxes':
      return (
        sampleItem.hasOwnProperty('box_2d') &&
        sampleItem.hasOwnProperty('label') &&
        Array.isArray(sampleItem.box_2d) &&
        sampleItem.box_2d.length === 4 &&
        typeof sampleItem.label === 'string'
      );

    case 'Points':
      return (
        sampleItem.hasOwnProperty('point') &&
        sampleItem.hasOwnProperty('label') &&
        Array.isArray(sampleItem.point) &&
        sampleItem.point.length === 2 &&
        typeof sampleItem.label === 'string'
      );

    case 'Segmentation masks':
      return (
        sampleItem.hasOwnProperty('box_2d') &&
        sampleItem.hasOwnProperty('label') &&
        sampleItem.hasOwnProperty('mask') &&
        Array.isArray(sampleItem.box_2d) &&
        sampleItem.box_2d.length === 4 &&
        typeof sampleItem.label === 'string'
      );

    case '3D bounding boxes':
      return (
        sampleItem.hasOwnProperty('box_3d') &&
        sampleItem.hasOwnProperty('label') &&
        Array.isArray(sampleItem.box_3d) &&
        sampleItem.box_3d.length === 9 &&
        typeof sampleItem.label === 'string'
      );

    default:
      return false;
  }
}

/**
 * GET endpoint to retrieve information about supported detection types
 */
export async function GET() {
  return NextResponse.json({
    supportedDetectionTypes: [
      {
        type: '2D bounding boxes',
        description: 'Detect objects and draw rectangular bounding boxes around them',
        useCases: ['Object detection', 'Item counting', 'General purpose detection'],
        responseFormat: { box_2d: [0, 0, 100, 100], label: 'object_name' }
      },
      {
        type: 'Points',
        description: 'Mark precise points on objects of interest',
        useCases: ['Landmark detection', 'Key point identification', 'Specific feature marking'],
        responseFormat: { point: [500, 500], label: 'feature_name' }
      },
      {
        type: 'Segmentation masks',
        description: 'Create detailed masks outlining object boundaries',
        useCases: ['Precise object segmentation', 'Background removal', 'Advanced analysis'],
        responseFormat: { box_2d: [0, 0, 100, 100], mask: 'image_data', label: 'object_name' }
      },
      {
        type: '3D bounding boxes',
        description: 'Detect objects in 3D space with orientation and depth',
        useCases: ['3D scene understanding', 'Spatial analysis', 'AR/VR applications'],
        responseFormat: { box_3d: [0, 0, 0, 1, 1, 1, 0, 0, 0], label: 'object_name' }
      }
    ],
    models: {
      '2D bounding boxes': 'gemini-2.5-flash (no thinking)',
      'Points': 'gemini-2.5-flash (no thinking)',
      'Segmentation masks': 'gemini-2.5-flash (no thinking)',
      '3D bounding boxes': 'gemini-2.0-flash'
    },
    limits: {
      maxItems: 20,
      supportedFormats: ['PNG', 'JPEG', 'WebP'],
      maxFileSize: '10MB'
    }
  });
}