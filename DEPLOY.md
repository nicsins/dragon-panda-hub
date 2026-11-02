# Deploy status

## Cloud sandbox (feature work)
```bash
cd /workspace/artifacts/dragon-panda-hub
python3 -m http.server 8766
# http://127.0.0.1:8766
```

## Production (Vercel)
- Project: `dragon-panda-hub` (team nic-s-projects)
- URL: https://dragon-panda-hub-nic-s-projects-33d61015.vercel.app
- Git: https://github.com/nicsins/dragon-panda-hub
- Vercel Auth (SSO): disabled for public playtesting
- Redeploy: push to `main` or MCP create_deployment

## Temporary (expires ~1h)
- Claim: see vercel claim link from last `vercel deploy --temporary`

## Workflow for features
1. Edit files under `/workspace/artifacts/dragon-panda-hub`
2. Test on local :8766
3. `git add -A && git commit && git push` → auto/manual Vercel redeploy
