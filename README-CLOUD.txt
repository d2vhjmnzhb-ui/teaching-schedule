College System v10 – Cloud Scheduler

ไฟล์:
- index.html เว็บหลัก
- image1.png ตราวิทยาลัย
- Code.gs Backend สำหรับ Google Sheets / Apps Script

เชื่อม Cloud ครั้งแรก:
1) สร้าง Google Sheet ใหม่สำหรับฐานตารางสอน
2) ใน Sheet เปิด Extensions > Apps Script
3) ลบโค้ดเดิม แล้ววาง Code.gs ทั้งไฟล์ กด Save
4) Deploy > New deployment > Web app
5) Execute as: Me
6) Who has access: Anyone (หรือค่าที่บัญชีองค์กรอนุญาตให้เว็บ GitHub Pages เรียกได้)
7) Deploy แล้วคัดลอก URL ที่ลงท้าย /exec
8) เปิดเว็บ v10 > ตั้งค่า Cloud > วาง URL > ตั้งชื่อฐาน เช่น college-2569
9) กด บันทึก Cloud

หลังจากนั้นเครื่องอื่นเปิดเว็บเดียวกัน ตั้ง URL และชื่อฐานเดียวกัน แล้วกด โหลด Cloud จะได้ข้อมูลชุดเดียวกัน

หมายเหตุด้านความปลอดภัย:
- อย่าเก็บข้อมูลลับ/รหัสผ่านในฐานนี้
- ถ้า deployment เปิด Anyone ผู้ที่รู้ URL และชื่อฐานอาจเรียก endpoint ได้
- สำหรับระบบใช้งานจริงหลายผู้ใช้ ควรเพิ่มระบบยืนยันตัวตน/สิทธิ์ในรุ่นถัดไป
