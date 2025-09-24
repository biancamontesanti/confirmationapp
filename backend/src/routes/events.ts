import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest, authenticateToken } from '../auth';
import Event from '../models/Event';
import mongoose from 'mongoose';

const router = express.Router();

// Get all events for a host
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const events = await Event.find({ host_id: req.user!.id })
      .sort({ created_at: -1 })
      .lean();
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single event
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const event = await Event.findOne({
      _id: req.params.id,
      host_id: req.user!.id
    }).lean();
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create event
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1 }),
  body('host_name').trim().isLength({ min: 1 }),
  body('date_time').isISO8601(),
  body('location').trim().isLength({ min: 1 }),
  body('event_type').trim().isLength({ min: 1 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, host_name, date_time, location, dress_code, event_type, image_url } = req.body;
    
    const newEvent = new Event({
      host_id: req.user!.id,
      name,
      host_name,
      date_time,
      location,
      dress_code: dress_code || '',
      event_type,
      image_url: image_url || null
    });

    const savedEvent = await newEvent.save();

    res.status(201).json({
      message: 'Event created successfully',
      event: savedEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update event
router.put('/:id', authenticateToken, [
  body('name').trim().isLength({ min: 1 }),
  body('host_name').trim().isLength({ min: 1 }),
  body('date_time').isISO8601(),
  body('location').trim().isLength({ min: 1 }),
  body('event_type').trim().isLength({ min: 1 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const { name, host_name, date_time, location, dress_code, event_type, image_url } = req.body;

    const updatedEvent = await Event.findOneAndUpdate(
      { _id: req.params.id, host_id: req.user!.id },
      {
        name,
        host_name,
        date_time,
        location,
        dress_code: dress_code || '',
        event_type,
        image_url: image_url || null
      },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const deletedEvent = await Event.findOneAndDelete({
      _id: req.params.id,
      host_id: req.user!.id
    });

    if (!deletedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;