
export enum UserRole {
  STUDENT = 'student',
  ORGANIZER = 'organizer',
  ADMIN = 'admin'
}

export enum EventCategory {
  ACADEMIC = 'academic',
  SOCIAL = 'social',
  CAREER = 'career',
  SPORTS = 'sports',
  VOLUNTEERING = 'volunteering',
  ARTS = 'arts',
  GAMING = 'gaming',
  WORKSHOP = 'workshop',
  CULTURAL = 'cultural',
  CONFERENCE = 'conference',
  OTHER = 'other'
}

export enum EventStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DRAFT = 'draft'
}

export enum NotificationType {
  EVENT_REMINDER = 'event_reminder',
  EVENT_UPDATE = 'event_update',
  REGISTRATION_CONFIRMED = 'registration_confirmed',
  EVENT_CANCELLED = 'event_cancelled',
  RECOMMENDATION = 'recommendation',
  FEEDBACK_REQUEST = 'feedback_request',
  EVENT_APPROVAL_REQUEST = 'event_approval_request', // For Admins
  EVENT_STATUS_CHANGE = 'event_status_change' // For Organizers
}

export interface Department {
  id: string;
  name: string;
  facultyId: string;
  description?: string;
}

export interface Faculty {
  id: string;
  name: string;
  abbreviation: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  createdAt: string;
  departments?: Department[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  facultyId?: string;
  profileImage?: string;
  phone?: string;
  bio?: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: PaginationMeta;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  facultyId?: string;
  role?: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  facultyId?: string;
  profileImage?: string;
  phone?: string;
  bio?: string;
}

export interface UserInterestsResponse {
  interests: string[];
}

export interface UpdateInterestsPayload {
  interests: string[];
}

export interface UpdateRolePayload {
  role: UserRole | string;
}

export interface CreateFacultyPayload {
  name: string;
  abbreviation: string;
  description?: string;
  website?: string;
  contactEmail?: string;
}

export interface CreateDepartmentPayload {
  name: string;
  facultyId: string;
  description?: string;
  website?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  organizerId: string;
  location: string;
  startDate: string;
  endDate: string;
  type: string; // API uses 'type', maps to EventCategory strings
  status: EventStatus;
  maxParticipants?: number;
  currentParticipants: number;
  coverImage?: string;
  rejectionReason?: string;
  isOnline?: boolean;
  onlineLink?: string;
  registrationDeadline?: string;
  address?: string;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  shortDescription?: string;
  type: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  location: string;
  isOnline: boolean;
  onlineLink?: string;
  maxParticipants?: number;
  coverImage?: string;
  tags?: string[];
  facultyId?: string;
  departmentId?: string;
  address?: string;
  requirements?: string;
  targetAudience?: string;
  status?: string;
  rejectionReason?: string | null;
}

export interface Participant {
  id: string;
  userId: string;
  eventId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  ticketNumber?: string;
  checkedInAt?: string;
  user?: { // Optional, depending on if API expands user details
      firstName: string;
      lastName: string;
      email: string;
  }
}

export interface EventStats {
  totalRegistrations: number;
  confirmed: number;
  attended: number;
  cancelled: number;
}

export interface Feedback {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment?: string;
  isAnonymous: boolean;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
}

export interface FeedbackStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
}

export interface CreateFeedbackPayload {
  eventId: string;
  rating: number;
  comment?: string;
  isAnonymous?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  isRead: boolean;
  data?: any; // JSON payload for extra info like eventId
  createdAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface EventMaterial {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
}

export interface CreateMaterialPayload {
  eventId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  isPublic?: boolean;
}