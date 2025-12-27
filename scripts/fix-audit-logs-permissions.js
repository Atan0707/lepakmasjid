#!/usr/bin/env node

/**
 * Fix audit_logs collection permissions
 * 
 * Updates the createRule to allow authenticated users to create audit logs.
 * This is necessary because audit logs need to be created by regular users
 * when they perform actions, not just superusers.
 */

import PocketBase from 'pocketbase';
import readline from 'readline';

const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL;

if (!POCKETBASE_URL) {
  console.error('❌ Error: VITE_POCKETBASE_URL or POCKETBASE_URL environment variable is required');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function authenticate(pb) {
  // Try environment variables first
  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
  const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    try {
      await pb.admins.authWithPassword(adminEmail, adminPassword);
      console.log('✅ Authenticated using environment variables');
      return true;
    } catch (err) {
      console.warn('⚠️  Failed to authenticate with environment variables, will prompt for credentials');
    }
  }

  // Prompt for credentials
  console.log('\n🔐 Please enter your PocketBase admin credentials:');
  const email = await question('Email: ');
  const password = await question('Password: ');
  rl.close();

  try {
    await pb.admins.authWithPassword(email, password);
    console.log('✅ Authenticated successfully');
    return true;
  } catch (err) {
    console.error('❌ Authentication failed:', err.message);
    return false;
  }
}

async function fixAuditLogsPermissions(pb) {
  try {
    console.log('\n📋 Fixing audit_logs collection permissions...\n');
    
    // Get the collection
    const collection = await pb.collections.getOne('audit_logs');
    
    console.log('Current permissions:');
    console.log(`  List rule: ${collection.listRule || '(none)'}`);
    console.log(`  View rule: ${collection.viewRule || '(none)'}`);
    console.log(`  Create rule: ${collection.createRule || '(none) - This is the problem!'}`);
    console.log(`  Update rule: ${collection.updateRule || '(none)'}`);
    console.log(`  Delete rule: ${collection.deleteRule || '(none)'}`);
    
    // Update the create rule to allow authenticated users
    await pb.collections.update(collection.id, {
      createRule: '@request.auth.id != ""', // Allow any authenticated user to create
    });
    
    console.log('\n✅ Updated permissions successfully!');
    console.log('New permissions:');
    console.log(`  List rule: ${collection.listRule || '(none)'}`);
    console.log(`  View rule: ${collection.viewRule || '(none)'}`);
    console.log(`  Create rule: @request.auth.id != "" (Any authenticated user can create)`);
    console.log(`  Update rule: ${collection.updateRule || '(none)'}`);
    console.log(`  Delete rule: ${collection.deleteRule || '(none)'}`);
    
    return { success: true };
  } catch (err) {
    console.error('❌ Failed to update permissions:', err.message);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('🔧 Fixing audit_logs Collection Permissions\n');
  console.log(`📍 PocketBase URL: ${POCKETBASE_URL}\n`);

  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);

  // Authenticate
  const authSuccess = await authenticate(pb);
  if (!authSuccess) {
    console.error('\n❌ Authentication failed. Cannot proceed.');
    process.exit(1);
  }

  // Fix permissions
  const result = await fixAuditLogsPermissions(pb);

  if (result.success) {
    console.log('\n✅ All done! Audit logs should now work correctly.');
    console.log('\n💡 Note: Regular authenticated users can now create audit logs.');
    console.log('   Only admins can view/list/delete audit logs (as intended).');
  } else {
    console.error('\n❌ Failed to fix permissions:', result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});

