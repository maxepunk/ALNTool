# Deployment Guide

## Pre-deployment Verification

Before deploying, run the verification suite to ensure database integrity:

```bash
# Run all verifications
npm run verify:all

# Or run individual verifications
npm run verify:migrations    # Verify migration state
npm run verify:pre-deploy    # Run full pre-deployment checks
```

The verification suite will:
1. Check database accessibility
2. Verify all migrations are applied correctly
3. Ensure critical tables have data
4. Validate character links integrity
5. Verify computed fields are populated
6. Report puzzle sync status

If any verification fails:
- Review the error messages
- Fix the issues before proceeding
- Run the verification again
- Document any manual fixes in the deployment log

## Deployment Steps

1. Run pre-deployment verification:
   ```bash
   npm run verify:all
   ```

2. If verification passes, proceed with deployment:
   ```bash
   # Deploy to staging
   npm run deploy:staging

   # Deploy to production
   npm run deploy:prod
   ```

3. After deployment, verify the deployment:
   ```bash
   # Check API health
   curl https://api.storyforge.com/health

   # Verify database connection
   curl https://api.storyforge.com/api/verify/db
   ```

## Troubleshooting

### Migration Issues

If migration verification fails:
1. Check the migration logs in `logs/migrations.log`
2. Review the `schema_migrations` table
3. Run `npm run verify:migrations` to see detailed status
4. If needed, manually fix migrations:
   ```bash
   # Connect to database
   sqlite3 data/production.db

   # Check applied migrations
   SELECT * FROM schema_migrations ORDER BY version;

   # Check migration status
   .tables
   PRAGMA table_info(puzzles);  # Check specific table
   ```

### Data Integrity Issues

If data verification fails:
1. Check the sync logs in `logs/sync.log`
2. Review the computed fields:
   ```sql
   -- Check timeline events
   SELECT COUNT(*) FROM timeline_events WHERE act_focus IS NULL;
   
   -- Check character resolution paths
   SELECT COUNT(*) FROM characters WHERE resolution_paths IS NULL;
   
   -- Check puzzle sync status
   SELECT sync_status, COUNT(*) FROM puzzles GROUP BY sync_status;
   ```

3. If needed, trigger a full sync:
   ```bash
   npm run sync:full
   ```

### Critical Fields

The following fields are critical and must be verified:
- `timeline_events.act_focus`
- `characters.resolution_paths`
- `elements.resolution_paths`
- `puzzles.narrative_threads`
- `puzzles.story_reveals`

If any of these fields are missing or null:
1. Check the sync logs for errors
2. Verify the Notion data is correct
3. Run a targeted sync:
   ```bash
   npm run sync:targeted -- --tables=puzzles,elements
   ```

## Rollback Procedure

If deployment fails:
1. Stop the application
2. Restore the database backup
3. Run migrations:
   ```bash
   npm run verify:migrations
   ```
4. Verify data integrity:
   ```bash
   npm run verify:pre-deploy
   ```
5. Restart the application

## Monitoring

After deployment:
1. Monitor the sync logs:
   ```bash
   tail -f logs/sync.log
   ```
2. Check the API health endpoint
3. Verify computed fields are updating
4. Monitor puzzle sync status

## Support

For deployment issues:
1. Check the deployment logs
2. Review the verification output
3. Contact the technical lead
4. Document any issues in the deployment log 