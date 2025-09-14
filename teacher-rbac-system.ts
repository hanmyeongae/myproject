/**
 * 담임 / 일반교사 역할 기반 접근제어 시스템
 * Role-Based Access Control (RBAC) for Homeroom Teacher and General Teacher
 */

// ============================================================================
// 기본 타입 정의 (Basic Types)
// ============================================================================

/**
 * 교사 역할 열거형
 */
enum TeacherRole {
  HOMEROOM_TEACHER = 'homeroom_teacher',    // 담임교사
  GENERAL_TEACHER = 'general_teacher'       // 일반교사
}

/**
 * 권한 열거형
 */
enum Permission {
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

/**
 * 사용자 인터페이스
 */
interface User {
  id: string;
  name: string;
  email: string;
  role: TeacherRole;
  classId?: string;     // 담임인 경우 담당 반 ID
  subjectIds?: string[]; // 일반교사인 경우 담당 과목 ID들
  createdAt: Date;
  isActive: boolean;
}

/**
 * 학생 인터페이스
 */
interface Student {
  id: string;
  name: string;
  classId: string;
  grade: number;
  parentContact?: string;
  createdAt: Date;
}

/**
 * 반 인터페이스
 */
interface ClassRoom {
  id: string;
  name: string;
  grade: number;
  homeroomTeacherId: string;
  studentIds: string[];
  createdAt: Date;
}

// ============================================================================
// 역할 기반 접근제어 인터페이스 및 클래스
// ============================================================================

/**
 * 역할-권한 매핑 인터페이스
 */
interface RolePermissions {
  [key: string]: Permission[];
}

/**
 * 권한 체크 결과 인터페이스
 */
interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * 접근 제어 정책 인터페이스
 */
interface AccessControlPolicy {
  checkPermission(user: User, permission: Permission, resource?: any): AuthorizationResult;
  getRolePermissions(role: TeacherRole): Permission[];
}

/**
 * 역할 기반 접근제어 클래스
 */
class RoleBasedAccessControl implements AccessControlPolicy {
  private rolePermissions: RolePermissions;

  constructor() {
    this.initializeRolePermissions();
  }

  /**
   * 역할별 권한 초기화
   */
  private initializeRolePermissions(): void {
    this.rolePermissions = {
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
        Permission.MANAGE_GRADES,     // 자신의 과목만
        Permission.VIEW_ATTENDANCE,
        Permission.CONDUCT_COUNSELING  // 자신의 과목 관련만
      ]
    };
  }

  /**
   * 권한 체크
   */
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

  /**
   * 리소스별 접근 권한 체크
   */
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
          return { allowed: false, reason: '담당 반의 학생만 조회할 수 있습니다.' };
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
          return { allowed: false, reason: '담임 반만 관리할 수 있습니다.' };
      }
    }

    return { allowed: true };
  }

  /**
   * 역할별 권한 목록 조회
   */
  getRolePermissions(role: TeacherRole): Permission[] {
    return this.rolePermissions[role] || [];
  }

  /**
   * 교사가 해당 학생을 가르치는지 확인
   */
  private isTeachingStudent(teacher: User, studentId: string): boolean {
    // 실제 구현에서는 데이터베이스에서 확인
    // 여기서는 예시로 true 반환
    return true;
  }

  /**
   * 교사가 해당 반을 가르치는지 확인
   */
  private isTeachingClass(teacher: User, classId: string): boolean {
    // 실제 구현에서는 교사의 담당 과목과 반 정보를 확인
    return true;
  }
}

// ============================================================================
// 인증 및 권한 관리 서비스
// ============================================================================

/**
 * 인증 서비스 인터페이스
 */
interface AuthenticationService {
  login(email: string, password: string): Promise<User | null>;
  logout(): void;
  getCurrentUser(): User | null;
  isAuthenticated(): boolean;
}

/**
 * 교사 관리 서비스
 */
class TeacherService {
  private users: Map<string, User> = new Map();
  private rbac: RoleBasedAccessControl;

  constructor() {
    this.rbac = new RoleBasedAccessControl();
    this.initializeSampleData();
  }

  /**
   * 샘플 데이터 초기화
   */
  private initializeSampleData(): void {
    const sampleUsers: User[] = [
      {
        id: 'teacher1',
        name: '김담임',
        email: 'kim@school.edu',
        role: TeacherRole.HOMEROOM_TEACHER,
        classId: 'class-3-1',
        createdAt: new Date(),
        isActive: true
      },
      {
        id: 'teacher2',
        name: '이일반',
        email: 'lee@school.edu',
        role: TeacherRole.GENERAL_TEACHER,
        subjectIds: ['math', 'science'],
        createdAt: new Date(),
        isActive: true
      }
    ];

    sampleUsers.forEach(user => this.users.set(user.id, user));
  }

