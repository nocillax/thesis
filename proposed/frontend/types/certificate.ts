// Certificate types
export interface Certificate {
  cert_hash: string;
  student_id: string;
  version: number;
  student_name: string;
  degree: string;
  program: string;
  cgpa: number;
  issuing_authority: string;
  issuer: string;
  issuer_name: string;
  is_revoked: boolean;
  signature: string;
  issuance_date: string;
}

export interface IssueCertificateDTO {
  student_id: string;
  student_name: string;
  degree: string;
  program: string;
  cgpa: number;
  issuing_authority: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    has_more: boolean;
  };
}
