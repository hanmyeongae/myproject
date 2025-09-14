/**
 * 인증 서비스
 */

import { User, TeacherRole } from '../types';

export class AuthService {
  private sampleUsers: User[] = [
    {
      id: 'teacher1',
      name: '김담임',
      email: 'homeroom@school.edu',
      role: TeacherRole.HOMEROOM_TEACHER,
      classId: 'class-3-1',
      profileImage: 'https://via.placeholder.com/150',
      createdAt: new Date('2023-01-01'),
      isActive: true
    },
    {
      id: 'teacher2',
      name: '이일반',
      email: 'general@school.edu',
      role: TeacherRole.GENERAL_TEACHER,
      subjectIds: ['math', 'science'],
      profileImage: 'https://via.placeholder.com/150',
      createdAt: new Date('2023-01-01'),
      isActive: true
    },
    {
      id: 'teacher3',
      name: '박수학',
      email: 'math@school.edu',
      role: TeacherRole.GENERAL_TEACHER,
      subjectIds: ['math'],
      profileImage: 'https://via.placeholder.com/150',
      createdAt: new Date('2023-01-01'),
      isActive: true
    }
  ];

  async login(email: string, password: string): Promise<User | null> {
    // 실제 앱에서는 서버 API 호출
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = this.sampleUsers.find(u => u.email === email);
        resolve(user || null);
      }, 1000);
    });
  }

  async logout(): Promise<void> {
    // 실제 앱에서는 서버에 로그아웃 요청
    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }

  async refreshToken(): Promise<string | null> {
    // 토큰 갱신 로직
    return new Promise((resolve) => {
      setTimeout(() => resolve('new-token'), 500);
    });
  }

  async resetPassword(email: string): Promise<boolean> {
    // 비밀번호 재설정 로직
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 1000);
    });
  }
}