import { readDb, writeDb, addActivity, getDefaultRoles } from '../utils/db.js';

const mapDesignationToRoleId = (designation, dbRoles = []) => {
  if (!designation) return 'role-subject-teacher';
  
  // Try to find matching role name in dbRoles (case insensitive)
  const matchedRole = dbRoles.find(r => r.name.toLowerCase() === designation.toLowerCase());
  if (matchedRole) return matchedRole.id;
  
  // Dynamic slug format fallback
  const slugId = `role-${designation.toLowerCase().trim().replace(/\s+/g, '-')}`;
  if (dbRoles.some(r => r.id === slugId)) {
    return slugId;
  }
  
  switch (designation) {
    case 'Super Admin':
    case 'role-super-admin':
      return 'role-principal';
    case 'Academic':
    case 'role-academic':
      return 'role-academic-coordinator';
    case 'Accountant':
    case 'role-accountant':
      return 'role-accountant';
    case 'Receptionist':
    case 'role-receptionist':
      return 'role-receptionist';
    case 'Subject Teacher':
    case 'role-subject-teacher':
      return 'role-subject-teacher';
    case 'Teacher':
    case 'role-teacher':
      return 'role-subject-teacher';
    case 'Expense Manager':
    case 'role-expense-manager':
      return 'role-expense-manager';
    default:
      return 'role-subject-teacher';
  }
};

// ========================================================
// TEACHER CRUD CONTROLLERS
// ========================================================

