import express from 'express';
import { readDb, writeDb, slugify, convertToRoman, tenantStorage, restoreTenantContext, ensureTenantSqlLoaded } from '../utils/db.js';
import { auth } from '../middleware/auth.js';
import { logAudit as fileLogAudit } from '../utils/logger.js';

const router = express.Router();

const getActiveTenantId = () => {
  return tenantStorage.getStore() || 'platform';
};

// Helper to log audit trails
const logAudit = (db, req, action, details) => {
  if (!db.auditLogs) db.auditLogs = [];
  const log = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: req.admin ? (req.admin.id || req.admin.username) : 'System',
    userName: req.admin ? (req.admin.username || 'System') : 'System',
    userRole: req.admin ? req.admin.role : 'System',
    action,
    details,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    timestamp: new Date().toISOString()
  };
  db.auditLogs = [log, ...db.auditLogs].slice(0, 500);

  // Write to centralized audit.log file
  fileLogAudit(action, 'Grade/Event/Notice Management', details, req);
};

// Check reference usages before deleting grade or mapping
const checkGradeUsage = (db, gradeName, deptName = null) => {
  const targetOption = deptName ? `${gradeName} (${deptName})` : gradeName;
  
  // 1. Check Students
  const hasStudent = (db.students || []).some(s => 
    s.studentClass === targetOption || 
    s.grade === targetOption || 
    (s.grade && s.grade.split('-')[0] === targetOption)
  );
  if (hasStudent) return 'This grade/option is currently assigned to one or more students.';

  // 2. Check Subjects
  const hasSubject = (db.subjects || []).some(sub => 
    sub.grade === targetOption || 
    sub.classId === targetOption
  );
  if (hasSubject) return 'This grade/option is referenced by one or more subjects.';

  // 3. Check Timetables
  const hasTimetable = (db.timetables || []).some(tt => 
    tt.cohort === targetOption || 
    (tt.cohort && tt.cohort.split('-')[0] === targetOption)
  );
  if (hasTimetable) return 'This grade/option is used in class timetables.';

  // 4. Check Exams
  const hasExam = (db.exams || []).some(ex => 
    (ex.gradeSections || []).some(gs => gs.grade === targetOption)
  );
  if (hasExam) return 'This grade/option is assigned to scheduled examinations.';

  // 5. Check Exam Timetables
  const hasExamTimetable = (db.examTimetables || []).some(et => 
    et.grade === targetOption || 
    et.classId === targetOption ||
    et.cohort === targetOption ||
    (et.cohort && et.cohort.split('-')[0] === targetOption)
  );
  if (hasExamTimetable) return 'This grade/option has scheduled exam timetable slots.';

  // 6. Check Results
  const hasResult = (db.results || []).some(r => r.studentClass === targetOption) ||
                    (db.overallResults || []).some(o => o.classId === targetOption);
  if (hasResult) return 'Academic results exist for this grade/option.';

  // 7. Check Attendance
  const hasAttendance = (db.attendance || []).some(att => att.classId === targetOption);
  if (hasAttendance) return 'Attendance records are associated with this grade/option.';

  return null;
};

// Apply auth to all endpoints
router.use(auth);
router.use(restoreTenantContext);
router.use(ensureTenantSqlLoaded);

// Apply grade-management permission check dynamically based on request method
import { checkPermission } from '../middleware/permissionMiddleware.js';
router.use((req, res, next) => {
  // Bypass permission check for utility lookups (active-options, sections)
  if (req.path === '/active-options' || req.path === '/sections') {
    return next();
  }

  const methodActionMap = {
    'GET': 'view',
    'POST': 'create',
    'PUT': 'edit',
    'PATCH': 'edit',
    'DELETE': 'delete'
  };
  const action = methodActionMap[req.method];
  if (action) {
    return checkPermission('grade-management', action)(req, res, next);
  }
  next();
});

// Helper to check if a grade is 11 or 12
const isGrade11or12 = (name) => {
  if (!name) return false;
  const clean = name.trim().toUpperCase();
  const tokens = clean.split(/[\s()\-]+/);
  return tokens.some(t => ['11', '12', 'XI', 'XII'].includes(t));
};

