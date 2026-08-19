# HM Lane 🎽

App tập luyện Half Marathon cá nhân — 22 tuần từ 19/8/2026 tới race **17/01/2027**, mục tiêu hoàn thành 21.1km trong 3h không chuột rút.

PWA tĩnh, không backend, không đăng nhập. Tiến độ lưu trong `localStorage` của máy bạn.

## Chạy thử trên máy

```bash
cd hm-planner
python3 -m http.server 8731
# mở http://localhost:8731
```

> Cần chạy qua HTTP server (không mở bằng `file://`) để Service Worker + offline hoạt động.

## Cấu trúc

| File | Vai trò |
|------|---------|
| `index.html` | Khung app + bottom nav |
| `styles.css` | Toàn bộ giao diện (track-rust + mint, liquid-glass) |
| `app.js` | Logic: tính ngày→buổi, render 6 màn (Today/Week/Month/Lane/Progress/Bài tập), tick, lưu localStorage |
| `plan.js` | Dữ liệu 22 tuần (sinh theo luật, neo Thứ Hai 17/8/2026) |
| `exercises.js` | Thư viện bài strength A/B + mobility |
| `sw.js` + `manifest.webmanifest` | PWA: offline + cài Home Screen |
| `icons/` | Icon PNG (tạo bằng `tools/generate-icons.js`) |
| `docs/superpowers/specs/` | Spec thiết kế gốc |

## Deploy lên GitHub Pages (để cài trên iPhone)

1. Tạo repo **public** (Pages bản free cần public), push thư mục này.
2. Settings → Pages → Deploy from branch → `main` / `root`.
3. Mở URL Pages trên **Safari iPhone**.

## Cài lên Home Screen iPhone

Safari → nút **Share** → **Add to Home Screen**. App mở toàn màn hình (standalone), chạy offline, icon riêng.

## Thay đổi kế hoạch

- Sửa long run / deload / pace: chỉnh mảng `WEEKS_SPEC` trong `plan.js`.
- Đổi bài tập: chỉnh `exercises.js`.
- Ngày bắt đầu / ngày race: `START_MONDAY`, `RACE_DATE` trong `plan.js`.
- Tạo lại icon sau khi đổi màu: `node tools/generate-icons.js`.

## Lưu ý

Đây là công cụ hỗ trợ, không phải tư vấn y khoa. Đau cổ chân sắc/kéo dài hoặc chấn thương → dừng và đi khám.
