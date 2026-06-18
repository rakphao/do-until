# do-until

ปลั๊กอิน autonomous loop สำหรับ **Grok Build TUI** และ **Claude Code** — ให้ agent ทำงานต่อเนื่องจนเสร็จ โดยไม่ต้องพึ่งฟีเจอร์ `/goal` ของ platform

## ทำไมต้อง do-until?

Loop แบบ Ralph Wiggum — ทำงานต่อเนื่องจนเสร็จ โดยไม่ต้องพึ่ง `/goal` ของ platform

- คำสั่ง `/do-until`, `/cancel-do-until`
- ดู state ได้ที่ `.grok/do-until.local.md`
- สคริปต์ Node.js — macOS, Linux, Windows
- ติดตั้งง่าย: `npx github:rakphao/do-until`

## คำสั่ง

```
/do-until "แก้ test ที่ fail" --max-iterations 20 --completion-promise "ALL GREEN"
/cancel-do-until
```

## ติดตั้ง (Grok)

**แบบง่าย (ต้องมี Node.js 18+ และ Grok CLI):**

```bash
npx github:rakphao/do-until
```

**แบบ manual:**

```bash
grok plugin install https://github.com/rakphao/do-until --trust
```

เพิ่มใน Grok config:

```toml
[plugins]
enabled = ["do-until"]
```

เปิด Grok ใหม่ หรือ `/plugins` → reload

## การพัฒนา

```bash
git clone https://github.com/rakphao/do-until.git
cd do-until
grok plugin install . --trust
```

## แผน release

- **v0.1** — loop ปัจจุบัน + docs
- **v0.2** — `/do-until-plan`, Loop Spec, Confirmation Gate
- **v0.3** — deliverable loop, verify gate, pause/resume

เอกสารภาษาอังกฤษฉบับเต็ม: [README.md](README.md)