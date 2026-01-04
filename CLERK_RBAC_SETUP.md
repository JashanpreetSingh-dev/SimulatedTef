# Clerk RBAC Setup Guide

## Overview

This guide explains how to set up and manage organizations, roles, and superusers in Clerk for the RBAC system.

## Organization Flow

### Multiple Organizations Per User

**Clerk allows users to be in multiple organizations.** However, for this application:

- **Active Organization**: The session token includes the "active" organization's ID and role
- **Assignment Scoping**: Assignments are scoped to the active organization when created
- **Data Access**: Users see data from their active organization context

**Recommendation**: 
- For most use cases, users should be in **one primary organization**
- If a user needs access to multiple orgs, they can switch organizations in Clerk (which changes the active org in the session)

### Organization Creation

1. **Via Clerk Dashboard** (Recommended):
   - Go to **Organizations** → **Create Organization**
   - Manually create organizations as needed
   - Assign users to organizations with roles

2. **Via API** (Optional):
   - Organizations can be created programmatically via Clerk API
   - Users can be invited/assigned via API

## Role Setup

### Step 1: Create Organization Roles

In Clerk Dashboard → **Organizations** → **Roles**, create these roles:

1. **`org:admin`** (optional - for org-scoped admins)
   - Description: Organization administrator
   - Can manage assignments within their organization

2. **`org:professor`** (required)
   - Description: Professor/Teacher role
   - Can create and manage assignments in their organization

3. **`org:student`** (required)
   - Description: Student role
   - Can view and complete assignments but cannot create them

### Step 2: Assign Users to Organizations

For each user:

1. Go to **Users** → Select user → **Organizations** tab
2. Click **Add organization**
3. Select or create an organization
4. Assign role: `org:professor` or `org:student`
5. Save

**Note**: Users can be in multiple organizations, but the "active" org determines their current context.

## Superuser Management

### Problem

Superusers need **cross-organization access**, but using `org:admin` role only gives access within that specific organization. We need a way to grant system-wide access.

### Solution: User Metadata

Superusers are identified via **Clerk user metadata**, not organization roles.

### Step 1: Mark User as Superuser

1. Go to **Users** → Select the superuser
2. Go to **Metadata** tab
3. Under **Public metadata**, add:
   ```json
   {
     "isSuperUser": true
   }
   ```
4. Save

### Step 2: Verify Superuser Status

- Superusers have access to **all organizations** regardless of membership
- Superusers can create assignments in any org (or without org)
- Superusers bypass all organization checks

### Alternative: Environment Variable (Fallback)

For backward compatibility, you can also set:
```
SUPER_USER_ID=user_xxxxxxxxxxxxx
```

This is deprecated but still works as a fallback.

## Complete Setup Checklist

### Initial Setup

- [ ] Enable Organizations in Clerk Dashboard
- [ ] Create organization roles: `org:professor`, `org:student` (and optionally `org:admin`)
- [ ] Create at least one organization
- [ ] Mark superuser(s) via user metadata: `publicMetadata.isSuperUser = true`

### For Each Organization

- [ ] Create organization in Clerk
- [ ] Assign professors to organization with `org:professor` role
- [ ] Assign students to organization with `org:student` role
- [ ] (Optional) Assign org admins with `org:admin` role

### For Superusers

- [ ] Set `publicMetadata.isSuperUser = true` in user metadata
- [ ] (Optional) Add superuser to organizations if they need org context
- [ ] Verify superuser can access all orgs

## Role Hierarchy

```
Superuser (metadata)
  └─ Full access across ALL organizations
  └─ Can create assignments in any org
  └─ Bypasses all org checks

org:admin (role in org)
  └─ Full access within their organization
  └─ Can manage all assignments in their org

org:professor (role in org)
  └─ Can create/manage assignments in their org
  └─ Can see all assignments in their org

org:student (role in org)
  └─ Can view/complete assignments in their org
  └─ Cannot create assignments
```

## Common Scenarios

### Scenario 1: Single Organization Setup

**Setup**:
- Create one organization (e.g., "University A")
- Assign all users to this organization
- Assign roles: professors get `org:professor`, students get `org:student`
- Mark system admins as superusers via metadata

**Result**: Simple, single-org setup with clear role separation.

### Scenario 2: Multiple Organizations

**Setup**:
- Create multiple organizations (e.g., "University A", "University B")
- Assign users to their respective organizations
- Each org has its own professors and students
- Mark system admins as superusers for cross-org access

**Result**: Isolated organizations with shared superuser access.

### Scenario 3: User in Multiple Organizations

**Setup**:
- User is member of both "University A" and "University B"
- Has `org:professor` role in Org A, `org:student` role in Org B
- Active org determines current context

**Result**: User can switch between orgs, context changes based on active org.

## Testing

After setup, verify:

1. **Superuser**:
   - [ ] Can create assignments (UI visible)
   - [ ] Can access assignments from any org
   - [ ] Can create assignments without org membership

2. **Professor**:
   - [ ] Can create assignments (UI visible)
   - [ ] Can see all assignments in their org
   - [ ] Cannot access assignments from other orgs

3. **Student**:
   - [ ] Cannot create assignments (UI hidden)
   - [ ] Can see published assignments from their org
   - [ ] Cannot access assignments from other orgs

4. **User without org**:
   - [ ] Cannot create assignments
   - [ ] Cannot see any assignments
   - [ ] Gets appropriate error messages

## Troubleshooting

### User can't create assignments

1. **Sign out and sign back in** - This is the most common issue! After adding a user to an organization or changing their role, they must sign out and sign back in to refresh their session token.

2. **Check user's role in active organization**:
   - Go to Clerk Dashboard → Users → Select user → Organizations tab
   - Verify the role is set to `org:professor` (not just `professor`)
   - Verify the organization is listed

3. **Set organization as active**:
   - In Clerk Dashboard, ensure the organization is set as the user's active organization
   - Or use Clerk's organization switcher in the UI to set it as active

4. **Check browser console**:
   - Open browser DevTools → Console
   - Look for `[useRole] Debug:` logs that show the extracted role
   - Verify `extractedRole` shows `org:professor`

5. **Verify role name**:
   - The role must be exactly `org:professor` (with `org:` prefix)
   - Check if user has `org:professor` role or `isSuperUser` metadata

6. **Check organization context**:
   - Verify `organizationId` and `organizationName` are populated in the debug logs
   - If both are `undefined`, the user is not in an active organization

### Superuser not working

1. Verify `publicMetadata.isSuperUser = true` is set
2. Check that metadata is in **Public metadata** (not Private)
3. User may need to sign out and sign back in to refresh token
4. Check backend logs for metadata extraction

### User sees wrong organization's data

1. Verify active organization in Clerk session
2. Check that `orgId` in token matches expected org
3. User may need to switch organizations in Clerk
4. Verify assignment's `organizationId` field

## API Reference

### Token Claims Structure

When user is in an organization, Clerk session token includes:

```json
{
  "sub": "user_xxxxx",
  "org_id": "org_xxxxx",
  "org_role": "org:professor",
  "public_metadata": {
    "isSuperUser": true
  }
}
```

### Backend Request Object

After authentication middleware:

```typescript
req.userId = "user_xxxxx"
req.orgId = "org_xxxxx"  // Active organization
req.userRole = "org:professor"  // Role in active org
req.isSuperUser = true  // From metadata
```