router.get('/active-options', (req, res) => {
  try {
    const db = readDb();
    const activeGrades = (db.grades || []).filter(g => g.status === 'Active');
    const activeDepartments = (db.departments || []).filter(d => d.status === 'Active');
    const gradeDepartments = db.gradeDepartments || [];

    const options = [];

    activeGrades.forEach(g => {
      if (isGrade11or12(g.name)) {
        const mappingsForGrade = gradeDepartments.filter(gd => gd.gradeId === g.id && gd.status === 'Active');
        if (mappingsForGrade.length > 0) {
          mappingsForGrade.forEach(map => {
            const dept = activeDepartments.find(d => d.id === map.departmentId);
            if (dept) {
              options.push({
                id: `${g.id}-${dept.id}`,
                name: g.name.includes('(') ? g.name : `${g.name} (${dept.name})`,
                gradeId: g.id,
                gradeName: g.name,
                departmentId: dept.id,
                departmentName: dept.name,
                sections: map.sections || []
              });
            }
          });
        } else if (!g.name.includes('(') && activeDepartments.length > 0) {
          activeDepartments.forEach(dept => {
            options.push({
              id: `${g.id}-${dept.id}`,
              name: `${g.name} (${dept.name})`,
              gradeId: g.id,
              gradeName: g.name,
              departmentId: dept.id,
              departmentName: dept.name,
              sections: []
            });
          });
        } else {
          options.push({
            id: g.id,
            name: g.name,
            gradeId: g.id,
            gradeName: g.name,
            departmentId: null,
            departmentName: null,
            sections: []
          });
        }
      } else {
        options.push({
          id: g.id,
          name: g.name,
          gradeId: g.id,
          gradeName: g.name,
          departmentId: null,
          departmentName: null,
          sections: g.sections || []
        });
      }
    });

    res.json(options);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate active grade options: ' + error.message });
  }
});

