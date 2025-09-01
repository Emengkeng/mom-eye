"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import User from "../database/models/user.model";
import Image, { ImageQuery } from "../database/models/image.model";
import { redirect } from "next/navigation";

import { v2 as cloudinary } from 'cloudinary'

const populateUser = (query: any) => query.populate({
  path: 'author',
  model: User,
  select: '_id firstName lastName clerkId'
})

// ADD IMAGE
export async function addImage({ image, userId, path }: AddImageParams) {
  try {
    await connectToDatabase();

    const author = await User.findById(userId);

    if (!author) {
      throw new Error("User not found");
    }

    const newImage = await Image.create({
      ...image,
      author: author._id,
      privacy: 'private' // Default to private
    })

    revalidatePath(path);

    return JSON.parse(JSON.stringify(newImage));
  } catch (error) {
    handleError(error)
  }
}

// UPDATE IMAGE
export async function updateImage({ image, userId, path }: UpdateImageParams) {
  try {
    await connectToDatabase();

    const imageToUpdate = await Image.findById(image._id);

    if (!imageToUpdate || imageToUpdate.author.toHexString() !== userId) {
      throw new Error("Unauthorized or image not found");
    }

    const updatedImage = await Image.findByIdAndUpdate(
      imageToUpdate._id,
      image,
      { new: true }
    )

    revalidatePath(path);

    return JSON.parse(JSON.stringify(updatedImage));
  } catch (error) {
    handleError(error)
  }
}

// DELETE IMAGE
export async function deleteImage(imageId: string, userId: string) {
  try {
    await connectToDatabase();

    // Check if user owns the image
    const imageToDelete = await Image.findById(imageId);
    
    if (!imageToDelete) {
      throw new Error("Image not found");
    }
    
    if (imageToDelete.author.toHexString() !== userId) {
      throw new Error("Unauthorized: You can only delete your own images");
    }

    await Image.findByIdAndDelete(imageId);
  } catch (error) {
    handleError(error)
  } finally{
    redirect('/')
  }
}

// GET IMAGE (with privacy check)
export async function getImageById(imageId: string, currentUserId?: string) {
  try {
    await connectToDatabase();

    const image = await populateUser(Image.findById(imageId));

    if (!image) throw new Error("Image not found");

    // Check privacy: only show if public OR user owns the image
    const isOwner = currentUserId && image.author._id.toString() === currentUserId;
    const isPublic = image.privacy === 'public';

    if (!isPublic && !isOwner) {
      throw new Error("Unauthorized: This image is private");
    }

    return JSON.parse(JSON.stringify(image));
  } catch (error) {
    handleError(error)
  }
}

// GET PUBLIC IMAGES (for homepage)
export async function getPublicImages({ limit = 9, page = 1, searchQuery = '' }: {
  limit?: number;
  page: number;
  searchQuery?: string;
}) {
  try {
    await connectToDatabase();

    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    })

    let expression = 'folder=imaginify';

    if (searchQuery) {
      expression += ` AND ${searchQuery}`
    }

    const { resources } = await cloudinary.search
      .expression(expression)
      .execute();

    const resourceIds = resources.map((resource: any) => resource.public_id);

    // Base query - only public images
    let query: ImageQuery = { privacy: 'public' };

    if(searchQuery) {
      query = {
        ...query,
        publicId: {
          $in: resourceIds
        }
      }
    }

    const skipAmount = (Number(page) -1) * limit;

    const images = await populateUser(Image.find(query))
      .sort({ updatedAt: -1 })
      .skip(skipAmount)
      .limit(limit);
    
    const totalImages = await Image.find(query).countDocuments();
    const savedImages = await Image.find().countDocuments();

    return {
      data: JSON.parse(JSON.stringify(images)),
      totalPage: Math.ceil(totalImages / limit),
      savedImages,
    }
  } catch (error) {
    handleError(error)
  }
}

// GET ALL IMAGES (admin only or for dashboard showing all user's own images)
export async function getAllImages({ 
  limit = 9, 
  page = 1, 
  searchQuery = '', 
  userId,
  showOnlyUserImages = false 
}: {
  limit?: number;
  page: number;
  searchQuery?: string;
  userId?: string;
  showOnlyUserImages?: boolean;
}) {
  try {
    await connectToDatabase();

    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    })

    let expression = 'folder=imaginify';

    if (searchQuery) {
      expression += ` AND ${searchQuery}`
    }

    const { resources } = await cloudinary.search
      .expression(expression)
      .execute();

    const resourceIds = resources.map((resource: any) => resource.public_id);

    let query: ImageQuery = {};

    // If showing only user's images, filter by user
    if (showOnlyUserImages && userId) {
      query.author = userId;
    } else {
      // Otherwise, show only public images
      query.privacy = 'public';
    }

    if(searchQuery) {
      query = {
        ...query,
        publicId: {
          $in: resourceIds
        }
      }
    }

    const skipAmount = (Number(page) -1) * limit;

    const images = await populateUser(Image.find(query))
      .sort({ updatedAt: -1 })
      .skip(skipAmount)
      .limit(limit);
    
    const totalImages = await Image.find(query).countDocuments();
    const savedImages = await Image.find().countDocuments();

    return {
      data: JSON.parse(JSON.stringify(images)),
      totalPage: Math.ceil(totalImages / limit),
      savedImages,
    }
  } catch (error) {
    handleError(error)
  }
}

// GET IMAGES BY USER (user's own images - both public and private)
export async function getUserImages({
  limit = 9,
  page = 1,
  userId,
}: {
  limit?: number;
  page: number;
  userId: string;
}) {
  try {
    await connectToDatabase();

    const skipAmount = (Number(page) - 1) * limit;

    // User can see all their own images (public and private)
    const images = await populateUser(Image.find({ author: userId }))
      .sort({ updatedAt: -1 })
      .skip(skipAmount)
      .limit(limit);

    const totalImages = await Image.find({ author: userId }).countDocuments();

    return {
      data: JSON.parse(JSON.stringify(images)),
      totalPages: Math.ceil(totalImages / limit),
    };
  } catch (error) {
    handleError(error);
  }
}

// UPDATE IMAGE PRIVACY
export async function updateImagePrivacy({ 
  imageId, 
  userId, 
  privacy 
}: { 
  imageId: string; 
  userId: string; 
  privacy: 'public' | 'private' 
}) {
  try {
    await connectToDatabase();

    const image = await Image.findById(imageId);

    if (!image) {
      throw new Error("Image not found");
    }

    if (image.author.toHexString() !== userId) {
      throw new Error("Unauthorized: You can only modify your own images");
    }

    const updatedImage = await Image.findByIdAndUpdate(
      imageId,
      { privacy },
      { new: true }
    );

    return JSON.parse(JSON.stringify(updatedImage));
  } catch (error) {
    handleError(error);
  }
}