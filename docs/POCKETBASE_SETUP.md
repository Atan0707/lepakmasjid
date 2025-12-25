# PocketBase Setup Guide

This guide will help you set up and verify your PocketBase instance at `pb.muazhazali.me` to work with LepakMasjid.

## Prerequisites

- PocketBase instance running at `pb.muazhazali.me`
- Access to PocketBase Admin Panel (`https://pb.muazhazali.me/_/`)
- Node.js installed for running test scripts

## Step 1: Test Connection

First, verify that your application can connect to PocketBase:

```bash
npm run test:connection
```

This script will:
- ✅ Test the health endpoint
- ✅ List all collections
- ✅ Verify required collections exist
- ✅ Test authentication endpoints

**Expected Output:**
```
🔍 Testing PocketBase Connection...
📍 URL: https://pb.muazhazali.me

1️⃣ Testing health endpoint...
   ✅ Health check passed: { code: 200, message: "ok" }

2️⃣ Fetching collections...
   ✅ Found 6 collections:
      - mosques (base)
      - amenities (base)
      - mosque_amenities (base)
      - activities (base)
      - submissions (base)
      - audit_logs (base)

3️⃣ Verifying required collections...
   ✅ All required collections exist!

4️⃣ Testing authentication endpoint...
   ✅ Auth methods available: [ 'username', 'email', 'oauth2' ]
```

## Step 2: Verify Schema

Verify that your PocketBase collections match the PRD schema:

```bash
npm run test:schema
```

This script will:
- ✅ Check each collection exists
- ✅ Verify required fields are present
- ✅ Check field types match expected types
- ✅ Report any missing or mismatched fields

**If collections are missing or fields don't match**, you can create them automatically using the setup script.

## Step 3: Create Collections (if needed)

### Option A: Automated Setup (Recommended)

Create all collections programmatically using the setup script:

```bash
npm run setup:collections
```

This script will:
- ✅ Prompt for your PocketBase admin credentials
- ✅ Create all required collections automatically
- ✅ Set up fields, indexes, and rules
- ✅ Handle collection dependencies

**Using Environment Variables (Optional):**

You can set admin credentials in `.env.local` to avoid prompts:

```env
POCKETBASE_ADMIN_EMAIL=your-admin@email.com
POCKETBASE_ADMIN_PASSWORD=your-admin-password
```

### Option B: Manual Setup

If you prefer to create collections manually, use the PocketBase Admin Panel:

### Collection: `mosques`

**Fields:**
- `name` (Text, required)
- `name_bm` (Text, optional)
- `address` (Text, required)
- `state` (Text, required)
- `lat` (Number, required)
- `lng` (Number, required)
- `description` (Text, optional)
- `description_bm` (Text, optional)
- `status` (Select: pending, approved, rejected, default: pending)
- `created_by` (Relation: users, required)

**Settings:**
- Enable file uploads if needed for images
- Set list/search rules as needed

### Collection: `amenities`

**Fields:**
- `key` (Text, required, unique)
- `label_bm` (Text, required)
- `label_en` (Text, required)
- `icon` (Text, optional)
- `order` (Number, default: 0)

**Settings:**
- Make this collection viewable by all users

### Collection: `mosque_amenities`

**Fields:**
- `mosque_id` (Relation: mosques, required)
- `amenity_id` (Relation: amenities, optional - null for custom)
- `details` (JSON, default: {})
- `verified` (Boolean, default: false)

**Settings:**
- Add index on `mosque_id` for performance

### Collection: `activities`

**Fields:**
- `mosque_id` (Relation: mosques, required)
- `title` (Text, required)
- `title_bm` (Text, optional)
- `description` (Text, optional)
- `description_bm` (Text, optional)
- `type` (Select: one_off, recurring, fixed, required)
- `schedule_json` (JSON, required)
- `start_date` (Date, optional)
- `end_date` (Date, optional)
- `status` (Select: active, cancelled, default: active)
- `created_by` (Relation: users, required)

### Collection: `submissions`

**Fields:**
- `type` (Select: new_mosque, edit_mosque, required)
- `mosque_id` (Relation: mosques, optional - null for new_mosque)
- `data` (JSON, required) - Full mosque data
- `status` (Select: pending, approved, rejected, default: pending)
- `submitted_by` (Relation: users, required)
- `submitted_at` (Date, required)
- `reviewed_by` (Relation: users, optional)
- `reviewed_at` (Date, optional)
- `rejection_reason` (Text, optional)

### Collection: `audit_logs`

**Fields:**
- `actor_id` (Relation: users, required)
- `action` (Text, required) - e.g., "create", "update", "delete"
- `entity_type` (Text, required) - e.g., "mosque", "submission"
- `entity_id` (Text, required)
- `before` (JSON, optional) - Snapshot before change
- `after` (JSON, optional) - Snapshot after change
- `timestamp` (Date, required)
- `ip_address` (Text, optional)
- `user_agent` (Text, optional)

