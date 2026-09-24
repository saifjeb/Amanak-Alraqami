# Amanak Frontend — Final QA Notes

## Static checks completed in the packaged source

- JS/JSX syntax parsing: PASS
- Relative import resolution: PASS
- CSS brace balance: PASS
- Duplicate AutoTranslator dictionary keys: PASS
- Six adventure fallback covers present: PASS
- Child shared navigation present on all child pages: PASS
- Parent shared navigation present on all parent pages: PASS
- Admin shared navigation present on all admin pages: PASS
- Obsolete layout/global-language overlay references: PASS (none)
- Simple unused-import audit: PASS

## Local verification required after extraction

The build environment used to package this project cannot download npm packages, so `eslint` and `vite` executables are intentionally not bundled.

Run locally:

```bash
npm install
npm run lint -- --quiet
npm run build
npm run dev
```

## End-to-end flows to verify with the live backend

### Child

1. Register age 8–10 and age 11–14 accounts.
2. Login/logout and refresh session persistence.
3. Open dashboard, adventures, badges, assessments, profile and parent linking.
4. Complete an adventure and confirm points/progress/badge updates.
5. Verify Arabic/English switching and RTL/LTR layout.
6. Confirm assigned adventure images override fallback covers.
7. Confirm a broken assigned image falls back to the built-in cover.

### Parent

1. Register/login/logout.
2. Generate a link code.
3. Link a child from the child account.
4. View linked-child dashboard, progress, badges and assessments.
5. Verify refresh persistence and language switching.

### Admin

1. Login/logout and protected-route behavior.
2. Review dashboard statistics.
3. Search/view/enable/disable students.
4. Create/edit/activate/deactivate/trash/restore/delete an adventure.
5. Assign an adventure image.
6. Create/edit/trash/restore/delete adventure/pre-test/post-test questions.
7. Upload/view/trash/restore/delete media.
8. Verify mobile/tablet navigation.

## Production environment

Set:

```env
VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api
```

Do not commit `.env`.
