import { readDb, writeDb, addActivity, getDefaultRoles } from '../utils/db.js';
import { hashPassword } from '../utils/authHelper.js';
import { encrypt, decrypt } from '../utils/encryptionHelper.js';
import { logAudit } from '../utils/logger.js';

const mapDesignationToRoleId = (designation, dbRoles = []) => {
  if (!designation) return 'role-receptionist';
  
  // Try to find matching role name in dbRoles (case insensitive)
  const matchedRole = dbRoles.find(r => r.name.toLowerCase() === designation.toLowerCase());
  if (matchedRole) return matchedRole.id;
  
  // Dynamic slug format fallback
  const slugId = `role-${designation.toLowerCase().trim().replace(/\s+/g, '-')}`;
  if (dbRoles.some(r => r.id === slugId)) {
    return slugId;
  }
  
  switch (designation) {
    case 'Principal':
    case 'role-principal':
      return 'role-principal';
    case 'Academic Coordinator':
    case 'role-academic-coordinator':
      return 'role-academic-coordinator';
    case 'Accountant':
    case 'role-accountant':
      return 'role-accountant';
    case 'Receptionist':
    case 'role-receptionist':
      return 'role-receptionist';
    case 'HR':
    case 'role-hr':
      return 'role-hr';
    case 'Librarian':
    case 'role-librarian':
      return 'role-librarian';
    default:
      return 'role-receptionist';
  }
};

// ========================================================
// STAFF CRUD CONTROLLERS
// ========================================================

