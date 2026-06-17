export const GRADE_ORDER = ['LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const romanMap = { 
  'LKG': -2, 'UKG': -1, 'NURSERY': -3,
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 
};

export function sortGrades(grades) {
  return [...grades].sort((a, b) => {
    const aVal = typeof a === 'string' ? a.toUpperCase() : '';
    const bVal = typeof b === 'string' ? b.toUpperCase() : '';
    
    // Extract base grade (before departments like "(Arts)")
    const aBase = aVal.split(' ')[0];
    const bBase = bVal.split(' ')[0];
    
    const aRoman = romanMap[aBase];
    const bRoman = romanMap[bBase];
    
    if (aRoman !== undefined && bRoman !== undefined) {
      if (aRoman === bRoman) {
        return aVal.localeCompare(bVal);
      }
      return aRoman - bRoman;
    }
    
    const aNum = parseInt(aVal.replace('GRADE', '').trim());
    const bNum = parseInt(bVal.replace('GRADE', '').trim());
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    
    return aVal.localeCompare(bVal);
  });
}

export function sortGradeObjects(options) {
  return [...options].sort((a, b) => {
    const aVal = typeof a.name === 'string' ? a.name.toUpperCase() : '';
    const bVal = typeof b.name === 'string' ? b.name.toUpperCase() : '';
    
    // Extract base grade (before departments like "(Arts)")
    const aBase = aVal.split(' ')[0];
    const bBase = bVal.split(' ')[0];
    
    const aRoman = romanMap[aBase];
    const bRoman = romanMap[bBase];
    
    if (aRoman !== undefined && bRoman !== undefined) {
      if (aRoman === bRoman) {
        return aVal.localeCompare(bVal);
      }
      return aRoman - bRoman;
    }
    
    const aNum = parseInt(aVal.replace('GRADE', '').trim());
    const bNum = parseInt(bVal.replace('GRADE', '').trim());
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    
    return aVal.localeCompare(bVal);
  });
}

export async function fetchActiveGrades() {
  try {
    const res = await fetch('/api/grades/active-options');
    if (res.ok) {
      const options = await res.json();
      const mapped = options.map(opt => ({
        id: opt.id,
        name: opt.name,
        gradeId: opt.gradeId,
        gradeName: opt.gradeName,
        departmentId: opt.departmentId,
        departmentName: opt.departmentName
      }));
      return sortGradeObjects(mapped);
    }
  } catch (err) {
    console.error('Failed to fetch active grades:', err);
  }
  return [];
}

export function getGradesWithSubjects(subjects) {
  if (!subjects || !Array.isArray(subjects)) return [];
  const gradesWithSubjects = [...new Set(subjects.map(s => s.grade).filter(Boolean))];
  return sortGrades(gradesWithSubjects);
}

export function getGradeOptions(subjects) {
  return getGradesWithSubjects(subjects).map(g => ({ value: g, label: `Grade ${g}` }));
}

export async function fetchActiveSections() {
  try {
    const res = await fetch('/api/grades/sections');
    if (res.ok) {
      const data = await res.json();
      return data.filter(s => s.status === 'Active');
    }
  } catch (err) {
    console.error('Failed to fetch active sections:', err);
  }
  return [];
}
