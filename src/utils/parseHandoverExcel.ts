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
  
  // Handle DD-MM-YYYY format
  const dashMatch = dateStr.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (dashMatch) {
    const [, day, month, year] = dashMatch;
    return `${year}-${month}-${day}`;
  }
  
  // Handle DD/MM/YYYY format
  const slashMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
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
  if (!oxygenStr || oxygenStr.trim() === '' || oxygenStr.toLowerCase() === 'no') return null;
  
  // If it's already a JSON object string, try to parse it
  if (oxygenStr.startsWith('{')) {
    try {
      return JSON.parse(oxygenStr);
    } catch {
      // Continue with text parsing
    }
  }
  
  const str = oxygenStr.toUpperCase();
  
  // Parse CPAP with PEEP and FiO2
  if (str.includes('CPAP')) {
    const result: any = { type: 'CPAP' };
    
    const peepMatch = str.match(/PEEP[:\s]*(\d+)/i) || str.match(/CPAP\s*(\d+)/);
    if (peepMatch) result.peep = parseInt(peepMatch[1]);
    
    const fio2Match = str.match(/FIO2[:\s]*(\d+)/i) || str.match(/(\d+)%/);
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
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
          header: 1,
          defval: '',
          blankrows: false
        }) as any[][];
        
        const patients: ParsedPatient[] = [];
        
        // Find the header row (looking for "Cama" column)
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(20, jsonData.length); i++) {
          const row = jsonData[i];
          if (row && row.length > 0) {
            const firstCell = row[0]?.toString().toLowerCase() || '';
            if (firstCell.includes('cama')) {
              headerRowIndex = i;
              break;
            }
          }
        }
        
        if (headerRowIndex === -1) {
          throw new Error('No se encontró la fila de encabezados en el Excel');
        }
        
        const headers = jsonData[headerRowIndex].map((h: any) => h?.toString().toLowerCase() || '');
        
        // Find column indices
        const camaIdx = headers.findIndex((h: string) => h.includes('cama'));
        const nombreIdx = headers.findIndex((h: string) => h.includes('nombre'));
        const edadIdx = headers.findIndex((h: string) => h.includes('edad'));
        const rutIdx = headers.findIndex((h: string) => h.includes('rut'));
        const diagnosticoIdx = headers.findIndex((h: string) => h.includes('diagn'));
        const fechaIngresoIdx = headers.findIndex((h: string) => h.includes('fecha') || h.includes('ingreso'));
        const viralPanelIdx = headers.findIndex((h: string) => h.includes('viral') || h.includes('panel'));
        const oxygenIdx = headers.findIndex((h: string) => h.includes('o2') || h.includes('oxigeno') || h.includes('requerimiento'));
        const scoreIdx = headers.findIndex((h: string) => h.includes('score') || h.includes('respiratorio'));
        const antibioticosIdx = headers.findIndex((h: string) => h.includes('antibi'));
        const pendientesIdx = headers.findIndex((h: string) => h.includes('pendiente'));
        
        console.log('Column indices:', { camaIdx, nombreIdx, edadIdx, rutIdx, diagnosticoIdx });
        
        // Process data rows
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          if (!row || row.length === 0) continue;
          
          // Parse bed assignment (format: "501-1" or "501" and separate bed number)
          const camaStr = row[camaIdx]?.toString().trim() || '';
          if (!camaStr) {
            console.log(`Row ${i}: Skipping - no bed number`);
            continue;
          }
          
          let room = '';
          let bed = 1;
          
          if (camaStr.includes('-')) {
            const parts = camaStr.split('-');
            room = parts[0].trim();
            bed = parseInt(parts[1]) || 1;
          } else {
            room = camaStr;
          }
          
          // Log room being processed
          console.log(`Row ${i}: Processing room ${room}, bed ${bed}`);
          
          const name = row[nombreIdx]?.toString().trim() || '';
          if (!name) {
            console.log(`Row ${i}: Skipping room ${room} - no patient name`);
            continue;
          }
          
          const ageStr = row[edadIdx]?.toString().trim() || '';
          const rut = row[rutIdx] ? cleanRUT(row[rutIdx].toString()) : '';
          
          if (!rut) {
            console.warn(`Row ${i}: Skipping patient ${name} in room ${room} - no RUT found`);
            continue;
          }
          
          console.log(`Row ${i}: Processing patient ${name} (RUT: ${rut}) in room ${room}`);
          
          const diagnosesStr = row[diagnosticoIdx]?.toString() || '';
          const diagnoses = parseDiagnoses(diagnosesStr);
          
          const admissionDateStr = row[fechaIngresoIdx]?.toString() || '';
          const admissionDate = parseDate(admissionDateStr) || new Date().toISOString().split('T')[0];
          
          const viralPanel = viralPanelIdx >= 0 && row[viralPanelIdx] ? row[viralPanelIdx].toString().trim() : null;
          
          const oxygenStr = oxygenIdx >= 0 && row[oxygenIdx] ? row[oxygenIdx].toString() : '';
          const oxygen = parseOxygenRequirement(oxygenStr);
          
          const respiratoryScore = scoreIdx >= 0 && row[scoreIdx] ? row[scoreIdx].toString().trim() : null;
          
          const pending = pendientesIdx >= 0 && row[pendientesIdx] ? row[pendientesIdx].toString().trim() : null;
          
          // Plan might be in antibiotics column or a separate column
          const plan = antibioticosIdx >= 0 && row[antibioticosIdx] ? row[antibioticosIdx].toString().trim() : null;
          
          // Calculate DOB from age
          let dateOfBirth = '';
          if (ageStr) {
            const age = parseAge(ageStr);
            if (age) {
              dateOfBirth = calculateDOBFromAge(age);
            }
          }
          
          if (!dateOfBirth) {
            dateOfBirth = '2000-01-01'; // Fallback
          }
          
          const patient = {
            room,
            bed,
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
          };
          
          patients.push(patient);
          console.log(`Row ${i}: Successfully parsed patient in room ${room}`);
        }
        
        console.log(`Parsed ${patients.length} patients from Excel`);
        console.log('Rooms found:', [...new Set(patients.map(p => p.room))].sort());
        resolve(patients);
      } catch (error) {
        console.error('Error parsing Excel:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsArrayBuffer(file);
  });
}
