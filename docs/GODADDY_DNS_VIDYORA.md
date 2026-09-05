# Point vidyora.co.in to EC2

Server IP: `52.66.204.66`

## GoDaddy steps

1. Open [GoDaddy DNS](https://dcc.godaddy.com/manage/vidyora.co.in/dns)
2. Turn **off** Domain Forwarding / Parking if enabled
3. Set DNS records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `52.66.204.66` | 600 |
| A | `www` | `52.66.204.66` | 600 |

4. Delete old A records pointing to `3.33.130.190` / `15.197.148.33`
5. Save, wait 2–10 minutes

## After DNS propagates

On EC2:

```bash
sudo certbot --nginx -d vidyora.co.in -d www.vidyora.co.in --non-interactive --agree-tos -m admin@vidyora.co.in --redirect
```

Verify:

```bash
dig +short vidyora.co.in A
curl -I https://vidyora.co.in
```
