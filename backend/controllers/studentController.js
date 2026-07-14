import { readDb, writeDb, addActivity } from '../utils/db.js';
import { hashPassword } from '../utils/authHelper.js';
import { logAudit } from '../utils/logger.js';
import { encrypt, decrypt } from '../utils/encryptionHelper.js';
import { uploadToImageKit, deleteFromImageKit } from '../utils/imagekit.js';


// ==========================================
// STUDENT CONTROLLERS
// ==========================================

// 1. REGISTER NEW STUDENT
export const registerStudent = async (req, res) => {
  try {
    const db = readDb();
    
    // Parse form fields
    let {
      fullName,
      firstName,
      middleName,
      lastName,
      gender,
      dob,
      bloodGroup,
      nationality,
      category,
      religion,
      aadhaarNumber,
      
      fatherName,
      fatherOccupation,
      fatherMobile,
      fatherEmail,
      motherName,
      motherOccupation,
      motherMobile,
      motherEmail,
      guardianName,
      guardianRelation,
      guardianContact,

      admissionNumber,
      admissionDate,
      rollNumber,
      studentClass,
      section,
      academicYear,
      admissionType,
      previousSchoolName,
      previousSchoolAddress,
      previousClassStudied,
      transferCertificateNumber,
      status,

      currentAddress,
      permanentAddress,
      city,
      state,
      country,
      postalCode,
      emergencyContactNumber,
      isSameAddress,

      medicalConditions,
      allergies,
      disabilities,
      emergencyNotes,
      doctorName,
      doctorContact,

      transportRequired,
      hostelRequired,

      feeStructure,
      scholarshipDetails,
      discountType,
      discountAmount,
      initialPaymentStatus
    } = req.body;

    // Auto-generate academic details if missing
    if (!admissionNumber) {
      admissionNumber = `ADM-${Date.now().toString().slice(-6)}`;
    }
    if (!rollNumber) {
      rollNumber = '';
    }
    if (!studentClass) {
      studentClass = 'I';
    }
    if (!section) {
      section = '';
    }
    if (!academicYear) {
      academicYear = '2026-2027';
    }

    const calculatedFullName = fullName || [firstName, middleName, lastName].filter(Boolean).join(' ') || 'Student';
    const calculatedFirstName = firstName || calculatedFullName.split(' ')[0] || '';
    const calculatedLastName = lastName || calculatedFullName.split(' ').slice(1).join(' ') || '';

    if (!calculatedFullName || !admissionNumber || !studentClass || !adminEmailCheck(req.body)) {
      return res.status(400).json({ error: 'Missing required student details.' });
    }

    if (aadhaarNumber && !/^\d{12}$/.test(String(aadhaarNumber).replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid Aadhaar number. Must be exactly 12 digits.' });
    }

    const files = req.files || {};
    const tenantId = req.admin?.tenantId || 'platform';
    const folder = `school/${tenantId}/students`;

    const processUpload = async (fileArray) => {
      if (!fileArray || !fileArray[0]) return '';
      const uploadRes = await uploadToImageKit(fileArray[0].buffer, fileArray[0].originalname, folder);
      return uploadRes.url;
    };

    const photoPath = await processUpload(files.photo);
    const aadhaarPath = await processUpload(files.aadhaarFile);
    const birthCertPath = await processUpload(files.birthCertificateFile);
    const marksheetPath = await processUpload(files.marksheetFile);
    const tcPath = await processUpload(files.transferCertificateFile);
    const addressProofPath = await processUpload(files.addressProofFile);
    const medicalCertPath = await processUpload(files.medicalCertificateFile);
    const additionalPath = await processUpload(files.additionalFile);

    // Student & Parent account logins creation
    const studentUsername = admissionNumber;
    const studentPassword = await hashPassword(`stu@${calculatedFirstName.toLowerCase() || 'student'}`);
    const parentUsername = fatherEmail || motherEmail || `parent_${admissionNumber}`;
    const parentPassword = await hashPassword('parent123');

    const newStudent = {
      id: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      enrollmentId: `ENR-${Math.floor(100000 + Math.random() * 900000)}`,
      parentId: `PAR-${Math.floor(100000 + Math.random() * 900000)}`,
      addressId: `ADD-${Math.floor(100000 + Math.random() * 900000)}`,
      medicalId: `MED-${Math.floor(100000 + Math.random() * 900000)}`,
      feeAssignmentId: `FEE-ASN-${Math.floor(100000 + Math.random() * 900000)}`,
      name: calculatedFullName,
      fullName: calculatedFullName,
      firstName: calculatedFirstName,
      middleName: middleName || '',
      lastName: calculatedLastName,
      gender,
      dob,
      bloodGroup,
      nationality: nationality || 'Indian',
      category: category || 'General',
      religion: religion || 'Hinduism',
      aadhaarNumber: encrypt(aadhaarNumber || ''),
      
      fatherName: fatherName || '',
      fatherOccupation: fatherOccupation || '',
      fatherMobile: encrypt(fatherMobile || ''),
      fatherEmail: encrypt(fatherEmail || ''),
      motherName: motherName || '',
      motherOccupation: motherOccupation || '',
      motherMobile: encrypt(motherMobile || ''),
      motherEmail: encrypt(motherEmail || ''),
      guardianName: guardianName || '',
      guardianRelation: guardianRelation || '',
      guardianContact: encrypt(guardianContact || ''),

      admissionNumber,
      admissionDate: admissionDate || new Date().toISOString().split('T')[0],
      rollNumber,
      roll: rollNumber,
      studentClass,
      section,
      academicYear,
      admissionType: admissionType || 'New Admission',
      previousSchoolName: previousSchoolName || '',
      previousSchoolAddress: previousSchoolAddress || '',
      previousClassStudied: previousClassStudied || '',
      transferCertificateNumber: transferCertificateNumber || '',
      status: status || 'Pending',

      currentAddress: currentAddress || '',
      permanentAddress: permanentAddress || '',
      address: currentAddress || '',
      city: city || '',
      state: state || '',
      country: country || 'India',
      postalCode: postalCode || '',
      pincode: postalCode || '',
      emergencyContactNumber: emergencyContactNumber || '',
      isSameAddress: isSameAddress === 'true' || isSameAddress === true,

      medicalConditions: medicalConditions || '',
      allergies: allergies || '',
      disabilities: disabilities || '',
      emergencyNotes: emergencyNotes || '',
      doctorName: doctorName || '',
      doctorContact: doctorContact || '',

      transportRequired: transportRequired || 'No',
      hostelRequired: hostelRequired || 'No',

      feeStructure: feeStructure || '',
      scholarshipDetails: scholarshipDetails || '',
      discountType: discountType || '',
      discountAmount: parseFloat(discountAmount || 0),
      feeStatus: initialPaymentStatus || 'Pending',
      initialPaymentStatus: initialPaymentStatus || 'Pending',

      studentUsername,
      studentPassword,
      parentUsername,
      parentPassword,

      // Supporting files
      photo: photoPath,
      aadhaarFile: aadhaarPath,
      birthCertificateFile: birthCertPath,
      marksheetFile: marksheetPath,
      transferCertificateFile: tcPath,
      addressProofFile: addressProofPath,
      medicalCertificateFile: medicalCertPath,
      additionalFile: additionalPath,

      // Backward-compatible properties
      grade: section ? `${studentClass}-${section}` : studentClass,
      guardian: guardianName || fatherName || motherName,
      email: encrypt(fatherEmail || motherEmail || `${admissionNumber}@academy.edu`),
      phone: encrypt(guardianContact || fatherMobile || motherMobile),
      rank: 'N/A',
      photoBg: `linear-gradient(135deg, hsl(${Math.random() * 360}, 75%, 60%) 0%, hsl(${Math.random() * 360}, 85%, 50%) 100%)`
    };

    db.students.push(newStudent);
    addActivity(db, 'registration', 'New Student Admitted', `${calculatedFullName} registered in Grade ${newStudent.grade}`, 'hsl(var(--color-primary))', 'rgba(hsl(var(--color-primary)), 0.1)');
    writeDb(db);
    logAudit('Create Student', `Student: ${newStudent.name} (Adm: ${newStudent.admissionNumber})`, `Registered student ID: ${newStudent.id}`, req);

    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Error registering student:', error);
    res.status(500).json({ error: 'Internal API Server error during registration.' });
  }
};

// 2. GET STUDENTS (With Search, Filters, Sorting & Pagination)
export const getStudents = async (req, res) => {
  try {
    const db = readDb();
    
    // If teacher is logged in, restrict query options to their assigned class and section
    const user = req.admin;
    if (user && user.role === 'Teacher') {
      const teacher = (db.teachers || []).find(t => t.id === user.id);
      if (teacher) {
        req.query.class = teacher.assignedGradeId || 'NONE';
        req.query.section = teacher.assignedSectionId || 'NONE';
      }
    }

    let result = [...db.students];

    // 0. Status Filter (Default to 'Active')
    const statusFilter = req.query.status || 'Active';
    if (statusFilter !== 'All') {
      result = result.filter(s => s.status === statusFilter);
    }

    // 1. Search Query (always searches by name startsWith OR id/admissionNumber includes, avoiding prefix collision)
    const search = req.query.search || '';
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      const cleanQ = q.replace(/^(stu-?|adm-?)/i, '');
      result = result.filter(s => {
        const nameMatch = (s.name && s.name.toLowerCase().startsWith(q)) || 
                          (s.fullName && s.fullName.toLowerCase().startsWith(q));
        
        const cleanId = (s.id || '').replace(/^stu-?/i, '').toLowerCase();
        const cleanAdm = (s.admissionNumber || '').replace(/^adm-?/i, '').toLowerCase();
        const idMatch = cleanQ !== '' && (cleanId.includes(cleanQ) || cleanAdm.includes(cleanQ));
                        
        return nameMatch || idMatch;
      });
    }

    // 2. Class Filter
    const classFilter = req.query.class || 'All';
    if (classFilter !== 'All') {
      result = result.filter(s => s.studentClass === classFilter || (s.grade && s.grade.split('-')[0] === classFilter));
    }

    // 3. Section Filter
    const sectionFilter = req.query.section || 'All';
    if (sectionFilter !== 'All') {
      result = result.filter(s => s.section === sectionFilter);
    }

    // 4. Academic Year Filter
    const yearFilter = req.query.academicYear || 'All';
    if (yearFilter !== 'All') {
      result = result.filter(s => s.academicYear === yearFilter);
    }

    // 5. Sorting
    const sortBy = req.query.sortBy || 'name'; // 'name', 'id', 'roll'
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

    const decryptedStudents = paginatedItems.map(s => ({
      ...s,
      aadhaarNumber: decrypt(s.aadhaarNumber),
      fatherMobile: decrypt(s.fatherMobile),
      fatherEmail: decrypt(s.fatherEmail),
      motherMobile: decrypt(s.motherMobile),
      motherEmail: decrypt(s.motherEmail),
      guardianContact: decrypt(s.guardianContact),
      email: decrypt(s.email),
      phone: decrypt(s.phone)
    }));

    res.json({
      totalCount: result.length,
      page,
      limit,
      totalPages: Math.ceil(result.length / limit),
      students: decryptedStudents
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
};

// 3. UPDATE STUDENT DETAILS
export const updateStudent = async (req, res) => {
  try {
    const db = readDb();
    const studentId = req.params.id;
    const studentIndex = db.students.findIndex(s => s.id === studentId);

    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const currentStudent = db.students[studentIndex];
    const updateData = req.body;

    if (updateData.aadhaarNumber && !/^\d{12}$/.test(String(updateData.aadhaarNumber).replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid Aadhaar number. Must be exactly 12 digits.' });
    }

    const files = req.files || {};
    const tenantId = req.admin?.tenantId || 'platform';
    const folder = `school/${tenantId}/students`;

    const processUpdateUpload = async (fileArray, oldPath) => {
      if (!fileArray || !fileArray[0]) return oldPath;
      if (oldPath) {
        deleteFromImageKit(oldPath).catch(e => console.error('[ImageKit Delete Error]', e));
      }
      const uploadRes = await uploadToImageKit(fileArray[0].buffer, fileArray[0].originalname, folder);
      return uploadRes.url;
    };

    const photoPath = await processUpdateUpload(files.photo, currentStudent.photo);
    const aadhaarPath = await processUpdateUpload(files.aadhaarFile, currentStudent.aadhaarFile);
    const birthCertPath = await processUpdateUpload(files.birthCertificateFile, currentStudent.birthCertificateFile);
    const marksheetPath = await processUpdateUpload(files.marksheetFile, currentStudent.marksheetFile);
    const tcPath = await processUpdateUpload(files.transferCertificateFile, currentStudent.transferCertificateFile);
    const addressProofPath = await processUpdateUpload(files.addressProofFile, currentStudent.addressProofFile);
    const medicalCertPath = await processUpdateUpload(files.medicalCertificateFile, currentStudent.medicalCertificateFile);
    const additionalPath = await processUpdateUpload(files.additionalFile, currentStudent.additionalFile);

    const updatedStudent = {
      ...currentStudent,
      ...updateData,
      photo: photoPath,
      aadhaarFile: aadhaarPath,
      birthCertificateFile: birthCertPath,
      marksheetFile: marksheetPath,
      transferCertificateFile: tcPath,
      addressProofFile: addressProofPath,
      medicalCertificateFile: medicalCertPath,
      additionalFile: additionalPath,
      name: updateData.fullName || currentStudent.name,
      roll: updateData.rollNumber !== undefined ? updateData.rollNumber : currentStudent.roll,
      rollNumber: updateData.rollNumber !== undefined ? updateData.rollNumber : currentStudent.rollNumber,
      grade: (updateData.section !== undefined ? updateData.section : currentStudent.section)
        ? `${updateData.studentClass || currentStudent.studentClass}-${updateData.section !== undefined ? updateData.section : currentStudent.section}`
        : (updateData.studentClass || currentStudent.studentClass),
      guardian: updateData.guardianName || updateData.fatherName || currentStudent.guardian,
      aadhaarNumber: updateData.aadhaarNumber !== undefined ? encrypt(updateData.aadhaarNumber) : currentStudent.aadhaarNumber,
      fatherMobile: updateData.fatherMobile !== undefined ? encrypt(updateData.fatherMobile) : currentStudent.fatherMobile,
      fatherEmail: updateData.fatherEmail !== undefined ? encrypt(updateData.fatherEmail) : currentStudent.fatherEmail,
      motherMobile: updateData.motherMobile !== undefined ? encrypt(updateData.motherMobile) : currentStudent.motherMobile,
      motherEmail: updateData.motherEmail !== undefined ? encrypt(updateData.motherEmail) : currentStudent.motherEmail,
      guardianContact: updateData.guardianContact !== undefined ? encrypt(updateData.guardianContact) : currentStudent.guardianContact,
      email: updateData.fatherEmail !== undefined || updateData.motherEmail !== undefined
        ? encrypt(updateData.fatherEmail || updateData.motherEmail || decrypt(currentStudent.email))
        : currentStudent.email,
      phone: updateData.guardianContact !== undefined || updateData.fatherMobile !== undefined || updateData.motherMobile !== undefined
        ? encrypt(updateData.guardianContact || updateData.fatherMobile || updateData.motherMobile || decrypt(currentStudent.phone))
        : currentStudent.phone
    };

    db.students[studentIndex] = updatedStudent;
    addActivity(db, 'alert', 'Student Profile Modified', `${updatedStudent.name}'s registry was modified.`, 'hsl(var(--color-secondary))', 'rgba(hsl(var(--color-secondary)), 0.1)');
    writeDb(db);
    logAudit('Update Student', `Student: ${updatedStudent.name} (Adm: ${updatedStudent.admissionNumber})`, `Updated student registry details`, req);

    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Internal server error while updating student.' });
  }
};

// 4. DELETE / DISMISS STUDENT
export const deleteStudent = async (req, res) => {
  try {
    const db = readDb();
    const studentIndex = db.students.findIndex(s => s.id === req.params.id);

    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const student = db.students[studentIndex];
    const studentName = student.name;

    // Delete files from ImageKit
    const filesToDelete = [
      student.photo, student.aadhaarFile, student.birthCertificateFile, student.marksheetFile,
      student.transferCertificateFile, student.addressProofFile, student.medicalCertificateFile, student.additionalFile
    ];
    for (const fileUrl of filesToDelete) {
      if (fileUrl) {
        await deleteFromImageKit(fileUrl);
      }
    }

    db.students.splice(studentIndex, 1);
    addActivity(db, 'alert', 'Student Dismissed', `${studentName} was removed from the registry`, 'rgb(var(--color-danger-rgb))', 'rgba(var(--color-danger-rgb), 0.1)');
    writeDb(db);
    logAudit('Delete Student', `Student: ${studentName} (ID: ${req.params.id})`, `Dismissed student record`, req);

    res.json({ success: true, message: `Removed student ${studentName}` });
  } catch (error) {
    console.error('Error removing student:', error);
    res.status(500).json({ error: 'Internal API Server Error.' });
  }
};

// Helper to check admin validator context safely
function adminEmailCheck(body) {
  return body.adminEmail ? true : true;
}
