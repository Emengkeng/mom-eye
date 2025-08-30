<div align="center">
  <br />
  <div>
    <img src="https://img.shields.io/badge/-Next_JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000" alt="nextdotjs" />
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
    <img src="https://img.shields.io/badge/-Google_Gemini-black?style=for-the-badge&logoColor=white&logo=google&color=4285F4" alt="gemini" />
    <img src="https://img.shields.io/badge/-Stripe-black?style=for-the-badge&logoColor=white&logo=stripe&color=008CDD" alt="stripe" />
    <img src="https://img.shields.io/badge/-MongoDB-black?style=for-the-badge&logoColor=white&logo=mongodb&color=47A248" alt="mongodb" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
  </div>

  <h3 align="center">AI SaaS Platform with Advanced Object Detection</h3>

   <div align="center">
     An extended AI image processing platform featuring Gemini-powered object detection alongside comprehensive image transformation capabilities.
    </div>
</div>

## 📋 Table of Contents

1. 🤖 [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🎯 [Object Detection Features](#object-detection-features)
5. 🤸 [Quick Start](#quick-start)
6. 🔧 [Environment Variables](#environment-variables)
7. 📊 [API Endpoints](#api-endpoints)
8. 🙏 [Credits](#credits)

## 🤖 Introduction

This is an extended AI image SaaS platform that builds upon traditional image processing capabilities with advanced object detection features powered by Google's Gemini AI. The platform combines secure payment infrastructure, advanced image search functionalities, and multiple AI features including image restoration, recoloring, object removal, generative filling, background removal, and comprehensive object detection with real-time visual feedback.

## ⚙️ Tech Stack

- Next.js 14
- TypeScript
- MongoDB
- Clerk (Authentication)
- Cloudinary (Image Processing)
- Google Gemini AI (Object Detection)
- Stripe (Payments)
- Shadcn/ui
- TailwindCSS

## 🔋 Core Features

👉 **Authentication and Authorization**: Secure user access with registration, login, and route protection

👉 **Community Image Showcase**: Explore user transformations with easy navigation using pagination

👉 **Advanced Image Search**: Find images by content or objects present inside the image quickly and accurately

👉 **Image Restoration**: Revive old or damaged images effortlessly

👉 **Image Recoloring**: Customize images by replacing objects with desired colors easily

👉 **Image Generative Fill**: Fill in missing areas of images seamlessly

👉 **Object Removal**: Clean up images by removing unwanted objects with precision

👉 **Background Removal**: Extract objects from backgrounds with ease

👉 **Download Transformed Images**: Save and share AI-transformed images conveniently

👉 **Transformed Image Details**: View details of transformations for each image

👉 **Transformation Management**: Control over deletion and updates of transformations

👉 **Credits System**: Earn or purchase credits for image transformations

👉 **Profile Page**: Access transformed images and credit information personally

👉 **Credits Purchase**: Securely buy credits via Stripe for uninterrupted use

👉 **Responsive UI/UX**: A seamless experience across devices with a user-friendly interface

## 🎯 Object Detection Features

🔍 **AI-Powered Object Detection**: Powered by Google Gemini 2.5 Flash and 2.0 Flash models

🎯 **Multiple Detection Types**: 
- 2D Bounding Boxes
- Segmentation Masks  
- Point Detection
- 3D Bounding Boxes

📷 **Flexible Image Input**: 
- File upload support
- Real-time camera capture
- Base64 image processing

✨ **Interactive Visual Feedback**:
- Animated green detection points with expanding glow rings
- Side-by-side original vs detected image comparison
- Hover tooltips with object labels
- Smart label truncation for long descriptions

🎮 **User-Friendly Interface**:
- Simplified controls optimized for non-technical users
- Default temperature settings (0.3) for optimal results  
- Quick tips for better detection accuracy
- Expandable labels with "Read more/Show less" functionality

🔧 **Advanced API Integration**:
- Dynamic model selection based on detection type
- Robust error handling for quota and safety issues
- JSON response parsing with fallback mechanisms
- Comprehensive validation and sanitization

## 🤸 Quick Start

Follow these steps to set up the project locally on your machine.

**Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

**Cloning the Repository**

```bash
git clone https://github.com/Emengkeng/mom-eye.git
cd mom-eye
```

**Installation**

Install the project dependencies using npm:

```bash
npm install
```

**Set Up Environment Variables**

Create a new file named `.env.local` in the root of your project and add the following content:

## 🔧 Environment Variables

```env
#NEXT
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

#MONGODB
MONGODB_URL=your_mongodb_connection_string

#CLERK
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
WEBHOOK_SECRET=your_clerk_webhook_secret

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

#CLOUDINARY
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

#STRIPE
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

#GOOGLE GEMINI AI
GEMINI_API_KEY=your_google_gemini_api_key
```

Replace the placeholder values with your actual respective account credentials. You can obtain these credentials by signing up on:
- [Clerk](https://clerk.com/) - Authentication
- [MongoDB](https://www.mongodb.com/) - Database  
- [Cloudinary](https://cloudinary.com/) - Image processing
- [Stripe](https://stripe.com) - Payments
- [Google AI Studio](https://makersuite.google.com/) - Gemini API

**Running the Project**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the project.

## 📊 API Endpoints

### Object Detection API

**POST** `/api/gemini-detection`

Detect objects in images using Google Gemini AI.

**Request Body:**
```json
{
  "image": "base64_encoded_image_string",
  "detectionType": "points|boundingBoxes|segmentationMasks|3dBoundingBoxes",
  "temperature": 0.3,
  "prompt": "optional_custom_prompt"
}
```

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "label": "detected_object",
      "coordinates": [x, y],
      "confidence": 0.95
    }
  ],
  "model": "gemini-2.5-flash",
  "processingTime": 1250
}
```

**GET** `/api/gemini-detection`

Get supported detection types and model information.

### Navigation Routes

- `/` - Home page with featured transformations
- `/object-detection` - AI object detection interface (requires authentication)
- `/transformations/add/[type]` - Add new image transformations
- `/transformations/[id]` - View transformation details
- `/profile` - User profile and credits
- `/credits` - Purchase credits
- `/sign-in` - Authentication

## 🙏 Credits

This project extends the foundational work from the **Imaginify** AI SaaS tutorial by [JavaScript Mastery](https://www.youtube.com/@javascriptmastery). The original tutorial provided excellent groundwork for:

- Authentication system with Clerk
- Image transformation pipeline with Cloudinary  
- Payment processing with Stripe
- Database architecture with MongoDB
- UI components and styling foundations

**Original Tutorial**: [Build an AI Image SaaS Platform with Next.js](https://youtu.be/Ahwoks_dawU?feature=shared)

**Key Extensions Added:**
- Integration with Gemini Nano Banana for image editing 
- Complete object detection system with Google Gemini AI
- Advanced visual feedback and interactive UI components
- Real-time camera capture and processing capabilities
- Dynamic model selection and optimization
- Enhanced error handling and user experience improvements

Special thanks to the JavaScript Mastery team for creating such a comprehensive foundation that enabled these advanced features to be built upon.

---

For questions, suggestions, or contributions, feel free to open an issue or submit a pull request.