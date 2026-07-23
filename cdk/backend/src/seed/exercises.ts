import { randomUUID } from 'crypto'
import type { Exercise, BodyPart } from '../types/index'

function ex(
  name: { es: string; en: string },
  bodyPart: BodyPart,
  category: Exercise['category'],
  primaryMuscle: string,
  secondaryMuscles: string[],
  equipment: string,
): Omit<Exercise, 'pk' | 'sk'> {
  const id = randomUUID()
  return {
    exerciseId: id,
    name,
    bodyPart,
    category,
    primaryMuscle,
    secondaryMuscles,
    equipment,
    isCustom: false,
    coachId: undefined,
  }
}

export const EXERCISES: Omit<Exercise, 'pk' | 'sk'>[] = [
  // ── Chest ─────────────────────────────────────────────────────────────
  ex({ es: 'Press de Banca', en: 'Bench Press' }, 'Chest', 'compound', 'Pectoral Mayor', ['Tríceps', 'Deltoides Anterior'], 'Barra'),
  ex({ es: 'Press Inclinado con Barra', en: 'Incline Barbell Press' }, 'Chest', 'compound', 'Pectoral Superior', ['Tríceps', 'Deltoides Anterior'], 'Barra'),
  ex({ es: 'Press Declinado con Barra', en: 'Decline Barbell Press' }, 'Chest', 'compound', 'Pectoral Inferior', ['Tríceps'], 'Barra'),
  ex({ es: 'Press con Mancuernas', en: 'Dumbbell Press' }, 'Chest', 'compound', 'Pectoral Mayor', ['Tríceps', 'Deltoides Anterior'], 'Mancuernas'),
  ex({ es: 'Aperturas con Mancuernas', en: 'Dumbbell Flyes' }, 'Chest', 'isolation', 'Pectoral Mayor', ['Deltoides Anterior'], 'Mancuernas'),
  ex({ es: 'Cruce de Poleas', en: 'Cable Crossover' }, 'Chest', 'isolation', 'Pectoral Mayor', [], 'Polea'),
  ex({ es: 'Fondos en Paralelas', en: 'Chest Dips' }, 'Chest', 'compound', 'Pectoral Inferior', ['Tríceps', 'Deltoides Anterior'], 'Peso Corporal'),
  ex({ es: 'Flexiones', en: 'Push-Ups' }, 'Chest', 'compound', 'Pectoral Mayor', ['Tríceps', 'Deltoides Anterior'], 'Peso Corporal'),

  // ── Back ──────────────────────────────────────────────────────────────
  ex({ es: 'Dominadas', en: 'Pull-Ups' }, 'Back', 'compound', 'Dorsal Ancho', ['Bíceps', 'Romboides'], 'Peso Corporal'),
  ex({ es: 'Jalón al Pecho', en: 'Lat Pulldown' }, 'Back', 'compound', 'Dorsal Ancho', ['Bíceps', 'Romboides'], 'Polea'),
  ex({ es: 'Remo en Polea Baja', en: 'Seated Cable Row' }, 'Back', 'compound', 'Dorsal Ancho', ['Bíceps', 'Romboides'], 'Polea'),
  ex({ es: 'Remo con Barra', en: 'Barbell Bent-Over Row' }, 'Back', 'compound', 'Dorsal Ancho', ['Bíceps', 'Romboides', 'Trapecios'], 'Barra'),
  ex({ es: 'Peso Muerto', en: 'Deadlift' }, 'Back', 'compound', 'Erector Espinal', ['Dorsales', 'Glúteos', 'Isquiotibiales'], 'Barra'),
  ex({ es: 'Remo con Mancuerna', en: 'One-Arm Dumbbell Row' }, 'Back', 'compound', 'Dorsal Ancho', ['Bíceps', 'Romboides'], 'Mancuerna'),
  ex({ es: 'Face Pull', en: 'Face Pull' }, 'Back', 'isolation', 'Deltoides Posterior', ['Romboides', 'Trapecios'], 'Polea'),
  ex({ es: 'Remo en T', en: 'T-Bar Row' }, 'Back', 'compound', 'Dorsal Ancho', ['Bíceps', 'Romboides'], 'Barra T'),

  // ── Shoulders ─────────────────────────────────────────────────────────
  ex({ es: 'Press Militar', en: 'Overhead Press' }, 'Shoulders', 'compound', 'Deltoides Medial', ['Tríceps', 'Trapecios'], 'Barra'),
  ex({ es: 'Press Arnold', en: 'Arnold Press' }, 'Shoulders', 'compound', 'Deltoides Anterior', ['Deltoides Medial', 'Tríceps'], 'Mancuernas'),
  ex({ es: 'Elevaciones Laterales', en: 'Lateral Raises' }, 'Shoulders', 'isolation', 'Deltoides Medial', [], 'Mancuernas'),
  ex({ es: 'Elevaciones Frontales', en: 'Front Raises' }, 'Shoulders', 'isolation', 'Deltoides Anterior', [], 'Mancuernas'),
  ex({ es: 'Pájaros', en: 'Reverse Flyes' }, 'Shoulders', 'isolation', 'Deltoides Posterior', ['Romboides'], 'Mancuernas'),
  ex({ es: 'Remo al Mentón', en: 'Upright Row' }, 'Shoulders', 'compound', 'Trapecios', ['Deltoides Medial'], 'Barra'),
  ex({ es: 'Encogimientos', en: 'Shrugs' }, 'Shoulders', 'isolation', 'Trapecios Superiores', [], 'Barra o Mancuernas'),

  // ── Biceps ────────────────────────────────────────────────────────────
  ex({ es: 'Curl con Barra', en: 'Barbell Curl' }, 'Biceps', 'isolation', 'Bíceps', ['Braquial'], 'Barra'),
  ex({ es: 'Curl con Mancuernas', en: 'Dumbbell Curl' }, 'Biceps', 'isolation', 'Bíceps', ['Braquial'], 'Mancuernas'),
  ex({ es: 'Curl Martillo', en: 'Hammer Curl' }, 'Biceps', 'isolation', 'Braquiorradial', ['Bíceps'], 'Mancuernas'),
  ex({ es: 'Curl Predicador', en: 'Preacher Curl' }, 'Biceps', 'isolation', 'Bíceps', [], 'Barra / Mancuerna'),
  ex({ es: 'Curl en Polea', en: 'Cable Curl' }, 'Biceps', 'isolation', 'Bíceps', [], 'Polea'),
  ex({ es: 'Curl de Concentración', en: 'Concentration Curl' }, 'Biceps', 'isolation', 'Bíceps', [], 'Mancuerna'),

  // ── Triceps ───────────────────────────────────────────────────────────
  ex({ es: 'Press Cerrado', en: 'Close-Grip Bench Press' }, 'Triceps', 'compound', 'Tríceps', ['Pectoral', 'Deltoides'], 'Barra'),
  ex({ es: 'Press Francés', en: 'Skull Crushers' }, 'Triceps', 'isolation', 'Tríceps', [], 'Barra'),
  ex({ es: 'Extensión en Polea Alta', en: 'Tricep Pushdown' }, 'Triceps', 'isolation', 'Tríceps', [], 'Polea'),
  ex({ es: 'Extensión de Tríceps sobre la Cabeza', en: 'Overhead Tricep Extension' }, 'Triceps', 'isolation', 'Tríceps', [], 'Mancuerna / Polea'),
  ex({ es: 'Fondos para Tríceps', en: 'Tricep Dips' }, 'Triceps', 'compound', 'Tríceps', ['Pectoral', 'Deltoides'], 'Peso Corporal'),
  ex({ es: 'Patada de Tríceps', en: 'Tricep Kickbacks' }, 'Triceps', 'isolation', 'Tríceps', [], 'Mancuerna'),

  // ── Legs ──────────────────────────────────────────────────────────────
  ex({ es: 'Sentadilla', en: 'Squat' }, 'Legs', 'compound', 'Cuádriceps', ['Glúteos', 'Isquiotibiales', 'Core'], 'Barra'),
  ex({ es: 'Prensa de Piernas', en: 'Leg Press' }, 'Legs', 'compound', 'Cuádriceps', ['Glúteos', 'Isquiotibiales'], 'Máquina'),
  ex({ es: 'Zancadas', en: 'Lunges' }, 'Legs', 'compound', 'Cuádriceps', ['Glúteos', 'Isquiotibiales'], 'Peso Corporal / Mancuernas'),
  ex({ es: 'Extensión de Cuádriceps', en: 'Leg Extension' }, 'Legs', 'isolation', 'Cuádriceps', [], 'Máquina'),
  ex({ es: 'Curl de Pierna', en: 'Leg Curl' }, 'Legs', 'isolation', 'Isquiotibiales', [], 'Máquina'),
  ex({ es: 'Elevación de Talones de Pie', en: 'Standing Calf Raise' }, 'Legs', 'isolation', 'Gastrocnemio', ['Sóleo'], 'Máquina / Peso Corporal'),
  ex({ es: 'Peso Muerto Rumano', en: 'Romanian Deadlift' }, 'Legs', 'compound', 'Isquiotibiales', ['Glúteos', 'Erector Espinal'], 'Barra'),
  ex({ es: 'Sentadilla Frontal', en: 'Front Squat' }, 'Legs', 'compound', 'Cuádriceps', ['Core', 'Glúteos'], 'Barra'),
  ex({ es: 'Hack Squat', en: 'Hack Squat' }, 'Legs', 'compound', 'Cuádriceps', ['Glúteos'], 'Máquina'),

  // ── Glutes ────────────────────────────────────────────────────────────
  ex({ es: 'Hip Thrust', en: 'Hip Thrust' }, 'Glutes', 'compound', 'Glúteo Mayor', ['Isquiotibiales', 'Core'], 'Barra'),
  ex({ es: 'Puente de Glúteos', en: 'Glute Bridge' }, 'Glutes', 'isolation', 'Glúteo Mayor', ['Isquiotibiales'], 'Peso Corporal / Barra'),
  ex({ es: 'Patada Trasera en Polea', en: 'Cable Kickback' }, 'Glutes', 'isolation', 'Glúteo Mayor', [], 'Polea'),
  ex({ es: 'Sentadilla Sumo', en: 'Sumo Squat' }, 'Glutes', 'compound', 'Glúteo Mayor', ['Aductores', 'Cuádriceps'], 'Mancuerna / Barra'),
  ex({ es: 'Step-Up', en: 'Step-Up' }, 'Glutes', 'compound', 'Glúteo Mayor', ['Cuádriceps', 'Isquiotibiales'], 'Banco / Mancuernas'),

  // ── Core ──────────────────────────────────────────────────────────────
  ex({ es: 'Plancha', en: 'Plank' }, 'Core', 'isolation', 'Core', ['Hombros', 'Glúteos'], 'Peso Corporal'),
  ex({ es: 'Crunch', en: 'Crunches' }, 'Core', 'isolation', 'Recto Abdominal', [], 'Peso Corporal'),
  ex({ es: 'Elevación de Piernas', en: 'Leg Raise' }, 'Core', 'isolation', 'Recto Abdominal Inferior', ['Flexores de Cadera'], 'Peso Corporal / Barra Dominadas'),
  ex({ es: 'Giro Ruso', en: 'Russian Twist' }, 'Core', 'isolation', 'Oblicuos', ['Recto Abdominal'], 'Peso Corporal / Disco'),
  ex({ es: 'Crunch en Polea', en: 'Cable Crunch' }, 'Core', 'isolation', 'Recto Abdominal', ['Oblicuos'], 'Polea'),
  ex({ es: 'Rueda Abdominal', en: 'Ab Wheel Rollout' }, 'Core', 'compound', 'Recto Abdominal', ['Oblicuos', 'Hombros', 'Dorsales'], 'Rueda Abdominal'),
  ex({ es: 'Mountain Climbers', en: 'Mountain Climbers' }, 'Core', 'compound', 'Core', ['Hombros', 'Flexores de Cadera'], 'Peso Corporal'),

  // ── Cardio ────────────────────────────────────────────────────────────
  ex({ es: 'Cinta de Correr', en: 'Treadmill' }, 'Cardio', 'cardio', 'Sistema Cardiovascular', ['Piernas'], 'Máquina'),
  ex({ es: 'Remo Ergómetro', en: 'Rowing Machine' }, 'Cardio', 'cardio', 'Sistema Cardiovascular', ['Espalda', 'Piernas', 'Core'], 'Máquina'),
  ex({ es: 'Bicicleta Estática', en: 'Stationary Bike' }, 'Cardio', 'cardio', 'Sistema Cardiovascular', ['Cuádriceps', 'Isquiotibiales'], 'Máquina'),
  ex({ es: 'Saltar la Cuerda', en: 'Jump Rope' }, 'Cardio', 'cardio', 'Sistema Cardiovascular', ['Pantorrillas', 'Hombros'], 'Cuerda'),
  ex({ es: 'Burpees', en: 'Burpees' }, 'Cardio', 'cardio', 'Cuerpo Completo', ['Core', 'Pecho', 'Piernas'], 'Peso Corporal'),
  ex({ es: 'Escaladora', en: 'Stair Climber' }, 'Cardio', 'cardio', 'Sistema Cardiovascular', ['Glúteos', 'Cuádriceps'], 'Máquina'),
]
