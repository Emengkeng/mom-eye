"use client"
 
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { 
  aspectRatioOptions, 
  getCreditCost, 
  hasEnoughCredits,
  defaultValues, 
  transformationTypes,
  TransformationType 
} from "@/constants"
import { CustomField } from "./CustomField"
import { useEffect, useState, useTransition } from "react"
import { AspectRatioKey, debounce, deepMergeObjects } from "@/lib/utils"
import MediaUploader from "./MediaUploader"
import TransformedImage from "./TransformedImage"
import { updateCredits } from "@/lib/actions/user.actions"
import { getCldImageUrl } from "next-cloudinary"
import { addImage, updateImage } from "@/lib/actions/image.actions"
import { useRouter } from "next/navigation"
import { InsufficientCreditsModal } from "./InsufficientCreditsModal"
 
export const formSchema = z.object({
  title: z.string(),
  aspectRatio: z.string().optional(),
  color: z.string().optional(),
  prompt: z.string().optional(),
  publicId: z.string(),
})

const TransformationForm = ({ action, data = null, userId, type, creditBalance, config = null }: TransformationFormProps) => {
  const transformationType = transformationTypes[type];
  const [image, setImage] = useState(data)
  const [newTransformation, setNewTransformation] = useState<Transformations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformationConfig, setTransformationConfig] = useState(config)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Get dynamic credit cost for this transformation type
  const creditCost = getCreditCost(type as TransformationType);
  const transformationCost = Math.abs(creditCost);
  const uploadCost = Math.abs(getCreditCost('upload'));
  const totalCost = action === 'Add' ? transformationCost + uploadCost : transformationCost;

  // Check if user has enough credits
  const hasSufficientCredits = creditBalance >= totalCost;

  const initialValues = data && action === 'Update' ? {
    title: data?.title,
    aspectRatio: data?.aspectRatio,
    color: data?.color,
    prompt: data?.prompt,
    publicId: data?.publicId,
  } : defaultValues

   // 1. Define your form.
   const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })
 
  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    if(data || image) {
      const transformationUrl = getCldImageUrl({
        width: image?.width,
        height: image?.height,
        src: image?.publicId,
        ...transformationConfig
      })

      const imageData = {
        title: values.title,
        publicId: image?.publicId,
        transformationType: type,
        width: image?.width,
        height: image?.height,
        config: transformationConfig,
        secureURL: image?.secureURL,
        transformationURL: transformationUrl,
        aspectRatio: values.aspectRatio,
        prompt: values.prompt,
        color: values.color,
      }

      if(action === 'Add') {
        try {
          const newImage = await addImage({
            image: imageData,
            userId,
            path: '/'
          })

          if(newImage) {
            // Deduct credits for upload + transformation
            await updateCredits(userId, -(uploadCost + transformationCost))
            
            form.reset()
            setImage(data)
            router.push(`/transformations/${newImage._id}`)
          }
        } catch (error) {
          console.log(error);
        }
      }

      if(action === 'Update') {
        try {
          const updatedImage = await updateImage({
            image: {
              ...imageData,
              _id: data._id
            },
            userId,
            path: `/transformations/${data._id}`
          })

          if(updatedImage) {
            // Only deduct transformation cost for updates
            await updateCredits(userId, creditCost)
            router.push(`/transformations/${updatedImage._id}`)
          }
        } catch (error) {
          console.log(error);
        }
      }
    }

    setIsSubmitting(false)
  }

  const onSelectFieldHandler = (value: string, onChangeField: (value: string) => void) => {
    const imageSize = aspectRatioOptions[value as AspectRatioKey]

    setImage((prevState: any) => ({
      ...prevState,
      aspectRatio: imageSize.aspectRatio,
      width: imageSize.width,
      height: imageSize.height,
    }))

    setNewTransformation(transformationType.config);

    return onChangeField(value)
  }

  const onInputChangeHandler = (fieldName: string, value: string, type: string, onChangeField: (value: string) => void) => {
    debounce(() => {
      setNewTransformation((prevState: any) => ({
        ...prevState,
        [type]: {
          ...prevState?.[type],
          [fieldName === 'prompt' ? 'prompt' : 'to' ]: value 
        }
      }))
    }, 1000)();
      
    return onChangeField(value)
  }

  const onTransformHandler = async () => {
    setIsTransforming(true)

    // Check if user has enough credits before transformation
    if (!hasSufficientCredits) {
      setIsTransforming(false);
      return;
    }

    // Check if we should use AI-powered transformation
    const useAITransformation = type === 'remove' || type === 'recolor' || type === 'restore' || type === 'removeBackground';
    
    if (useAITransformation && image?.secureURL) {
      try {
        // Convert image to base64 for Gemini API
        const response = await fetch(image.secureURL);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        // Call Gemini API for AI transformation
        const aiResponse = await fetch('/api/banana-ai-model', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transformationType: type,
            imageData: base64,
            userInput: {
              prompt: form.getValues().prompt,
              color: form.getValues().color,
              aspectRatio: form.getValues().aspectRatio,
              title: form.getValues().title,
            }
          }),
        });

        if (!aiResponse.ok) {
          throw new Error('AI transformation failed');
        }

        const aiResult = await aiResponse.json();
        
        if (aiResult.success && aiResult.editedImageData) {
          // Upload the AI-edited image back to Cloudinary
          const uploadResponse = await fetch('/api/upload-ai-result', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageData: aiResult.editedImageData,
              publicId: image.publicId + '_ai_edited',
            }),
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            // Update transformation config with the new AI-edited image
            setTransformationConfig({
              ...newTransformation,
              publicId: uploadResult.public_id,
            });
          }
        }
      } catch (error) {
        console.error('AI transformation error:', error);
        // Fallback to regular Cloudinary transformation
        setTransformationConfig(
          deepMergeObjects(newTransformation, transformationConfig)
        );
      }
    } else {
      // Use regular Cloudinary transformations for 'fill' type
      setTransformationConfig(
        deepMergeObjects(newTransformation, transformationConfig)
      );
    }

    setNewTransformation(null);
    setIsTransforming(false);
  };

  useEffect(() => {
    if(image && (type === 'restore' || type === 'removeBackground')) {
      setNewTransformation(transformationType.config)
    }
  }, [image, transformationType.config, type])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {!hasSufficientCredits && <InsufficientCreditsModal />}
        
        {/* Credit Cost Display */}
        <div className="credit-display">
          <div className="flex items-center justify-between p-4 rounded-lg bg-purple-100 border border-purple-200">
            <div>
              <h4 className="font-medium text-purple-800">
                {transformationType.title} Transformation
              </h4>
              <p className="text-sm text-purple-600">
                {action === 'Add' 
                  ? `Upload (${uploadCost}) + Transform (${transformationCost}) credits`
                  : `Transform: ${transformationCost} credits`
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-800">
                {totalCost} credits
              </div>
              <div className="text-sm text-gray-600">
                Balance: {creditBalance}
              </div>
            </div>
          </div>
        </div>

        <CustomField 
          control={form.control}
          name="title"
          formLabel="Image Title"
          className="w-full"
          render={({ field }) => <Input {...field} className="input-field" />}
        />

        {type === 'fill' && (
          <CustomField
            control={form.control}
            name="aspectRatio"
            formLabel="Aspect Ratio"
            className="w-full"
            render={({ field }) => (
              <Select
                onValueChange={(value) => onSelectFieldHandler(value, field.onChange)}
                value={field.value}
              >
                <SelectTrigger className="select-field">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(aspectRatioOptions).map((key) => (
                    <SelectItem key={key} value={key} className="select-item">
                      {aspectRatioOptions[key as AspectRatioKey].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}  
          />
        )}

        {(type === 'remove' || type === 'recolor') && (
          <div className="prompt-field">
            <CustomField 
              control={form.control}
              name="prompt"
              formLabel={
                type === 'remove' ? 'Object to remove' : 'Object to recolor'
              }
              className="w-full"
              render={({ field }) => (
                <Input 
                  value={field.value}
                  className="input-field"
                  onChange={(e) => onInputChangeHandler(
                    'prompt',
                    e.target.value,
                    type,
                    field.onChange
                  )}
                />
              )}
            />

            {type === 'recolor' && (
              <CustomField 
                control={form.control}
                name="color"
                formLabel="Replacement Color"
                className="w-full"
                render={({ field }) => (
                  <Input 
                    value={field.value}
                    className="input-field"
                    onChange={(e) => onInputChangeHandler(
                      'color',
                      e.target.value,
                      'recolor',
                      field.onChange
                    )}
                  />
                )}
              />
            )}
          </div>
        )}

        <div className="media-uploader-field">
          <CustomField 
            control={form.control}
            name="publicId"
            className="flex size-full flex-col"
            render={({ field }) => (
              <MediaUploader 
                onValueChange={field.onChange}
                setImage={setImage}
                publicId={field.value}
                image={image}
                type={type}
              />
            )}
          />

          <TransformedImage 
            image={image}
            type={type}
            title={form.getValues().title}
            isTransforming={isTransforming}
            setIsTransforming={setIsTransforming}
            transformationConfig={transformationConfig}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Button 
            type="button"
            className="submit-button capitalize"
            disabled={isTransforming || newTransformation === null || !hasSufficientCredits}
            onClick={onTransformHandler}
          >
            {isTransforming ? 'Transforming...' : 
             !hasSufficientCredits ? `Need ${totalCost} Credits` :
             'Apply Transformation'}
          </Button>
          <Button 
            type="submit"
            className="submit-button capitalize"
            disabled={isSubmitting || !hasSufficientCredits}
          >
            {isSubmitting ? 'Submitting...' : 
             !hasSufficientCredits ? 'Insufficient Credits' :
             'Save Image'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default TransformationForm