**Settings:**
- This collection should be write-only for regular users
- Only admins can read audit logs

## Step 4: Configure Permissions

Set up collection permissions in PocketBase Admin Panel:

### `mosques`
- **List/Search**: Anyone can view approved mosques
- **View**: Anyone can view approved mosques
- **Create**: Authenticated users (for submissions)
- **Update**: Admin only
- **Delete**: Admin only

### `submissions`
- **List/Search**: Admin only
- **View**: Owner or Admin
- **Create**: Authenticated users
- **Update**: Admin only (for approval/rejection)
- **Delete**: Admin only

### `audit_logs`
- **List/Search**: Admin only
- **View**: Admin only
- **Create**: System (via hooks)
- **Update**: No one
- **Delete**: Admin only

## Step 5: Set Up Google OAuth

Follow the guide in [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) to configure Google OAuth authentication.

## Step 6: Test Submission Workflow

Test the end-to-end submission workflow:

```bash
npm run test:submission
```

This interactive script will:
1. Authenticate as a regular user
2. Create a test submission
3. Verify the submission was created
4. Optionally test admin approval
5. Clean up test data

## Step 7: Seed Sample Data

### Automated Seeding (Recommended)

Seed the database with sample mosque data using the seed script:

```bash
npm run seed:data
```

This script will:
- ✅ Create amenities if they don't exist
- ✅ Create 10 sample mosques from different Malaysian states
- ✅ Link amenities to mosques
- ✅ Set all mosques to "approved" status
- ✅ Skip mosques that already exist (idempotent)

**Using Environment Variables (Optional):**

You can set admin credentials in `.env.local` to avoid prompts:

```env
POCKETBASE_ADMIN_EMAIL=your-admin@email.com
POCKETBASE_ADMIN_PASSWORD=your-admin-password
```

**Sample Mosques Included:**
- Masjid Negara (Kuala Lumpur)
- Masjid Sultan Salahuddin Abdul Aziz Shah (Selangor)
- Masjid Jamek Sultan Abdul Samad (Kuala Lumpur)
- Masjid Putra (Putrajaya)
- Masjid Wilayah Persekutuan (Kuala Lumpur)
- Masjid Kapitan Keling (Penang)
- Masjid Sultan Abu Bakar (Johor)
- Masjid Ubudiah (Perak)
- Masjid Zahir (Kedah)
- Masjid Kristal (Terengganu)

### Manual Seeding

If you prefer to create amenities manually, here are example amenities:

```javascript
// Example amenities to create
[
  { key: 'parking', label_en: 'Parking', label_bm: 'Tempat Letak Kereta', icon: 'car', order: 1 },
  { key: 'wudhu', label_en: 'Wudhu Area', label_bm: 'Tempat Wuduk', icon: 'droplet', order: 2 },
  { key: 'library', label_en: 'Library', label_bm: 'Perpustakaan', icon: 'book', order: 3 },
  { key: 'cafe', label_en: 'Café/Canteen', label_bm: 'Kafe/Kantin', icon: 'utensils', order: 4 },
  { key: 'wifi', label_en: 'Free WiFi', label_bm: 'WiFi Percuma', icon: 'wifi', order: 5 },
  // Add more as needed
]
```

## Troubleshooting

### Connection Issues

**Error: "Failed to fetch"**
- Check that PocketBase is running
- Verify the URL is correct
- Check Cloudflare tunnel is active
- Verify firewall rules allow connections

**Error: "CORS policy"**
- Configure CORS in PocketBase settings
- Add your frontend URL to allowed origins

### Schema Issues

**Missing Collections**
- Create collections manually in Admin Panel
- Or use PocketBase CLI to import schema

**Field Type Mismatches**
- Update field types in Admin Panel
- Be careful: changing types may require data migration

### Authentication Issues

**OAuth not working**
- Verify redirect URIs match exactly
- Check Google OAuth credentials
- Ensure PocketBase OAuth provider is enabled

## Next Steps

Once setup is complete:
1. ✅ Test connection: `npm run test:connection`
2. ✅ Create collections: `npm run setup:collections` (if not done yet)
3. ✅ Verify schema: `npm run test:schema`
4. ✅ Configure Google OAuth
5. ✅ Test submission workflow: `npm run test:submission`
6. ✅ Seed sample data: `npm run seed:data`
7. ✅ Start development: `npm run dev`

## Additional Resources

- [Connecting to Remote PocketBase](./CONNECT_REMOTE_POCKETBASE.md) - Detailed guide on connecting your local app to a remote PocketBase instance
- [PocketBase Documentation](https://pocketbase.io/docs/)
- [PocketBase Admin Panel](https://pb.muazhazali.me/_/)
- [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md)

