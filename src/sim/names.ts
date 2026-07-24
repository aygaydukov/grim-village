const MALE = [
  "Гримм",
  "Ульф",
  "Боро",
  "Харт",
  "Ивор",
  "Дрен",
  "Каин",
  "Орн",
  "Вальк",
  "Сторм",
  "Ран",
  "Торн",
  "Эгиль",
  "Бран",
  "Морд",
];

const FEMALE = [
  "Сигр",
  "Хельга",
  "Ингрид",
  "Брюн",
  "Астра",
  "Рунна",
  "Эйра",
  "Фрейя",
  "Гудрун",
  "Тира",
  "Скади",
  "Идун",
  "Хильда",
  "Йорунн",
  "Вера",
];

export function randomName(sex: "male" | "female", rng: () => number): string {
  const pool = sex === "male" ? MALE : FEMALE;
  return pool[Math.floor(rng() * pool.length)]!;
}

export const STATE_LABELS: Record<string, string> = {
  wander: "бродит у участка",
  seekFood: "ищет еду",
  eat: "ест",
  seekRest: "идёт домой спать",
  sleep: "спит",
  seekMate: "ищет пару",
  court: "ухаживает",
  seekGather: "идёт на сбор",
  gather: "собирает",
  deposit: "несёт в амбар",
  returnHome: "возвращается на участок",
  patrol: "обходит участок",
  idle: "у дома",
};

export const SEX_LABELS = {
  male: "мужчина",
  female: "женщина",
} as const;
