/**
 * 역할 기반 접근제어 서비스
 */

import { User, TeacherRole, Permission, AuthorizationResult } from '../types';

export class RBACService {
  private rolePermissions: Record<TeacherRole, Permission[]> = {
    [TeacherRole.HOMEROOM_TEACHER]: [
      // 담임교사는 모든 권한 보유
      Permission.VIEW_STUDENTS,
      Permission.MANAGE_STUDENTS,
      Permission.EDIT_STUDENT_INFO,
      Permission.VIEW_GRADES,
      Permission.MANAGE_GRADES,
      Permission.EXPORT_GRADES,
      Permission.VIEW_ATTENDANCE,
      Permission.MANAGE_ATTENDANCE,
      Permission.VIEW_PARENT_INFO,
      Permission.CONTACT_PARENTS,
      Permission.MANAGE_CLASS,
      Permission.VIEW_CLASS_REPORTS,
      Permission.CONDUCT_COUNSELING,
      Permission.VIEW_COUNSELING_RECORDS
    ],
    [TeacherRole.GENERAL_TEACHER]: [
      // 일반교사는 제한된 권한만 보유
      Permission.VIEW_STUDENTS,
      Permission.VIEW_GRADES,
      Permission.MANAGE_GRADES,
      Permission.VIEW_ATTENDANCE,
      Permission.CONDUCT_COUNSELING
    ]
  };

  checkPermission(user: User, permission: Permission, resource?: any): AuthorizationResult {
    // 비활성 사용자는 모든 접근 거부
    if (!user.isActive) {
      return { allowed: false, reason: '비활성화된 사용자입니다.' };
    }

    // 기본 역할 권한 체크
    const rolePermissions = this.getRolePermissions(user.role);
    if (!rolePermissions.includes(permission)) {
      return { allowed: false, reason: '해당 역할에 권한이 없습니다.' };
    }

    // 리소스별 추가 체크
    return this.checkResourceAccess(user, permission, resource);
  }

  private checkResourceAccess(user: User, permission: Permission, resource?: any): AuthorizationResult {
    // 일반교사의 경우 추가 제한 사항 체크
    if (user.role === TeacherRole.GENERAL_TEACHER) {
      switch (permission) {
        case Permission.MANAGE_GRADES:
          // 자신의 과목만 성적 관리 가능
          if (resource?.subjectId && user.subjectIds?.includes(resource.subjectId)) {
            return { allowed: true };
          }
          return { allowed: false, reason: '담당 과목의 성적만 관리할 수 있습니다.' };

        case Permission.CONDUCT_COUNSELING:
          // 자신의 과목 학생만 상담 가능
          if (resource?.studentId && this.isTeachingStudent(user, resource.studentId)) {
            return { allowed: true };
          }
          return { allowed: false, reason: '담당 학생만 상담할 수 있습니다.' };

        case Permission.VIEW_STUDENTS:
        case Permission.VIEW_GRADES:
        case Permission.VIEW_ATTENDANCE:
          // 자신이 가르치는 학생들만 조회 가능
          if (resource?.classId && this.isTeachingClass(user, resource.classId)) {
            return { allowed: true };
          }
          return { allowed: true }; // 일반적인 조회는 허용
      }
    }

    // 담임교사의 경우
    if (user.role === TeacherRole.HOMEROOM_TEACHER) {
      switch (permission) {
        case Permission.MANAGE_CLASS:
        case Permission.MANAGE_STUDENTS:
        case Permission.EDIT_STUDENT_INFO:
          // 자신의 담임 반만 관리 가능
          if (resource?.classId && user.classId === resource.classId) {
            return { allowed: true };
          }
          if (!resource?.classId) {
            return { allowed: true }; // 클래스 ID가 없으면 일반적으로 허용
          }
          return { allowed: false, reason: '담임 반만 관리할 수 있습니다.' };
      }
    }

    return { allowed: true };
  }

  private getRolePermissions(role: TeacherRole): Permission[] {
    return this.rolePermissions[role] || [];
  }

  private isTeachingStudent(teacher: User, studentId: string): boolean {
    // 실제 구현에서는 데이터베이스에서 확인
    return true;
  }

  private isTeachingClass(teacher: User, classId: string): boolean {
    // 실제 구현에서는 교사의 담당 과목과 반 정보를 확인
    return true;
  }

  getUserPermissions(user: User): Permission[] {
    return this.getRolePermissions(user.role);
  }

  canAccessScreen(user: User, screenName: string): boolean {
    const screenPermissions: Record<string, Permission[]> = {
      'Students': [Permission.VIEW_STUDENTS],
      'StudentDetail': [Permission.VIEW_STUDENTS],
      'AddStudent': [Permission.MANAGE_STUDENTS],
      'EditStudent': [Permission.EDIT_STUDENT_INFO],
      'Grades': [Permission.VIEW_GRADES],
      'AddGrade': [Permission.MANAGE_GRADES],
      'EditGrade': [Permission.MANAGE_GRADES],
      'Attendance': [Permission.VIEW_ATTENDANCE],
      'TakeAttendance': [Permission.MANAGE_ATTENDANCE],
    };

    const requiredPermissions = screenPermissions[screenName];
    if (!requiredPermissions) return true;

    return requiredPermissions.some(permission =>
      this.checkPermission(user, permission).allowed
    );
  }
}