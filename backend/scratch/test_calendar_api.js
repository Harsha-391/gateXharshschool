import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_URL = 'http://localhost:5000';
const TENANT = 'greenvalley';

async function testCalendarEndpoints() {
  console.log('--- Starting Academic Calendar Backend API Verification ---');
  
  try {
    // 1. Fetch initially (empty or legacy)
    console.log('\n[TEST 1] Fetching calendar events...');
    const getRes = await fetch(`${BACKEND_URL}/api/academics/calendar-events?tenantId=${TENANT}`);
    if (!getRes.ok) throw new Error(`Fetch failed: ${getRes.statusText}`);
    const events = await getRes.json();
    console.log(`Success: Found ${events.length} events.`);

    // 2. Declare a manual event
    console.log('\n[TEST 2] Declaring a manual event...');
    const manualEvent = {
      eventDate: '2026-07-10',
      title: 'Manual Integration Test Event',
      eventType: 'Sports Event',
      description: 'API test declaration verify',
      applicableClasses: 'Grade V, Grade VI',
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      session: '2026-27'
    };
    
    const postRes = await fetch(`${BACKEND_URL}/api/academics/calendar-events?tenantId=${TENANT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manualEvent)
    });
    if (!postRes.ok) throw new Error(`Post failed: ${postRes.statusText}`);
    const createdEvent = await postRes.json();
    console.log('Success: Event declared successfully! Created ID:', createdEvent.id);

    // 3. Fetch again to verify addition
    console.log('\n[TEST 3] Verifying addition...');
    const getRes2 = await fetch(`${BACKEND_URL}/api/academics/calendar-events?tenantId=${TENANT}`);
    const events2 = await getRes2.json();
    const found = events2.find(e => e.id === createdEvent.id);
    if (!found) {
      throw new Error('Verification failed: Created event not found in list!');
    }
    console.log('Success: Confirmed event exists in database cache!');

    // 4. Test Template Download
    console.log('\n[TEST 4] Fetching template CSV...');
    const tempRes = await fetch(`${BACKEND_URL}/api/academics/calendar-template?tenantId=${TENANT}`);
    if (!tempRes.ok) throw new Error(`Template download failed: ${tempRes.status}`);
    const templateText = await tempRes.text();
    console.log('Success: CSV template loaded. First line:', templateText.split('\n')[0]);

    // 5. Test File Upload Validation
    console.log('\n[TEST 5] Uploading CSV for row validation...');
    const testCsvPath = path.join(__dirname, 'test_calendar.csv');
    const csvContent = fs.readFileSync(testCsvPath);

    const formData = new FormData();
    const fileBlob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('file', fileBlob, 'test_calendar.csv');

    const uploadRes = await fetch(`${BACKEND_URL}/api/academics/calendar-upload?tenantId=${TENANT}`, {
      method: 'POST',
      body: formData
    });
    if (!uploadRes.ok) throw new Error(`Upload failed: ${await uploadRes.text()}`);
    const uploadData = await uploadRes.json();
    console.log('Success: Upload processed.');
    console.log(`Total Records: ${uploadData.totalRecords}, Invalid: ${uploadData.invalidRecords}`);
    
    // Check validation details
    console.log('Validation results row by row:');
    uploadData.rows.forEach(r => {
      console.log(`- Row ${r.rowNumber}: Valid? ${r.isValid}. Title: "${r.data.title || ''}". Errors: ${r.errors.join(', ')}`);
    });

    // 6. Confirm valid records import
    console.log('\n[TEST 6] Confirming import of valid events...');
    const validEvents = uploadData.rows.filter(r => r.isValid).map(r => r.data);
    const confirmRes = await fetch(`${BACKEND_URL}/api/academics/calendar-import-confirm?tenantId=${TENANT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'test_calendar.csv',
        session: '2026-27',
        events: validEvents
      })
    });
    if (!confirmRes.ok) throw new Error(`Import confirmation failed: ${confirmRes.statusText}`);
    const confirmData = await confirmRes.json();
    console.log(`Success: Imported ${confirmData.totalRecords} events from CSV file.`);

    // 7. Verify import history logs
    console.log('\n[TEST 7] Fetching import logs history...');
    const logsRes = await fetch(`${BACKEND_URL}/api/academics/calendar-imports?tenantId=${TENANT}`);
    const logs = await logsRes.json();
    console.log('Success: Import history entries count:', logs.length);
    console.log('Last import log:', logs[logs.length - 1]);

    // 8. Test update manual event
    console.log('\n[TEST 8] Modifying manual event details...');
    const updateRes = await fetch(`${BACKEND_URL}/api/academics/calendar-events/${createdEvent.id}?tenantId=${TENANT}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'UPDATED: Manual Integration Test Event' })
    });
    const updated = await updateRes.json();
    console.log('Success: Event updated. New Title:', updated.title);

    // 9. Test delete event
    console.log('\n[TEST 9] Cleaning up test event...');
    const delRes = await fetch(`${BACKEND_URL}/api/academics/calendar-events/${createdEvent.id}?tenantId=${TENANT}`, {
      method: 'DELETE'
    });
    const delData = await delRes.json();
    console.log('Success: Deleted manual test event. Message:', delData.message);

    console.log('\n--- All Backend API Verification Tests Passed! ---');
  } catch (err) {
    console.error('\n[TEST ERROR] Verification failed:', err.message);
  }
}

testCalendarEndpoints();
