/**
 * 앱 전체에서 사용되는 타입 정의
 */

export enum TeacherRole {
  HOMEROOM_TEACHER = 'homeroom_teacher',
  GENERAL_TEACHER = 'general_teacher'
}

export enum Permission {
  // 학생 관련 권한
  VIEW_STUDENTS = 'view_students',
  MANAGE_STUDENTS = 'manage_students',
  EDIT_STUDENT_INFO = 'edit_student_info',

  // 성적 관련 권한
  VIEW_GRADES = 'view_grades',
  MANAGE_GRADES = 'manage_grades',
  EXPORT_GRADES = 'export_grades',

  // 출석 관련 권한
  VIEW_ATTENDANCE = 'view_attendance',
  MANAGE_ATTENDANCE = 'manage_attendance',

  // 학부모 관련 권한
  VIEW_PARENT_INFO = 'view_parent_info',
  CONTACT_PARENTS = 'contact_parents',

  // 반 관리 권한
  MANAGE_CLASS = 'manage_class',
  VIEW_CLASS_REPORTS = 'view_class_reports',

  // 상담 권한
  CONDUCT_COUNSELING = 'conduct_counseling',
  VIEW_COUNSELING_RECORDS = 'view_counseling_records'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: TeacherRole;
  classId?: string;
  subjectIds?: string[];
  profileImage?: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  grade: number;
  studentNumber: string;
  parentContact?: string;
  profileImage?: string;
  createdAt: Date;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: number;
  homeroomTeacherId: string;
  studentIds: string[];
  createdAt: Date;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  subjectName: string;
  score: number;
  maxScore: number;
  examType: 'midterm' | 'final' | 'quiz' | 'assignment';
  examDate: Date;
  createdAt: Date;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'early_leave';
  reason?: string;
  createdAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  classIds: string[];
}

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
}

// 네비게이션 타입 정의
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Students: undefined;
  Grades: undefined;
  Attendance: undefined;
  Profile: undefined;
};

export type StudentStackParamList = {
  StudentList: undefined;
  StudentDetail: { studentId: string };
  AddStudent: undefined;
  EditStudent: { studentId: string };
};

export type GradeStackParamList = {
  GradeList: undefined;
  GradeDetail: { studentId: string; subjectId: string };
  AddGrade: undefined;
  EditGrade: { gradeId: string };
};

export type AttendanceStackParamList = {
  AttendanceList: undefined;
  AttendanceDetail: { date: string };
  TakeAttendance: undefined;
};