# HM Planner — Thiết kế (Design Spec)

**Ngày:** 2026-08-19
**Loại:** Web app cá nhân (PWA), 1 người dùng, không auth, lưu local.
**Mục tiêu race:** Half Marathon 21.1km, ngày **17/01/2027**, hoàn thành trong **3h00 (pace ~8:34/km)**, **không bị chuột rút**.

---

## 1. Hồ sơ người dùng (runner profile)

- Nam, cao 1m73, nặng 68kg, skinny-fat, dev ngồi nhiều → thân dưới yếu/nặng, ít vận động.
- Đã hoàn thành HM 2 lần: 3h15 và 3h30.
- Hiện **mất thể lực** (từ lần chạy cuối tới nay không chạy).
- Triệu chứng khi chạy dài:
  - 0–10km: ổn.
  - 12–15km: **đau cổ chân**.
  - 15km+: **chuột rút bắp chân & bắp đùi**.
- Ràng buộc: **CLB công ty bắt buộc 10km/tuần**, không đạt sẽ bị phạt.
- Thiết bị tại nhà: tạ đòn (barbell), tạ đơn (dumbbell), xà đơn (pull-up bar), dây kháng lực (resistance bands).
- Số buổi chạy/tuần khả thi: **3 buổi**, + bài bổ trợ strength xen kẽ ngày không chạy.

> ⚠️ **Miễn trừ y tế:** Đây không phải tư vấn y khoa. Nếu đau cổ chân sắc/kéo dài hoặc chấn thương, dừng và đi khám chuyên gia.

## 2. Chẩn đoán & chiến lược

**Limiter chính KHÔNG phải tim mạch** (mục tiêu 3h rất dễ so với nền 3h15). Limiter là **độ bền & sức mạnh cơ-gân chi dưới**:

- **Chuột rút 15km+**: do cơ chưa quen quãng dài + thiếu sức mạnh + có thể thiếu nước/điện giải + pacing quá nhanh giai đoạn đầu.
  - Giải: long run tăng dần → cơ quen tải; strength → cơ khỏe; tập tiếp nước/điện giải trong long run từ GĐ chuyên biệt; pacing đều (10km đầu chậm hơn goal pace); cadence 170–180.
- **Đau cổ chân 12–15km**: cổ chân/cẳng chân yếu, tăng tải quá nhanh.
  - Giải: **eccentric calf raise (hạ chậm 3s)** + **tibialis raise** (2 bài quan trọng nhất); mobility cổ chân; tăng volume ≤10%/tuần; giày phù hợp.

## 3. Phân kỳ 22 tuần (19/8/2026 → 17/1/2027)

| GĐ | Tuần | Ngày | Trọng tâm | Long run |
|----|------|------|-----------|----------|
| Reset | 1–3 | 19/8 – 6/9 | Chạy lại nhẹ, khởi động strength, chân làm quen | 3.5→6→8 km |
| Nền tảng | 4–9 | 7/9 – 18/10 | Tăng thể lực + sức mạnh chân/hông, volume tăng | 10→16 km |
| Chuyên biệt | 10–16 | 19/10 – 6/12 | Long run dài + đoạn goal-pace, tập tiếp điện giải | 17→21 km |
| Đỉnh + giảm tải | 17–19 | 7/12 – 27/12 | Volume đỉnh rồi giảm | 16/18/14 km |
| Taper | 20–22 | 28/12 – 17/1 | Nghỉ dưỡng sức, tuần đua | 12→8→**RACE** |

### Bảng long run & volume theo tuần (deload mỗi ~3–4 tuần)

| Tuần | Khoảng ngày | Long run (km) | Ghi chú |
|------|-------------|---------------|---------|
| 1 | 19–23/8 | — (3×3.5 easy) | Tuần đặc biệt, chỉ T4/T5/T6, đủ 10km CLB |
| 2 | 24–30/8 | 6 | Vào khung tuần chuẩn |
| 3 | 31/8–6/9 | 8 | |
| 4 | 7–13/9 | 10 | |
| 5 | 14–20/9 | 8 | deload |
| 6 | 21–27/9 | 12 | |
| 7 | 28/9–4/10 | 14 | |
| 8 | 5–11/10 | 11 | deload |
| 9 | 12–18/10 | 16 | |
| 10 | 19–25/10 | 17 | bắt đầu đoạn goal-pace trong long run |
| 11 | 26/10–1/11 | 13 | deload |
| 12 | 2–8/11 | 18 | tập tiếp nước/điện giải |
| 13 | 9–15/11 | 19 | |
| 14 | 16–22/11 | 15 | deload |
| 15 | 23–29/11 | 20 | |
| 16 | 30/11–6/12 | **21** | dài nhất — rehearsal đủ cự ly |
| 17 | 7–13/12 | 16 | giảm sau đỉnh |
| 18 | 14–20/12 | 18 | long run lớn cuối |
| 19 | 21–27/12 | 14 | bắt đầu taper |
| 20 | 28/12–3/1 | 12 | taper |
| 21 | 4–10/1 | 8 | taper sâu |
| 22 | 11–17/1 | **RACE 21.1** | tuần đua |

