# CertiGuard Worker — HuggingFace Space

Lightweight PDF extraction + QR decoding worker for CertiGuard.
(Image OCR and GPU dependencies have been DISABLED to reduce memory usage and startup time).

## Deployment

1. Create a new HuggingFace Space with **Docker** SDK
2. Upload `app.py`, `Dockerfile`, and `requirements.txt`
3. The Space will auto-build and start on port 7860

### System Dependencies (included in Dockerfile)

```
libzbar0
libgl1-mesa-glx
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/process` | PDF base64 → text + QR codes |
| GET | `/health` | Health check |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `7860` | Server port |
