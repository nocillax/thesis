import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class IssueCertificateDto {
  @IsString()
  @IsNotEmpty()
  certificate_number: string;

  @IsString()
  @IsNotEmpty()
  student_id: string;

  @IsString()
  @IsNotEmpty()
  student_name: string;

  @IsString()
  @IsNotEmpty()
  degree_program: string;

  @IsNumber()
  @Min(0)
  @Max(4)
  cgpa: number;

  @IsString()
  @IsNotEmpty()
  issuing_authority: string;
}

export class VerifyCertificateDto {
  @IsString()
  @IsNotEmpty()
  cert_hash: string;
}

export class UpdateCertificateDto {
  @IsString()
  @IsNotEmpty()
  student_name: string;

  @IsString()
  @IsNotEmpty()
  degree_program: string;

  @IsNumber()
  @Min(0)
  @Max(4)
  cgpa: number;
}
