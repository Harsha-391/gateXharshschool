// Centralized Grade and Section Normalization and Matching Utilities

const ROMAN_TO_NUM = {
  'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
  'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
  'XI': '11', 'XII': '12'
};

export const normalizeGradeStr = (g) => {
  if (!g) return '';
  let str = String(g).trim().toUpperCase();
  str = str.replace(/^(GRADE|CLASS|STD|STANDARD)\s*/i, '').trim();
  const parts = str.split(/(\s+|[-()])/);
  for (let i = 0; i < parts.length; i++) {
    const token = parts[i].trim();
    if (ROMAN_TO_NUM[token]) {
      parts[i] = ROMAN_TO_NUM[token];
      break;
    }
  }
  return parts.join('').replace(/\s+/g, ' ').trim();
};

export const areGradesMatch = (g1, g2) => {
  if (!g1 || !g2) return false;
  if (String(g1).trim().toLowerCase() === String(g2).trim().toLowerCase()) return true;
  return normalizeGradeStr(g1) === normalizeGradeStr(g2);
};

export const normalizeSectionStr = (s) => {
  if (!s) return '';
  return String(s).trim().toUpperCase().replace(/^(SECTION|SEC\.?)\s*/i, '').trim();
};

export const areSectionsMatch = (s1, s2) => {
  if (!s1 || !s2) return false;
  if (String(s1).trim().toLowerCase() === String(s2).trim().toLowerCase()) return true;
  return normalizeSectionStr(s1) === normalizeSectionStr(s2);
};
