const translations = {
  // Levels
  beginner: "مبتدئ",
  learner: "متعلم",
  active: "ناشط",
  enthusiast: "متحمس",
  eco_hero: "بطل البيئة",
  eco_expert: "خبير بيئي",

  // Badges
  first_step: "الخطوة الأولى",
  eco_friend: "صديق البيئة",
  challenge_champion: "بطل التحديات",
  water_protector: "حامي المياه",
  recycling_expert: "خبير إعادة التدوير",
  eco_legend: "أسطورة البيئة",

  // Challenges
  use_water_bottle: "استخدم قارورة ماء",
  walk_to_school: "امشِ إلى المدرسة",
  collect_plastic: "اجمع البلاستيك",
  plant_something: "ازرع شيئاً",
  turn_off_lights: "أطفئ الأنوار",
  teach_sibling: "علّم أخاك",
  sort_waste: "صنف النفايات",

  // Time words
  now: "الآن",
  minute: "دقيقة",
  hour: "ساعة",
  yesterday: "أمس",
  days: "أيام",
  week: "أسبوع",
  month: "شهر",
};

const arabicMonths = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const t = (key) => {
  return translations[key] || key;
};

const formatRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffMinutes < 1) {
    return t("now");
  } else if (diffMinutes < 60) {
    return `منذ ${diffMinutes} ${t("minute")}`;
  } else if (diffHours < 24) {
    return `منذ ${diffHours} ${t("hour")}`;
  } else if (diffDays === 1) {
    return t("yesterday");
  } else if (diffDays < 7) {
    return `منذ ${diffDays} ${t("days")}`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `منذ ${weeks} ${t("week")}`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `منذ ${months} ${t("month")}`;
  }
};

const formatMemberSince = (date) => {
  return `${arabicMonths[date.getMonth()]} ${date.getFullYear()}`;
};

module.exports = {
  translations,
  arabicMonths,
  MS_PER_DAY,
  t,
  formatRelativeTime,
  formatMemberSince,
};
