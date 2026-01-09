// Mock user data for Storybook and tests

export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  role?: 'student' | 'professor' | 'admin';
  organizationId?: string;
}

export const mockStudent: MockUser = {
  id: 'user_student_123',
  firstName: 'Marie',
  lastName: 'Dupont',
  email: 'marie.dupont@example.com',
  imageUrl: 'https://ui-avatars.com/api/?name=Marie+Dupont&background=6366f1&color=fff',
  role: 'student',
};

export const mockProfessor: MockUser = {
  id: 'user_prof_456',
  firstName: 'Jean',
  lastName: 'Martin',
  email: 'jean.martin@university.edu',
  imageUrl: 'https://ui-avatars.com/api/?name=Jean+Martin&background=059669&color=fff',
  role: 'professor',
  organizationId: 'org_university_1',
};

export const mockAdmin: MockUser = {
  id: 'user_admin_789',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@akseli.com',
  imageUrl: 'https://ui-avatars.com/api/?name=Admin&background=dc2626&color=fff',
  role: 'admin',
};

// Clerk-like user object structure
export const mockClerkUser = {
  id: mockStudent.id,
  firstName: mockStudent.firstName,
  lastName: mockStudent.lastName,
  fullName: `${mockStudent.firstName} ${mockStudent.lastName}`,
  primaryEmailAddress: {
    emailAddress: mockStudent.email,
  },
  imageUrl: mockStudent.imageUrl,
  publicMetadata: {},
  privateMetadata: {},
  unsafeMetadata: {},
};

// Session token mock
export const mockSessionToken = 'mock_session_token_xyz123';

// Organization membership mock
export const mockOrganizationMembership = {
  id: 'mem_123',
  organization: {
    id: 'org_university_1',
    name: 'University of Montreal',
    slug: 'udem',
  },
  role: 'org:professor',
  publicMetadata: {},
};
