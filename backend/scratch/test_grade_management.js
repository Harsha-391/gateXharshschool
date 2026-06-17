import { generateToken } from '../middleware/auth.js';

const PORT = 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const token = generateToken({ username: 'admin', role: 'Admin', id: 'admin-test' });

async function runTests() {
  console.log('--- STARTING GRADE MANAGEMENT API INTEGRATION TESTS ---');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': 'greenvalley'
  };

  try {
    // Test 1: Fetch initial grades list (seeding should have occurred)
    console.log('\nTest 1: Fetching seeded grades...');
    const getGradesRes = await fetch(`${BASE_URL}/api/grades`, { headers });
    if (!getGradesRes.ok) throw new Error(`Fetch grades failed: ${getGradesRes.statusText}`);
    const grades = await getGradesRes.json();
    console.log(`Success! Found ${grades.length} seeded grades (Expected >= 14 standard grades: LKG-XII).`);
    
    // Check if LKG, UKG, I-XII exist
    const names = grades.map(g => g.name);
    console.log('Seeded grade names:', names.join(', '));
    if (!names.includes('LKG') || !names.includes('XI') || !names.includes('XII')) {
      throw new Error('Missing standard seeded grades in database!');
    }

    // Test 2: Fetch active options
    console.log('\nTest 2: Fetching active options...');
    const getOptionsRes = await fetch(`${BASE_URL}/api/grades/active-options`, { headers });
    if (!getOptionsRes.ok) throw new Error(`Fetch active options failed: ${getOptionsRes.statusText}`);
    const options = await getOptionsRes.json();
    console.log(`Success! Found ${options.length} options (e.g. "XI (Arts)", "LKG").`);
    const optionNames = options.map(o => o.name);
    console.log('Active options:', optionNames.slice(0, 10).join(', ') + '...');
    
    // Check if department-mapped options exist
    if (!optionNames.includes('XI (Arts)') || !optionNames.includes('XII (Commerce)')) {
      throw new Error('Missing expected department mappings for Grade 11 & 12!');
    }

    // Test 3: Try to create a duplicate grade name
    console.log('\nTest 3: Attempting to create duplicate grade "LKG"...');
    const dupRes = await fetch(`${BASE_URL}/api/grades`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'LKG', status: 'Active' })
    });
    console.log(`Response status: ${dupRes.status} (Expected: 400)`);
    const dupData = await dupRes.json();
    console.log('Response body error:', dupData.error);
    if (dupRes.status !== 400) {
      throw new Error('Duplicate grade name creation was not blocked!');
    }

    // Pre-cleanup: Try to delete Pre-K and Pre-K-Test in case they exist from previous aborted runs
    await fetch(`${BASE_URL}/api/grades/grade-pre-k`, { method: 'DELETE', headers }).catch(() => {});
    await fetch(`${BASE_URL}/api/grades/grade-pre-k-test`, { method: 'DELETE', headers }).catch(() => {});

    // Test 4: Create a custom grade "Pre-K-Test" and mapping it to departments...
    console.log('\nTest 4: Creating a custom grade "Pre-K-Test" and mapping it to departments...');
    const createGradeRes = await fetch(`${BASE_URL}/api/grades`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Pre-K-Test', status: 'Active' })
    });
    if (!createGradeRes.ok) throw new Error(`Create Pre-K-Test grade failed: ${createGradeRes.statusText}`);
    const newGrade = await createGradeRes.json();
    console.log(`Success! Created custom grade: ${newGrade.name} with ID: ${newGrade.id}`);

    // Fetch active options again to verify Pre-K-Test is listed
    const getOptionsRes2 = await fetch(`${BASE_URL}/api/grades/active-options`, { headers });
    const options2 = await getOptionsRes2.json();
    const optionNames2 = options2.map(o => o.name);
    if (!optionNames2.includes('Pre-K-Test')) {
      throw new Error('Custom grade Pre-K-Test was not found in active-options!');
    }
    console.log('Pre-K-Test verified in active options.');

    // Test 5: Verify cascading deletion blocks
    console.log('\nTest 5: Verifying deletion cascades are blocked when referenced (Cascade Deletion Checks)...');
    // First: Fetch a grade that is assigned to student records. Grade I is assigned.
    // Let's check if Grade I is used by students in db.
    // Try to delete grade I
    const deleteGradeRes = await fetch(`${BASE_URL}/api/grades/grade-i`, {
      method: 'DELETE',
      headers
    });
    console.log(`Response status for deleting active grade "I": ${deleteGradeRes.status} (Expected: 400)`);
    const deleteData = await deleteGradeRes.json();
    console.log('Reason blocked:', deleteData.error);
    if (deleteGradeRes.status !== 400 || !deleteData.error) {
      throw new Error('Deleting grade I was not blocked despite active dependencies!');
    }
    console.log('Cascade deletion block successfully validated.');

    // Cleanup: Delete the newly created Pre-K-Test grade
    console.log('\nCleaning up: Deleting Pre-K-Test...');
    const cleanupRes = await fetch(`${BASE_URL}/api/grades/${newGrade.id}`, {
      method: 'DELETE',
      headers
    });
    if (!cleanupRes.ok) throw new Error(`Cleanup of Pre-K-Test grade failed: ${cleanupRes.statusText}`);
    console.log('Pre-K-Test deleted successfully.');

    console.log('\n--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  }
}

runTests();
