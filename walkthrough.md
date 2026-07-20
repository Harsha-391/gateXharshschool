# Walkthrough - Parent Portal Implementation

We have successfully implemented the **Parent Portal** in the School Management System (SMS). The implementation is fully backward-compatible, secure, and utilizes the existing database structures and authentication workflows without modifying the database schema.

---

## 1. Feature Additions & Enhancements

### A. Extended Student Registration Flow
* **Extended Step 3 Form**: Added a **"Create Parent Login?"** toggle checkbox in the Parent details section in [RegisterStudent.jsx](file:///c:/Users/uttam%20rajpurrohit/OneDrive/Desktop/SMS/frontend/src/pages/RegisterStudent.jsx#L1504-L1570).
* **Optional Credentials Configuration**: If toggled `Yes`, admins can specify:
  * **Parent Username**: Custom username (automatically defaults to parent's email or `parent_[admissionNumber]`).
  * **Parent Email**: Custom email address (automatically defaults to Father/Mother Email).
  * **Parent Password**: Password for parent portal (defaults to `parent123`).

### B. Dual Login Credentials Support (Username & Email)
* **Unified Login Options**: Parents can log in using either their **Parent Username** or **Parent Email** on the standard unified login page.
* **Authentication Security**: The login endpoint in [server.js](file:///c:/Users/uttam%20rajpurrohit/OneDrive/Desktop/SMS/backend/server.js#L679-L695) checks both the Parent Username and decrypted Parent Email values when verifying credentials.

### C. Parent Duplication Prevention (Backend Matching)
* **Parent Matching Logic**: In [studentController.js](file:///c:/Users/uttam%20rajpurrohit/OneDrive/Desktop/SMS/backend/controllers/studentController.js#L130-L175), when a new student is registered with parent login enabled:
  1. The server decrypts and searches the existing students list for a parent with matching `fatherMobile`, `fatherEmail`, `motherMobile`, or `motherEmail`.
  2. If a match is found, the student is linked to the **same parent account** (reusing their existing parent login username and hashed password), preventing duplicate parent accounts for siblings.
  3. If no match is found, a new parent account is provisioned using the provided credentials.

### D. Secure Read-Only Access
* **Read-Only Bypass**: Automatically grants read-only access (`action === 'view'`) for any module if the user's role is `Parent` in [permissionMiddleware.js](file:///c:/Users/uttam%20rajpurrohit/OneDrive/Desktop/SMS/backend/middleware/permissionMiddleware.js#L89-L95).
* **Access Filtering**: Restricts GET students queries to only return the parent's linked child(ren) inside `getStudents` in [studentController.js](file:///c:/Users/uttam%20rajpurrohit/OneDrive/Desktop/SMS/backend/controllers/studentController.js#L301-L329).

### E. Dedicated Parent Portal Dashboard
* **Dynamic Sidebar & Layout**: Created a custom Parent Portal Dashboard component [ParentDashboard.jsx](file:///c:/Users/uttam%20rajpurrohit/OneDrive/Desktop/SMS/frontend/src/pages/ParentDashboard.jsx) and styled it in [ParentDashboard.css](file:///c:/Users/uttam%20rajpurrohit/OneDrive/Desktop/SMS/frontend/src/pages/ParentDashboard.css).
* **Dynamic Theme Variable Binding**: Bound the Parent Dashboard container, sidebar, child cards, and dashboard widgets to the standard theme-agnostic variables (`var(--bg-app)`, `var(--bg-sidebar)`, `var(--bg-card)`, and `var(--text-main)`). When switching color schemes, the portal updates instantly between high-contrast SaaS white (light theme) and cyberspace radial-gradients (dark theme).
* **Gillian Bartlett Profile Card Replica Popover**: Clicking the bottom profile trigger displays a popover styled exactly like the admin panel's profile card, featuring:
  * Circular avatar with orange border initials/photo.
  * Parent full name & teal role badge.
  * Account Role Matrix section with Shield indicator.
  * Grid mapping for Login Username, Email Address, Phone Number, and Active status.
  * Unified centered Sign Out button.
* **Defensive Mapping Guard (API Payload Wrap)**: Handled paginated wrappers in `/api/students` where it returns `{ totalCount, students: [...] }` instead of a plain array. Extracted `students` array fallback to solve `children.map is not a function` error.
* **Premium Header Extras**:
  * **Theme Toggle Button**: Synchronized with light/dark stylesheet rules in `App.jsx` to dynamically switch schemes.
  * **Notifications Popover**: Renders a dropdown listing latest academic announcements and administrative circulars.
* **Multi-Child Sibling Selector**: Dynamic selector in the top navbar allows parents with multiple children in the school to switch active views to see details for any of their children.
* **Portal Views Included**:
  1. **Dashboard**: Performance snapshots, quick statistics, and announcements.
  2. **My Children**: Profile card summaries of all linked children.
  3. **Attendance**: Month/Year selector with dynamic color-coded calendar grid showing Present/Absent/Late records.
  4. **Results**: Subject grades, GPAs, percentages, and exam term transcripts.
  5. **Homework**: Simulated clean due task lists showing pending vs completed items.
  6. **Timetable**: Period lists and teachers matching the child's grade/section cohort.
  7. **Fees & Receipts**: Paid fee status summaries with printable PDF receipts.
  8. **Notices**: School-wide broadcasts list.
  9. **Leave Requests**: Applied leave requests list and leave application forms.
  10. **Messages**: Chat messaging interface with teachers.
  11. **Profile & Settings**: Security panel to update credentials.

---

## 2. Verification Plan

### Manual Verification Flow
1. **School Admin Login**: Log in as a School Admin and navigate to **Registry Admissions -> Register Student**.
2. **Onboard Siblings**:
   * Add **Student A** -> Go to step 3 -> Tick **Create Parent Login** -> Enter `parent_smith` (username), `smith@example.com` (email), and `password123` (password) -> Submit.
   * Add **Student B** -> Go to step 3 -> Enter same father email/mobile -> Tick **Create Parent Login** -> Submit.
3. **Login as Parent**:
   * Log in using `parent_smith` / `password123` or `smith@example.com` / `password123` on the standard login screen.
   * Verify the parent is successfully logged in and directed straight to the custom **Parent Dashboard**.
   * Use the header dropdown to toggle between Student A and Student B, verifying data switches dynamically.