// 1. REGISTER NEW TEACHER
export const registerTeacher = async (req, res) => {
  try {
    const db = readDb();
    
    // Parse form parameters
    const {
      firstName,
      middleName,
      lastName,
      fullName,
      gender,
      dob,
      bloodGroup,
      nationality,
      maritalStatus,
      aadhaarNumber,
      panNumber,
      joiningDate,
      employmentType,
      designation,
      department,
      primarySubject,
      secondarySubject,
      mobile,
      alternateMobile,
      email,
      emergencyContactNumber,
      currentAddress,
      currentCity,
      currentState,
      currentCountry,
      currentPostalCode,
      permanentAddress,
      permanentCity,
      permanentState,
      permanentCountry,
      permanentPostalCode,
      sameAsPermanent,
      qualification,
      experience,
      experiences,
      salary,
      username,
      password
    } = req.body;

    // Fallback to construct full name if missing
    const derivedFullName = fullName || [firstName, middleName, lastName].filter(Boolean).join(' ');

    // Validate required fields (bare minimums)
    if (!derivedFullName) {
      return res.status(400).json({ error: 'Missing required teacher registration details (Full Name).' });
    }

    if (aadhaarNumber && !/^\d{12}$/.test(String(aadhaarNumber).replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid Aadhaar number. Must be exactly 12 digits.' });
    }
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(panNumber).toUpperCase())) {
      return res.status(400).json({ error: 'Invalid PAN card format. Must match ABCDE1234F.' });
    }

    // Generate unique employee ID (Format: EMP-2026-XXXX, sequential starting at 1001)
    const currentYear = 2026;
    let maxNum = 1000;
    const prefix = 'EMP';
    const yearPrefix = `${prefix}-${currentYear}-`;
    if (db.teachers && db.teachers.length > 0) {
      db.teachers.forEach(t => {
        const id = t.employeeId || t.id || '';
        if (id.startsWith(yearPrefix)) {
          const suffixNum = parseInt(id.replace(yearPrefix, ''), 10);
          if (!isNaN(suffixNum) && suffixNum > maxNum) {
            maxNum = suffixNum;
          }
        }
      });
    }
    const employeeId = `${yearPrefix}${maxNum + 1}`;

    // Generate QR Code containing Employee ID and Employee Type
    let qrPath = '';
    try {
      const { generateQrCode } = await import('../utils/qrService.js');
      qrPath = await generateQrCode(employeeId, 'Teacher');
    } catch (qrErr) {
      console.error('Failed to generate QR Code during teacher registration:', qrErr);
    }

    // Auto-generate username and password if not provided
    const generatedUsername = username || `teacher_${employeeId.toLowerCase().replace(/-/g, '_')}`;
    const generatedPassword = password || 'teacher123';

    // Check username uniqueness
    const usernameExists = db.teachers.some(t => t.username === generatedUsername);
    if (usernameExists) {
      return res.status(400).json({ error: 'Generated username already exists. Please try again or specify a username.' });
    }

    // Map uploaded file routes
    const files = req.files || {};
    const photoPath = files.photo ? `/uploads/${files.photo[0].filename}` : '';
    const aadhaarPath = files.aadhaarFile ? `/uploads/${files.aadhaarFile[0].filename}` : '';
    const panPath = files.panFile ? `/uploads/${files.panFile[0].filename}` : '';
    const resumePath = files.resumeFile ? `/uploads/${files.resumeFile[0].filename}` : '';
    const qualificationPath = files.qualificationFile ? `/uploads/${files.qualificationFile[0].filename}` : '';
    const experiencePath = files.experienceFile ? `/uploads/${files.experienceFile[0].filename}` : '';
    const joiningLetterPath = files.joiningLetterFile ? `/uploads/${files.joiningLetterFile[0].filename}` : '';
    const otherPath = files.otherFile ? `/uploads/${files.otherFile[0].filename}` : '';

    // Parse qualification & experience arrays if they came as stringified JSON
    let parsedQualifications = qualification;
    if (typeof qualification === 'string') {
      try {
        parsedQualifications = JSON.parse(qualification);
      } catch (e) {
        parsedQualifications = [];
      }
    }
    let parsedExperiences = experiences;
    if (typeof experiences === 'string') {
      try {
        parsedExperiences = JSON.parse(experiences);
      } catch (e) {
        parsedExperiences = [];
      }
    }

    const newTeacher = {
      id: employeeId, // Direct backward compatibility index
      employeeId,
      qrCodePath: qrPath,
      name: derivedFullName, // Legacy compatibility
      fullName: derivedFullName,
      firstName: firstName || derivedFullName.split(' ')[0],
      middleName: middleName || '',
      lastName: lastName || derivedFullName.split(' ').slice(1).join(' '),
      gender: gender || '',
      dob: dob || '',
      bloodGroup: bloodGroup || '',
      nationality: nationality || 'Indian',
      maritalStatus: maritalStatus || '',
      aadhaarNumber: aadhaarNumber || '',
      panNumber: panNumber || '',
      joiningDate: joiningDate || '',
      employmentType: employmentType || '',
      designation: designation || '',
      department: department || '',
      primarySubject: primarySubject || '',
      secondarySubject: secondarySubject || '',
      mobile: mobile || '',
      phone: mobile || '', // Legacy compatibility
      alternateMobile: alternateMobile || '',
      email: email || '',
      emergencyContactNumber: emergencyContactNumber || '',
      currentAddress: currentAddress || '',
      currentCity: currentCity || '',
      currentState: currentState || '',
      currentCountry: currentCountry || 'India',
      currentPostalCode: currentPostalCode || '',
      permanentAddress: permanentAddress || '',
      permanentCity: permanentCity || '',
      permanentState: permanentState || '',
      permanentCountry: permanentCountry || 'India',
      permanentPostalCode: permanentPostalCode || '',
      sameAsPermanent: sameAsPermanent === 'true' || sameAsPermanent === true || sameAsPermanent === 'Yes',
      
      qualification: parsedQualifications,
      experience: experience || '0',
      experiences: parsedExperiences,
      salary: salary || '0',
      status: 'Active', // Default status: "Active", "Inactive", "On Leave"
      username: generatedUsername,
      password: generatedPassword, // Plain text or hash depending on system architecture
      
      // Uploaded documents
      photo: photoPath,
      aadhaarFile: aadhaarPath,
      panFile: panPath,
      resumeFile: resumePath,
      qualificationFile: qualificationPath,
      experienceFile: experiencePath,
      joiningLetterFile: joiningLetterPath,
      otherFile: otherPath,
      
      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Legacy compatibility mappings
      subject: primarySubject || req.body.subjectSpecialization || '',
      subjectSpecialization: primarySubject || req.body.subjectSpecialization || '',
      classes: 0,
      hours: 0,
      badge: 'Faculty',
      avatarBg: `linear-gradient(135deg, hsl(${Math.random() * 360}, 75%, 60%) 0%, hsl(${Math.random() * 360}, 85%, 50%) 100%)`
    };

    db.teachers.push(newTeacher);

    if (!db.employeeQrCodes) db.employeeQrCodes = [];
    db.employeeQrCodes.push({
      id: `QR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      employeeId: employeeId,
      employeeType: 'Teacher',
      qrPath: qrPath,
      createdAt: new Date().toISOString()
    });

    // Automatically create userAccess entry matching the teacher's designation
    if (!db.userAccess) db.userAccess = [];
    
    // Ensure roles array is initialized defensively if missing
    if (!db.roles) {
      db.roles = [];
    }
    
    const roleId = mapDesignationToRoleId(designation, db.roles);
    
    const accessEntry = {
      id: `access-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: employeeId,
      userName: derivedFullName,
      userType: 'Teacher',
      roleId: roleId,
      status: 'Active',
      overrides: {},
      updatedAt: new Date().toISOString()
    };
    db.userAccess.push(accessEntry);

    addActivity(db, 'registration', 'New Faculty Registered', `${fullName} joined ${department || 'School'} Department as ${employmentType || 'Faculty'}`, 'hsl(var(--color-secondary))', 'rgba(hsl(var(--color-secondary)), 0.1)');
    writeDb(db);

    res.status(201).json(newTeacher);
  } catch (error) {
    console.error('Error registering teacher:', error);
    res.status(500).json({ error: 'Internal API Server error during teacher registration.' });
  }
};

