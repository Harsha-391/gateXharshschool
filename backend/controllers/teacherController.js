import { readDb, writeDb, addActivity, isSqlActive, tenantStorage, slugify } from '../utils/db.js';
import { hashPassword } from '../utils/authHelper.js';
import { encrypt, decrypt } from '../utils/encryptionHelper.js';
import { logAudit } from '../utils/logger.js';
import { uploadToImageKit, deleteFromImageKit } from '../utils/imagekit.js';

// ========================================================
// TEACHER CRUD CONTROLLERS
// ========================================================

// 1. REGISTER NEW TEACHER
export const registerTeacher = async (req, res) => {
  const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || req.query?.tenantId || tenantStorage.getStore() || 'platform';
  const tenantId = slugify(rawTenantId);

  return tenantStorage.run(tenantId, async () => {
    try {
      const {
        firstName, middleName, lastName, email, phone, gender, dob, bloodGroup, nationality, maritalStatus,
        aadhaarNumber, panNumber, joiningDate, employmentType, designation, department, primarySubject, secondarySubject,
        alternateMobile, currentAddress, currentCity, currentState, currentCountry, currentPostalCode, permanentAddress,
        permanentCity, permanentState, permanentCountry, permanentPostalCode, sameAsPermanent, qualification, experience,
        experiences, salary, username, password,
        assignedGradeId, assignedSectionId, isClassTeacher, attendancePermission,
        teachingGrades
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

      const db = readDb(tenantId);
      if (!db.teachers) db.teachers = [];

      // Ensure only one active Class Teacher is assigned to a Grade + Section
      const reqIsClassTeacher = isClassTeacher === 'Yes' || isClassTeacher === 'true' || isClassTeacher === true || isClassTeacher === 1;
      if (reqIsClassTeacher && assignedGradeId && assignedSectionId) {
        const duplicateClassTeacher = db.teachers.find(t => 
          (!t.status || t.status === 'Active') &&
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
        try {
          const uploadPromise = uploadToImageKit(fileArray[0].buffer, fileArray[0].originalname, folder);
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timeout')), 2500));
          const uploadRes = await Promise.race([uploadPromise, timeoutPromise]);
          return uploadRes.url;
        } catch (uploadErr) {
          console.warn('[Teacher Upload Warning] Could not upload file to ImageKit:', uploadErr.message);
          return '';
        }
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
      let parsedTeachingGrades = teachingGrades || [];
      if (typeof parsedTeachingGrades === 'string') {
        try { parsedTeachingGrades = JSON.parse(parsedTeachingGrades); } catch (e) {
          parsedTeachingGrades = parsedTeachingGrades.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      if (!Array.isArray(parsedTeachingGrades)) parsedTeachingGrades = [];

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
        phone: phone || req.body.mobile || '',
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
        attendancePermission: (attendancePermission === 'Yes' || attendancePermission === 'true' || attendancePermission === true || attendancePermission === 1) ? 1 : 0,
        teachingGrades: parsedTeachingGrades
      };

      db.teachers.push(newTeacher);
      db.teachers = [...db.teachers];

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
      writeDb(db, ['teachers', 'employees', 'userAccess', 'employeeQrCodes'], tenantId);

      // Direct Synchronous SQL Insert to guarantee immediate database persistence
      if (isSqlActive()) {
        try {
          const sqlDb = await import('../utils/sqlDb.js');
          await sqlDb.query(
            `INSERT INTO teachers (
              id, name, fullName, firstName, middleName, lastName, email, phone, gender, dob, bloodGroup,
              nationality, maritalStatus, aadhaarNumber, panNumber, joiningDate, employmentType, role,
              hasRole, designation, department, primarySubject, secondarySubject, alternateMobile,
              currentAddress, currentCity, currentState, currentCountry, currentPostalCode,
              permanentAddress, permanentCity, permanentState, permanentCountry, permanentPostalCode,
              sameAsPermanent, qualification, experience, experiences, salaryGrade,
              photo, aadharFile, panFile, resumeFile, joiningLetterFile, otherFile, certificateFile,
              avatarBg, password, username, tenantId, assignedGradeId, assignedSectionId,
              isClassTeacher, attendancePermission, teachingGrades
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              name=VALUES(name), fullName=VALUES(fullName), firstName=VALUES(firstName), middleName=VALUES(middleName), lastName=VALUES(lastName),
              email=VALUES(email), phone=VALUES(phone), gender=VALUES(gender), dob=VALUES(dob), bloodGroup=VALUES(bloodGroup),
              nationality=VALUES(nationality), maritalStatus=VALUES(maritalStatus), aadhaarNumber=VALUES(aadhaarNumber), panNumber=VALUES(panNumber),
              joiningDate=VALUES(joiningDate), employmentType=VALUES(employmentType), role=VALUES(role), hasRole=VALUES(hasRole),
              designation=VALUES(designation), department=VALUES(department), primarySubject=VALUES(primarySubject), secondarySubject=VALUES(secondarySubject),
              alternateMobile=VALUES(alternateMobile), currentAddress=VALUES(currentAddress), currentCity=VALUES(currentCity), currentState=VALUES(currentState),
              currentCountry=VALUES(currentCountry), currentPostalCode=VALUES(currentPostalCode), permanentAddress=VALUES(permanentAddress),
              permanentCity=VALUES(permanentCity), permanentState=VALUES(permanentState), permanentCountry=VALUES(permanentCountry),
              permanentPostalCode=VALUES(permanentPostalCode), sameAsPermanent=VALUES(sameAsPermanent), qualification=VALUES(qualification),
              experience=VALUES(experience), experiences=VALUES(experiences), salaryGrade=VALUES(salaryGrade), photo=VALUES(photo),
              aadharFile=VALUES(aadharFile), panFile=VALUES(panFile), resumeFile=VALUES(resumeFile), joiningLetterFile=VALUES(joiningLetterFile),
              otherFile=VALUES(otherFile), certificateFile=VALUES(certificateFile), avatarBg=VALUES(avatarBg),
              password=VALUES(password), username=VALUES(username), assignedGradeId=VALUES(assignedGradeId), assignedSectionId=VALUES(assignedSectionId),
              isClassTeacher=VALUES(isClassTeacher), attendancePermission=VALUES(attendancePermission), teachingGrades=VALUES(teachingGrades)`,
            [
              employeeId, derivedFullName, derivedFullName, firstName || '', middleName || '', lastName || '', email || '', phone || req.body.mobile || '', gender || 'Male', dob || '', bloodGroup || '',
              nationality || 'Indian', maritalStatus || 'Single', aadhaarNumber ? encrypt(aadhaarNumber) : '', panNumber ? encrypt(panNumber) : '',
              joiningDate || new Date().toISOString().split('T')[0], employmentType || 'Full-Time', 'Teacher', 'Yes', 'Teacher', department || 'Academics',
              primarySubject || '', secondarySubject || '', alternateMobile || '', currentAddress || '', currentCity || '', currentState || '', currentCountry || 'India',
              currentPostalCode || '', permanentAddress || '', permanentCity || '', permanentState || '', permanentCountry || 'India', permanentPostalCode || '',
              newTeacher.sameAsPermanent ? 'Yes' : 'No', typeof parsedQualifications === 'object' ? JSON.stringify(parsedQualifications) : (parsedQualifications || ''),
              experience || '0', typeof parsedExperiences === 'object' ? JSON.stringify(parsedExperiences) : (parsedExperiences || ''), '',
              photoPath || '', aadhaarPath || '', panPath || '', resumePath || '', joiningLetterPath || '', otherPath || '', qualificationPath || '',
              newTeacher.avatarBg, generatedPassword, generatedUsername, tenantId,
              newTeacher.assignedGradeId, newTeacher.assignedSectionId, newTeacher.isClassTeacher, newTeacher.attendancePermission,
              Array.isArray(newTeacher.teachingGrades) ? JSON.stringify(newTeacher.teachingGrades) : (newTeacher.teachingGrades || '')
            ],
            tenantId
          );
        } catch (sqlErr) {
          console.error('[SQL Direct Teacher Insert Error]:', sqlErr.message);
        }
      }

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
  });
};

// 2. GET ALL TEACHERS
export const getTeachers = (req, res) => {
  const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || req.query?.tenantId || tenantStorage.getStore() || 'platform';
  const tenantId = slugify(rawTenantId);

  return tenantStorage.run(tenantId, async () => {
    try {
      const db = readDb(tenantId);
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
        if (typeof copy.teachingGrades === 'string' && copy.teachingGrades.trim()) {
          try { copy.teachingGrades = JSON.parse(copy.teachingGrades); } catch (e) {
            copy.teachingGrades = copy.teachingGrades.split(',').map(s => s.trim()).filter(Boolean);
          }
        }
        if (!Array.isArray(copy.teachingGrades)) copy.teachingGrades = [];
        return copy;
      });

      res.json(decryptedList);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      res.status(500).json({ error: 'Internal server error fetching teachers.' });
    }
  });
};

// 3. GET SINGLE TEACHER BY ID
export const getTeacherById = (req, res) => {
  const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || req.query?.tenantId || tenantStorage.getStore() || 'platform';
  const tenantId = slugify(rawTenantId);

  return tenantStorage.run(tenantId, async () => {
    try {
      const db = readDb(tenantId);
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
      if (typeof decryptedTeacher.teachingGrades === 'string' && decryptedTeacher.teachingGrades.trim()) {
        try { decryptedTeacher.teachingGrades = JSON.parse(decryptedTeacher.teachingGrades); } catch (e) {
          decryptedTeacher.teachingGrades = decryptedTeacher.teachingGrades.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      if (!Array.isArray(decryptedTeacher.teachingGrades)) decryptedTeacher.teachingGrades = [];

      res.json(decryptedTeacher);
    } catch (error) {
      console.error('Error loading teacher profile:', error);
      res.status(500).json({ error: 'Internal server error loading profile.' });
    }
  });
};

// 4. UPDATE TEACHER PROFILE
export const updateTeacher = async (req, res) => {
  const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || req.query?.tenantId || tenantStorage.getStore() || 'platform';
  const tenantId = slugify(rawTenantId);

  return tenantStorage.run(tenantId, async () => {
    try {
      const db = readDb(tenantId);
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
        (!t.status || t.status === 'Active') &&
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

    let parsedTeachingGrades = updateData.teachingGrades !== undefined ? updateData.teachingGrades : currentTeacher.teachingGrades;
    if (typeof parsedTeachingGrades === 'string') {
      try { parsedTeachingGrades = JSON.parse(parsedTeachingGrades); } catch (e) {
        parsedTeachingGrades = parsedTeachingGrades.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(parsedTeachingGrades)) parsedTeachingGrades = [];

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
      attendancePermission: updateData.attendancePermission !== undefined ? (updateData.attendancePermission === 'Yes' || updateData.attendancePermission === 'true' || updateData.attendancePermission === true || updateData.attendancePermission === 1 ? 1 : 0) : currentTeacher.attendancePermission,
      teachingGrades: parsedTeachingGrades
    };

    db.teachers = [...db.teachers];
    db.teachers[teacherIndex] = updatedTeacher;

    // Sync matching employee record in db.employees if present
    if (db.employees && Array.isArray(db.employees)) {
      const empIdx = db.employees.findIndex(e => e.id === teacherId || e.id === currentTeacher.employeeId);
      if (empIdx !== -1) {
        db.employees = [...db.employees];
        db.employees[empIdx] = {
          ...db.employees[empIdx],
          name: updatedTeacher.fullName || updatedTeacher.name,
          fullName: updatedTeacher.fullName || updatedTeacher.name,
          email: updatedTeacher.email || db.employees[empIdx].email,
          phone: updatedTeacher.mobile || updatedTeacher.phone || db.employees[empIdx].phone,
          status: updatedTeacher.status || db.employees[empIdx].status,
          photo: updatedTeacher.photo || db.employees[empIdx].photo,
          teachingGrades: parsedTeachingGrades
        };
      }
    }

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
    writeDb(db, ['teachers', 'employees'], tenantId);

    // Direct Synchronous SQL Update to guarantee persistence
    if (isSqlActive()) {
      try {
        const sqlDb = await import('../utils/sqlDb.js');
        await sqlDb.query(
          `UPDATE teachers SET 
            name = ?, fullName = ?, firstName = ?, middleName = ?, lastName = ?,
            email = ?, phone = ?, gender = ?, dob = ?, bloodGroup = ?, nationality = ?,
            maritalStatus = ?, joiningDate = ?, employmentType = ?, role = ?, designation = ?,
            department = ?, primarySubject = ?, secondarySubject = ?, alternateMobile = ?,
            currentAddress = ?, currentCity = ?, currentState = ?, currentCountry = ?, currentPostalCode = ?,
            permanentAddress = ?, permanentCity = ?, permanentState = ?, permanentCountry = ?, permanentPostalCode = ?,
            sameAsPermanent = ?, qualification = ?, experience = ?, experiences = ?,
            photo = ?, aadharFile = ?, panFile = ?, resumeFile = ?, joiningLetterFile = ?, otherFile = ?, certificateFile = ?,
            assignedGradeId = ?, assignedSectionId = ?, isClassTeacher = ?, attendancePermission = ?, teachingGrades = ?
          WHERE (id = ? OR employeeId = ?) AND tenantId = ?`,
          [
            updatedTeacher.name, updatedTeacher.fullName, updatedTeacher.firstName || '', updatedTeacher.middleName || '', updatedTeacher.lastName || '',
            updatedTeacher.email || '', updatedTeacher.phone || updatedTeacher.mobile || '', updatedTeacher.gender || 'Male', updatedTeacher.dob || '', updatedTeacher.bloodGroup || '', updatedTeacher.nationality || 'Indian',
            updatedTeacher.maritalStatus || 'Single', updatedTeacher.joiningDate || '', updatedTeacher.employmentType || 'Full-Time', updatedTeacher.role || 'Teacher', updatedTeacher.designation || 'Teacher',
            updatedTeacher.department || 'Academics', updatedTeacher.primarySubject || '', updatedTeacher.secondarySubject || '', updatedTeacher.alternateMobile || '',
            updatedTeacher.currentAddress || '', updatedTeacher.currentCity || '', updatedTeacher.currentState || '', updatedTeacher.currentCountry || 'India', updatedTeacher.currentPostalCode || '',
            updatedTeacher.permanentAddress || '', updatedTeacher.permanentCity || '', updatedTeacher.permanentState || '', updatedTeacher.permanentCountry || 'India', updatedTeacher.permanentPostalCode || '',
            updatedTeacher.sameAsPermanent ? 'Yes' : 'No', typeof parsedQualifications === 'object' ? JSON.stringify(parsedQualifications) : (parsedQualifications || ''),
            updatedTeacher.experience || '0', typeof parsedExperiences === 'object' ? JSON.stringify(parsedExperiences) : (parsedExperiences || ''),
            updatedTeacher.photo || '', updatedTeacher.aadhaarFile || '', updatedTeacher.panFile || '', updatedTeacher.resumeFile || '', updatedTeacher.joiningLetterFile || '', updatedTeacher.otherFile || '', updatedTeacher.qualificationFile || '',
            updatedTeacher.assignedGradeId || null, updatedTeacher.assignedSectionId || null,
            updatedTeacher.isClassTeacher ? 1 : 0, updatedTeacher.attendancePermission ? 1 : 0,
            Array.isArray(updatedTeacher.teachingGrades) ? JSON.stringify(updatedTeacher.teachingGrades) : (updatedTeacher.teachingGrades || ''),
            teacherId, teacherId, tenantId
          ],
          tenantId
        );
      } catch (sqlErr) {
        console.error('[SQL Direct Update Teacher Error]:', sqlErr.message);
      }
    }

    logAudit('Update Teacher', `Teacher: ${updatedTeacher.fullName} (Emp: ${updatedTeacher.employeeId})`, `Updated teacher profile professional records`, req);

    res.json(updatedTeacher);
  } catch (error) {
    console.error('Error updating teacher profile:', error);
    res.status(500).json({ error: 'Internal server error while updating teacher details.' });
  }
  });
};

// 5. DELETE / DISMISS TEACHER
export const deleteTeacher = async (req, res) => {
  const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || req.query?.tenantId || tenantStorage.getStore() || 'platform';
  const tenantId = slugify(rawTenantId);

  return tenantStorage.run(tenantId, async () => {
    try {
      const db = readDb(tenantId);
      if (!db.teachers) db.teachers = [];
      const reqId = String(req.params.id || '').trim();
      const cleanReqId = reqId.replace(/^(emp|tea)-?/i, '');
      const teacherIndex = db.teachers.findIndex(t => {
        const tEmpId = String(t.employeeId || '').trim();
        const tId = String(t.id || '').trim();
        return tEmpId === reqId || tId === reqId ||
               (cleanReqId && (tEmpId.replace(/^(emp|tea)-?/i, '') === cleanReqId || tId.replace(/^(emp|tea)-?/i, '') === cleanReqId));
      });

      if (teacherIndex === -1) {
        return res.status(404).json({ error: 'Teacher profile not found.' });
      }

      const teacher = db.teachers[teacherIndex];
      const teacherName = teacher.name || teacher.fullName || 'Teacher';
      const deletedId = teacher.id || teacher.employeeId;
      const deletedEmpId = teacher.employeeId || teacher.id;

      // Delete files from ImageKit asynchronously without blocking database deletion
      const filesToDelete = [
        teacher.photo, teacher.aadhaarFile, teacher.panFile, teacher.resumeFile,
        teacher.qualificationFile, teacher.experienceFile, teacher.joiningLetterFile, teacher.otherFile
      ];
      for (const fileUrl of filesToDelete) {
        if (fileUrl) {
          deleteFromImageKit(fileUrl).catch(e => console.error('[ImageKit Delete Error]', e?.message || e));
        }
      }

      // Direct Synchronous SQL Delete to guarantee immediate database persistence
      if (isSqlActive()) {
        try {
          const sqlDb = await import('../utils/sqlDb.js');
          const tId = tenantId || 'platform';

          await sqlDb.query('DELETE FROM teacher_leaves WHERE teacherId = ? AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [deletedId, tId, ''], tId);
          await sqlDb.query('DELETE FROM teacher_reports WHERE teacherId = ? AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [deletedId, tId, ''], tId);
          await sqlDb.query('DELETE FROM employee_qr_codes WHERE (employeeId = ? OR teacherId = ? OR employeeId = ? OR teacherId = ?) AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [deletedId, deletedId, deletedEmpId, deletedEmpId, tId, ''], tId);
          await sqlDb.query('DELETE FROM attendance_records WHERE (employeeId = ? OR teacherId = ? OR employeeId = ? OR teacherId = ?) AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [deletedId, deletedId, deletedEmpId, deletedEmpId, tId, ''], tId);
          await sqlDb.query('DELETE FROM attendance_logs WHERE (employeeId = ? OR teacherId = ? OR employeeId = ? OR teacherId = ?) AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [deletedId, deletedId, deletedEmpId, deletedEmpId, tId, ''], tId);
          await sqlDb.query('DELETE FROM user_access WHERE (userId = ? OR userId = ?) AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [deletedId, deletedEmpId, tId, ''], tId);
          await sqlDb.query('DELETE FROM teachers WHERE (id = ? OR id = ?) AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [deletedId, deletedEmpId, tId, ''], tId);
          await sqlDb.query('DELETE FROM employees WHERE (id = ? OR id = ?) AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [deletedId, deletedEmpId, tId, ''], tId);

          const syncTs = new Date().toISOString();
          await sqlDb.query('UPDATE schools SET updatedAt = ? WHERE subdomain = ?', [syncTs, tId], tId);
        } catch (sqlErr) {
          console.error('[SQL Direct Delete Teacher Error]', sqlErr);
        }
      }

      db.teachers.splice(teacherIndex, 1);
      db.teachers = [...db.teachers];

      // Keep db.employees synchronized
      if (db.employees && Array.isArray(db.employees)) {
        db.employees = db.employees.filter(e => e.id !== deletedId && e.id !== deletedEmpId);
      }
      if (db.employeeQrCodes) {
        db.employeeQrCodes = db.employeeQrCodes.filter(q => q.employeeId !== deletedId && q.teacherId !== deletedId && q.employeeId !== deletedEmpId);
      }
      if (db.attendanceRecords) {
        db.attendanceRecords = db.attendanceRecords.filter(a => a.employeeId !== deletedId && a.teacherId !== deletedId && a.employeeId !== deletedEmpId);
      }
      if (db.attendanceLogs) {
        db.attendanceLogs = db.attendanceLogs.filter(l => l.employeeId !== deletedId && l.teacherId !== deletedId && l.employeeId !== deletedEmpId);
      }
      if (db.userAccess) {
        db.userAccess = db.userAccess.filter(ua => ua.userId !== deletedId && ua.userId !== deletedEmpId);
      }

      addActivity(db, 'alert', 'Teacher Dismissed', `${teacherName} was removed from the roster`, 'rgb(var(--color-danger-rgb))', 'rgba(var(--color-danger-rgb), 0.1)');
      writeDb(db, ['teachers', 'employees'], tenantId);
      logAudit('Delete Teacher', `Teacher: ${teacherName} (ID: ${deletedId})`, `Dismissed teacher roster record`, req);

      res.json({ success: true, message: `Successfully dismissed teacher ${teacherName}` });
    } catch (error) {
      console.error('Error removing teacher record:', error);
      res.status(500).json({ error: 'Internal server error dismissing teacher.' });
    }
  });
};

// 6. BULK DELETE / DISMISS TEACHERS
export const bulkDeleteTeachers = async (req, res) => {
  const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || req.query?.tenantId || tenantStorage.getStore() || 'platform';
  const tenantId = slugify(rawTenantId);

  return tenantStorage.run(tenantId, async () => {
    try {
      const db = readDb(tenantId);
      if (!db.teachers) db.teachers = [];
      const { ids, teacherIds } = req.body;
      const idsToDelete = Array.isArray(ids) ? ids : (Array.isArray(teacherIds) ? teacherIds : []);

      if (!idsToDelete || idsToDelete.length === 0) {
        return res.status(400).json({ error: 'No teacher IDs provided for bulk deletion.' });
      }

      const normalizedIds = idsToDelete.map(id => String(id || '').trim().toLowerCase());
      const teachersToRemove = db.teachers.filter(t => {
        const tId = String(t.id || '').trim().toLowerCase();
        const tEmpId = String(t.employeeId || '').trim().toLowerCase();
        return normalizedIds.some(reqId => {
          const cleanReqId = reqId.replace(/^(emp|tea)-?/i, '');
          return tId === reqId || tEmpId === reqId ||
                 (cleanReqId && (tId.replace(/^(emp|tea)-?/i, '') === cleanReqId || tEmpId.replace(/^(emp|tea)-?/i, '') === cleanReqId));
        });
      });

      if (teachersToRemove.length === 0) {
        return res.status(404).json({ error: 'No matching teachers found to delete.' });
      }

      const allTargetIds = new Set();
      for (const t of teachersToRemove) {
        if (t.id) allTargetIds.add(t.id);
        if (t.employeeId) allTargetIds.add(t.employeeId);
      }

      // Delete files from ImageKit asynchronously
      for (const teacher of teachersToRemove) {
        const filesToDelete = [
          teacher.photo, teacher.aadhaarFile, teacher.panFile, teacher.resumeFile,
          teacher.qualificationFile, teacher.experienceFile, teacher.joiningLetterFile, teacher.otherFile
        ];
        for (const fileUrl of filesToDelete) {
          if (fileUrl) {
            deleteFromImageKit(fileUrl).catch(e => console.error('[ImageKit Delete Error]', e?.message || e));
          }
        }
      }

      // Direct Synchronous SQL Delete
      if (isSqlActive()) {
        try {
          const sqlDb = await import('../utils/sqlDb.js');
          const tId = tenantId || 'platform';

          for (const targetId of allTargetIds) {
            await sqlDb.query('DELETE FROM teacher_leaves WHERE teacherId = ? AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [targetId, tId, ''], tId);
            await sqlDb.query('DELETE FROM teacher_reports WHERE teacherId = ? AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [targetId, tId, ''], tId);
            await sqlDb.query('DELETE FROM employee_qr_codes WHERE (employeeId = ? OR teacherId = ?) AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [targetId, targetId, tId, ''], tId);
            await sqlDb.query('DELETE FROM attendance_records WHERE (employeeId = ? OR teacherId = ?) AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [targetId, targetId, tId, ''], tId);
            await sqlDb.query('DELETE FROM attendance_logs WHERE (employeeId = ? OR teacherId = ?) AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [targetId, targetId, tId, ''], tId);
            await sqlDb.query('DELETE FROM user_access WHERE userId = ? AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [targetId, tId, ''], tId);
            await sqlDb.query('DELETE FROM teachers WHERE id = ? AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [targetId, tId, ''], tId);
            await sqlDb.query('DELETE FROM employees WHERE id = ? AND (tenantId = ? OR tenantId IS NULL OR tenantId = ?)', [targetId, tId, ''], tId);
          }

          const syncTs = new Date().toISOString();
          await sqlDb.query('UPDATE schools SET updatedAt = ? WHERE subdomain = ?', [syncTs, tId], tId);
        } catch (sqlErr) {
          console.error('[SQL Direct Bulk Delete Teacher Error]', sqlErr);
        }
      }

      // Synchronize in-memory/JSON db
      db.teachers = db.teachers.filter(t => !allTargetIds.has(t.id) && !allTargetIds.has(t.employeeId));
      if (db.employees && Array.isArray(db.employees)) {
        db.employees = db.employees.filter(e => !allTargetIds.has(e.id) && !allTargetIds.has(e.employeeId));
      }
      if (db.employeeQrCodes) {
        db.employeeQrCodes = db.employeeQrCodes.filter(q => !allTargetIds.has(q.employeeId) && !allTargetIds.has(q.teacherId));
      }
      if (db.attendanceRecords) {
        db.attendanceRecords = db.attendanceRecords.filter(a => !allTargetIds.has(a.employeeId) && !allTargetIds.has(a.teacherId));
      }
      if (db.attendanceLogs) {
        db.attendanceLogs = db.attendanceLogs.filter(l => !allTargetIds.has(l.employeeId) && !allTargetIds.has(l.teacherId));
      }
      if (db.userAccess) {
        db.userAccess = db.userAccess.filter(ua => !allTargetIds.has(ua.userId));
      }

      addActivity(db, 'alert', 'Teachers Bulk Dismissed', `${teachersToRemove.length} teachers were removed from the roster`, 'rgb(var(--color-danger-rgb))', 'rgba(var(--color-danger-rgb), 0.1)');
      writeDb(db, ['teachers', 'employees'], tenantId);
      logAudit('Bulk Delete Teachers', `Total: ${teachersToRemove.length}`, `Dismissed teacher IDs: ${Array.from(allTargetIds).join(', ')}`, req);

      res.json({ success: true, count: teachersToRemove.length, message: `Successfully dismissed ${teachersToRemove.length} teacher(s)` });
    } catch (error) {
      console.error('Error removing teachers:', error);
      res.status(500).json({ error: 'Internal server error dismissing teachers.' });
    }
  });
};

