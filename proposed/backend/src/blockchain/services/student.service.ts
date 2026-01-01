import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async syncStudent(student_id: string) {
    const student = await this.studentRepository.findOne({
      where: { student_id },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${student_id} not found`);
    }

    if (student.credit_remaining > 0) {
      throw new BadRequestException(
        `Student has ${student.credit_remaining} credits remaining. Cannot issue certificate until completion.`,
      );
    }

    return {
      student_id: student.student_id,
      student_name: student.student_name,
      degree: student.degree,
      program: student.program,
      cgpa: student.cgpa,
    };
  }
}