// 2. GET ALL TEACHERS (With Search, Filters, Sorting & Pagination)
export const getTeachers = async (req, res) => {
  try {
    const db = readDb();
    let result = [...(db.teachers || [])];

    // 1. Search Query (matches Employee ID, Name, Department)
    const search = req.query.search || '';
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(t => 
        (t.fullName && t.fullName.toLowerCase().includes(q)) || 
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.employeeId && t.employeeId.toLowerCase().includes(q)) || 
        (t.department && t.department.toLowerCase().includes(q)) ||
        (t.subjectSpecialization && t.subjectSpecialization.toLowerCase().includes(q))
      );
    }

    // 2. Department Filter
    const deptFilter = req.query.department || 'All';
    if (deptFilter !== 'All') {
      result = result.filter(t => t.department === deptFilter);
    }

    // 3. Employment Type Filter
    const typeFilter = req.query.employmentType || 'All';
    if (typeFilter !== 'All') {
      result = result.filter(t => t.employmentType === typeFilter);
    }

    // 4. Status Filter (Active, Inactive, On Leave)
    const statusFilter = req.query.status || 'All';
    if (statusFilter !== 'All') {
      result = result.filter(t => t.status === statusFilter);
    }

    // 4.5. Designation (Role) Filter
    const designationFilter = req.query.designation || 'All';
    if (designationFilter !== 'All') {
      result = result.filter(t => t.designation === designationFilter);
    }

    // 5. Sorting
    const sortBy = req.query.sortBy || 'name'; // 'name', 'employeeId', 'joiningDate', 'department'
    const sortOrder = req.query.sortOrder || 'asc';
    result.sort((a, b) => {
      let valA = a[sortBy] ? a[sortBy].toString().toLowerCase() : '';
      let valB = b[sortBy] ? b[sortBy].toString().toLowerCase() : '';
      
      if (sortOrder === 'asc') {
        return valA.localeCompare(valB, undefined, { numeric: true });
      } else {
        return valB.localeCompare(valA, undefined, { numeric: true });
      }
    });

    // 6. Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedItems = result.slice(startIndex, endIndex);

    res.json({
      totalCount: result.length,
      page,
      limit,
      totalPages: Math.ceil(result.length / limit),
      teachers: paginatedItems
    });
  } catch (error) {
    console.error('Error fetching teachers registry:', error);
    res.status(500).json({ error: 'Internal Server Error fetching teachers roster.' });
  }
};

