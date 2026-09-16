# SPIN

Web app chọn ngẫu nhiên từ danh sách do người dùng nhập, với giao diện đen–đỏ và danh sách cuộn dọc lấy cảm hứng từ video tham chiếu.

## Chạy trên máy

Yêu cầu Node.js 22.12+ hoặc Node.js 24.

```powershell
cd D:\spinner-app
npm install
npm run dev
```

Mở địa chỉ được Vite in trong terminal, mặc định http://127.0.0.1:5173. Trên Windows, bạn cũng có thể nhấp đúp `START.cmd` sau khi đã cài dependencies; cửa sổ terminal cần giữ mở trong lúc dùng app.

## Sử dụng

1. Nhập các lựa chọn, mỗi dòng một giá trị. Tối thiểu 2, tối đa 100 lựa chọn; mỗi lựa chọn tối đa 120 ký tự.
2. Nếu có dòng trùng (không phân biệt hoa thường), chọn **Gộp dòng trùng** hoặc sửa thủ công.
3. Nhấn **Tạo spinner**, sau đó **QUAY** hoặc phím Space.
4. Kết quả xuất hiện ở giữa khung đỏ. Nhấn **QUAY LẠI** hoặc **Sửa danh sách**.

Cài đặt gồm thời gian 3/4/5 giây (mặc định 5 giây), âm thanh và không lặp kết quả. Khi bật không lặp, mỗi giá trị chỉ được chọn một lần trong lượt. Đặt lại lượt để dùng lại toàn bộ danh sách. Sửa danh sách hoặc thay đổi chế độ không lặp sẽ bắt đầu lượt mới.

Danh sách, cài đặt và các lựa chọn đã quay được lưu trong localStorage của trình duyệt. Khi tải lại trang, app mở màn hình nhập với danh sách đã lưu. Dữ liệu không đồng bộ giữa thiết bị. Nếu trình duyệt chặn lưu trữ, app thông báo và vẫn cho phép sử dụng trong phiên hiện tại.

Âm thanh mặc định bật cho lần sử dụng đầu tiên: tiếng tick đồng bộ theo dòng đi qua và chậm dần cùng spinner, kèm ba nốt báo kết quả. Bật/tắt bằng nút ở góc dưới bên phải hoặc trong Cài đặt. Lựa chọn bật/tắt đã lưu trước đó được giữ nguyên. Âm thanh được tạo bằng Web Audio ngay trên thiết bị, không tải file bên ngoài và chỉ bắt đầu sau thao tác quay. Chế độ giảm chuyển động của hệ điều hành được tôn trọng. Đang quay thì các thao tác sửa/cài đặt bị khóa.

## Kiểm tra và build

```powershell
npm test
npm run build
npm run test:e2e
npm run preview
```

Kiểm thử trình duyệt dùng Google Chrome đã cài trên máy (Playwright channel `chrome`). Nếu máy khác chưa có Chrome, cài Chrome hoặc đổi cấu hình sang Chromium và chạy `npx playwright install chromium`.

`dist/` là bản build tĩnh để đưa lên hosting. `npm run preview` phục vụ bản build trên máy, không phải triển khai công khai.

## Mã nguồn

- `src/App.tsx`: nhập liệu, cài đặt và lưu dữ liệu.
- `src/Spinner.tsx`: danh sách cuộn, chuyển động, âm thanh và bàn phím.
- `src/logic.ts`: chuẩn hóa dữ liệu, lọc lựa chọn, random và căn tâm danh sách.
- `src/styles.css`: giao diện và responsive.
- `src/logic.test.ts`: kiểm thử chuẩn hóa, random và căn tâm.
- `tests/app.spec.ts`: kiểm thử luồng sử dụng trên desktop/mobile.

Random sử dụng `crypto.getRandomValues` với rejection sampling để tránh thiên lệch phép chia dư. Kết quả được chọn từ tập hợp hợp lệ trước animation; chuyển động chỉ thể hiện kết quả này. Mỗi lượt dựng số dòng hữu hạn, không tạo danh sách DOM vô hạn.

## Tài liệu công nghệ

- [Vite](https://vite.dev/guide/)
- [Motion](https://motion.dev/docs/react-animation)
- [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)

React + TypeScript, Vite, Motion, Radix Dialog, Tailwind CSS và CSS tùy chỉnh. Font Be Vietnam Pro được phục vụ từ ứng dụng, có hỗ trợ tiếng Việt; icon Phosphor.

## Kết quả kiểm tra trên máy phát triển

- Build production và kiểm tra TypeScript: thành công.
- Unit tests kiểm tra dữ liệu đầu vào, random, phục hồi cài đặt và chuyển đổi thời lượng cũ.
- Kiểm thử Chrome gồm nhập/sửa/lưu danh sách, quay thực tế và căn kết quả, không lặp/đặt lại/bàn phím, mobile 360 px, âm thanh/bật tắt/lưu tùy chọn và trường hợp không có AudioContext.
- Kiểm thử thời gian đo các lượt 3 và 5 giây ở cả chế độ chuyển động bình thường và giảm chuyển động, bao gồm lượt cuối chỉ còn một lựa chọn.
- Đã xem ảnh chụp desktop 1440 px và mobile 360 px, bao gồm nội dung tiếng Việt dài.

Ảnh chụp sau khi chạy `npm run test:e2e` nằm trong `test-results/`. Kiểm thử âm thanh đo tín hiệu bằng AnalyserNode trong Chrome và kiểm tra tick/ba nốt kết quả; chưa nghe bằng loa thực tế. Các trình duyệt khác ngoài Chrome chưa được chạy kiểm thử tự động.

Mỗi lượt luôn giữ đủ thời gian đã chọn, kể cả khi bật giảm chuyển động hoặc chỉ còn một lựa chọn. Cài đặt 8 giây từ phiên bản cũ tự chuyển về 5 giây.
