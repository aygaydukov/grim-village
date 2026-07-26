/**
 * Шкала времени деревни.
 *
 * Якорь: за 1 реальные сутки при скорости ×1 проходит YEARS_PER_REAL_DAY «лет» возраста.
 * Игровой день/ночь (dayLength тиков) остаётся коротким для геймплея голода и смен —
 * меняется только календарь лет / сезонов / беременности.
 */
export const TICKS_PER_REAL_SECOND = 30;
export const DEFAULT_DAY_LENGTH = 1200;
export const YEARS_PER_REAL_DAY = 3;

/** Сколько игровых дней умещается в одни реальные сутки при ×1 */
export const GAME_DAYS_PER_REAL_DAY =
  (24 * 3600 * TICKS_PER_REAL_SECOND) / DEFAULT_DAY_LENGTH; // 2160

/** Прирост возраста за один игровой день */
export const AGE_PER_GAME_DAY = YEARS_PER_REAL_DAY / GAME_DAYS_PER_REAL_DAY; // 3/2160

/** Игровых дней в одном «годе» возраста */
export const GAME_DAYS_PER_YEAR = 1 / AGE_PER_GAME_DAY; // 720

/** Сезон = четверть года */
export const DAYS_PER_SEASON = Math.round(GAME_DAYS_PER_YEAR / 4); // 180

/** Беременность ≈ 9 месяцев */
export const PREGNANCY_GAME_DAYS = GAME_DAYS_PER_YEAR * 0.75; // 540

/** Пауза матери после родов ≈ 1 год */
export const BIRTH_COOLDOWN_GAME_DAYS = GAME_DAYS_PER_YEAR; // 720

/** Пауза пары после зачатия ≈ 2 месяца */
export const MATE_COOLDOWN_GAME_DAYS = GAME_DAYS_PER_YEAR / 6; // 120

export function yearsPerRealDayAtSpeed(speed: number): number {
  return YEARS_PER_REAL_DAY * Math.max(0, speed);
}

export function realSecondsPerGameDay(speed = 1): number {
  return DEFAULT_DAY_LENGTH / (TICKS_PER_REAL_SECOND * Math.max(0.0001, speed));
}

export function formatTimeScaleRu(speed = 1): string {
  const y = yearsPerRealDayAtSpeed(speed);
  const daySec = realSecondsPerGameDay(speed);
  return `×${speed}: ~${y} лет / реальные сутки · игровой день ≈ ${Math.round(daySec)} с`;
}

export function ageYearsFromGameDays(days: number): number {
  return days * AGE_PER_GAME_DAY;
}
