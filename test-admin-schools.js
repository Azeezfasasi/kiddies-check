/**
 * Test script to verify admin schools sync and debug admin user state
 * Run this in your browser console while logged in to the app
 */

// 1. GET ADMIN USER ID FROM LOCALSTORAGE
const userId = localStorage.getItem('userId');
console.log('📋 Your User ID:', userId);

// 2. CHECK DEBUG INFO
async function checkAdminStatus() {
  try {
    const response = await fetch(`/api/debug/admin-schools?userId=${userId}`);
    const data = await response.json();
    console.log('📊 Admin Status:', data);
    return data;
  } catch (error) {
    console.error('❌ Error checking status:', error);
  }
}

// 3. SYNC ALL SCHOOLS
async function syncAdminSchools() {
  try {
    // First get the admin email
    const adminEmail = prompt('Enter your admin email:');
    if (!adminEmail) return;

    const response = await fetch(`/api/admin/sync-admin-schools?adminEmail=${adminEmail}`, {
      method: 'POST'
    });
    const data = await response.json();
    console.log('🔄 Sync Result:', data);
    
    if (data.success) {
      console.log(`✅ Successfully synced ${data.data.schoolsSynced} school(s)!`);
    }
    return data;
  } catch (error) {
    console.error('❌ Error syncing:', error);
  }
}

// 4. CHECK SYNC STATUS
async function checkSyncStatus() {
  try {
    const adminEmail = prompt('Enter your admin email:');
    if (!adminEmail) return;

    const response = await fetch(`/api/admin/sync-admin-schools?adminEmail=${adminEmail}`);
    const data = await response.json();
    console.log('📈 Sync Status:', data);
    return data;
  } catch (error) {
    console.error('❌ Error checking sync:', error);
  }
}

// QUICK TEST COMMANDS
console.log(`
🚀 QUICK TEST COMMANDS:
========================

1️⃣ Check your admin status:
   checkAdminStatus()

2️⃣ Sync all schools to your account:
   syncAdminSchools()

3️⃣ Check current sync status:
   checkSyncStatus()

4️⃣ After syncing, refresh the page and check SchoolSwitcher dropdown

Your User ID is: ${userId}
`);
