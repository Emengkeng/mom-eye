import { GoogleGenAI } from '@google/genai';
import { NextResponse } from "next/server";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const model = 'models/gemini-2.0-flash-001';

// Define transformation types that match our frontend
type TransformationType = 'fill' | 'remove' | 'recolor' | 'restore' | 'removeBackground';

interface ImageEditRequest {
  transformationType: TransformationType;
  imageData: string; // base64 image data
  userInput?: {
    prompt?: string;
    color?: string;
    aspectRatio?: string;
    title?: string;
  };
}

/**
 * Generate transformation-specific prompts for actual image editing
 */
function generateEditingPrompt(transformationType: TransformationType, userInput?: ImageEditRequest['userInput']): string {
  const editingPrompts = {
    fill: `Edit this image by performing generative fill to expand the image content.
    ${userInput?.aspectRatio ? `Maintain the aspect ratio: ${userInput.aspectRatio}` : ''}
    Fill in any empty or extended areas with appropriate content that matches the existing image style, lighting, and composition.
    Return the edited image with the expanded content.`,

    remove: `Edit this image by removing the specified object or element.
    ${userInput?.prompt ? `Remove: ${userInput.prompt}` : 'Remove the main subject or unwanted element'}
    Intelligently fill in the background where the object was removed to create a natural, seamless result.
    Maintain the original lighting, shadows, and perspective.
    Return the edited image with the object completely removed.`,

    recolor: `Edit this image by changing the color of the specified object.
    ${userInput?.prompt ? `Target object: ${userInput.prompt}` : 'Change the color of the main object'}
    ${userInput?.color ? `New color: ${userInput.color}` : 'Use a complementary color'}
    Maintain realistic lighting, shadows, and reflections with the new color.
    Ensure the color change looks natural and fits the scene.
    Return the edited image with the recolored object.`,

    restore: `Edit this image by enhancing and restoring its quality.
    Improve image sharpness, reduce noise, fix artifacts, enhance details.
    Restore faded colors, improve contrast and brightness naturally.
    Fix any visible damage, scratches, or imperfections.
    Return the enhanced and restored version of the image.`,

    removeBackground: `Edit this image by removing the background completely.
    Create a clean cutout of the main subject with transparent background.
    Ensure clean, precise edges around the subject.
    Handle complex areas like hair, fur, or transparent objects carefully.
    Return the image with the subject isolated on a transparent background.`
  };

  return editingPrompts[transformationType];
}

/**
 * API route for AI-powered image editing
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const data: ImageEditRequest = await req.json();
    const { transformationType, imageData, userInput } = data;

    // Validate required fields
    if (!transformationType || !imageData) {
      return NextResponse.json(
        { error: 'Missing required fields: transformationType and imageData' },
        { status: 400 }
      );
    }

    // Generate transformation-specific editing prompt
    const prompt = generateEditingPrompt(transformationType, userInput);

    // Prepare image data (remove data URL prefix if present)
    const cleanImageData = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

    // Generate edited image using Gemini AI
    const result = await genAI.models.generateContent({
      model,
      contents: [
        {
          //role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanImageData,
                mimeType: 'image/png',
              },
            },
            {text: prompt},
          ],
        },
      ],
    })
    const response = await result;
    
    // Check if the response contains an image
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const candidate = candidates[0];
      
      // Look for image data in the response
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
            // Return the edited image
            return NextResponse.json({
              success: true,
              transformationType,
              editedImageData: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
              userInput,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }

    // If no image was generated, return an error
    return NextResponse.json(
      { 
        error: 'No edited image was generated',
        details: 'The AI model did not return an edited image. This transformation may not be supported or the image may not be suitable for editing.'
      },
      { status: 422 }
    );

  } catch (error) {
    console.error('Image Editing Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to edit image', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve supported transformation types
 */
export async function GET(): Promise<Response> {
  return NextResponse.json({
    supportedTransformations: [
      { type: 'fill', description: 'Generative fill for aspect ratio changes' },
      { type: 'remove', description: 'Remove specific objects from images' },
      { type: 'recolor', description: 'Change colors of specific objects' },
      { type: 'restore', description: 'Enhance and restore image quality' },
      { type: 'removeBackground', description: 'Remove background and create cutout' },
    ],
    note: 'All transformations return edited images, not analysis'
  });
}