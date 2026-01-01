import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StudentService } from '../services/student.service';

@Controller('students')
@UseGuards(AuthGuard('jwt'))
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('sync/:student_id')
  async syncStudent(@Param('student_id') student_id: string) {
    return this.studentService.syncStudent(student_id);
  }
}