**Volume tuần (3 buổi):** easy run ~4–6km × 2 + long run. Đỉnh ~35km/tuần (tuần 16). Luôn ≥10km → luôn đạt chỉ tiêu CLB.

### Tuần 1 (đặc biệt)
- T4 19/8: 3.5km easy (run-walk thoải mái)
- T5 20/8: 3.5km easy
- T6 21/8: 3km easy
- → ~10km, đạt CLB, không quá tải chân mới tập lại.

## 4. Khung tuần chuẩn (từ tuần 2)

| Ngày | Buổi |
|------|------|
| T3 | Chạy Easy (Zone 2) |
| T4 | Strength A (thân dưới / running-specific) |
| T5 | Chạy Easy + strides (GĐ sau: có đoạn quality) |
| T6 | Strength B (posterior chain + core + upper) |
| T7 hoặc CN | Long run |
| Ngày còn lại | Mobility cổ chân/hông hoặc nghỉ |

*App cho phép tick buổi ở bất kỳ ngày nào runner thực sự tập — khung chỉ là gợi ý.*

## 5. Nội dung Strength (thiết bị tại nhà)

**Strength A — Thân dưới / chạy:**
- Squat (goblet/barbell) 3×8–10
- **Eccentric calf raise** (hạ chậm 3s) 3×12 — trọng điểm cổ chân/bắp chân
- Bulgarian split squat / single-leg 3×8 mỗi chân
- **Tibialis raise** 3×15 — trọng điểm cẳng chân trước
- Banded lateral walk / clamshell (cơ mông bên) 3×15

**Strength B — Posterior + core + upper:**
- Romanian deadlift (barbell) 3×8
- Pull-up (xà đơn) 3×AMRAP
- Push-up 3×AMRAP
- Plank + side plank 3×30–45s
- Hip bridge / bird-dog 3×12

**Mobility (ngày nhẹ):** ankle dorsiflexion, giãn bắp chân, giãn cơ gấp hông (hip flexor — quan trọng với dev ngồi nhiều).

## 6. Thiết kế Web App

### 6.1 Phạm vi (đã chốt)
- **1 người dùng, không auth, mở lên dùng ngay.**
- **Mobile-first**, cài lên Home Screen iPhone (PWA / shortcut), chạy **offline**.
- Chức năng track = **xem plan + tick hoàn thành** (không nhập số liệu, không sync Health/Strava).

### 6.2 Kiến trúc
- **PWA tĩnh, không backend, không build tooling** (HTML + CSS + JS thuần) — cài đặt dễ, offline, không phụ thuộc.
- Dữ liệu plan: file JSON tĩnh (`plan.js`) sinh từ bảng ở mục 3–5 (22 tuần × các buổi).
- Tiến độ (buổi nào đã tick): **localStorage**.
- Ngày bắt đầu plan cố định: **2026-08-19** → app tự tính "hôm nay là tuần mấy, buổi gì".
- Service worker (`sw.js`) + `manifest.json` để cài Home Screen & offline.

### 6.3 Cấu trúc file
```
hm-planner/
  index.html
  styles.css
  app.js         // logic: tính ngày, render, tick, lưu localStorage
  plan.js        // dữ liệu 22 tuần (chạy + strength + mobility)
  exercises.js   // thư viện bài tập (mô tả + cues ngắn)
  sw.js          // service worker (offline cache)
  manifest.json  // PWA manifest (icon, name, standalone)
  icons/         // app icons
```

### 6.4 Màn hình
1. **Today (mặc định):** buổi hôm nay (chạy/strength/nghỉ), chi tiết bài + cách thực hiện, nút **tick "Đã hoàn thành"**. Hiện tuần/GĐ hiện tại + ngày còn lại tới race.
2. **Week:** tổng quan tuần hiện tại, tick từng buổi, tổng km tuần vs mục tiêu CLB 10km.
3. **Plan (toàn bộ):** cuộn 22 tuần, xem trước/sau, badge GĐ.
4. **Progress:** streak, số buổi hoàn thành, km đã chạy (ước tính từ buổi tick), tiến độ tới race.
5. **Exercises:** thư viện strength/mobility — mô tả ngắn + lưu ý kỹ thuật.

### 6.5 UI direction
- Mobile-first, một tay dùng được, chữ to, nút tick lớn.
- Điều hướng bottom tab (Today / Week / Plan / Progress).
- Thiết kế chi tiết sẽ làm ở bước frontend-design (artifact mockup) trước khi build.

## 7. Ngoài phạm vi (YAGNI)
- Không auth, không cloud/sync, không multi-user, không nhập pace/HR thủ công, không tích hợp Apple Health/Strava, không thông báo push (giai đoạn 1).

## 8. Tiêu chí thành công
- Mở app trên iPhone (offline) → thấy ngay buổi hôm nay và tick được.
- Plan phủ đủ 22 tuần tới ngày race, luôn ≥10km/tuần.
- Nội dung nhắm trúng 2 vấn đề: đau cổ chân + chuột rút (đủ strength + long run tăng dần).
