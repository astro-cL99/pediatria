import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface SearchObservationsParams {
  patientId?: string;
  category?: string;
  code?: string;
  limit?: number;
  offset?: number;
}

export async function searchObservations(params: SearchObservationsParams) {
  const { patientId, category, code, limit = 100, offset = 0 } = params;
  
  const query = {
    text: `
      SELECT o.*, p.id as patient_id
      FROM observations o
      JOIN patients p ON o.patient_id = p.id
      WHERE 1=1
      ${patientId ? 'AND o.patient_id = $1' : ''}
      ${category ? 'AND o.category = $2' : ''}
      ${code ? 'AND o.code = $3' : ''}
      ORDER BY o.effective_date DESC
      LIMIT $${Object.values(params).filter(Boolean).length + 1}
      OFFSET $${Object.values(params).filter(Boolean).length + 2}
    `,
    values: [
      ...(patientId ? [patientId] : []),
      ...(category ? [category] : []),
      ...(code ? [code] : []),
      limit,
      offset
    ].filter(Boolean)
  };

  try {
    const result = await pool.query(query);
    return result.rows.map(mapObservationRowToFhir);
  } catch (error) {
    console.error('Error searching observations:', error);
    throw new Error('Failed to search observations');
  }
}

export async function getPatientById(id: string) {
  const res = await pool.query('SELECT * FROM patients WHERE id=$1', [id]);
  if (!res.rows.length) return null;
  const row = res.rows[0];
  return mapPatientRowToFhir(row);
}

export function mapPatientRowToFhir(row: any) {
  return {
    resourceType: 'Patient',
    id: row.id,
    identifier: [{ system: 'https://midominio.cl/rut', value: row.rut }],
    name: [{ family: row.family_name, given: [row.given_name] }],
    birthDate: row.birth_date?.toISOString().split('T')[0],
  };
}

export function mapObservationRowToFhir(row: any) {
  const loinc = row.loinc || inferLoincFromType(row.type);
  return {
    resourceType: 'Observation',
    id: row.id,
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
    code: { coding: [{ system: 'http://loinc.org', code: loinc }] },
    subject: { reference: `Patient/${row.patient_id}` },
    effectiveDateTime: row.timestamp?.toISOString(),
    valueQuantity: { value: row.value, unit: row.unit, system: 'http://unitsofmeasure.org', code: guessUcum(row.unit) },
  };
}

function inferLoincFromType(type: string) {
  switch (type?.toLowerCase()) {
    case 'heart_rate': return '8867-4';
    case 'respiratory_rate': return '9279-1';
    case 'spo2': return '59408-5';
    case 'temperature': return '8310-5';
    default: return 'unknown';
  }
}

function guessUcum(unit: string) {
  if (!unit) return null;
  if (unit.includes('beats') || unit.includes('bpm')) return '/min';
  if (unit.toLowerCase().includes('c')) return 'Cel';
  return unit;
}
