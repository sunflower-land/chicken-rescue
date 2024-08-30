export type BumpkinLevel =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50
  | 51
  | 52
  | 53
  | 54
  | 55
  | 56
  | 57
  | 58
  | 59
  | 60
  | 61
  | 62
  | 63
  | 64
  | 65
  | 66
  | 67
  | 68
  | 69
  | 70
  | 71
  | 72
  | 73
  | 74
  | 75;

export const LEVEL_EXPERIENCE: Record<BumpkinLevel, number> = {
  1: 0,
  2: 2,
  3: 22,
  4: 230,
  5: 625,
  6: 1500,
  7: 3400,
  8: 7000,
  9: 11000,
  10: 15500,
  11: 20000,
  12: 25000,
  13: 30500,
  14: 36500,
  15: 44000,
  16: 52000,
  17: 60500,
  18: 69500,
  19: 79500,
  20: 90000,
  21: 100500,
  22: 111500,
  23: 123000,
  24: 135500,
  25: 148500,
  26: 162000,
  27: 176000,
  28: 190500,
  29: 205500,
  30: 220500,
  31: 236500,
  32: 254500,
  33: 274500,
  34: 296500,
  35: 320500,
  36: 348500,
  37: 380500,
  38: 416500,
  39: 456500,
  40: 500500,
  41: 548500,
  42: 601500,
  43: 659500,
  44: 722500,
  45: 790500,
  46: 868500,
  47: 956500,
  48: 1054500,
  49: 1162500,
  50: 1280500,
  51: 1410500,
  52: 1552500,
  53: 1700500,
  54: 1855500,
  55: 2025500,
  56: 2210500,
  57: 2415500,
  58: 2640500,
  59: 2880500,
  60: 3140500,
  61: 3415500,
  62: 3705500,
  63: 4015500,
  64: 4340500,
  65: 4680500,
  66: 5035500,
  67: 5405500,
  68: 5790500,
  69: 6190500,
  70: 6610500,
  71: 7050500,
  72: 7510500,
  73: 7990500,
  74: 8490500,
  75: 9015500,
};

const MAX_BUMPKIN_LEVEL: BumpkinLevel = 75;

export const isMaxLevel = (experience: number): boolean => {
  return experience >= LEVEL_EXPERIENCE[MAX_BUMPKIN_LEVEL];
};

export const getBumpkinLevel = (experience: number): BumpkinLevel => {
  let bumpkinLevel: BumpkinLevel = 1;
  for (const key in LEVEL_EXPERIENCE) {
    const level = Number(key) as BumpkinLevel;
    if (experience >= LEVEL_EXPERIENCE[level]) {
      bumpkinLevel = level;
    } else {
      break;
    }
  }
  return bumpkinLevel;
};

export const SKILL_POINTS: Record<BumpkinLevel, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 3,
  6: 4,
  7: 5,
  8: 6,
  9: 7,
  10: 7,
  11: 8,
  12: 9,
  13: 10,
  14: 10,
  15: 11,
  16: 12,
  17: 13,
  18: 13,
  19: 14,
  20: 15,
  21: 16,
  22: 16,
  23: 17,
  24: 18,
  25: 18,
  26: 19,
  27: 20,
  28: 21,
  29: 21,
  30: 22,
  31: 22,
  32: 23,
  33: 23,
  34: 24,
  35: 24,
  36: 25,
  37: 25,
  38: 26,
  39: 26,
  40: 27,
  41: 27,
  42: 28,
  43: 28,
  44: 29,
  45: 29,
  46: 30,
  47: 30,
  48: 31,
  49: 31,
  50: 32,
  51: 32,
  52: 33,
  53: 33,
  54: 34,
  55: 34,
  56: 35,
  57: 35,
  58: 36,
  59: 36,
  60: 37,
  61: 37,
  62: 38,
  63: 38,
  64: 39,
  65: 39,
  66: 40,
  67: 40,
  68: 41,
  69: 41,
  70: 42,
  71: 42,
  72: 43,
  73: 43,
  74: 44,
  75: 44,
};

export const findLevelRequiredForNextSkillPoint = (
  experience: number,
): BumpkinLevel | undefined => {
  const bumpkinLevel = getBumpkinLevel(experience);
  const availableSkillPoints = bumpkinLevel;

  if (availableSkillPoints < 1) {
    return undefined;
  }

  return (bumpkinLevel + 1) as BumpkinLevel;
};

export const getExperienceToNextLevel = (experience: number) => {
  const level = getBumpkinLevel(experience);

  const nextLevelExperience = LEVEL_EXPERIENCE[(level + 1) as BumpkinLevel];
  const currentLevelExperience = LEVEL_EXPERIENCE[level] || 0;

  const currentExperienceProgress = experience - currentLevelExperience;
  const experienceToNextLevel = nextLevelExperience - currentLevelExperience;

  if (level === MAX_BUMPKIN_LEVEL) {
    return {
      currentExperienceProgress,
      experienceToNextLevel: 0,
    };
  }

  return {
    currentExperienceProgress,
    experienceToNextLevel,
  };
};