  /**
   * 사용자 생성
   */
  createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const user: User = {
      ...userData,
      id: `teacher_${Date.now()}`,
      createdAt: new Date()
    };

    this.users.set(user.id, user);
    return user;
  }

  /**
   * 사용자 조회
   */
  getUserById(id: string): User | null {
    return this.users.get(id) || null;
  }

  /**
   * 이메일로 사용자 조회
   */
  getUserByEmail(email: string): User | null {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  /**
   * 사용자 권한 체크
   */
  checkPermission(userId: string, permission: Permission, resource?: any): AuthorizationResult {
    const user = this.getUserById(userId);
    if (!user) {
      return { allowed: false, reason: '사용자를 찾을 수 없습니다.' };
    }

    return this.rbac.checkPermission(user, permission, resource);
  }

  /**
   * 사용자 역할 변경
   */
  updateUserRole(userId: string, newRole: TeacherRole, additionalData?: Partial<User>): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    user.role = newRole;
    if (additionalData) {
      Object.assign(user, additionalData);
    }

    this.users.set(userId, user);
    return true;
  }

  /**
   * 모든 사용자 조회
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * 담임교사들 조회
   */
  getHomeroomTeachers(): User[] {
    return this.getAllUsers().filter(user => user.role === TeacherRole.HOMEROOM_TEACHER);
  }

  /**
   * 일반교사들 조회
   */
  getGeneralTeachers(): User[] {
    return this.getAllUsers().filter(user => user.role === TeacherRole.GENERAL_TEACHER);
  }
}

/**
 * 인증 서비스 구현
 */
class AuthService implements AuthenticationService {
  private currentUser: User | null = null;
  private teacherService: TeacherService;

  constructor(teacherService: TeacherService) {
    this.teacherService = teacherService;
  }

  /**
   * 로그인
   */
  async login(email: string, password: string): Promise<User | null> {
    // 실제 구현에서는 비밀번호 검증 로직이 필요
    const user = this.teacherService.getUserByEmail(email);

    if (user && user.isActive) {
      this.currentUser = user;
      return user;
    }

    return null;
  }

  /**
   * 로그아웃
   */
  logout(): void {
    this.currentUser = null;
  }