// 3. GET SINGLE TEACHER BY ID
export const getTeacherById = async (req, res) => {
  try {
    const db = readDb();
    const teacher = db.teachers.find(t => t.employeeId === req.params.id || t.id === req.params.id);

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found.' });
    }

    res.json(teacher);
  } catch (error) {
    console.error('Error fetching single teacher profile:', error);
    res.status(500).json({ error: 'Internal server error fetching teacher profile.' });
  }
};

// 4. UPDATE TEACHER
export const updateTeacher = async (req, res) => {
  try {
    const db = readDb();
    const teacherId = req.params.id;
    const teacherIndex = db.teachers.findIndex(t => t.employeeId === teacherId || t.id === teacherId);

    if (teacherIndex === -1) {
      return res.status(404).json({ error: 'Teacher profile not found.' });
    }

    const currentTeacher = db.teachers[teacherIndex];
    const updateData = req.body;

    if (updateData.aadhaarNumber && !/^\d{12}$/.test(String(updateData.aadhaarNumber).replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid Aadhaar number. Must be exactly 12 digits.' });
    }
    if (updateData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(updateData.panNumber).toUpperCase())) {
      return res.status(400).json({ error: 'Invalid PAN card format. Must match ABCDE1234F.' });
    }

    // Check username uniqueness if modified
    if (updateData.username && updateData.username !== currentTeacher.username) {
      const usernameExists = db.teachers.some(t => t.username === updateData.username);
      if (usernameExists) {
        return res.status(400).json({ error: 'Username already exists.' });
      }
    }

    // Process files
    const files = req.files || {};
    const photoPath = files.photo ? `/uploads/${files.photo[0].filename}` : currentTeacher.photo;
    const aadhaarPath = files.aadhaarFile ? `/uploads/${files.aadhaarFile[0].filename}` : currentTeacher.aadhaarFile;
    const panPath = files.panFile ? `/uploads/${files.panFile[0].filename}` : currentTeacher.panFile;
    const resumePath = files.resumeFile ? `/uploads/${files.resumeFile[0].filename}` : currentTeacher.resumeFile;
    const qualificationPath = files.qualificationFile ? `/uploads/${files.qualificationFile[0].filename}` : currentTeacher.qualificationFile;
    const experiencePath = files.experienceFile ? `/uploads/${files.experienceFile[0].filename}` : currentTeacher.experienceFile;
    const joiningLetterPath = files.joiningLetterFile ? `/uploads/${files.joiningLetterFile[0].filename}` : currentTeacher.joiningLetterFile;
    const otherPath = files.otherFile ? `/uploads/${files.otherFile[0].filename}` : currentTeacher.otherFile;

    // Parse qualification & experience arrays if they came as stringified JSON
    let parsedQualifications = updateData.qualification || currentTeacher.qualification;
    if (typeof updateData.qualification === 'string') {
      try {
        parsedQualifications = JSON.parse(updateData.qualification);
      } catch (e) {}
    }
    let parsedExperiences = updateData.experiences || currentTeacher.experiences;
    if (typeof updateData.experiences === 'string') {
      try {
        parsedExperiences = JSON.parse(updateData.experiences);
      } catch (e) {}
    }

    const updatedTeacher = {
      ...currentTeacher,
      ...updateData,
      photo: photoPath,
      aadhaarFile: aadhaarPath,
      panFile: panPath,
      resumeFile: resumePath,
      qualificationFile: qualificationPath,
      experienceFile: experiencePath,
      joiningLetterFile: joiningLetterPath,
      otherFile: otherPath,
      qualification: parsedQualifications,
      experiences: parsedExperiences,
      name: updateData.fullName || currentTeacher.fullName || currentTeacher.name, // Compatibility
      phone: updateData.mobile || currentTeacher.phone, // Compatibility
      subject: updateData.primarySubject || updateData.subjectSpecialization || currentTeacher.subject, // Compatibility
      updatedAt: new Date().toISOString()
    };

    db.teachers[teacherIndex] = updatedTeacher;

    // Synchronize userAccess record matching the teacher's designation and name
    if (!db.userAccess) db.userAccess = [];
    if (!db.roles) {
      db.roles = [];
    }
    const accessIndex = db.userAccess.findIndex(ua => ua.userId === teacherId && ua.userType === 'Teacher');
    const targetRoleId = mapDesignationToRoleId(updatedTeacher.designation, db.roles);
    
    if (accessIndex === -1) {
      db.userAccess.push({
        id: `access-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: teacherId,
        userName: updatedTeacher.fullName || updatedTeacher.name,
        userType: 'Teacher',
        roleId: targetRoleId,
        status: updatedTeacher.status || 'Active',
        overrides: {},
        updatedAt: new Date().toISOString()
      });
    } else {
      db.userAccess[accessIndex].userName = updatedTeacher.fullName || updatedTeacher.name;
      if (updateData.designation && updateData.designation !== currentTeacher.designation) {
        db.userAccess[accessIndex].roleId = targetRoleId;
      }
      if (updateData.status) {
        db.userAccess[accessIndex].status = updateData.status;
      }
      db.userAccess[accessIndex].updatedAt = new Date().toISOString();
    }

    addActivity(db, 'alert', 'Teacher Profile Modified', `${updatedTeacher.name || updatedTeacher.fullName}'s professional records were updated.`, 'hsl(var(--color-secondary))', 'rgba(hsl(var(--color-secondary)), 0.1)');
    writeDb(db);

    res.json(updatedTeacher);
  } catch (error) {
    console.error('Error updating teacher profile:', error);
    res.status(500).json({ error: 'Internal server error while updating teacher details.' });
  }
};

// 5. DELETE / DISMISS TEACHER
export const deleteTeacher = async (req, res) => {
  try {
    const db = readDb();
    const teacherId = req.params.id;
    const teacherIndex = db.teachers.findIndex(t => t.employeeId === teacherId || t.id === teacherId);

    if (teacherIndex === -1) {
      return res.status(404).json({ error: 'Teacher profile not found.' });
    }

    const teacherName = db.teachers[teacherIndex].name;
    const deletedId = db.teachers[teacherIndex].id || db.teachers[teacherIndex].employeeId;
    db.teachers.splice(teacherIndex, 1);

    // Clean up QR codes and attendance records from in-memory database to prevent foreign key errors on sync
    if (db.employeeQrCodes) {
      db.employeeQrCodes = db.employeeQrCodes.filter(q => q.employeeId !== deletedId && q.teacherId !== deletedId);
    }
    if (db.attendanceRecords) {
      db.attendanceRecords = db.attendanceRecords.filter(a => a.employeeId !== deletedId && a.teacherId !== deletedId);
    }
    if (db.attendanceLogs) {
      db.attendanceLogs = db.attendanceLogs.filter(l => l.employeeId !== deletedId && l.teacherId !== deletedId);
    }

    addActivity(db, 'alert', 'Faculty Dismissed', `${teacherName} was removed from the roster`, 'rgb(var(--color-danger-rgb))', 'rgba(var(--color-danger-rgb), 0.1)');
    writeDb(db);

    res.json({ success: true, message: `Successfully dismissed teacher ${teacherName}` });
  } catch (error) {
    console.error('Error removing teacher record:', error);
    res.status(500).json({ error: 'Internal server error dismissing teacher.' });
  }
};