// 1. REGISTER NEW STAFF
export const registerTeacher = async (req, res) => { // Keep export name registerTeacher for compatibility, but internally registers Staff
  try {
    const {
      firstName, middleName, lastName, email, phone, gender, dob, bloodGroup, nationality, maritalStatus,
      aadhaarNumber, panNumber, joiningDate, employmentType, department, primarySubject, secondarySubject,
      alternateMobile, currentAddress, currentCity, currentState, currentCountry, currentPostalCode, permanentAddress,
      permanentCity, permanentState, permanentCountry, permanentPostalCode, sameAsPermanent, qualification, experience,
      experiences, salary, username, password, role
    } = req.body;

    const activeRole = role;

    const derivedFullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    if (!derivedFullName) {
      return res.status(400).json({ error: 'First name and last name are required.' });
    }

    if (aadhaarNumber && !/^\d{12}$/.test(String(aadhaarNumber).replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid Aadhaar number. Must be exactly 12 digits.' });
    }
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(panNumber).toUpperCase())) {
      return res.status(400).json({ error: 'Invalid PAN card format. Must match ABCDE1234F.' });
    }

    const db = readDb();
    if (!db.staff) db.staff = [];

    // Generate unique employee ID for Staff: STF-2026-XXXX
    const currentYear = 2026;
    let maxNum = 1000;
    const prefix = 'STF';
    const yearPrefix = `${prefix}-${currentYear}-`;
    db.staff.forEach(s => {
      const id = s.employeeId || s.id || '';
      if (id.startsWith(yearPrefix)) {
        const suffixNum = parseInt(id.replace(yearPrefix, ''), 10);
        if (!isNaN(suffixNum) && suffixNum > maxNum) {
          maxNum = suffixNum;
        }
      }
    });
    const employeeId = `${yearPrefix}${maxNum + 1}`;

    // Generate QR Code
    let qrPath = '';
    try {
      const { generateQrCode } = await import('../utils/qrService.js');
      qrPath = await generateQrCode(employeeId, 'Staff');
    } catch (qrErr) {
      console.error('Failed to generate QR Code during staff registration:', qrErr);
    }

    const generatedUsername = username || `staff_${employeeId.toLowerCase().replace(/-/g, '_')}`;
    const generatedPassword = await hashPassword(password || 'staff123');

    // Check username uniqueness
    const usernameExists = db.staff.some(s => s.username === generatedUsername);
    if (usernameExists) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const files = req.files || {};
    const photoPath = files.photo ? `/uploads/${files.photo[0].filename}` : '';
    const aadhaarPath = files.aadhaarFile ? `/uploads/${files.aadhaarFile[0].filename}` : '';
    const panPath = files.panFile ? `/uploads/${files.panFile[0].filename}` : '';
    const resumePath = files.resumeFile ? `/uploads/${files.resumeFile[0].filename}` : '';
    const qualificationPath = files.qualificationFile ? `/uploads/${files.qualificationFile[0].filename}` : '';
    const experiencePath = files.experienceFile ? `/uploads/${files.experienceFile[0].filename}` : '';
    const joiningLetterPath = files.joiningLetterFile ? `/uploads/${files.joiningLetterFile[0].filename}` : '';
    const otherPath = files.otherFile ? `/uploads/${files.otherFile[0].filename}` : '';

    let parsedQualifications = qualification;
    if (typeof qualification === 'string') {
      try { parsedQualifications = JSON.parse(qualification); } catch (e) { parsedQualifications = []; }
    }
    let parsedExperiences = experiences;
    if (typeof experiences === 'string') {
      try { parsedExperiences = JSON.parse(experiences); } catch (e) { parsedExperiences = []; }
    }

    const targetRoleId = mapDesignationToRoleId(activeRole, db.roles || getDefaultRoles());

    const newStaff = {
      id: employeeId,
      employeeId,
      qrCodePath: qrPath,
      name: derivedFullName,
      fullName: derivedFullName,
      firstName: firstName || '',
      middleName: middleName || '',
      lastName: lastName || '',
      email: email || '',
      phone: phone || '',
      gender: gender || 'Male',
      dob: dob || '',
      bloodGroup: bloodGroup || '',
      nationality: nationality || 'Indian',
      maritalStatus: maritalStatus || 'Single',
      aadhaarNumber: aadhaarNumber ? encrypt(aadhaarNumber) : '',
      panNumber: panNumber ? encrypt(panNumber) : '',
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      employmentType: employmentType || 'Full-Time',
      role: activeRole || 'Receptionist',
      department: department || 'Administration',
      primarySubject: primarySubject || '',
      secondarySubject: secondarySubject || '',
      alternateMobile: alternateMobile || '',
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
      salary: encrypt(salary || '0'),
      bankAccount: encrypt(req.body.bankAccount || ''),
      bankName: encrypt(req.body.bankName || ''),
      ifscCode: encrypt(req.body.ifscCode || ''),
      accountHolder: encrypt(req.body.accountHolder || ''),
      upiId: encrypt(req.body.upiId || ''),
      status: 'Active',
      username: generatedUsername,
      password: generatedPassword,
      photo: photoPath,
      aadhaarFile: aadhaarPath,
      panFile: panPath,
      resumeFile: resumePath,
      qualificationFile: qualificationPath,
      experienceFile: experiencePath,
      joiningLetterFile: joiningLetterPath,
      otherFile: otherPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subject: primarySubject || '',
      subjectSpecialization: primarySubject || '',
      classes: 0,
      hours: 0,
      badge: 'Staff',
      avatarBg: `linear-gradient(135deg, hsl(${Math.random() * 360}, 75%, 60%) 0%, hsl(${Math.random() * 360}, 85%, 50%) 100%)`
    };

    db.staff.push(newStaff);

    if (!db.employeeQrCodes) db.employeeQrCodes = [];
    db.employeeQrCodes.push({
      id: `QR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      employeeId: employeeId,
      employeeType: 'Staff',
      qrPath: qrPath,
      createdAt: new Date().toISOString()
    });

    if (!db.userAccess) db.userAccess = [];
    db.userAccess.push({
      id: `access-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: employeeId,
      userName: derivedFullName,
      userType: 'Staff',
      roleId: targetRoleId,
      status: 'Active',
      overrides: {},
      updatedAt: new Date().toISOString()
    });

    addActivity(db, 'registration', 'New Staff Registered', `${derivedFullName} joined the school as ${activeRole}.`, 'hsl(var(--color-primary))', 'rgba(hsl(var(--color-primary)), 0.1)');
    writeDb(db);
    logAudit('Register Staff', `Staff: ${derivedFullName} (ID: ${employeeId})`, `Registered new staff member.`, req);

    res.status(201).json({
      success: true,
      message: 'Staff registered successfully',
      teacher: { // Kept name for compatibility
        employeeId,
        fullName: derivedFullName,
        username: generatedUsername,
        password: password || 'staff123',
        role: activeRole
      }
    });
  } catch (error) {
    console.error('Error registering staff:', error);
    res.status(500).json({ error: 'Internal server error while registering staff.' });
  }
};

