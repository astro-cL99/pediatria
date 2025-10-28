import express, { Request, Response, NextFunction } from 'express';
import { getPatientById, searchObservations } from './transform';
import { Role, canAccessPatientData } from '../auth/roles';
import { z } from 'zod';

// Types
type AuthRequest = Request & { user?: { role: Role } };

// Middleware
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  // In a real app, validate JWT or session token here
  // For now, we'll simulate an authenticated user with doctor role
  req.user = { role: Role.DOCTOR };
  next();
};

const app = express();
app.use(express.json());

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Routes
app.get('/fhir/Patient/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !canAccessPatientData(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const patientId = req.params.id;
    if (!z.string().uuid().safeParse(patientId).success) {
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }

    const patient = await getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(patient);
  } catch (error) {
    next(error);
  }
});

app.get('/fhir/Observation', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !canAccessPatientData(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { patient, category, code } = req.query;
    const observations = await searchObservations({
      patientId: patient as string,
      category: category as string,
      code: code as string
    });
    
    res.json({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: observations.map(obs => ({
        resource: obs
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FHIR Adapter running on port ${PORT}`);
  
  // Validate required environment variables
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }
});
