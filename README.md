# Verasanth

## Local development

The local D1 database is empty — Franklin's account (and other production accounts) exist only in production. To test locally, either:

- **Option A:** Register a new account using the **New Character** tab on the local dev server.
- **Option B:** Copy production data to local D1:
  ```bash
  npx wrangler d1 export verasanth --remote --output=./prod-backup.sql
  npx wrangler d1 execute verasanth --local --file=./prod-backup.sql
  ```
