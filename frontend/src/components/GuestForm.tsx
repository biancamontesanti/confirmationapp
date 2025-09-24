import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { guestsAPI } from '@/lib/api';

const guestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

type GuestFormData = z.infer<typeof guestSchema>;

interface GuestFormProps {
  eventId: string;
  onSuccess: () => void;
}

const GuestForm: React.FC<GuestFormProps> = ({ eventId, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
  });

  const onSubmit = async (data: GuestFormData) => {
    setIsSubmitting(true);
    try {
      // Generate a simple email from the name
      const email = `${data.name.toLowerCase().replace(/\s+/g, '.')}@guest.local`;
      await guestsAPI.addToEvent(eventId, data.name, email);
      toast({
        title: "Guest added",
        description: "The guest has been successfully added to the event.",
      });
      reset();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || 'Failed to add guest',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Guest Name</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="e.g., Jane Smith"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>


      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Adding...' : 'Add Guest'}
      </Button>
    </form>
  );
};

export default GuestForm;
