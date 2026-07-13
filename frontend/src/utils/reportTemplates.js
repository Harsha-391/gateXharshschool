export const DEFAULT_TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic Elegant',
    html: `<div style="font-family: 'Playfair Display', Georgia, serif; font-variant-numeric: lining-nums; font-feature-settings: 'lnum'; padding: 40px; border: 15px double #1e3a8a; background: #fff; color: #1e293b; max-width: 800px; margin: 0 auto; box-sizing: border-box; position: relative;">
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); opacity: 0.03; font-size: 5rem; font-weight: 900; z-index: 0; pointer-events: none; text-align: center; width: 100%; white-space: nowrap;">
    OFFICIAL REPORT CARD
  </div>
  
  <div style="position: relative; z-index: 1;">
    <!-- School Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #1e3a8a; padding-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 20px;">
        {{schoolLogo}}
        <div>
          <h1 style="margin: 0; font-size: 1.8rem; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 1px;">{{schoolName}}</h1>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #475569; font-style: italic;">{{schoolAddress}}</p>
          <p style="margin: 2px 0 0 0; font-size: 0.85rem; color: #475569;">Contact: {{schoolContact}}</p>
        </div>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 0.85rem; font-weight: bold; border: 1px solid #1e3a8a; padding: 6px 12px; border-radius: 4px; color: #1e3a8a; background: #f0f4f8;">
          ACADEMIC REPORT CARD
        </span>
        <p style="margin: 8px 0 0 0; font-size: 0.8rem; color: #64748b;">Session: <strong>{{session}}</strong></p>
      </div>
    </div>

    <!-- Student Details Grid -->
    <div style="display: grid; grid-template-columns: 100px 1fr 120px; gap: 20px; margin-top: 25px; padding: 15px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px;">
      <div style="display: flex; align-items: center; justify-content: center;">{{studentPhoto}}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.85rem;">
        <div><strong>Student Name:</strong> {{studentName}}</div>
        <div><strong>Admission No:</strong> {{admissionNo}}</div>
        <div><strong>Class & Section:</strong> Class {{class}} - {{section}}</div>
        <div><strong>Roll Number:</strong> {{rollNo}}</div>
        <div><strong>Father's Name:</strong> {{fatherName}}</div>
        <div><strong>Mother's Name:</strong> {{motherName}}</div>
        <div><strong>Date of Birth:</strong> {{dob}}</div>
        <div><strong>Gender:</strong> {{gender}}</div>
      </div>
      <div style="text-align: center; border-left: 1px solid #cbd5e1; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px;">
        <span style="font-size: 0.7rem; color: #64748b; text-transform: uppercase;">Overall Rank</span>
        <span style="font-size: 1.5rem; font-weight: bold; color: #1e3a8a;">{{rank}}</span>
        <span style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; margin-top: 8px;">Attendance</span>
        <span style="font-size: 0.9rem; font-weight: 700; color: #10b981;">{{attendance}}</span>
      </div>
    </div>

    <!-- Marks Breakdown Section -->
    <div style="margin-top: 25px;">
      <h3 style="margin: 0 0 10px 0; font-size: 1.1rem; color: #1e3a8a; border-bottom: 1px solid #1e3a8a; padding-bottom: 6px; text-transform: uppercase;">
        Academic Performance - {{examName}}
      </h3>
      {{subjectMarksTable}}
    </div>

    <!-- Summary Box -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; border: 2px solid #1e3a8a; background: #f0f4f8; padding: 15px; border-radius: 6px; text-align: center; margin-top: 25px; font-size: 0.85rem;">
      <div>
        <span style="color: #64748b; display: block; font-size: 0.75rem; text-transform: uppercase;">Grand Marks Obtained</span>
        <strong style="font-size: 1.2rem; color: #1e3a8a;">{{obtainedMarks}} / {{totalMarks}}</strong>
      </div>
      <div>
        <span style="color: #64748b; display: block; font-size: 0.75rem; text-transform: uppercase;">Overall Percentage</span>
        <strong style="font-size: 1.2rem; color: #1e3a8a;">{{percentage}}</strong>
      </div>
      <div>
        <span style="color: #64748b; display: block; font-size: 0.75rem; text-transform: uppercase;">Final Results Grade</span>
        <strong style="font-size: 1.2rem; color: #16a34a;">{{grade}} ({{result}})</strong>
      </div>
    </div>

    <!-- Footnotes & Signatures -->
    <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 0.8rem; color: #475569; display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 20px; align-items: center;">
      <div>
        <strong>Teacher's Remarks:</strong>
        <p style="margin: 4px 0 0 0; padding: 6px 10px; background: #f8fafc; border-radius: 4px; min-height: 40px; font-style: italic; border: 1px dashed #cbd5e1;">
          {{remarks}}
        </p>
      </div>
      <div style="text-align: center;">
        <span style="display: block; margin-bottom: 20px; font-size: 0.75rem; text-transform: uppercase; color: #64748b;">Class Teacher</span>
        <span style="font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px; display: inline-block; width: 140px;">{{classTeacherName}}</span>
      </div>
      <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px;">
        <span style="font-size: 0.75rem; text-transform: uppercase; color: #64748b;">Principal Signature & Stamp</span>
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; height: 50px;">
          {{principalSignature}}
          {{schoolStamp}}
        </div>
        <span style="font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px; display: inline-block; width: 140px;">{{principalName}}</span>
      </div>
    </div>

    <!-- Date & QR Info -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 12px; font-size: 0.75rem; color: #64748b;">
      <div>Report Generated Date: <strong>{{generatedDate}}</strong></div>
      <div>{{qrCode}}</div>
    </div>
  </div>
</div>`
  },
  {
    id: 'modern',
    name: 'Modern Minimalist',
    html: `<div style="font-family: 'Inter', system-ui, sans-serif; font-variant-numeric: lining-nums; font-feature-settings: 'lnum'; padding: 35px; background: #ffffff; color: #334155; max-width: 800px; margin: 0 auto; box-sizing: border-box; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
  <!-- Header Banner -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
    <div style="display: flex; gap: 16px; align-items: center;">
      {{schoolLogo}}
      <div>
        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">{{schoolName}}</h2>
        <span style="font-size: 0.8rem; color: #64748b; display: block; margin-top: 2px;">{{schoolAddress}}</span>
        <span style="font-size: 0.8rem; color: #64748b;">{{schoolContact}}</span>
      </div>
    </div>
    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
      <span style="font-size: 0.72rem; padding: 4px 10px; border-radius: 99px; background: rgba(255, 107, 0,0.08); color: #e05e00; font-weight: 800; text-transform: uppercase;">
        Report Summary
      </span>
      <span style="font-size: 0.8rem; color: #64748b;">Session: <strong>{{session}}</strong></span>
    </div>
  </div>

  <!-- Student Header -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 25px; background: #f8fafc; padding: 15px 20px; border-radius: 10px; border-left: 4px solid #e05e00;">
    <div style="display: flex; gap: 18px; align-items: center;">
      <div style="display: flex; align-items: center; justify-content: center;">{{studentPhoto}}</div>
      <div>
        <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #0f172a;">{{studentName}}</h3>
        <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: #64748b;">
          Class {{class}} - {{section}} · Roll #<strong>{{rollNo}}</strong> · Adm No <strong>{{admissionNo}}</strong>
        </p>
      </div>
    </div>
    <div style="text-align: right; display: grid; grid-template-columns: auto auto; gap: 16px; font-size: 0.8rem;">
      <div style="border-right: 1px solid #e2e8f0; padding-right: 16px;">
        <span style="color: #64748b; display: block; font-size: 0.7rem; text-transform: uppercase; margin-bottom: 2px;">DOB</span>
        <strong style="color: #0f172a;">{{dob}}</strong>
      </div>
      <div>
        <span style="color: #64748b; display: block; font-size: 0.7rem; text-transform: uppercase; margin-bottom: 2px;">Gender</span>
        <strong style="color: #0f172a;">{{gender}}</strong>
      </div>
    </div>
  </div>

  <!-- Academic section -->
  <div style="margin-top: 25px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px;">
        Performance Breakdown
      </h4>
      <span style="font-size: 0.8rem; background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
        {{examName}}
      </span>
    </div>
    {{subjectMarksTable}}
  </div>

  <!-- Modern overall grid -->
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 20px;">
    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #f1f5f9;">
      <span style="font-size: 0.7rem; color: #64748b; display: block; text-transform: uppercase;">Marks</span>
      <strong style="font-size: 1.1rem; color: #0f172a; display: block; margin-top: 4px;">{{obtainedMarks}} / {{totalMarks}}</strong>
    </div>
    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #f1f5f9;">
      <span style="font-size: 0.7rem; color: #64748b; display: block; text-transform: uppercase;">Percentage</span>
      <strong style="font-size: 1.1rem; color: #e05e00; display: block; margin-top: 4px;">{{percentage}}</strong>
    </div>
    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #f1f5f9;">
      <span style="font-size: 0.7rem; color: #64748b; display: block; text-transform: uppercase;">Grade</span>
      <strong style="font-size: 1.1rem; color: #10b981; display: block; margin-top: 4px;">{{grade}}</strong>
    </div>
    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #f1f5f9;">
      <span style="font-size: 0.7rem; color: #64748b; display: block; text-transform: uppercase;">Overall Rank</span>
      <strong style="font-size: 1.1rem; color: #f59e0b; display: block; margin-top: 4px;">{{rank}}</strong>
    </div>
  </div>

  <!-- Remarks -->
  <div style="margin-top: 20px; background: rgba(255, 107, 0,0.02); border: 1px dashed rgba(255, 107, 0,0.2); padding: 12px 16px; border-radius: 8px;">
    <strong style="font-size: 0.8rem; color: #e05e00; text-transform: uppercase;">Teacher Remarks</strong>
    <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: #475569; font-style: italic;">"{{remarks}}"</p>
  </div>

  <!-- Signatures -->
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 0.8rem;">
    <div style="text-align: center;">
      <span style="color: #64748b; display: block; margin-bottom: 25px;">Class Teacher</span>
      <strong style="color: #334155; border-top: 1px solid #e2e8f0; padding-top: 4px; display: block; width: 80%; margin: 0 auto;">{{classTeacherName}}</strong>
    </div>
    <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
      {{schoolStamp}}
      <span style="color: #334155; border-top: 1px solid #e2e8f0; padding-top: 4px; display: block; width: 80%; margin-top: 4px;">School Seal</span>
    </div>
    <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
      {{principalSignature}}
      <strong style="color: #334155; border-top: 1px solid #e2e8f0; padding-top: 4px; display: block; width: 80%; margin-top: 4px;">{{principalName}}</strong>
    </div>
  </div>

  <!-- Footer meta -->
  <div style="margin-top: 25px; border-top: 1px dashed #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: #94a3b8;">
    <span>Report Generated: {{generatedDate}}</span>
    {{qrCode}}
  </div>
</div>`
  },
  {
    id: 'compact',
    name: 'Compact Professional',
    html: `<div style="font-family: 'Roboto', system-ui, sans-serif; font-variant-numeric: lining-nums; font-feature-settings: 'lnum'; padding: 25px; background: #ffffff; color: #1e293b; max-width: 800px; margin: 0 auto; box-sizing: border-box; border: 2px solid #475569; border-radius: 8px;">
  <!-- Two Column Layout: Logo and Info -->
  <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #475569; padding-bottom: 12px;">
    <div style="display: flex; gap: 12px; align-items: center;">
      {{schoolLogo}}
      <div>
        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #1e293b; text-transform: uppercase;">{{schoolName}}</h3>
        <span style="font-size: 0.75rem; color: #475569; display: block;">{{schoolAddress}}</span>
      </div>
    </div>
    <div style="text-align: right;">
      <h4 style="margin: 0; font-size: 0.9rem; color: #475569; text-transform: uppercase; font-weight: 700;">Academic Scorecard</h4>
      <span style="font-size: 0.75rem; color: #64748b;">Session: <strong>{{session}}</strong></span>
    </div>
  </div>

  <!-- Student Info Card (Compact) -->
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 15px; background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 0.78rem; border: 1px solid #e2e8f0;">
    <div><strong>Student:</strong> {{studentName}}</div>
    <div><strong>Adm No:</strong> {{admissionNo}}</div>
    <div><strong>Roll No:</strong> {{rollNo}}</div>
    <div><strong>Class/Sec:</strong> {{class}} - {{section}}</div>
    <div><strong>Father:</strong> {{fatherName}}</div>
    <div><strong>Mother:</strong> {{motherName}}</div>
  </div>

  <!-- Marks Section -->
  <div style="margin-top: 15px;">
    <div style="font-weight: 800; font-size: 0.85rem; text-transform: uppercase; color: #475569; margin-bottom: 6px;">
      Exam Results: {{examName}}
    </div>
    {{subjectMarksTable}}
  </div>

  <!-- Overall Scores Footer Bar -->
  <div style="display: flex; justify-content: space-between; align-items: center; background: #334155; color: #ffffff; padding: 10px 18px; border-radius: 6px; margin-top: 15px; font-size: 0.8rem;">
    <div><strong>TOTAL OBTAINED:</strong> {{obtainedMarks}} / {{totalMarks}}</div>
    <div><strong>PERCENTAGE:</strong> {{percentage}}</div>
    <div><strong>GRADE:</strong> {{grade}}</div>
    <div><strong>STATUS:</strong> {{result}}</div>
  </div>

  <!-- Remarks Block -->
  <div style="margin-top: 12px; font-size: 0.75rem; color: #475569;">
    <strong>Teacher's Remarks:</strong> <span style="font-style: italic;">"{{remarks}}"</span>
  </div>

  <!-- Official Signatures -->
  <div style="display: flex; justify-content: space-between; margin-top: 25px; border-top: 1px dashed #cbd5e1; padding-top: 15px; font-size: 0.75rem;">
    <div style="text-align: center; width: 120px;">
      <span style="height: 15px; display: block;"></span>
      <span style="border-top: 1px solid #94a3b8; display: block; padding-top: 2px;">Class Staff</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      {{schoolStamp}}
      {{principalSignature}}
    </div>
    <div style="text-align: center; width: 120px;">
      <span style="height: 15px; display: block;"></span>
      <span style="border-top: 1px solid #94a3b8; display: block; padding-top: 2px;">Principal</span>
    </div>
  </div>
</div>`
  }
];

