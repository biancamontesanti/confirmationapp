import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { dbRun, dbGet, dbAll } from '../database';
import { AuthRequest, authenticateToken } from '../auth';

const router = express.Router();

// Get all events for a host
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const events = await dbAll(
      'SELECT * FROM events WHERE host_id = ? ORDER BY created_at DESC',
      [req.user!.id]
    );
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single event
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const event = await dbGet(
      'SELECT * FROM events WHERE id = ? AND host_id = ?',
      [req.params.id, req.user!.id]
    );
    
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

    const result = await dbRun(
      'INSERT INTO events (host_id, name, host_name, date_time, location, dress_code, event_type, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user!.id, name, host_name, date_time, location, dress_code || '', event_type, image_url || null]
    ) as any;

    res.status(201).json({
      message: 'Event created successfully',
      event: { id: result.lastID, name, host_name, date_time, location, dress_code, event_type, image_url }
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

    const { name, host_name, date_time, location, dress_code, event_type, image_url } = req.body;

    const result = await dbRun(
      'UPDATE events SET name = ?, host_name = ?, date_time = ?, location = ?, dress_code = ?, event_type = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND host_id = ?',
      [name, host_name, date_time, location, dress_code || '', event_type, image_url || null, req.params.id, req.user!.id]
    ) as any;

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await dbRun(
      'DELETE FROM events WHERE id = ? AND host_id = ?',
      [req.params.id, req.user!.id]
    ) as any;

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
