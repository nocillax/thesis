import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  Length,
} from 'class-validator';

export class IssueCertificateDto {
  @IsString()
  @IsNotEmpty()
  student_id: string;

  @IsString()
  @IsNotEmpty()
  student_name: string;

  @IsString()
  @IsNotEmpty()
  degree: string;

  @IsString()
  @IsNotEmpty()
  program: string;

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
  degree: string;

  @IsString()
  @IsNotEmpty()
  program: string;

  @IsNumber()
  @Min(0)
  @Max(4)
  cgpa: number;
}

export class RevokeCertificateDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 500, { message: 'Reason must be between 1 and 500 characters' })
  reason: string;
}