// 2. GET ALL STAFF
export const getTeachers = (req, res) => { // Keep getTeachers naming for compatibility
  try {
    const db = readDb();
    let list = db.staff || [];
    
    // Decrypt sensitive info
    let decryptedList = list.map(s => {
      const copy = { ...s };
      try { if (copy.aadhaarNumber) copy.aadhaarNumber = decrypt(copy.aadhaarNumber); } catch (e) { copy.aadhaarNumber = ''; }
      try { if (copy.panNumber) copy.panNumber = decrypt(copy.panNumber); } catch (e) { copy.panNumber = ''; }
      try { if (copy.salary) copy.salary = decrypt(copy.salary); } catch (e) { copy.salary = '0'; }
      try { if (copy.bankAccount) copy.bankAccount = decrypt(copy.bankAccount); } catch (e) { copy.bankAccount = ''; }
      try { if (copy.bankName) copy.bankName = decrypt(copy.bankName); } catch (e) { copy.bankName = ''; }
      try { if (copy.ifscCode) copy.ifscCode = decrypt(copy.ifscCode); } catch (e) { copy.ifscCode = ''; }
      try { if (copy.accountHolder) copy.accountHolder = decrypt(copy.accountHolder); } catch (e) { copy.accountHolder = ''; }
      try { if (copy.upiId) copy.upiId = decrypt(copy.upiId); } catch (e) { copy.upiId = ''; }
      return copy;
    });

    const {
      search = '',
      department = 'All',
      employmentType = 'All',
      status = 'All',
      designation = 'All',
      role = 'All',
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 8
    } = req.query;

    // Apply filtering
    if (search && search.trim() !== '') {
      const query = search.toLowerCase().trim();
      decryptedList = decryptedList.filter(s => 
        (s.name || '').toLowerCase().startsWith(query) ||
        (s.fullName || '').toLowerCase().startsWith(query) ||
        (s.employeeId || '').toLowerCase().startsWith(query)
      );
    }

    if (department && department !== 'All') {
      decryptedList = decryptedList.filter(s => s.department === department);
    }

    if (employmentType && employmentType !== 'All') {
      decryptedList = decryptedList.filter(s => s.employmentType === employmentType);
    }

    if (status && status !== 'All') {
      decryptedList = decryptedList.filter(s => s.status === status);
    }

    const activeRoleFilter = role !== 'All' ? role : designation;
    if (activeRoleFilter && activeRoleFilter !== 'All') {
      decryptedList = decryptedList.filter(s => s.role === activeRoleFilter);
    }

    // Apply sorting
    decryptedList.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const totalCount = decryptedList.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 8;
    const totalPages = Math.ceil(totalCount / limitNum);
    const startIdx = (pageNum - 1) * limitNum;
    const paginatedList = decryptedList.slice(startIdx, startIdx + limitNum);

    res.json({
      teachers: paginatedList, // Kept name teachers for compatibility in frontend
      totalCount,
      totalPages,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Internal server error fetching staff.' });
  }
};

// 3. GET SINGLE STAFF BY ID
export const getTeacherById = (req, res) => { // Keep getTeacherById naming for compatibility
  try {
    const db = readDb();
    const staffId = req.params.id;
    const staff = (db.staff || []).find(s => s.employeeId === staffId || s.id === staffId);

    if (!staff) {
      return res.status(404).json({ error: 'Staff profile not found.' });
    }

    const decryptedStaff = { ...staff };
    try { if (decryptedStaff.aadhaarNumber) decryptedStaff.aadhaarNumber = decrypt(decryptedStaff.aadhaarNumber); } catch (e) { decryptedStaff.aadhaarNumber = ''; }
    try { if (decryptedStaff.panNumber) decryptedStaff.panNumber = decrypt(decryptedStaff.panNumber); } catch (e) { decryptedStaff.panNumber = ''; }
    try { if (decryptedStaff.salary) decryptedStaff.salary = decrypt(decryptedStaff.salary); } catch (e) { decryptedStaff.salary = '0'; }
    try { if (decryptedStaff.bankAccount) decryptedStaff.bankAccount = decrypt(decryptedStaff.bankAccount); } catch (e) { decryptedStaff.bankAccount = ''; }
    try { if (decryptedStaff.bankName) decryptedStaff.bankName = decrypt(decryptedStaff.bankName); } catch (e) { decryptedStaff.bankName = ''; }
    try { if (decryptedStaff.ifscCode) decryptedStaff.ifscCode = decrypt(decryptedStaff.ifscCode); } catch (e) { decryptedStaff.ifscCode = ''; }
    try { if (decryptedStaff.accountHolder) decryptedStaff.accountHolder = decrypt(decryptedStaff.accountHolder); } catch (e) { decryptedStaff.accountHolder = ''; }
    try { if (decryptedStaff.upiId) decryptedStaff.upiId = decrypt(decryptedStaff.upiId); } catch (e) { decryptedStaff.upiId = ''; }

    res.json(decryptedStaff);
  } catch (error) {
    console.error('Error loading staff profile:', error);
    res.status(500).json({ error: 'Internal server error loading profile.' });
  }
};

// 4. UPDATE STAFF PROFILE
export const updateTeacher = async (req, res) => { // Keep updateTeacher naming for compatibility
  try {
    const db = readDb();
    const staffId = req.params.id;
    const staffIndex = db.staff.findIndex(s => s.employeeId === staffId || s.id === staffId);

    if (staffIndex === -1) {
      return res.status(404).json({ error: 'Staff profile not found.' });
    }

    const currentStaff = db.staff[staffIndex];
    const updateData = req.body;

    if (updateData.aadhaarNumber && !/^\d{12}$/.test(String(updateData.aadhaarNumber).replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid Aadhaar number. Must be exactly 12 digits.' });
    }
    if (updateData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(updateData.panNumber).toUpperCase())) {
      return res.status(400).json({ error: 'Invalid PAN card format. Must match ABCDE1234F.' });
    }

    if (updateData.username && updateData.username !== currentStaff.username) {
      const usernameExists = db.staff.some(s => s.username === updateData.username);
      if (usernameExists) {
        return res.status(400).json({ error: 'Username already exists.' });
      }
    }

    const files = req.files || {};
    const photoPath = files.photo ? `/uploads/${files.photo[0].filename}` : currentStaff.photo;
    const aadhaarPath = files.aadhaarFile ? `/uploads/${files.aadhaarFile[0].filename}` : currentStaff.aadhaarFile;
    const panPath = files.panFile ? `/uploads/${files.panFile[0].filename}` : currentStaff.panFile;
    const resumePath = files.resumeFile ? `/uploads/${files.resumeFile[0].filename}` : currentStaff.resumeFile;
    const qualificationPath = files.qualificationFile ? `/uploads/${files.qualificationFile[0].filename}` : currentStaff.qualificationFile;
    const experiencePath = files.experienceFile ? `/uploads/${files.experienceFile[0].filename}` : currentStaff.experienceFile;
    const joiningLetterPath = files.joiningLetterFile ? `/uploads/${files.joiningLetterFile[0].filename}` : currentStaff.joiningLetterFile;
    const otherPath = files.otherFile ? `/uploads/${files.otherFile[0].filename}` : currentStaff.otherFile;

    let parsedQualifications = updateData.qualification || currentStaff.qualification;
    if (typeof updateData.qualification === 'string') {
      try { parsedQualifications = JSON.parse(updateData.qualification); } catch (e) {}
    }
    let parsedExperiences = updateData.experiences || currentStaff.experiences;
    if (typeof updateData.experiences === 'string') {
      try { parsedExperiences = JSON.parse(updateData.experiences); } catch (e) {}
    }

    const updatedStaff = {
      ...currentStaff,
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
      name: updateData.fullName || currentStaff.fullName || currentStaff.name,
      phone: updateData.mobile || currentStaff.phone,
      subject: updateData.primarySubject || updateData.subjectSpecialization || currentStaff.subject,
      aadhaarNumber: updateData.aadhaarNumber !== undefined ? encrypt(updateData.aadhaarNumber) : currentStaff.aadhaarNumber,
      panNumber: updateData.panNumber !== undefined ? encrypt(updateData.panNumber) : currentStaff.panNumber,
      salary: updateData.salary !== undefined ? encrypt(updateData.salary) : currentStaff.salary,
      bankAccount: updateData.bankAccount !== undefined ? encrypt(updateData.bankAccount) : currentStaff.bankAccount,
      bankName: updateData.bankName !== undefined ? encrypt(updateData.bankName) : currentStaff.bankName,
      ifscCode: updateData.ifscCode !== undefined ? encrypt(updateData.ifscCode) : currentStaff.ifscCode,
      accountHolder: updateData.accountHolder !== undefined ? encrypt(updateData.accountHolder) : currentStaff.accountHolder,
      upiId: updateData.upiId !== undefined ? encrypt(updateData.upiId) : currentStaff.upiId,
      role: updateData.role || currentStaff.role,
      updatedAt: new Date().toISOString()
    };

    db.staff[staffIndex] = updatedStaff;

    if (!db.userAccess) db.userAccess = [];
    const accessIndex = db.userAccess.findIndex(ua => ua.userId === staffId && ua.userType === 'Staff');
    const targetRoleId = mapDesignationToRoleId(updatedStaff.role, db.roles || getDefaultRoles());
    
    if (accessIndex === -1) {
      db.userAccess.push({
        id: `access-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: staffId,
        userName: updatedStaff.fullName || updatedStaff.name,
        userType: 'Staff',
        roleId: targetRoleId,
        status: updatedStaff.status || 'Active',
        overrides: {},
        updatedAt: new Date().toISOString()
      });
    } else {
      db.userAccess[accessIndex].userName = updatedStaff.fullName || updatedStaff.name;
      db.userAccess[accessIndex].roleId = targetRoleId;
      if (updateData.status) {
        db.userAccess[accessIndex].status = updateData.status;
      }
      db.userAccess[accessIndex].updatedAt = new Date().toISOString();
    }

    addActivity(db, 'alert', 'Staff Profile Modified', `${updatedStaff.fullName}'s professional records were updated.`, 'hsl(var(--color-secondary))', 'rgba(hsl(var(--color-secondary)), 0.1)');
    writeDb(db);
    logAudit('Update Staff', `Staff: ${updatedStaff.fullName} (Emp: ${updatedStaff.employeeId})`, `Updated staff profile professional records`, req);

    res.json(updatedStaff);
  } catch (error) {
    console.error('Error updating staff profile:', error);
    res.status(500).json({ error: 'Internal server error while updating staff details.' });
  }
};

// 5. DELETE / DISMISS STAFF
export const deleteTeacher = async (req, res) => { // Keep deleteTeacher naming for compatibility
  try {
    const db = readDb();
    const staffId = req.params.id;
    const staffIndex = db.staff.findIndex(s => s.employeeId === staffId || s.id === staffId);

    if (staffIndex === -1) {
      return res.status(404).json({ error: 'Staff profile not found.' });
    }

    const staffName = db.staff[staffIndex].name;
    const deletedId = db.staff[staffIndex].id || db.staff[staffIndex].employeeId;
    db.staff.splice(staffIndex, 1);

    if (db.employeeQrCodes) {
      db.employeeQrCodes = db.employeeQrCodes.filter(q => q.employeeId !== deletedId && q.teacherId !== deletedId);
    }
    if (db.attendanceRecords) {
      db.attendanceRecords = db.attendanceRecords.filter(a => a.employeeId !== deletedId && a.teacherId !== deletedId);
    }
    if (db.attendanceLogs) {
      db.attendanceLogs = db.attendanceLogs.filter(l => l.employeeId !== deletedId && l.teacherId !== deletedId);
    }

    // Remove user access record
    if (db.userAccess) {
      db.userAccess = db.userAccess.filter(ua => ua.userId !== deletedId);
    }

    addActivity(db, 'alert', 'Staff Dismissed', `${staffName} was removed from the roster`, 'rgb(var(--color-danger-rgb))', 'rgba(var(--color-danger-rgb), 0.1)');
    writeDb(db);
    logAudit('Delete Staff', `Staff: ${staffName} (ID: ${deletedId})`, `Dismissed staff roster record`, req);

    res.json({ success: true, message: `Successfully dismissed staff member ${staffName}` });
  } catch (error) {
    console.error('Error removing staff record:', error);
    res.status(500).json({ error: 'Internal server error dismissing staff.' });
  }
};