export const compileTemplate = (html, data) => {
  let compiled = html;

  // Simple values replacements
  const replacements = {
    '{{schoolName}}': data.schoolName,
    '{{schoolAddress}}': data.schoolAddress,
    '{{schoolContact}}': data.schoolContact,
    '{{studentName}}': data.studentName,
    '{{admissionNo}}': data.admissionNo,
    '{{rollNo}}': data.rollNo,
    '{{class}}': data.class,
    '{{section}}': data.section,
    '{{fatherName}}': data.fatherName,
    '{{motherName}}': data.motherName,
    '{{mobile}}': data.mobile,
    '{{dob}}': data.dob,
    '{{gender}}': data.gender,
    '{{examName}}': data.examName,
    '{{session}}': data.session,
    '{{totalMarks}}': data.totalMarks,
    '{{obtainedMarks}}': data.obtainedMarks,
    '{{percentage}}': data.percentage + '%',
    '{{grade}}': data.grade,
    '{{result}}': data.result,
    '{{remarks}}': data.remarks,
    '{{rank}}': data.rank,
    '{{attendance}}': data.attendance,
    '{{classTeacherName}}': data.classTeacherName,
    '{{principalName}}': data.principalName,
    '{{generatedDate}}': data.generatedDate,

    // HTML Component structures
    '{{schoolLogo}}': data.schoolLogoUrl
      ? `<img src="${data.schoolLogoUrl}" alt="School Logo" style="max-height: 50px; object-fit: contain; max-width: 100px;" />`
      : `<div style="width: 50px; height: 50px; border-radius: 8px; background: #e05e00; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 1.25rem;">GV</div>`,

    '{{studentPhoto}}': data.studentPhotoUrl
      ? `<img src="${data.studentPhotoUrl}" alt="Student Photo" style="width: 80px; height: 100px; border-radius: 6px; border: 1px solid #cbd5e1; object-fit: cover;" />`
      : `<div style="width: 80px; height: 100px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.7rem; font-weight: 600;">Photo</div>`,

    '{{principalSignature}}': `<div style="font-family: 'Courier New', Courier, monospace; font-style: italic; color: #1e3a8a; font-size: 1.1rem; font-weight: bold; transform: rotate(-3deg); margin-right: 12px; display: inline-block;">${data.principalName || 'Alex Devlin'}</div>`,

    '{{schoolStamp}}': `<div style="width: 60px; height: 60px; border-radius: 50%; border: 3px double #1e3a8a; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; color: #1e3a8a; font-size: 0.55rem; font-weight: 900; line-height: 1; transform: rotate(10deg); opacity: 0.85; text-transform: uppercase;">
      <span>SEAL</span>
      <span style="font-size: 0.4rem; border-top: 1px solid #1e3a8a; margin-top: 2px; padding-top: 2px;">OFFICIAL</span>
    </div>`,

    '{{qrCode}}': `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; width: fit-content; margin: 0 auto;">
      <div style="display: grid; grid-template-columns: repeat(6, 6px); gap: 2px; width: fit-content;">
        ${Array.from({ length: 36 }).map(() => `<div style="width: 6px; height: 6px; background: ${Math.random() > 0.45 ? '#000' : 'transparent'};"></div>`).join('')}
      </div>
      <span style="font-size: 0.55rem; color: #64748b; font-family: monospace;">VERIFIED</span>
    </div>`,

    '{{subjectMarksTable}}': data.subjectMarksTableHtml,
    '{{subjects_table}}': data.subjectMarksTableHtml,

    // Extra aliases for PDF-generated templates
    '{{schoolPhone}}': data.schoolContact,
    '{{schoolEmail}}': data.schoolEmail || data.schoolContact,
    '{{date}}': data.generatedDate,
    '{{classTeacher}}': data.classTeacherName,
    '{{studentFullName}}': data.studentName,
    '{{studentId}}': data.admissionNo,
    '{{academicYear}}': data.session,
    '{{examTitle}}': data.examName,
    '{{finalGrade}}': data.grade,
    '{{finalResult}}': data.result,
    '{{totalObtained}}': data.obtainedMarks,
    '{{totalMax}}': data.totalMarks,
    '{{pct}}': data.percentage + '%'
  };

  for (const [placeholder, val] of Object.entries(replacements)) {
    compiled = compiled.replaceAll(placeholder, val !== undefined && val !== null ? val : '');
  }

  // Replace any dynamic placeholders (e.g., subject-specific scores)
  for (const [key, val] of Object.entries(data)) {
    if (key.startsWith('{{') && key.endsWith('}}')) {
      compiled = compiled.replaceAll(key, val !== undefined && val !== null ? val : '');
    }
  }

  return compiled;
};
