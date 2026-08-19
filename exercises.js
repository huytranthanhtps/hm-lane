/* HM Lane — thư viện bài bổ trợ. Dùng đúng thiết bị tại nhà:
   tạ đòn (barbell), tạ đơn (dumbbell), xà đơn (pull-up bar), dây kháng lực (bands). */

const ROUTINES = {
  A: {
    id: 'A',
    title: 'Strength A',
    subtitle: 'Thân dưới / running-specific',
    focus: 'Sức mạnh chân & hông để chịu quãng dài. Nghỉ 60–90s giữa các set.',
    items: [
      { id: 'a1', name: 'Goblet / Back Squat',      sets: '3×8–10', cue: 'Tạ đơn hoặc tạ đòn · xuống sâu, gót chạm sàn' },
      { id: 'a2', name: 'Eccentric Calf Raise',     sets: '3×12',   cue: 'Trên bậc · hạ gót chậm 3 giây', key: 'Cổ chân' },
      { id: 'a3', name: 'Bulgarian Split Squat',    sets: '3×8 / chân', cue: 'Tạ đơn · chân sau gác ghế, giữ thăng bằng' },
      { id: 'a4', name: 'Tibialis Raise',           sets: '3×15',   cue: 'Dựa tường · kéo mũi bàn chân lên hết cỡ', key: 'Cẳng chân' },
      { id: 'a5', name: 'Banded Lateral Walk',      sets: '3×15 / bên', cue: 'Dây kháng lực trên gối · bước ngang, gối không sập vào' },
    ],
  },
  B: {
    id: 'B',
    title: 'Strength B',
    subtitle: 'Posterior chain + core + upper',
    focus: 'Chuỗi cơ sau, core và thân trên để giữ form khi mệt. Nghỉ 60–90s.',
    items: [
      { id: 'b1', name: 'Romanian Deadlift',        sets: '3×8',    cue: 'Tạ đòn · lưng thẳng, đẩy hông ra sau, cảm nhận gân kheo' },
      { id: 'b2', name: 'Pull-up',                  sets: '3×AMRAP', cue: 'Xà đơn · kéo hết tầm; dùng dây hỗ trợ nếu cần' },
      { id: 'b3', name: 'Push-up',                  sets: '3×AMRAP', cue: 'Thân thẳng như tấm ván, khuỷu ~45°' },
      { id: 'b4', name: 'Plank + Side Plank',       sets: '3×30–45s', cue: 'Siết bụng & mông · giữ hông không võng' },
      { id: 'b5', name: 'Hip Bridge / Bird-dog',    sets: '3×12',   cue: 'Kích hoạt mông & core, chống bù trừ khi chạy' },
    ],
  },
  MOB: {
    id: 'MOB',
    title: 'Mobility',
    subtitle: 'Giãn & linh hoạt',
    focus: 'Ngày nhẹ — mở cổ chân, bắp chân, hông. Đặc biệt quan trọng vì bạn ngồi nhiều.',
    items: [
      { id: 'm1', name: 'Ankle Dorsiflexion',       sets: '2×10 / bên', cue: 'Gối đẩy qua mũi chân, gót giữ sàn', key: 'Cổ chân' },
      { id: 'm2', name: 'Giãn bắp chân (gastroc + soleus)', sets: '2×30s / bên', cue: 'Dựa tường · một lần gối thẳng, một lần gối chùng' },
      { id: 'm3', name: 'Giãn cơ gấp hông',         sets: '2×30s / bên', cue: 'Tư thế lunge quỳ · đẩy hông tới trước', key: 'Hông' },
      { id: 'm4', name: 'Foam roll đùi + bắp chân', sets: '3–4 phút', cue: 'Lăn chậm, dừng ở điểm căng' },
    ],
  },
};

if (typeof module !== 'undefined') module.exports = ROUTINES;
