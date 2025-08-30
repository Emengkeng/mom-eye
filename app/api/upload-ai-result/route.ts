// app/api/create-upload-preset/route.ts
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST() {
  try {
    const preset = await cloudinary.api.create_upload_preset({
      name: 'ml_mom_eye',
      unsigned: true,
      //folder: 'momeye',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      max_file_size: 10000000, // 10MB
      unique_filename: true,
      overwrite: false,
    });

    return NextResponse.json({
      success: true,
      preset: preset,
      message: 'Upload preset created successfully'
    });
  } catch (error) {
    console.error('Create preset error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create upload preset', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}