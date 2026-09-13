/**
 * Hand-maintained bootstrap types for the initial schema.
 * Replace this file with Supabase CLI-generated types after a project is connected.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "student" | "admin";
export type CourseStatus = "draft" | "published" | "archived";
export type EnrollmentStatus = "pending" | "active" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type SubmissionStatus = "submitted" | "under_review" | "needs_revision" | "approved" | "rejected";
export type ReferralStatus = "pending" | "qualified" | "rejected";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";
export type ChallengeStatus = "draft" | "upcoming" | "active" | "completed" | "archived";
export type RewardStatus = "active" | "inactive" | "archived";
export type WalletTransactionType = "points_reward" | "referral_reward" | "challenge_reward" | "withdrawal" | "adjustment";
export type WalletTransactionStatus = "pending" | "completed" | "failed" | "reversed";
export type CertificateStatus = "active" | "revoked";

type Id = string;
type Timestamp = string;

export interface Profile {
  id: Id; full_name: string; email: string; avatar_url: string | null; role: UserRole;
  created_at: Timestamp; updated_at: Timestamp;
}
export interface Course {
  id: Id; title: string; slug: string; description: string; short_description: string;
  thumbnail_url: string | null; price: number; status: CourseStatus; created_at: Timestamp; updated_at: Timestamp;
}
export interface CourseModule {
  id: Id; course_id: Id; title: string; description: string | null; sort_order: number; created_at: Timestamp;
}
export interface Lesson {
  id: Id; module_id: Id; title: string; description: string | null; content: string | null;
  video_url: string | null; sort_order: number; created_at: Timestamp; updated_at: Timestamp;
}
export interface Enrollment {
  id: Id; student_id: Id; course_id: Id; status: EnrollmentStatus; progress_percentage: number;
  enrolled_at: Timestamp; completed_at: Timestamp | null;
}
export interface Payment {
  id: Id; student_id: Id; course_id: Id; amount: number; currency: string; status: PaymentStatus;
  provider: string | null; provider_reference: string | null; created_at: Timestamp; paid_at: Timestamp | null;
}
export interface Quiz {
  id: Id; lesson_id: Id; title: string; description: string | null; passing_score: number; created_at: Timestamp;
  is_published: boolean; updated_at: Timestamp;
}
export interface QuizQuestion {
  id: Id; quiz_id: Id; question: string; options: Json; correct_answer: Json; points: number; sort_order: number;
}
export interface QuizAttempt {
  id: Id; student_id: Id; quiz_id: Id; score: number; max_score: number; percentage: number;
  passed: boolean; correct_answers: number; total_questions: number; answers: Json;
  result_summary: Json; submission_token: Id; attempted_at: Timestamp;
}
export interface Task {
  id: Id; course_id: Id; title: string; description: string; submission_type: string;
  points: number; deadline: Timestamp | null; module_id: Id | null; lesson_id: Id | null;
  is_published: boolean; resubmission_allowed: boolean; created_at: Timestamp; updated_at: Timestamp;
}
export interface TaskSubmission {
  id: Id; task_id: Id; student_id: Id; submission_text: string | null; submission_url: string | null;
  file_url: string | null; status: SubmissionStatus; awarded_points: number; feedback: string | null;
  submitted_at: Timestamp; reviewed_at: Timestamp | null; reviewer_id: Id | null;
  submission_token: Id; updated_at: Timestamp;
}
export interface PointEntry {
  id: Id; student_id: Id; points: number; source: string; reference_id: Id | null; created_at: Timestamp;
}
export interface Challenge {
  id: Id; title: string; description: string; course_id: Id | null; points: number;
  start_at: Timestamp; end_at: Timestamp; status: ChallengeStatus; created_at: Timestamp;
}
export interface ChallengeParticipant {
  id: Id; challenge_id: Id; student_id: Id; score: number; rank: number | null; joined_at: Timestamp;
}
export interface Reward {
  id: Id; title: string; description: string; reward_type: string; reward_value: number;
  points_required: number; status: RewardStatus; created_at: Timestamp;
}
export interface Referral {
  id: Id; referrer_id: Id; referred_student_id: Id; referral_code: string; status: ReferralStatus;
  reward_amount: number; created_at: Timestamp; qualified_at: Timestamp | null;
}
export interface Wallet {
  id: Id; student_id: Id; available_balance: number; pending_balance: number;
  total_earned: number; created_at: Timestamp; updated_at: Timestamp;
}
export interface WalletTransaction {
  id: Id; wallet_id: Id; type: WalletTransactionType; amount: number; status: WalletTransactionStatus;
  reference_type: string | null; reference_id: Id | null; description: string | null; created_at: Timestamp;
}
export interface WithdrawalRequest {
  id: Id; student_id: Id; amount: number; method: string; account_reference: string;
  status: WithdrawalStatus; admin_note: string | null; requested_at: Timestamp; processed_at: Timestamp | null;
}
export interface Certificate {
  id: Id; student_id: Id; course_id: Id; certificate_number: string; certificate_type: string;
  issued_at: Timestamp; verification_token: string; status: CertificateStatus;
}
export interface Notification {
  id: Id; student_id: Id; title: string; message: string; type: string;
  read_at: Timestamp | null; created_at: Timestamp;
}
export interface LessonProgress {
  id: Id; student_id: Id; lesson_id: Id; completed: boolean;
  completed_at: Timestamp | null; created_at: Timestamp; updated_at: Timestamp;
}
export interface CourseOutline {
  course_id: Id; course_slug: string; module_id: Id; module_title: string;
  module_description: string | null; module_sort_order: number; lesson_id: Id | null;
  lesson_title: string | null; lesson_description: string | null; lesson_sort_order: number | null;
}

type Insertable<T, Optional extends keyof T = never> = Omit<T, Optional> & Partial<Pick<T, Optional>>;
type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row & Record<string, unknown>;
  Insert: Insert & Record<string, unknown>;
  Update: Update & Record<string, unknown>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile, Insertable<Profile, "created_at" | "updated_at" | "avatar_url" | "role">>;
      courses: Table<Course, Insertable<Course, "id" | "thumbnail_url" | "price" | "status" | "created_at" | "updated_at">>;
      course_modules: Table<CourseModule, Insertable<CourseModule, "id" | "description" | "sort_order" | "created_at">>;
      lessons: Table<Lesson, Insertable<Lesson, "id" | "description" | "content" | "video_url" | "sort_order" | "created_at" | "updated_at">>;
      enrollments: Table<Enrollment, Insertable<Enrollment, "id" | "status" | "progress_percentage" | "enrolled_at" | "completed_at">>;
      payments: Table<Payment, Insertable<Payment, "id" | "currency" | "status" | "provider" | "provider_reference" | "created_at" | "paid_at">>;
      quizzes: Table<Quiz, Insertable<Quiz, "id" | "description" | "passing_score" | "is_published" | "created_at" | "updated_at">>;
      quiz_questions: Table<QuizQuestion, Insertable<QuizQuestion, "id" | "points" | "sort_order">>;
      quiz_attempts: Table<QuizAttempt, Insertable<QuizAttempt, "id" | "passed" | "attempted_at">>;
      tasks: Table<Task, Insertable<Task, "id" | "points" | "deadline" | "module_id" | "lesson_id" | "is_published" | "resubmission_allowed" | "created_at" | "updated_at">>;
      task_submissions: Table<TaskSubmission, Insertable<TaskSubmission, "id" | "submission_text" | "submission_url" | "file_url" | "status" | "awarded_points" | "feedback" | "submitted_at" | "reviewed_at" | "reviewer_id" | "submission_token" | "updated_at">>;
      points: Table<PointEntry, Insertable<PointEntry, "id" | "reference_id" | "created_at">>;
      challenges: Table<Challenge, Insertable<Challenge, "id" | "course_id" | "points" | "status" | "created_at">>;
      challenge_participants: Table<ChallengeParticipant, Insertable<ChallengeParticipant, "id" | "score" | "rank" | "joined_at">>;
      rewards: Table<Reward, Insertable<Reward, "id" | "reward_value" | "points_required" | "status" | "created_at">>;
      referrals: Table<Referral, Insertable<Referral, "id" | "status" | "reward_amount" | "created_at" | "qualified_at">>;
      wallets: Table<Wallet, Insertable<Wallet, "id" | "available_balance" | "pending_balance" | "total_earned" | "created_at" | "updated_at">>;
      wallet_transactions: Table<WalletTransaction, Insertable<WalletTransaction, "id" | "status" | "reference_type" | "reference_id" | "description" | "created_at">>;
      withdrawal_requests: Table<WithdrawalRequest, Insertable<WithdrawalRequest, "id" | "status" | "admin_note" | "requested_at" | "processed_at">>;
      certificates: Table<Certificate, Insertable<Certificate, "id" | "issued_at" | "status">>;
      notifications: Table<Notification, Insertable<Notification, "id" | "type" | "read_at" | "created_at">>;
      lesson_progress: Table<LessonProgress, Insertable<LessonProgress, "id" | "completed" | "completed_at" | "created_at" | "updated_at">>;
    };
    Views: {
      course_outline: {
        Row: CourseOutline & Record<string, unknown>;
        Relationships: [];
      };
    };
    Functions: {
      get_quiz_questions: {
        Args: { p_quiz_id: string };
        Returns: Array<{ question_id: string; question: string; options: Json; points: number; sort_order: number }>;
      };
      is_admin: {
        Args: never;
        Returns: boolean;
      };
      review_task_submission: {
        Args: { p_submission_id: string; p_status: SubmissionStatus; p_awarded_points: number; p_feedback: string };
        Returns: Array<{ submission_id: string; submission_status: SubmissionStatus; awarded_points: number }>;
      };
      submit_task_work: {
        Args: { p_task_id: string; p_submission_text: string; p_submission_url: string; p_submission_token: string };
        Returns: Array<{ submission_id: string; submission_status: SubmissionStatus }>;
      };
      submit_quiz_attempt: {
        Args: { p_quiz_id: string; p_answers: Json; p_submission_token: string };
        Returns: Array<{ attempt_id: string; score: number; max_score: number; percentage: number; passed: boolean; correct_answers: number; total_questions: number }>;
      };
    };
    Enums: {
      user_role: UserRole;
      course_status: CourseStatus;
      enrollment_status: EnrollmentStatus;
      payment_status: PaymentStatus;
      submission_status: SubmissionStatus;
      referral_status: ReferralStatus;
      withdrawal_status: WithdrawalStatus;
      challenge_status: ChallengeStatus;
      reward_status: RewardStatus;
      wallet_transaction_type: WalletTransactionType;
      wallet_transaction_status: WalletTransactionStatus;
      certificate_status: CertificateStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
