import * as XLSX from "xlsx";

export interface ParsedPatient {
  room: string;
  bed: number;
  name: string;
  dateOfBirth: string;
  rut: string;
  diagnoses: string[];
  admissionDate: string;
  viralPanel: string | null;
  oxygen: any;
  respiratoryScore: string | null;
  pending: string | null;
  plan: string | null;
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // Extract date from strings like "UCIN 14/04/2025 SALA 27/08/2025"
  const dateMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

function parseAge(ageStr: string): { years?: number; months?: number; days?: number } | null {
  if (!ageStr) return null;
  
  const result: { years?: number; months?: number; days?: number } = {};
  
  // Match patterns like "3 años", "6 meses", "27 días"
  const yearsMatch = ageStr.match(/(\d+)\s*a[ñn]os?/i);
  const monthsMatch = ageStr.match(/(\d+)\s*meses?/i);
  const daysMatch = ageStr.match(/(\d+)\s*d[íi]as?/i);
  
  if (yearsMatch) result.years = parseInt(yearsMatch[1]);
  if (monthsMatch) result.months = parseInt(monthsMatch[1]);
  if (daysMatch) result.days = parseInt(daysMatch[1]);
  
  return Object.keys(result).length > 0 ? result : null;
}

function calculateDOBFromAge(age: { years?: number; months?: number; days?: number }): string {
  const now = new Date();
  if (age.years) now.setFullYear(now.getFullYear() - age.years);
  if (age.months) now.setMonth(now.getMonth() - age.months);
  if (age.days) now.setDate(now.getDate() - age.days);
  
  return now.toISOString().split('T')[0];
}

function parseOxygenRequirement(oxygenStr: string): any {
  if (!oxygenStr || oxygenStr.trim() === '') return null;
  
  const str = oxygenStr.toUpperCase();
  
  // Parse CPAP with PEEP and FiO2
  if (str.includes('CPAP')) {
    const result: any = { type: 'CPAP' };
    
    const peepMatch = str.match(/PEEP\s*(\d+)/i) || str.match(/CPAP\s*(\d+)/);
    if (peepMatch) result.peep = parseInt(peepMatch[1]);
    
    const fio2Match = str.match(/FIO2\s*(\d+)/i) || str.match(/(\d+)%/);
    if (fio2Match) result.fio2 = parseInt(fio2Match[1]);
    
    if (str.includes('NOCTURNO')) result.uso = 'Nocturno';
    
    return result;
  }
  
  // Parse ambient air variants
  if (str.includes('AM') || str.includes('AMB') || str.includes('AMBIENTE')) {
    return { type: 'AM' };
  }
  
  // Parse nasal cannula
  if (str.includes('CN') || str.includes('NASAL')) {
    const flowMatch = str.match(/(\d+)\s*L/i);
    return { 
      type: 'CN',
      flow: flowMatch ? parseInt(flowMatch[1]) : null
    };
  }
  
  return null;
}

function parseDiagnoses(diagnosesStr: string): string[] {
  if (!diagnosesStr) return [];
  
  // Split by common separators
  const separators = /[\/\n]/;
  return diagnosesStr
    .split(separators)
    .map(d => d.trim())
    .filter(d => d.length > 0);
}

function cleanRUT(rut: string): string {
  if (!rut) return '';
  
  // Remove any spaces and convert to uppercase
  return rut.trim().toUpperCase();
}

function extractNameAndDOB(nameStr: string): { name: string; dob: string | null } {
  if (!nameStr) return { name: '', dob: null };
  
  // Check if name contains DOB in parentheses like "Aymara Urrea (27/04/2025)"
  const match = nameStr.match(/^(.+?)\s*\((\d{2}\/\d{2}\/\d{4})\)$/);
  
  if (match) {
    const name = match[1].trim();
    const dobStr = match[2];
    const dob = parseDate(dobStr);
    return { name, dob };
  }
  
  return { name: nameStr.trim(), dob: null };
}

export async function parseHandoverExcel(file: File): Promise<ParsedPatient[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        
        const patients: ParsedPatient[] = [];
        let currentRoom = '';
        
        // Start from row 18 (index 17 contains headers, data starts at index 18)
        for (let i = 18; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          // Column A (index 0): Room number
          if (row[0]) {
            currentRoom = row[0].toString().trim();
          }
          
          // Column B (index 1): Bed number
          const bedNumber = row[1] ? parseInt(row[1].toString()) : null;
          
          // Column C (index 2): Patient name
          const nameCell = row[2] ? row[2].toString().trim() : '';
          
          if (!nameCell || !bedNumber || !currentRoom) continue;
          
          // Extract name and potential DOB from name field
          const { name, dob: dobFromName } = extractNameAndDOB(nameCell);
          
          // Column D (index 3): Age
          const ageStr = row[3] ? row[3].toString().trim() : '';
          
          // Column E (index 4): RUT
          const rut = row[4] ? cleanRUT(row[4].toString()) : '';
          
          // Column F (index 5): Diagnoses
          const diagnosesStr = row[5] ? row[5].toString() : '';
          const diagnoses = parseDiagnoses(diagnosesStr);
          
          // Column G (index 6): Admission date
          const admissionDateStr = row[6] ? row[6].toString() : '';
          const admissionDate = parseDate(admissionDateStr) || new Date().toISOString().split('T')[0];
          
          // Column H (index 7): Viral panel
          const viralPanel = row[7] ? row[7].toString().trim() : null;
          
          // Column I (index 8): Oxygen requirement
          const oxygenStr = row[8] ? row[8].toString() : '';
          const oxygen = parseOxygenRequirement(oxygenStr);
          
          // Column J (index 9): Respiratory score
          const respiratoryScore = row[9] ? row[9].toString().trim() : null;
          
          // Column K (index 10): Pending
          const pending = row[10] ? row[10].toString().trim() : null;
          
          // Column L (index 11): Plan
          const plan = row[11] ? row[11].toString().trim() : null;
          
          // Calculate DOB
          let dateOfBirth = dobFromName;
          if (!dateOfBirth && ageStr) {
            const age = parseAge(ageStr);
            if (age) {
              dateOfBirth = calculateDOBFromAge(age);
            }
          }
          
          if (!dateOfBirth) {
            dateOfBirth = '2000-01-01'; // Fallback
          }
          
          patients.push({
            room: currentRoom,
            bed: bedNumber,
            name,
            dateOfBirth,
            rut,
            diagnoses,
            admissionDate,
            viralPanel,
            oxygen,
            respiratoryScore,
            pending,
            plan,
          });
        }
        
        resolve(patients);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsArrayBuffer(file);
  });
}
