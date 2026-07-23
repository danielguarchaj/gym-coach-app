export type Role = 'COACH' | 'TRAINEE';
export type WeightUnit = 'kg' | 'lb';
export type InviteStatus = 'pending' | 'used';

export interface User {
  pk: string;           // USER#{userId}
  sk: 'PROFILE';
  userId: string;
  email: string;
  name: string;
  role: Role;
  coachId?: string;     // trainees only
  weightUnit: WeightUnit;
  createdAt: string;    // ISO 8601
}

export interface SetRecord {
  reps: number;
  weightKg: number;     // always kg in storage
  restSeconds: number;
}

export interface ExerciseRecord {
  catalogId: string;
  name: string;
  bodyPart: string;
  sets: SetRecord[];
}

export interface WorkoutSession {
  pk: string;           // TRAINEE#{traineeId}
  sk: string;           // SESSION#{isoDate}#{uuid}
  traineeId: string;
  date: string;         // ISO 8601
  durationMin?: number;
  notes?: string;
  exercises: ExerciseRecord[];
}

export interface Exercise {
  pk: string;           // EXERCISE#{exerciseId}
  sk: 'METADATA';
  exerciseId: string;
  name: { es: string; en: string };
  bodyPart: BodyPart;
  category: 'compound' | 'isolation' | 'cardio';
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  isCustom: boolean;
  coachId?: string;     // null for global exercises
}

export interface Invite {
  pk: string;           // INVITE#{token}
  sk: 'METADATA';
  token: string;
  coachId: string;
  coachName: string;
  expiresAt: number;    // Unix timestamp (DynamoDB TTL)
  status: InviteStatus;
}

export type BodyPart =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Legs'
  | 'Glutes'
  | 'Core'
  | 'Cardio';

export interface ApiResponse<T = unknown> {
  statusCode: number;
  body: string;         // JSON.stringify(T)
  headers: Record<string, string>;
}