  /**
   * 현재 사용자 조회
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * 인증 상태 확인
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentUser.isActive;
  }
}

// ============================================================================
// 권한 가드 및 데코레이터
// ============================================================================

/**
 * 권한 체크 데코레이터
 */
function RequirePermission(permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const authService: AuthService = this.authService;
      const teacherService: TeacherService = this.teacherService;

      if (!authService.isAuthenticated()) {
        throw new Error('인증이 필요합니다.');
      }

      const currentUser = authService.getCurrentUser()!;
      const authResult = teacherService.checkPermission(currentUser.id, permission, args[0]);

      if (!authResult.allowed) {
        throw new Error(`접근 거부: ${authResult.reason}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 역할 체크 데코레이터
 */
function RequireRole(role: TeacherRole) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const authService: AuthService = this.authService;

      if (!authService.isAuthenticated()) {
        throw new Error('인증이 필요합니다.');
      }

      const currentUser = authService.getCurrentUser()!;
      if (currentUser.role !== role) {
        throw new Error(`접근 거부: ${role} 권한이 필요합니다.`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// ============================================================================
// 비즈니스 로직 서비스
// ============================================================================

/**
 * 학생 관리 서비스
 */
class StudentService {
  private students: Map<string, Student> = new Map();
  private authService: AuthService;
  private teacherService: TeacherService;

  constructor(authService: AuthService, teacherService: TeacherService) {
    this.authService = authService;
    this.teacherService = teacherService;
    this.initializeSampleData();
  }

  /**
   * 샘플 학생 데이터 초기화
   */
  private initializeSampleData(): void {
    const sampleStudents: Student[] = [
      {
        id: 'student1',
        name: '홍길동',
        classId: 'class-3-1',
        grade: 3,
        parentContact: '010-1234-5678',
        createdAt: new Date()
      },
      {
        id: 'student2',
        name: '김영희',
        classId: 'class-3-1',
        grade: 3,
        parentContact: '010-2345-6789',
        createdAt: new Date()
      }
    ];

    sampleStudents.forEach(student => this.students.set(student.id, student));
  }

  /**
   * 학생 목록 조회 (권한 체크 포함)
   */
  @RequirePermission(Permission.VIEW_STUDENTS)
  getStudents(filter?: { classId?: string }): Student[] {
    const currentUser = this.authService.getCurrentUser()!;
    let students = Array.from(this.students.values());

    // 일반교사의 경우 자신이 가르치는 학생들만 조회 가능
    if (currentUser.role === TeacherRole.GENERAL_TEACHER) {
      // 실제 구현에서는 교사-과목-학생 관계를 확인
      students = students.filter(student => {
        // 예시: 교사가 가르치는 반의 학생들만 필터링
        return true; // 실제 로직 구현 필요
      });
    }

    // 담임교사의 경우 자신의 담임 반 학생들만 조회 가능
    if (currentUser.role === TeacherRole.HOMEROOM_TEACHER && currentUser.classId) {
      students = students.filter(student => student.classId === currentUser.classId);
    }

    if (filter?.classId) {
      students = students.filter(student => student.classId === filter.classId);
    }

    return students;
  }

  /**
   * 학생 정보 수정 (담임교사만 가능)
   */
  @RequirePermission(Permission.EDIT_STUDENT_INFO)
  updateStudent(studentId: string, updateData: Partial<Student>): boolean {
    const student = this.students.get(studentId);
    if (!student) {
      return false;
    }

    Object.assign(student, updateData);
    this.students.set(studentId, student);
    return true;
  }

  /**
   * 학생 추가 (담임교사만 가능)
   */
  @RequirePermission(Permission.MANAGE_STUDENTS)
  addStudent(studentData: Omit<Student, 'id' | 'createdAt'>): Student {
    const student: Student = {
      ...studentData,
      id: `student_${Date.now()}`,
      createdAt: new Date()
    };

    this.students.set(student.id, student);
    return student;
  }
}

/**
 * 성적 관리 서비스
 */
class GradeService {
  private grades: Map<string, any> = new Map();
  private authService: AuthService;
  private teacherService: TeacherService;

  constructor(authService: AuthService, teacherService: TeacherService) {
    this.authService = authService;
    this.teacherService = teacherService;
  }

  /**
   * 성적 조회
   */
  @RequirePermission(Permission.VIEW_GRADES)
  getGrades(filter: { studentId?: string; subjectId?: string; classId?: string }): any[] {
    // 실제 구현 로직
    return [];
  }

  /**
   * 성적 관리 (자신의 과목만 가능)
   */
  @RequirePermission(Permission.MANAGE_GRADES)
  updateGrade(gradeData: { studentId: string; subjectId: string; score: number }): boolean {
    const currentUser = this.authService.getCurrentUser()!;

    // 일반교사는 자신의 과목만 성적 관리 가능
    if (currentUser.role === TeacherRole.GENERAL_TEACHER) {
      if (!currentUser.subjectIds?.includes(gradeData.subjectId)) {
        throw new Error('담당 과목의 성적만 관리할 수 있습니다.');
      }
    }

    // 실제 성적 업데이트 로직
    const gradeId = `${gradeData.studentId}_${gradeData.subjectId}`;
    this.grades.set(gradeId, gradeData);
    return true;
  }

  /**
   * 성적 내보내기 (담임교사만 가능)
   */
  @RequireRole(TeacherRole.HOMEROOM_TEACHER)
  exportGrades(classId: string): string {
    // 실제 성적 내보내기 로직
    return '성적표 데이터';
  }
}

/**
 * 출석 관리 서비스
 */
class AttendanceService {
  private attendanceRecords: Map<string, any> = new Map();
  private authService: AuthService;
  private teacherService: TeacherService;

  constructor(authService: AuthService, teacherService: TeacherService) {
    this.authService = authService;
    this.teacherService = teacherService;
  }

  /**
   * 출석 조회
   */
  @RequirePermission(Permission.VIEW_ATTENDANCE)
  getAttendance(filter: { studentId?: string; classId?: string; date?: Date }): any[] {
    // 실제 출석 조회 로직
    return [];
  }

  /**
   * 출석 관리 (담임교사만 가능)
   */
  @RequirePermission(Permission.MANAGE_ATTENDANCE)
  updateAttendance(attendanceData: { studentId: string; date: Date; status: string }): boolean {
    // 실제 출석 업데이트 로직
    const recordId = `${attendanceData.studentId}_${attendanceData.date.toISOString()}`;
    this.attendanceRecords.set(recordId, attendanceData);
    return true;
  }
}

// ============================================================================
// 애플리케이션 통합 및 사용 예제
// ============================================================================

/**
 * 메인 애플리케이션 클래스
 */
class SchoolManagementSystem {
  private teacherService: TeacherService;
  private authService: AuthService;
  private studentService: StudentService;
  private gradeService: GradeService;
  private attendanceService: AttendanceService;

  constructor() {
    this.teacherService = new TeacherService();
    this.authService = new AuthService(this.teacherService);
    this.studentService = new StudentService(this.authService, this.teacherService);
    this.gradeService = new GradeService(this.authService, this.teacherService);
    this.attendanceService = new AttendanceService(this.authService, this.teacherService);
  }

  /**
   * 시스템 초기화
   */
  initialize(): void {
    console.log('학교 관리 시스템이 초기화되었습니다.');
  }

  /**
   * 교사 서비스 반환
   */
  getTeacherService(): TeacherService {
    return this.teacherService;
  }

  /**
   * 인증 서비스 반환
   */
  getAuthService(): AuthService {
    return this.authService;
  }

  /**
   * 학생 서비스 반환
   */
  getStudentService(): StudentService {
    return this.studentService;
  }

  /**
   * 성적 서비스 반환
   */
  getGradeService(): GradeService {
    return this.gradeService;
  }

  /**
   * 출석 서비스 반환
   */
  getAttendanceService(): AttendanceService {
    return this.attendanceService;
  }
}

// ============================================================================
// 실행 예제 및 테스트
// ============================================================================

/**
 * 시스템 사용 예제
 */
async function demonstrateSystem(): Promise<void> {
  const system = new SchoolManagementSystem();
  system.initialize();

  const authService = system.getAuthService();
  const teacherService = system.getTeacherService();
  const studentService = system.getStudentService();
  const gradeService = system.getGradeService();

  try {
    // 1. 담임교사 로그인
    console.log('\n=== 담임교사 로그인 테스트 ===');
    const homeroomTeacher = await authService.login('kim@school.edu', 'password');
    if (homeroomTeacher) {
      console.log(`로그인 성공: ${homeroomTeacher.name} (${homeroomTeacher.role})`);

      // 담임교사의 학생 조회
      const students = studentService.getStudents({ classId: 'class-3-1' });
      console.log(`담당 학생 수: ${students.length}명`);

      // 학생 정보 수정 (담임교사만 가능)
      const updateResult = studentService.updateStudent('student1', { parentContact: '010-9999-9999' });
      console.log(`학생 정보 수정 결과: ${updateResult}`);
    }

    // 2. 일반교사 로그인
    console.log('\n=== 일반교사 로그인 테스트 ===');
    await authService.login('lee@school.edu', 'password');
    const generalTeacher = authService.getCurrentUser();
    if (generalTeacher) {
      console.log(`로그인 성공: ${generalTeacher.name} (${generalTeacher.role})`);

      // 일반교사의 성적 관리 (자신의 과목만)
      try {
        const gradeUpdateResult = gradeService.updateGrade({
          studentId: 'student1',
          subjectId: 'math', // 담당 과목
          score: 95
        });
        console.log(`성적 업데이트 결과: ${gradeUpdateResult}`);
      } catch (error) {
        console.log(`성적 업데이트 실패: ${error}`);
      }

      // 일반교사가 성적 내보내기 시도 (실패해야 함)
      try {
        gradeService.exportGrades('class-3-1');
      } catch (error) {
        console.log(`성적 내보내기 실패 (예상된 결과): ${error}`);
      }
    }

    // 3. 권한 체크 테스트
    console.log('\n=== 권한 체크 테스트 ===');
    const permissionTests = [
      { userId: 'teacher1', permission: Permission.MANAGE_CLASS, expected: true },
      { userId: 'teacher2', permission: Permission.MANAGE_CLASS, expected: false },
      { userId: 'teacher1', permission: Permission.EXPORT_GRADES, expected: true },
      { userId: 'teacher2', permission: Permission.EXPORT_GRADES, expected: false }
    ];

    permissionTests.forEach(test => {
      const result = teacherService.checkPermission(test.userId, test.permission);
      console.log(`사용자 ${test.userId}의 ${test.permission} 권한: ${result.allowed} (예상: ${test.expected})`);
      if (!result.allowed) {
        console.log(`  이유: ${result.reason}`);
      }
    });

  } catch (error) {
    console.error('시스템 실행 중 오류:', error);
  }
}

// ============================================================================
// 내보내기 및 실행
// ============================================================================

export {
  TeacherRole,
  Permission,
  User,
  Student,
  ClassRoom,
  AuthorizationResult,
  RoleBasedAccessControl,
  TeacherService,
  AuthService,
  StudentService,
  GradeService,
  AttendanceService,
  SchoolManagementSystem,
  RequirePermission,
  RequireRole
};

// 시스템 데모 실행
if (require.main === module) {
  demonstrateSystem().catch(console.error);
}