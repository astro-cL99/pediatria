// Document status types
export type DocumentStatus = 'pending' | 'processing' | 'processed' | 'error';

// Document metadata from the database
export interface DocumentMetadata {
  // Required fields
  id: string;
  patient_id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  document_type: string;
  created_at: string;
  
  // Optional fields
  description?: string | null;
  extracted_data?: Record<string, any> | null;
  confidence_score?: number | null;
  admission_id?: string | null;
  uploaded_by?: string | null;
  updated_at?: string | null;
  status?: DocumentStatus;
  embeddings?: string | null;
}

// Type for creating a new document
export type DocumentInsert = Omit<DocumentMetadata, 'id' | 'created_at' | 'updated_at'>;

// Type for updating a document
export type DocumentUpdate = Partial<Omit<DocumentMetadata, 'id' | 'patient_id' | 'created_at'>>;

// Type for document processing result
export interface DocumentProcessingResult {
  success: boolean;
  document: DocumentMetadata;
  extractedData?: Record<string, any>;
  error?: string;
}

// Type for document upload response
export interface DocumentUploadResponse {
  success: boolean;
  document: DocumentMetadata | null;
  error?: string;
}

// Type for document list response
export interface DocumentListResponse {
  data: DocumentMetadata[] | null;
  error: string | null;
}

// Type for single document response
export interface DocumentResponse {
  data: DocumentMetadata | null;
  error: string | null;
}

// Type for document deletion response
export interface DocumentDeleteResponse {
  success: boolean;
  error?: string;
}
