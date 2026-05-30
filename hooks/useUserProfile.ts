import * as studentDataService from '../services/studentDataService.ts';
import { StudentProfile, Teacher } from '../types.ts';

// In a real application, this would be a hook that gets the current user's profile.
// For this demo, we'll use a static mock.

export const mockStudents: StudentProfile[] = studentDataService.getStudentProfiles();

export const mockTeacher: Teacher = studentDataService.getTeachers()[0];