// ==========================================
// 2. GRADES CRUD
// ==========================================
router.get('/', (req, res) => {
  try {
    const db = readDb();
    res.json(db.grades || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grades: ' + error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, status, departments } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Grade name is required.' });
    }

    const db = readDb();
    if (!db.grades) db.grades = [];
    if (!db.departments) db.departments = [];
    if (!db.gradeDepartments) db.gradeDepartments = [];

    const formattedName = convertToRoman(name.trim());

    // Duplicate Check
    const exists = db.grades.some(g => g.name.trim().toLowerCase() === formattedName.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'A grade with this name already exists.' });
    }

    const gradeId = `grade-${getActiveTenantId()}-${slugify(formattedName)}`;
    const newGrade = {
      id: gradeId,
      name: formattedName,
      status: status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.grades.push(newGrade);

    // If XI, XII, or department list provided
    if (departments && Array.isArray(departments)) {
      departments.forEach(deptId => {
        const mappingId = `map-${gradeId}-${deptId}`;
        const mappingObj = {
          id: mappingId,
          gradeId,
          departmentId: deptId,
          status: 'Active',
          sections: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.gradeDepartments.push(mappingObj);
      });
    }

    logAudit(db, req, 'Create Grade', `Created grade: ${name}`);
    writeDb(db);

    res.status(201).json(newGrade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create grade: ' + error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, sections, departments, departmentId } = req.body;

    const db = readDb();
    const index = db.grades.findIndex(g => g.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Grade not found.' });
    }

    const currentGrade = db.grades[index];

    // Check duplicate name on rename
    if (name) {
      const formattedName = convertToRoman(name.trim());
      if (formattedName.toLowerCase() !== currentGrade.name.toLowerCase()) {
        const exists = db.grades.some(g => g.name.trim().toLowerCase() === formattedName.toLowerCase() && g.id !== id);
        if (exists) {
          return res.status(400).json({ error: 'Another grade with this name already exists.' });
        }
        currentGrade.name = formattedName;
      }
    }

    if (status) {
      currentGrade.status = status;
    }

    if (sections !== undefined) {
      if (departmentId) {
        // Mapped grade section updates
        const map = (db.gradeDepartments || []).find(gd => gd.gradeId === id && gd.departmentId === departmentId);
        if (map) {
          const prevSections = map.sections || [];
          const deletedSections = prevSections.filter(s => !sections.includes(s));
          map.sections = sections;
          map.updatedAt = new Date().toISOString();

          if (deletedSections.length > 0) {
            const dept = (db.departments || []).find(d => d.id === departmentId);
            const targetCohortNames = dept ? [`${currentGrade.name} (${dept.name})`] : [];
            
            deletedSections.forEach(secName => {
              const cohortsToDelete = targetCohortNames.map(gn => `${gn}-${secName}`);

              // 1. Delete timetables
              if (db.timetables) {
                db.timetables = db.timetables.filter(t => 
                  !t.cohort || !cohortsToDelete.some(c => t.cohort.toLowerCase() === c.toLowerCase())
                );
              }
              if (db.publishedClassTimetables) {
                db.publishedClassTimetables = db.publishedClassTimetables.filter(pt => 
                  !pt.cohort || !cohortsToDelete.some(c => pt.cohort.toLowerCase() === c.toLowerCase())
                );
              }

              // 2. Delete exam timetables
              if (db.examTimetables) {
                db.examTimetables = db.examTimetables.filter(et => 
                  (!et.cohort || !cohortsToDelete.some(c => et.cohort.toLowerCase() === c.toLowerCase())) &&
                  !(targetCohortNames.some(gn => et.grade?.toLowerCase() === gn.toLowerCase()) && et.section?.toLowerCase() === secName.toLowerCase())
                );
              }

              // 3. Filter exams gradeSections
              if (db.exams) {
                db.exams.forEach(ex => {
                  if (ex.gradeSections) {
                    ex.gradeSections = ex.gradeSections.filter(gs => 
                      !(targetCohortNames.some(gn => gs.grade?.toLowerCase() === gn.toLowerCase()) && gs.section?.toLowerCase() === secName.toLowerCase())
                    );
                  }
                });
                db.exams = db.exams.filter(ex => !ex.gradeSections || ex.gradeSections.length > 0);
              }

              // 4. Delete attendance
              if (db.attendance) {
                db.attendance = db.attendance.filter(att => 
                  !(targetCohortNames.some(gn => att.classId?.toLowerCase() === gn.toLowerCase()) && att.sectionId?.toLowerCase() === secName.toLowerCase())
                );
              }

              // 5. Delete overall results
              if (db.overallResults) {
                db.overallResults = db.overallResults.filter(o => 
                  !(targetCohortNames.some(gn => o.classId?.toLowerCase() === gn.toLowerCase()) && o.sectionId?.toLowerCase() === secName.toLowerCase()) &&
                  (!o.cohort || !cohortsToDelete.some(c => o.cohort.toLowerCase() === c.toLowerCase()))
                );
              }

              // 6. Clear section for students in the deleted section
              if (db.students) {
                db.students.forEach(s => {
                  if (s.section && s.section.toLowerCase() === secName.toLowerCase() && s.studentClass && targetCohortNames.some(gn => s.studentClass.toLowerCase() === gn.toLowerCase())) {
                    s.section = '';
                  }
                });
              }
            });
          }
        }
      } else {
        // Standard grade section updates
        const prevSections = currentGrade.sections || [];
        const deletedSections = prevSections.filter(s => !sections.includes(s));
        currentGrade.sections = sections;

        if (deletedSections.length > 0) {
          const gradeNames = [currentGrade.name];
          const relatedMappings = (db.gradeDepartments || []).filter(gd => gd.gradeId === id);
          relatedMappings.forEach(m => {
            const dept = (db.departments || []).find(d => d.id === m.departmentId);
            if (dept) {
              gradeNames.push(`${currentGrade.name} (${dept.name})`);
            }
          });

          deletedSections.forEach(secName => {
            const cohortsToDelete = gradeNames.map(gn => `${gn}-${secName}`);

            // 1. Delete timetables
            if (db.timetables) {
              db.timetables = db.timetables.filter(t => 
                !t.cohort || !cohortsToDelete.some(c => t.cohort.toLowerCase() === c.toLowerCase())
              );
            }
            if (db.publishedClassTimetables) {
              db.publishedClassTimetables = db.publishedClassTimetables.filter(pt => 
                !pt.cohort || !cohortsToDelete.some(c => pt.cohort.toLowerCase() === c.toLowerCase())
              );
            }

            // 2. Delete exam timetables
            if (db.examTimetables) {
              db.examTimetables = db.examTimetables.filter(et => 
                (!et.cohort || !cohortsToDelete.some(c => et.cohort.toLowerCase() === c.toLowerCase())) &&
                !(gradeNames.some(gn => et.grade?.toLowerCase() === gn.toLowerCase()) && et.section?.toLowerCase() === secName.toLowerCase())
              );
            }

            // 3. Filter exams gradeSections
            if (db.exams) {
              db.exams.forEach(ex => {
                if (ex.gradeSections) {
                  ex.gradeSections = ex.gradeSections.filter(gs => 
                    !(gradeNames.some(gn => gs.grade?.toLowerCase() === gn.toLowerCase()) && gs.section?.toLowerCase() === secName.toLowerCase())
                  );
                }
              });
              db.exams = db.exams.filter(ex => !ex.gradeSections || ex.gradeSections.length > 0);
            }

            // 4. Delete attendance
            if (db.attendance) {
              db.attendance = db.attendance.filter(att => 
                !(gradeNames.some(gn => att.classId?.toLowerCase() === gn.toLowerCase()) && att.sectionId?.toLowerCase() === secName.toLowerCase())
              );
            }

            // 5. Delete overall results
            if (db.overallResults) {
              db.overallResults = db.overallResults.filter(o => 
                !(gradeNames.some(gn => o.classId?.toLowerCase() === gn.toLowerCase()) && o.sectionId?.toLowerCase() === secName.toLowerCase()) &&
                (!o.cohort || !cohortsToDelete.some(c => o.cohort.toLowerCase() === c.toLowerCase()))
              );
            }

            // 6. Clear section for students in the deleted section
            if (db.students) {
              db.students.forEach(s => {
                if (s.section && s.section.toLowerCase() === secName.toLowerCase() && s.studentClass && gradeNames.some(gn => s.studentClass.toLowerCase() === gn.toLowerCase())) {
                  s.section = '';
                }
              });
            }
          });
        }
      }
    }

    // Sync mappings if provided
    if (departments !== undefined && Array.isArray(departments)) {
      const prevMappings = db.gradeDepartments || [];
      db.gradeDepartments = (db.gradeDepartments || []).filter(gd => gd.gradeId !== id);
      departments.forEach(deptId => {
        const mappingId = `map-${id}-${deptId}`;
        const existingMap = prevMappings.find(m => m.id === mappingId);
        const mappingObj = {
          id: mappingId,
          gradeId: id,
          departmentId: deptId,
          status: 'Active',
          sections: existingMap ? (existingMap.sections || []) : [],
          createdAt: existingMap ? existingMap.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.gradeDepartments.push(mappingObj);
      });
    }

    currentGrade.updatedAt = new Date().toISOString();
    db.grades[index] = currentGrade;

    logAudit(db, req, 'Update Grade', `Updated grade profile: ${currentGrade.name}`);
    writeDb(db);

    res.json(currentGrade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update grade: ' + error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const grade = db.grades.find(g => g.id === id);
    if (!grade) {
      return res.status(404).json({ error: 'Grade not found.' });
    }

    // Reference validation check bypassed to allow clean grade reset / deletion
    /*
    // 1. Grade name check
    const usageError = checkGradeUsage(db, grade.name);
    if (usageError) {
      return res.status(400).json({ error: usageError });
    }

    // 2. Mapped options checks (both database mappings and dynamic XI/XII department combinations)
    const activeMappings = (db.gradeDepartments || []).filter(gd => gd.gradeId === id);
    for (const m of activeMappings) {
      const dept = (db.departments || []).find(d => d.id === m.departmentId);
      if (dept) {
        const optionUsageError = checkGradeUsage(db, grade.name, dept.name);
        if (optionUsageError) {
          return res.status(400).json({ error: `Mapped option "${grade.name} (${dept.name})" is active: ${optionUsageError}` });
        }
      }
    }

    if (isGrade11or12(grade.name)) {
      const activeDepts = (db.departments || []).filter(d => d.status === 'Active');
      for (const dept of activeDepts) {
        const optionUsageError = checkGradeUsage(db, grade.name, dept.name);
        if (optionUsageError) {
          return res.status(400).json({ error: `Mapped option "${grade.name} (${dept.name})" is active: ${optionUsageError}` });
        }
      }
    }
    */

    // Delete subjects associated with this grade's name or mapped names
    const namesToDelete = [grade.name];
    const relatedMappings = (db.gradeDepartments || []).filter(gd => gd.gradeId === id);
    relatedMappings.forEach(m => {
      const dept = (db.departments || []).find(d => d.id === m.departmentId);
      if (dept) {
        namesToDelete.push(`${grade.name} (${dept.name})`);
      }
    });

    if (db.subjects) {
      db.subjects = db.subjects.filter(sub => 
        !sub.grade || !namesToDelete.some(n => sub.grade.toLowerCase() === n.toLowerCase())
      );
    }

    // 2. Delete timetables
    if (db.timetables) {
      db.timetables = db.timetables.filter(t => 
        !t.cohort || !namesToDelete.some(n => t.cohort.toLowerCase() === n.toLowerCase() || t.cohort.toLowerCase().startsWith(n.toLowerCase() + '-'))
      );
    }
    if (db.publishedClassTimetables) {
      db.publishedClassTimetables = db.publishedClassTimetables.filter(pt => 
        !pt.cohort || !namesToDelete.some(n => pt.cohort.toLowerCase() === n.toLowerCase() || pt.cohort.toLowerCase().startsWith(n.toLowerCase() + '-'))
      );
    }

    // 3. Delete exam timetables
    if (db.examTimetables) {
      db.examTimetables = db.examTimetables.filter(et => 
        !et.grade || !namesToDelete.some(n => et.grade.toLowerCase() === n.toLowerCase())
      );
    }

    // 4. Filter exams gradeSections
    if (db.exams) {
      db.exams.forEach(ex => {
        if (ex.gradeSections) {
          ex.gradeSections = ex.gradeSections.filter(gs => 
            !gs.grade || !namesToDelete.some(n => gs.grade.toLowerCase() === n.toLowerCase())
          );
        }
      });
      db.exams = db.exams.filter(ex => !ex.gradeSections || ex.gradeSections.length > 0);
    }

    // 5. Delete attendance
    if (db.attendance) {
      db.attendance = db.attendance.filter(att => 
        !att.classId || !namesToDelete.some(n => att.classId.toLowerCase() === n.toLowerCase())
      );
    }

    // 6. Delete overall results
    if (db.overallResults) {
      db.overallResults = db.overallResults.filter(o => 
        !o.classId || !namesToDelete.some(n => o.classId.toLowerCase() === n.toLowerCase())
      );
    }

    // 7. Delete results
    if (db.results) {
      db.results = db.results.filter(r => 
        !r.studentClass || !namesToDelete.some(n => r.studentClass.toLowerCase() === n.toLowerCase() || r.studentClass.toLowerCase().startsWith(n.toLowerCase() + '-'))
      );
    }

    // 8. Delete students & student enrollments
    let deletedStudentIds = [];
    if (db.students) {
      db.students = db.students.filter(s => {
        const matches = s.studentClass && namesToDelete.some(n => s.studentClass.toLowerCase() === n.toLowerCase() || s.studentClass.toLowerCase().startsWith(n.toLowerCase() + '-'));
        if (matches) {
          deletedStudentIds.push(s.id);
          return false;
        }
        return true;
      });
    }

    if (deletedStudentIds.length > 0) {
      if (db.parentAccounts) db.parentAccounts = db.parentAccounts.filter(pa => !deletedStudentIds.includes(pa.studentId));
      if (db.studentAccounts) db.studentAccounts = db.studentAccounts.filter(sa => !deletedStudentIds.includes(sa.studentId));
      if (db.parents) db.parents = db.parents.filter(p => !deletedStudentIds.includes(p.studentId));
      if (db.addresses) db.addresses = db.addresses.filter(a => !deletedStudentIds.includes(a.studentId));
      if (db.medicalRecords) db.medicalRecords = db.medicalRecords.filter(m => !deletedStudentIds.includes(m.studentId));
      if (db.documents) db.documents = db.documents.filter(d => !deletedStudentIds.includes(d.studentId));
      if (db.feeAssignments) db.feeAssignments = db.feeAssignments.filter(f => !deletedStudentIds.includes(f.studentId));
    }

    // Delete mappings & grade
    db.gradeDepartments = (db.gradeDepartments || []).filter(gd => gd.gradeId !== id);
    db.grades = db.grades.filter(g => g.id !== id);

    logAudit(db, req, 'Delete Grade', `Deleted grade: ${grade.name}`);
    writeDb(db);

    res.json({ success: true, message: `Grade ${grade.name} and its department mappings deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete grade: ' + error.message });
  }
});

// ==========================================
// 3. DEPARTMENTS CRUD
// ==========================================
router.get('/departments', (req, res) => {
  try {
    const db = readDb();
    res.json(db.departments || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments: ' + error.message });
  }
});

router.post('/departments', (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Department name is required.' });
    }

    const db = readDb();
    if (!db.departments) db.departments = [];

    const exists = db.departments.some(d => d.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'A department with this name already exists.' });
    }

    const deptId = `dept-${getActiveTenantId()}-${slugify(name)}`;
    const newDept = {
      id: deptId,
      name: name.trim(),
      status: status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.departments.push(newDept);
    logAudit(db, req, 'Create Department', `Created department: ${name}`);
    writeDb(db);

    res.status(201).json(newDept);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create department: ' + error.message });
  }
});

router.put('/departments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const db = readDb();
    const index = db.departments.findIndex(d => d.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    const dept = db.departments[index];

    if (name && name.trim().toLowerCase() !== dept.name.toLowerCase()) {
      const exists = db.departments.some(d => d.name.trim().toLowerCase() === name.trim().toLowerCase() && d.id !== id);
      if (exists) {
        return res.status(400).json({ error: 'Another department with this name already exists.' });
      }
      dept.name = name.trim();
    }

    if (status) {
      dept.status = status;
    }

    dept.updatedAt = new Date().toISOString();
    db.departments[index] = dept;

    logAudit(db, req, 'Update Department', `Updated department: ${dept.name}`);
    writeDb(db);

    res.json(dept);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update department: ' + error.message });
  }
});

router.delete('/departments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const dept = db.departments.find(d => d.id === id);
    if (!dept) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    // Check if department is currently mapped to any grade in the DB mappings and if those mappings are in use
    const activeMappings = (db.gradeDepartments || []).filter(gd => gd.departmentId === id);
    for (const m of activeMappings) {
      const grade = (db.grades || []).find(g => g.id === m.gradeId);
      if (grade) {
        const optionUsageError = checkGradeUsage(db, grade.name, dept.name);
        if (optionUsageError) {
          return res.status(400).json({ error: `Mapped option "${grade.name} (${dept.name})" is active and in use: ${optionUsageError}` });
        }
      }
    }

    // Dynamic mapping usage check for XI/XII
    const grades11or12 = (db.grades || []).filter(g => isGrade11or12(g.name));
    for (const g of grades11or12) {
      const optionUsageError = checkGradeUsage(db, g.name, dept.name);
      if (optionUsageError) {
        return res.status(400).json({ error: `Mapped option "${g.name} (${dept.name})" is active and in use: ${optionUsageError}` });
      }
    }

    // Clean up mapping entries and delete department
    db.gradeDepartments = (db.gradeDepartments || []).filter(gd => gd.departmentId !== id);
    db.departments = db.departments.filter(d => d.id !== id);
    logAudit(db, req, 'Delete Department', `Deleted department: ${dept.name}`);
    writeDb(db);

    res.json({ success: true, message: `Department ${dept.name} and its mappings deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete department: ' + error.message });
  }
});

// ==========================================
// 4. GRADE-DEPARTMENT MAPPING
// ==========================================
router.get('/mappings', (req, res) => {
  try {
    const db = readDb();
    res.json(db.gradeDepartments || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mappings: ' + error.message });
  }
});

router.post('/mappings', (req, res) => {
  try {
    const { gradeId, departmentId, status } = req.body;
    if (!gradeId || !departmentId) {
      return res.status(400).json({ error: 'Grade ID and Department ID are required.' });
    }

    const db = readDb();
    if (!db.gradeDepartments) db.gradeDepartments = [];

    // Duplicate Check
    const exists = db.gradeDepartments.some(gd => gd.gradeId === gradeId && gd.departmentId === departmentId);
    if (exists) {
      return res.status(400).json({ error: 'This mapping combination already exists.' });
    }

    const mappingId = `map-${gradeId}-${departmentId}`;
    const newMapping = {
      id: mappingId,
      gradeId,
      departmentId,
      status: status || 'Active',
      sections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.gradeDepartments.push(newMapping);
    
    const grade = (db.grades || []).find(g => g.id === gradeId);
    const dept = (db.departments || []).find(d => d.id === departmentId);
    logAudit(db, req, 'Create Mapping', `Mapped grade "${grade?.name || gradeId}" to department "${dept?.name || departmentId}"`);
    
    writeDb(db);
    res.status(201).json(newMapping);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create mapping: ' + error.message });
  }
});

router.delete('/mappings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const map = (db.gradeDepartments || []).find(gd => gd.id === id);
    if (!map) {
      return res.status(404).json({ error: 'Mapping not found.' });
    }

    const grade = (db.grades || []).find(g => g.id === map.gradeId);
    const dept = (db.departments || []).find(d => d.id === map.departmentId);

    if (grade && dept) {
      const mappedName = `${grade.name} (${dept.name})`;
      const namesToDelete = [mappedName];

      // 1. Delete subjects
      if (db.subjects) {
        db.subjects = db.subjects.filter(sub => 
          !sub.grade || !namesToDelete.some(n => sub.grade.toLowerCase() === n.toLowerCase())
        );
      }

      // 2. Delete timetables
      if (db.timetables) {
        db.timetables = db.timetables.filter(t => 
          !t.cohort || !namesToDelete.some(n => t.cohort.toLowerCase() === n.toLowerCase() || t.cohort.toLowerCase().startsWith(n.toLowerCase() + '-'))
        );
      }
      if (db.publishedClassTimetables) {
        db.publishedClassTimetables = db.publishedClassTimetables.filter(pt => 
          !pt.cohort || !namesToDelete.some(n => pt.cohort.toLowerCase() === n.toLowerCase() || pt.cohort.toLowerCase().startsWith(n.toLowerCase() + '-'))
        );
      }

      // 3. Delete exam timetables
      if (db.examTimetables) {
        db.examTimetables = db.examTimetables.filter(et => 
          !et.grade || !namesToDelete.some(n => et.grade.toLowerCase() === n.toLowerCase())
        );
      }

      // 4. Filter exams gradeSections
      if (db.exams) {
        db.exams.forEach(ex => {
          if (ex.gradeSections) {
            ex.gradeSections = ex.gradeSections.filter(gs => 
              !gs.grade || !namesToDelete.some(n => gs.grade.toLowerCase() === n.toLowerCase())
            );
          }
        });
        db.exams = db.exams.filter(ex => !ex.gradeSections || ex.gradeSections.length > 0);
      }

      // 5. Delete attendance
      if (db.attendance) {
        db.attendance = db.attendance.filter(att => 
          !att.classId || !namesToDelete.some(n => att.classId.toLowerCase() === n.toLowerCase())
        );
      }

      // 6. Delete overall results
      if (db.overallResults) {
        db.overallResults = db.overallResults.filter(o => 
          !o.classId || !namesToDelete.some(n => o.classId.toLowerCase() === n.toLowerCase())
        );
      }

      // 7. Delete results
      if (db.results) {
        db.results = db.results.filter(r => 
          !r.studentClass || !namesToDelete.some(n => r.studentClass.toLowerCase() === n.toLowerCase() || r.studentClass.toLowerCase().startsWith(n.toLowerCase() + '-'))
        );
      }

      // 8. Delete students & student enrollments
      let deletedStudentIds = [];
      if (db.students) {
        db.students = db.students.filter(s => {
          const matches = s.studentClass && namesToDelete.some(n => s.studentClass.toLowerCase() === n.toLowerCase() || s.studentClass.toLowerCase().startsWith(n.toLowerCase() + '-'));
          if (matches) {
            deletedStudentIds.push(s.id);
            return false;
          }
          return true;
        });
      }

      if (deletedStudentIds.length > 0) {
        if (db.parentAccounts) db.parentAccounts = db.parentAccounts.filter(pa => !deletedStudentIds.includes(pa.studentId));
        if (db.studentAccounts) db.studentAccounts = db.studentAccounts.filter(sa => !deletedStudentIds.includes(sa.studentId));
        if (db.parents) db.parents = db.parents.filter(p => !deletedStudentIds.includes(p.studentId));
        if (db.addresses) db.addresses = db.addresses.filter(a => !deletedStudentIds.includes(a.studentId));
        if (db.medicalRecords) db.medicalRecords = db.medicalRecords.filter(m => !deletedStudentIds.includes(m.studentId));
        if (db.documents) db.documents = db.documents.filter(d => !deletedStudentIds.includes(d.studentId));
        if (db.feeAssignments) db.feeAssignments = db.feeAssignments.filter(f => !deletedStudentIds.includes(f.studentId));
      }
    }

    db.gradeDepartments = db.gradeDepartments.filter(gd => gd.id !== id);
    logAudit(db, req, 'Delete Mapping', `Removed mapping between "${grade?.name || map.gradeId}" and "${dept?.name || map.departmentId}"`);

    // Check if there are other mappings left for this grade. If none, clean up the master grade as well.
    const remainingMappings = db.gradeDepartments.filter(gd => gd.gradeId === map.gradeId);
    if (remainingMappings.length === 0) {
      db.grades = (db.grades || []).filter(g => g.id !== map.gradeId);
      logAudit(db, req, 'Delete Grade', `Deleted grade "${grade?.name || map.gradeId}" because it has no remaining mappings.`);
    }

    writeDb(db);

    res.json({ success: true, message: 'Mapping removed successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete mapping: ' + error.message });
  }
});

// ==========================================
// 5. SECTIONS CRUD
// ==========================================
router.get('/sections', (req, res) => {
  try {
    const db = readDb();
    res.json(db.sections || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sections: ' + error.message });
  }
});

router.post('/sections', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Section name is required.' });
    }

    const db = readDb();
    if (!db.sections) db.sections = [];

    const exists = db.sections.some(s => s.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'A section with this name already exists.' });
    }

    const sectionId = `section-${getActiveTenantId()}-${slugify(name)}-${Date.now()}`;
    const newSection = {
      id: sectionId,
      name: name.trim(),
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.sections.push(newSection);
    logAudit(db, req, 'Create Section', `Created section: ${name}`);
    writeDb(db);

    res.status(201).json(newSection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create section: ' + error.message });
  }
});

router.put('/sections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const db = readDb();
    const index = db.sections.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Section not found.' });
    }

    const section = db.sections[index];

    if (name && name.trim().toLowerCase() !== section.name.toLowerCase()) {
      const exists = db.sections.some(s => s.name.trim().toLowerCase() === name.trim().toLowerCase() && s.id !== id);
      if (exists) {
        return res.status(400).json({ error: 'Another section with this name already exists.' });
      }
      section.name = name.trim();
    }

    if (status) {
      section.status = status;
    }

    section.updatedAt = new Date().toISOString();
    db.sections[index] = section;

    logAudit(db, req, 'Update Section', `Updated section: ${section.name}`);
    writeDb(db);

    res.json(section);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update section: ' + error.message });
  }
});

router.delete('/sections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const section = db.sections.find(s => s.id === id);
    if (!section) {
      return res.status(404).json({ error: 'Section not found.' });
    }

    db.sections = db.sections.filter(s => s.id !== id);
    logAudit(db, req, 'Delete Section', `Deleted section: ${section.name}`);
    writeDb(db);

    res.json({ success: true, message: `Section ${section.name} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete section: ' + error.message });
  }
});

export default router;
