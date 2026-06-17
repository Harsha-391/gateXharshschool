// Test Grade Management CRUD via HTTP using localhost with tenant header
const BASE = 'http://127.0.0.1:5000/api/grades';
const headers = { 'Content-Type': 'application/json', 'x-tenant-id': 'greenvalley' };

async function test() {
  // 1. Create a grade
  console.log('\n=== CREATE GRADE ===');
  let res = await fetch(BASE, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Test Grade', status: 'Active' })
  });
  let data = await res.json();
  console.log(`Status: ${res.status}`, JSON.stringify(data));
  const gradeId = data.id;

  // 2. List grades
  console.log('\n=== LIST GRADES ===');
  res = await fetch(BASE, { headers });
  data = await res.json();
  console.log(`Status: ${res.status}, Count: ${data.length}`, JSON.stringify(data));

  // 3. Edit grade
  console.log('\n=== EDIT GRADE ===');
  res = await fetch(`${BASE}/${gradeId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name: 'Edited Grade', status: 'Inactive' })
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, JSON.stringify(data));

  // 4. Toggle status back
  console.log('\n=== TOGGLE STATUS ===');
  res = await fetch(`${BASE}/${gradeId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'Active' })
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, JSON.stringify(data));

  // 5. Delete grade
  console.log('\n=== DELETE GRADE ===');
  res = await fetch(`${BASE}/${gradeId}`, { method: 'DELETE', headers });
  data = await res.json();
  console.log(`Status: ${res.status}`, JSON.stringify(data));

  // 6. Create department
  console.log('\n=== CREATE DEPARTMENT ===');
  res = await fetch(`${BASE}/departments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Test Dept', status: 'Active' })
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, JSON.stringify(data));
  const deptId = data.id;

  // 7. Edit department
  console.log('\n=== EDIT DEPARTMENT ===');
  res = await fetch(`${BASE}/departments/${deptId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name: 'Edited Dept' })
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, JSON.stringify(data));

  // 8. Delete department
  console.log('\n=== DELETE DEPARTMENT ===');
  res = await fetch(`${BASE}/departments/${deptId}`, { method: 'DELETE', headers });
  data = await res.json();
  console.log(`Status: ${res.status}`, JSON.stringify(data));

  // 9. Final check
  console.log('\n=== FINAL STATE ===');
  res = await fetch(BASE, { headers });
  data = await res.json();
  console.log(`Grades remaining: ${data.length}`);
  res = await fetch(`${BASE}/departments`, { headers });
  data = await res.json();
  console.log(`Departments remaining: ${data.length}`);
}

test().catch(console.error);
