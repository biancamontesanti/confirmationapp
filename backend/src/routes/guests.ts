import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest, authenticateToken } from '../auth';
import Event from '../models/Event';
import Guest from '../models/Guest';
import mongoose from 'mongoose';

const router = express.Router();

// Get all guests for an event (host only)
router.get('/event/:eventId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Verify event belongs to host
    const event = await Event.findOne({
      _id: req.params.eventId,
      host_id: req.user!.id
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const guests = await Guest.find({ event_id: req.params.eventId })
      .sort({ created_at: 1 })
      .lean();

    res.json(guests);
  } catch (error) {
    console.error('Get guests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add guest to event (host only)
router.post('/event/:eventId', authenticateToken, [
  body('name').trim().isLength({ min: 1 }),
  body('email').isEmail().normalizeEmail()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Verify event belongs to host
    const event = await Event.findOne({
      _id: req.params.eventId,
      host_id: req.user!.id
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { name, email } = req.body;

    // Check if guest already exists for this event
    const existingGuest = await Guest.findOne({
      event_id: req.params.eventId,
      email
    });

    if (existingGuest) {
      return res.status(400).json({ error: 'Guest already exists for this event' });
    }

    const newGuest = new Guest({
      event_id: req.params.eventId,
      name,
      email
    });

    const savedGuest = await newGuest.save();

    res.status(201).json({
      message: 'Guest added successfully',
      guest: savedGuest
    });
  } catch (error) {
    console.error('Add guest error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event details for guests (public)
router.get('/public/event/:eventId', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const event = await Event.findById(req.params.eventId)
      .select('name host_name date_time location dress_code event_type image_url')
      .lean();

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get public event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// RSVP to event (public)
router.post('/rsvp/:eventId', [
  body('name').trim().isLength({ min: 1 }),
  body('response').isIn(['yes', 'no']),
  body('plus_ones').optional().isArray()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Verify event exists
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { name, response, plus_ones = [] } = req.body;
    
    // Generate email from name
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@guest.local`;
    
    // Check if guest already exists
    let guest = await Guest.findOne({
      event_id: req.params.eventId,
      email
    });

    const now = new Date();

    if (guest) {
      // Update existing guest
      guest.name = name;
      guest.response = response;
      guest.plus_ones = JSON.stringify(plus_ones);
      guest.responded_at = now;
      await guest.save();
    } else {
      // Create new guest
      guest = new Guest({
        event_id: req.params.eventId,
        name,
        email,
        response,
        plus_ones: JSON.stringify(plus_ones),
        responded_at: now
      });
      await guest.save();
    }

    res.json({
      message: 'RSVP recorded successfully',
      guest: {
        name: guest.name,
        response: guest.response,
        plus_ones: guest.plus_ones,
        responded_at: guest.responded_at
      }
    });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get guest's current RSVP status (public)
router.get('/rsvp/:eventId/:name', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Generate email from name
    const email = `${req.params.name.toLowerCase().replace(/\s+/g, '.')}@guest.local`;
    
    const guest = await Guest.findOne({
      event_id: req.params.eventId,
      email
    }).lean();

    if (!guest) {
      return res.json({ response: null });
    }

    res.json({
      name: guest.name,
      response: guest.response,
      plus_ones: guest.plus_ones ? JSON.parse(guest.plus_ones) : [],
      responded_at: guest.responded_at
    });
  } catch (error) {
    console.error('Get RSVP status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;