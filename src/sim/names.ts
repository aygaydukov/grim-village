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

const SURNAMES = [
  "Гриммсон",
  "Туманный",
  "Заречный",
  "Лесной",
  "Каменный",
  "Серый",
  "Волчий",
  "Северный",
  "Пепельный",
  "Ржаной",
  "Болотный",
  "Старый",
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

export function randomSurname(rng: () => number): string {
  return SURNAMES[Math.floor(rng() * SURNAMES.length)]!;
}

export function fullName(agent: { name: string; surname: string }): string {
  return `${agent.name} ${agent.surname}`;
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
  seekBuild: "идёт на стройку",
  build: "строит хижину",
};

export const SEX_LABELS = {
  male: "мужчина",
  female: "женщина",
} as const;
