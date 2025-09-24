import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { eventsAPI } from '@/lib/api';

const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  host_name: z.string().min(1, 'Host name is required'),
  date_time: z.string().min(1, 'Date and time is required'),
  location: z.string().min(1, 'Location is required'),
  dress_code: z.string().optional(),
  event_type: z.string().min(1, 'Event type is required'),
  image_url: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  onSuccess: () => void;
  event?: any;
}

const EventForm: React.FC<EventFormProps> = ({ onSuccess, event }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(event?.image_url || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event ? {
      name: event.name,
      host_name: event.host_name,
      date_time: event.date_time ? new Date(event.date_time).toISOString().slice(0, 16) : '',
      location: event.location,
      dress_code: event.dress_code || '',
      event_type: event.event_type,
      image_url: event.image_url || '',
    } : {
      name: '',
      host_name: '',
      date_time: '',
      location: '',
      dress_code: '',
      event_type: '',
      image_url: '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    try {
      // Prepare data with image
      let imageUrl = imagePreview || data.image_url || null;
      
      // If it's a base64 image, compress it if it's too large
      if (imageUrl && imageUrl.startsWith('data:image')) {
        const sizeInBytes = (imageUrl.length * 3) / 4;
        console.log('Image size:', Math.round(sizeInBytes / 1024), 'KB');
        
        if (sizeInBytes > 1024 * 1024) { // 1MB limit
          // Compress the image
          const img = new Image();
          img.src = imageUrl;
          await new Promise((resolve) => { img.onload = resolve; });
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set max dimensions
          const maxWidth = 800;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            imageUrl = canvas.toDataURL('image/jpeg', 0.8);
            const newSizeInBytes = (imageUrl.length * 3) / 4;
            console.log('Compressed image size:', Math.round(newSizeInBytes / 1024), 'KB');
          }
        }
      }
      
      const eventData = {
        ...data,
        image_url: imageUrl
      };

      if (event) {
        await eventsAPI.update(event.id, eventData);
      } else {
        await eventsAPI.create(eventData);
        toast({
          title: "Event created",
          description: "Your event has been successfully created.",
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || 'Failed to save event',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Event Name</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="e.g., Birthday Party"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="host_name">Host Name</Label>
        <Input
          id="host_name"
          {...register('host_name')}
          placeholder="e.g., John Doe"
        />
        {errors.host_name && (
          <p className="text-sm text-destructive">{errors.host_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date_time">Date & Time</Label>
        <Input
          id="date_time"
          type="datetime-local"
          {...register('date_time')}
        />
        {errors.date_time && (
          <p className="text-sm text-destructive">{errors.date_time.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          {...register('location')}
          placeholder="e.g., 123 Main St, City"
        />
        {errors.location && (
          <p className="text-sm text-destructive">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="event_type">Event Type</Label>
        <Input
          id="event_type"
          {...register('event_type')}
          placeholder="e.g., Birthday Party, Wedding, Corporate Event"
        />
        {errors.event_type && (
          <p className="text-sm text-destructive">{errors.event_type.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dress_code">Dress Code (Optional)</Label>
        <Input
          id="dress_code"
          {...register('dress_code')}
          placeholder="e.g., Black tie, Casual, Cocktail attire"
        />
        {errors.dress_code && (
          <p className="text-sm text-destructive">{errors.dress_code.message}</p>
        )}
      </div>

      {/* Image Upload Section */}
      <div className="space-y-2">
        <Label htmlFor="image">Event Image (Optional)</Label>
        <div className="space-y-3">
          {/* Image Preview */}
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Event preview"
                className="w-full h-32 sm:h-40 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeImage}
                className="absolute top-2 right-2"
              >
                Remove
              </Button>
            </div>
          )}
          
          {/* File Input */}
          <div className="flex items-center space-x-2">
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="flex-1"
            />
            {!imagePreview && (
              <span className="text-sm text-muted-foreground">
                Choose an image
              </span>
            )}
          </div>
          
          {/* URL Input as alternative */}
          <div className="space-y-2">
            <Label htmlFor="image_url" className="text-sm text-muted-foreground">
              Or enter image URL:
            </Label>
            <Input
              id="image_url"
              {...register('image_url')}
              placeholder="https://example.com/image.jpg"
              onChange={(e) => {
                if (e.target.value && !imageFile) {
                  setImagePreview(e.target.value);
                }
              }}
            />
          </div>
        </div>
        {errors.image_url && (
          <p className="text-sm text-destructive">{errors.image_url.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
      </Button>
      
      {/* Extra padding for better scrolling */}
      <div className="h-4"></div>
    </form>
  );
};

export default EventForm;
