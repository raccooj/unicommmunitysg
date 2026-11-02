export const UNIVERSITIES = [
  { code: "NUS", name: "National University of Singapore" },
  { code: "NTU", name: "Nanyang Technological University" },
  { code: "SMU", name: "Singapore Management University" },
  { code: "SIM", name: "Singapore Institute of Management" },
] as const;

export type UniversityCode = (typeof UNIVERSITIES)[number]["code"];

export const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "academics", label: "Academics" },
  { value: "campus_life", label: "Campus Life" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export function isUniversity(v: unknown): v is UniversityCode {
  return UNIVERSITIES.some((u) => u.code === v);
}

export function isCategory(v: unknown): v is CategoryValue {
  return CATEGORIES.some((c) => c.value === v);
}

export function categoryLabel(v: string) {
  return CATEGORIES.find((c) => c.value === v)?.label ?? v;
}

export function universityName(code: string) {
  return UNIVERSITIES.find((u) => u.code === code)?.name ?? code;
}

export const TITLE_MAX = 120;
export const BODY_MAX = 5000;
export const COMMENT_MAX = 2000;
