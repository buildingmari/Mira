# sync-meta-to-github

Supabase Edge Function yang otomatis meng-update `index.html` di GitHub setiap kali baris `site_settings` di Supabase di-INSERT atau di-UPDATE.

## Setup (wajib dilakukan sekali)

### 1. Buat GitHub Fine-Grained PAT

1. Buka https://github.com/settings/tokens?type=beta
2. **Generate new token** → pilih repo `buildingmari/Mira`
3. Permissions: **Repository contents → Read and write**
4. Salin token-nya.

### 2. Simpan PAT sebagai Supabase Secret

```bash
supabase secrets set GITHUB_PAT=github_pat_xxxxxxxxxxxxxxxx
```

Atau via Supabase Dashboard → Project Settings → Edge Functions → Secrets → tambah `GITHUB_PAT`.

### 3. Deploy Edge Function

```bash
supabase functions deploy sync-meta-to-github
```

### 4. Buat Database Webhook di Supabase

1. Supabase Dashboard → **Database** → **Webhooks** → **Create new webhook**
2. Isi:
   - **Name**: `on_site_settings_change`
   - **Table**: `site_settings`
   - **Events**: ✅ Insert, ✅ Update
   - **Type**: Supabase Edge Functions
   - **Edge Function**: `sync-meta-to-github`
3. Save.

### 5. Test manual

```bash
curl -X GET https://<project-ref>.supabase.co/functions/v1/sync-meta-to-github \
  -H "Authorization: Bearer <anon-key>"
```

Atau update satu field di `site_settings` → cek apakah `index.html` di GitHub ter-update dalam ~10 detik.

## Cara kerja

```
Admin save settings
  → Supabase site_settings row updated
  → Database Webhook fires
  → Edge Function reads latest row
  → Fetch index.html from GitHub (dengan SHA)
  → Patch <title>, <meta name="description">, og tags, favicon
  → PUT updated HTML back to GitHub
  → CI/CD deploy (Vercel/Netlify) picks up the commit
  → Google crawls fresh static HTML ✅
```
