import { readDb, writeDb, addActivity } from '../utils/db.js';
import { hashPassword } from '../utils/authHelper.js';
import { encrypt, decrypt } from '../utils/encryptionHelper.js';
import { logAudit } from '../utils/logger.js';
import { uploadToImageKit, deleteFromImageKit } from '../utils/imagekit.js';

// ========================================================
// TEACHER CRUD CONTROLLERS
// ========================================================

// 1. REGISTER NEW TEACHER
export const registerTeacher = async (req, res) => {
  try {
    const {
      firstName, middleName, lastName, email, phone, gender, dob, bloodGroup, nationality, maritalStatus,
      aadhaarNumber, panNumber, joiningDate, employmentType, designation, department, primarySubject, secondarySubject,
      alternateMobile, currentAddress, currentCity, currentState, currentCountry, currentPostalCode, permanentAddress,
      permanentCity, permanentState, permanentCountry, permanentPostalCode, sameAsPermanent, qualification, experience,
      experiences, salary, username, password,
      assignedGradeId, assignedSectionId, isClassTeacher, attendancePermission
    } = req.body;

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
    if (!db.teachers) db.teachers = [];

    // Ensure only one active Class Teacher is assigned to a Grade + Section
    const reqIsClassTeacher = isClassTeacher === 'Yes' || isClassTeacher === 'true' || isClassTeacher === true || isClassTeacher === 1;
    if (reqIsClassTeacher && assignedGradeId && assignedSectionId) {
      const duplicateClassTeacher = db.teachers.find(t => 
        t.status === 'Active' &&
        (t.isClassTeacher === 1 || t.isClassTeacher === true || t.isClassTeacher === 'Yes') &&
        t.assignedGradeId === assignedGradeId &&
        t.assignedSectionId === assignedSectionId
      );
      if (duplicateClassTeacher) {
        return res.status(400).json({ error: `Forbidden. Grade ${assignedGradeId} Section ${assignedSectionId} already has an active Class Teacher: ${duplicateClassTeacher.fullName || duplicateClassTeacher.name}.` });
      }
    }

    // Generate unique employee ID for Teacher: TCH-2026-XXXX
    const currentYear = 2026;
    let maxNum = 1000;
    const prefix = 'TCH';
    const yearPrefix = `${prefix}-${currentYear}-`;
    db.teachers.forEach(t => {
      const id = t.employeeId || t.id || '';
      if (id.startsWith(yearPrefix)) {
        const suffixNum = parseInt(id.replace(yearPrefix, ''), 10);
        if (!isNaN(suffixNum) && suffixNum > maxNum) {
          maxNum = suffixNum;
        }
      }
    });
    const employeeId = `${yearPrefix}${maxNum + 1}`;

    const tenantId = req.admin?.tenantId || 'platform';

    // Generate QR Code
    let qrPath = '';
    try {
      const { generateQrCode } = await import('../utils/qrService.js');
      qrPath = await generateQrCode(employeeId, 'Teacher', tenantId);
    } catch (qrErr) {
      console.error('Failed to generate QR Code during teacher registration:', qrErr);
    }

    // Auto-generate username and password if not provided
    const generatedUsername = username || `teacher_${employeeId.toLowerCase().replace(/-/g, '_')}`;
    const generatedPassword = await hashPassword(password || 'teacher123');

    // Check username uniqueness
    const usernameExists = db.teachers.some(t => t.username === generatedUsername);
    if (usernameExists) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const files = req.files || {};
    const folder = `school/${tenantId}/teachers`;

    const processUpload = async (fileArray) => {
      if (!fileArray || !fileArray[0]) return '';
      const uploadRes = await uploadToImageKit(fileArray[0].buffer, fileArray[0].originalname, folder);
      return uploadRes.url;
    };

    const photoPath = await processUpload(files.photo);
    const aadhaarPath = await processUpload(files.aadhaarFile);
    const panPath = await processUpload(files.panFile);
    const resumePath = await processUpload(files.resumeFile);
    const qualificationPath = await processUpload(files.qualificationFile);
    const experiencePath = await processUpload(files.experienceFile);
    const joiningLetterPath = await processUpload(files.joiningLetterFile);
    const otherPath = await processUpload(files.otherFile);

    let parsedQualifications = qualification;
    if (typeof qualification === 'string') {
      try { parsedQualifications = JSON.parse(qualification); } catch (e) { parsedQualifications = []; }
    }
    let parsedExperiences = experiences;
    if (typeof experiences === 'string') {
      try { parsedExperiences = JSON.parse(experiences); } catch (e) { parsedExperiences = []; }
    }

    const newTeacher = {
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
      designation: 'Teacher',
      role: 'Teacher',
      department: department || 'Academics',
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
      badge: 'Faculty',
      avatarBg: `linear-gradient(135deg, hsl(${Math.random() * 360}, 75%, 60%) 0%, hsl(${Math.random() * 360}, 85%, 50%) 100%)`,
      assignedGradeId: assignedGradeId || null,
      assignedSectionId: assignedSectionId || null,
      isClassTeacher: reqIsClassTeacher ? 1 : 0,
      attendancePermission: (attendancePermission === 'Yes' || attendancePermission === 'true' || attendancePermission === true || attendancePermission === 1) ? 1 : 0
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

    if (!db.userAccess) db.userAccess = [];
    db.userAccess.push({
      id: `access-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: employeeId,
      userName: derivedFullName,
      userType: 'Teacher',
      roleId: 'role-teacher',
      status: 'Active',
      overrides: {},
      updatedAt: new Date().toISOString()
    });

    addActivity(db, 'registration', 'New Teacher Registered', `${derivedFullName} joined the school as Teacher.`, 'hsl(var(--color-primary))', 'rgba(hsl(var(--color-primary)), 0.1)');
    writeDb(db);
    logAudit('Register Teacher', `Teacher: ${derivedFullName} (ID: ${employeeId})`, `Registered new teacher and generated login credentials.`, req);

    res.status(201).json({
      success: true,
      message: 'Teacher registered successfully',
      teacher: {
        employeeId,
        fullName: derivedFullName,
        username: generatedUsername,
        password: password || 'teacher123',
        role: 'Teacher'
      }
    });
  } catch (error) {
    console.error('Error registering teacher:', error);
    res.status(500).json({ error: 'Internal server error while registering teacher.' });
  }
};

// 2. GET ALL TEACHERS
export const getTeachers = (req, res) => {
  try {
    const db = readDb();
    const list = db.teachers || [];
    
    // Decrypt sensitive info
    const decryptedList = list.map(t => {
      const copy = { ...t };
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

    res.json(decryptedList);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Internal server error fetching teachers.' });
  }
};

// 3. GET SINGLE TEACHER BY ID
export const getTeacherById = (req, res) => {
  try {
    const db = readDb();
    const teacherId = req.params.id;
    const teacher = (db.teachers || []).find(t => t.employeeId === teacherId || t.id === teacherId);

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found.' });
    }

    const decryptedTeacher = { ...teacher };
    try { if (decryptedTeacher.aadhaarNumber) decryptedTeacher.aadhaarNumber = decrypt(decryptedTeacher.aadhaarNumber); } catch (e) { decryptedTeacher.aadhaarNumber = ''; }
    try { if (decryptedTeacher.panNumber) decryptedTeacher.panNumber = decrypt(decryptedTeacher.panNumber); } catch (e) { decryptedTeacher.panNumber = ''; }
    try { if (decryptedTeacher.salary) decryptedTeacher.salary = decrypt(decryptedTeacher.salary); } catch (e) { decryptedTeacher.salary = '0'; }
    try { if (decryptedTeacher.bankAccount) decryptedTeacher.bankAccount = decrypt(decryptedTeacher.bankAccount); } catch (e) { decryptedTeacher.bankAccount = ''; }
    try { if (decryptedTeacher.bankName) decryptedTeacher.bankName = decrypt(decryptedTeacher.bankName); } catch (e) { decryptedTeacher.bankName = ''; }
    try { if (decryptedTeacher.ifscCode) decryptedTeacher.ifscCode = decrypt(decryptedTeacher.ifscCode); } catch (e) { decryptedTeacher.ifscCode = ''; }
    try { if (decryptedTeacher.accountHolder) decryptedTeacher.accountHolder = decrypt(decryptedTeacher.accountHolder); } catch (e) { decryptedTeacher.accountHolder = ''; }
    try { if (decryptedTeacher.upiId) decryptedTeacher.upiId = decrypt(decryptedTeacher.upiId); } catch (e) { decryptedTeacher.upiId = ''; }

    res.json(decryptedTeacher);
  } catch (error) {
    console.error('Error loading teacher profile:', error);
    res.status(500).json({ error: 'Internal server error loading profile.' });
  }
};

// 4. UPDATE TEACHER PROFILE
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

    if (updateData.username && updateData.username !== currentTeacher.username) {
      const usernameExists = db.teachers.some(t => t.username === updateData.username);
      if (usernameExists) {
        return res.status(400).json({ error: 'Username already exists.' });
      }
    }

    // Ensure only one active Class Teacher is assigned to a Grade + Section on update
    const reqIsClassTeacher = updateData.isClassTeacher === 'Yes' || updateData.isClassTeacher === 'true' || updateData.isClassTeacher === true || updateData.isClassTeacher === 1;
    const reqGradeId = updateData.assignedGradeId !== undefined ? updateData.assignedGradeId : currentTeacher.assignedGradeId;
    const reqSectionId = updateData.assignedSectionId !== undefined ? updateData.assignedSectionId : currentTeacher.assignedSectionId;

    if (reqIsClassTeacher && reqGradeId && reqSectionId) {
      const duplicateClassTeacher = db.teachers.find(t => 
        t.id !== currentTeacher.id &&
        t.status === 'Active' &&
        (t.isClassTeacher === 1 || t.isClassTeacher === true || t.isClassTeacher === 'Yes') &&
        t.assignedGradeId === reqGradeId &&
        t.assignedSectionId === reqSectionId
      );
      if (duplicateClassTeacher) {
        return res.status(400).json({ error: `Forbidden. Grade ${reqGradeId} Section ${reqSectionId} already has an active Class Teacher: ${duplicateClassTeacher.fullName || duplicateClassTeacher.name}.` });
      }
    }

    const files = req.files || {};
    const tenantId = req.admin?.tenantId || 'platform';
    const folder = `school/${tenantId}/teachers`;

    const processUpdateUpload = async (fileArray, oldPath) => {
      if (!fileArray || !fileArray[0]) return oldPath;
      if (oldPath) {
        deleteFromImageKit(oldPath).catch(e => console.error('[ImageKit Delete Error]', e));
      }
      const uploadRes = await uploadToImageKit(fileArray[0].buffer, fileArray[0].originalname, folder);
      return uploadRes.url;
    };

    const photoPath = await processUpdateUpload(files.photo, currentTeacher.photo);
    const aadhaarPath = await processUpdateUpload(files.aadhaarFile, currentTeacher.aadhaarFile);
    const panPath = await processUpdateUpload(files.panFile, currentTeacher.panFile);
    const resumePath = await processUpdateUpload(files.resumeFile, currentTeacher.resumeFile);
    const qualificationPath = await processUpdateUpload(files.qualificationFile, currentTeacher.qualificationFile);
    const experiencePath = await processUpdateUpload(files.experienceFile, currentTeacher.experienceFile);
    const joiningLetterPath = await processUpdateUpload(files.joiningLetterFile, currentTeacher.joiningLetterFile);
    const otherPath = await processUpdateUpload(files.otherFile, currentTeacher.otherFile);

    let parsedQualifications = updateData.qualification || currentTeacher.qualification;
    if (typeof updateData.qualification === 'string') {
      try { parsedQualifications = JSON.parse(updateData.qualification); } catch (e) {}
    }
    let parsedExperiences = updateData.experiences || currentTeacher.experiences;
    if (typeof updateData.experiences === 'string') {
      try { parsedExperiences = JSON.parse(updateData.experiences); } catch (e) {}
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
      name: updateData.fullName || currentTeacher.fullName || currentTeacher.name,
      phone: updateData.mobile || currentTeacher.phone,
      subject: updateData.primarySubject || updateData.subjectSpecialization || currentTeacher.subject,
      aadhaarNumber: updateData.aadhaarNumber !== undefined ? encrypt(updateData.aadhaarNumber) : currentTeacher.aadhaarNumber,
      panNumber: updateData.panNumber !== undefined ? encrypt(updateData.panNumber) : currentTeacher.panNumber,
      salary: updateData.salary !== undefined ? encrypt(updateData.salary) : currentTeacher.salary,
      bankAccount: updateData.bankAccount !== undefined ? encrypt(updateData.bankAccount) : currentTeacher.bankAccount,
      bankName: updateData.bankName !== undefined ? encrypt(updateData.bankName) : currentTeacher.bankName,
      ifscCode: updateData.ifscCode !== undefined ? encrypt(updateData.ifscCode) : currentTeacher.ifscCode,
      accountHolder: updateData.accountHolder !== undefined ? encrypt(updateData.accountHolder) : currentTeacher.accountHolder,
      upiId: updateData.upiId !== undefined ? encrypt(updateData.upiId) : currentTeacher.upiId,
      designation: 'Teacher',
      role: 'Teacher',
      updatedAt: new Date().toISOString(),
      assignedGradeId: updateData.assignedGradeId !== undefined ? (updateData.assignedGradeId || null) : currentTeacher.assignedGradeId,
      assignedSectionId: updateData.assignedSectionId !== undefined ? (updateData.assignedSectionId || null) : currentTeacher.assignedSectionId,
      isClassTeacher: updateData.isClassTeacher !== undefined ? (reqIsClassTeacher ? 1 : 0) : currentTeacher.isClassTeacher,
      attendancePermission: updateData.attendancePermission !== undefined ? (updateData.attendancePermission === 'Yes' || updateData.attendancePermission === 'true' || updateData.attendancePermission === true || updateData.attendancePermission === 1 ? 1 : 0) : currentTeacher.attendancePermission
    };

    db.teachers[teacherIndex] = updatedTeacher;

    if (!db.userAccess) db.userAccess = [];
    const accessIndex = db.userAccess.findIndex(ua => ua.userId === teacherId && ua.userType === 'Teacher');
    if (accessIndex === -1) {
      db.userAccess.push({
        id: `access-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: teacherId,
        userName: updatedTeacher.fullName || updatedTeacher.name,
        userType: 'Teacher',
        roleId: 'role-teacher',
        status: updatedTeacher.status || 'Active',
        overrides: {},
        updatedAt: new Date().toISOString()
      });
    } else {
      db.userAccess[accessIndex].userName = updatedTeacher.fullName || updatedTeacher.name;
      db.userAccess[accessIndex].roleId = 'role-teacher';
      if (updateData.status) {
        db.userAccess[accessIndex].status = updateData.status;
      }
      db.userAccess[accessIndex].updatedAt = new Date().toISOString();
    }

    addActivity(db, 'alert', 'Teacher Profile Modified', `${updatedTeacher.fullName}'s professional records were updated.`, 'hsl(var(--color-secondary))', 'rgba(hsl(var(--color-secondary)), 0.1)');
    writeDb(db);
    logAudit('Update Teacher', `Teacher: ${updatedTeacher.fullName} (Emp: ${updatedTeacher.employeeId})`, `Updated teacher profile professional records`, req);

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

    const teacher = db.teachers[teacherIndex];
    const teacherName = teacher.name;
    const deletedId = teacher.id || teacher.employeeId;

    // Delete files from ImageKit
    const filesToDelete = [
      teacher.photo, teacher.aadhaarFile, teacher.panFile, teacher.resumeFile,
      teacher.qualificationFile, teacher.experienceFile, teacher.joiningLetterFile, teacher.otherFile
    ];
    for (const fileUrl of filesToDelete) {
      if (fileUrl) {
        await deleteFromImageKit(fileUrl);
      }
    }

    db.teachers.splice(teacherIndex, 1);

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

    addActivity(db, 'alert', 'Teacher Dismissed', `${teacherName} was removed from the roster`, 'rgb(var(--color-danger-rgb))', 'rgba(var(--color-danger-rgb), 0.1)');
    writeDb(db);
    logAudit('Delete Teacher', `Teacher: ${teacherName} (ID: ${deletedId})`, `Dismissed teacher roster record`, req);

    res.json({ success: true, message: `Successfully dismissed teacher ${teacherName}` });
  } catch (error) {
    console.error('Error removing teacher record:', error);
    res.status(500).json({ error: 'Internal server error dismissing teacher.' });
  }
};
