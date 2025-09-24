import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { dbRun, dbGet, dbAll } from '../database';
import { AuthRequest, authenticateToken } from '../auth';

const router = express.Router();

// Get all guests for an event (host only)
router.get('/event/:eventId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Verify event belongs to host
    const event = await dbGet(
      'SELECT id FROM events WHERE id = ? AND host_id = ?',
      [req.params.eventId, req.user!.id]
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const guests = await dbAll(
      'SELECT * FROM guests WHERE event_id = ? ORDER BY created_at ASC',
      [req.params.eventId]
    );

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

    // Verify event belongs to host
    const event = await dbGet(
      'SELECT id FROM events WHERE id = ? AND host_id = ?',
      [req.params.eventId, req.user!.id]
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { name, email } = req.body;

    // Check if guest already exists for this event
    const existingGuest = await dbGet(
      'SELECT id FROM guests WHERE event_id = ? AND email = ?',
      [req.params.eventId, email]
    );

    if (existingGuest) {
      return res.status(400).json({ error: 'Guest already exists for this event' });
    }

    const result = await dbRun(
      'INSERT INTO guests (event_id, name, email) VALUES (?, ?, ?)',
      [req.params.eventId, name, email]
    ) as any;

    res.status(201).json({
      message: 'Guest added successfully',
      guest: { id: result.lastID, name, email, event_id: req.params.eventId }
    });
  } catch (error) {
    console.error('Add guest error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event details for guest view (public)
router.get('/public/event/:eventId', async (req: Request, res: Response) => {
  try {
    const event = await dbGet(
      'SELECT id, name, host_name, date_time, location, dress_code, event_type, image_url FROM events WHERE id = ?',
      [req.params.eventId]
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get public event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// RSVP response (public)
router.post('/rsvp/:eventId', [
  body('email').isEmail().normalizeEmail(),
  body('response').isIn(['yes', 'no']),
  body('plus_ones').optional().isArray()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, response, plus_ones = [] } = req.body;

    // Check if event exists
    const event = await dbGet(
      'SELECT id FROM events WHERE id = ?',
      [req.params.eventId]
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Find or create guest
    let guest = await dbGet(
      'SELECT * FROM guests WHERE event_id = ? AND email = ?',
      [req.params.eventId, email]
    ) as any;

    if (!guest) {
      // Create new guest entry
      const result = await dbRun(
        'INSERT INTO guests (event_id, name, email, response, plus_ones, responded_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [req.params.eventId, email.split('@')[0].replace(/\./g, ' '), email, response, JSON.stringify(plus_ones)]
      ) as any;
      
      guest = {
        id: result.lastID,
        event_id: req.params.eventId,
        name: email.split('@')[0].replace(/\./g, ' '),
        email,
        response,
        plus_ones: JSON.stringify(plus_ones)
      };
    } else {
      // Update existing guest response
      await dbRun(
        'UPDATE guests SET response = ?, plus_ones = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?',
        [response, JSON.stringify(plus_ones), guest.id]
      );
    }

    res.json({ message: 'RSVP submitted successfully' });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get guest by email for event (public)
router.get('/public/event/:eventId/guest/:email', async (req: Request, res: Response) => {
  try {
    const guest = await dbGet(
      'SELECT * FROM guests WHERE event_id = ? AND email = ?',
      [req.params.eventId, req.params.email]
    );

    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    res.json(guest);
  } catch (error) {
    console.error('Get guest error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
