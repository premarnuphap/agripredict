วิธีติดตั้งและใช้งานโปรเจกต์

1) ติดตั้ง Node.js

โปรเจกต์นี้ใช้ Node.js สำหรับรัน backend server

วิธีติดตั้ง:
เปิดเว็บดาวน์โหลด Node.js
ดาวน์โหลดเวอร์ชัน LTS
ติดตั้งตามขั้นตอนปกติ โดยกด Next ไปเรื่อย ๆ จนเสร็จ
หลังติดตั้งเสร็จ ให้ปิดแล้วเปิด Command Prompt หรือ PowerShell ใหม่ 1 รอบ
วิธีเช็คว่าติดตั้งสำเร็จแล้วหรือยัง

เปิด Command Prompt หรือ PowerShell แล้วพิมพ์:

node -v

ถ้าติดตั้งสำเร็จ จะเห็นเลขเวอร์ชันของ Node.js แสดงขึ้นมา

จากนั้นพิมพ์:

npm -v

ถ้าขึ้นเลขเวอร์ชันของ npm ด้วย แปลว่าใช้งานได้แล้ว
npm จะติดมาพร้อมกับ Node.js โดยปกติ

----------------------------------
2) เปิดโปรเจกต์

หลังจากได้รับไฟล์โปรเจกต์แล้ว ให้แตกไฟล์ zip ไว้ในโฟลเดอร์ที่ต้องการ

ตัวอย่างเช่น:

E:\_Work_Freelance\line-oa-income-ai-mvp

จากนั้นเปิด Command Prompt หรือ PowerShell แล้วเข้าไปที่โฟลเดอร์โปรเจกต์ด้วยคำสั่ง:

cd E:\_Work_Freelance\line-oa-income-ai-mvp

ถ้าพาธของคุณไม่เหมือนตัวอย่าง ให้เปลี่ยนเป็นพาธของเครื่องตัวเอง

----------------------------------
3) ติดตั้ง package ที่โปรเจกต์ต้องใช้

เมื่อเข้ามาในโฟลเดอร์โปรเจกต์แล้ว ให้พิมพ์คำสั่งนี้:

npm install

คำสั่งนี้จะติดตั้ง dependencies ทั้งหมดที่ระบุไว้ใน package.json และสร้างโฟลเดอร์ node_modules ขึ้นมา
รอจนติดตั้งเสร็จ ถ้าไม่มี error ถือว่าเรียบร้อย

----------------------------------
4) สร้างไฟล์ .env

โปรเจกต์นี้ใช้ Environment Variables สำหรับเก็บค่าตั้งค่าที่สำคัญ เช่น LINE token, LIFF ID, URL ของระบบ, และ OpenAI API key
แนวทางนี้ปลอดภัยกว่าการเขียน key ตรง ๆ ลงในโค้ด และเป็นวิธีที่ OpenAI แนะนำสำหรับ API key ด้วย

วิธีทำ
มองหาไฟล์ชื่อ .env.example
copy ไฟล์นี้
เปลี่ยนชื่อไฟล์ copy ให้เป็น .env

ตัวอย่างค่าข้างในอาจมีลักษณะประมาณนี้:

LINE_CHANNEL_ACCESS_TOKEN=YOUR_LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET=YOUR_LINE_CHANNEL_SECRET
BASE_URL=https://your-app.onrender.com
LIFF_ID=YOUR_LIFF_ID
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-5.4

คำอธิบาย:
LINE_CHANNEL_ACCESS_TOKEN = token ของ LINE Messaging API
LINE_CHANNEL_SECRET = secret ของ LINE channel
BASE_URL = URL ของระบบที่ deploy แล้ว
LIFF_ID = LIFF ID สำหรับเปิด Dashboard
OPENAI_API_KEY = API key สำหรับ AI Insight
OPENAI_MODEL = model ที่ระบบจะใช้

ถ้ายังไม่มีค่าเหล่านี้ครบ ให้ใส่ทีละตัวก่อนเริ่มใช้งาน

----------------------------------
5) รันโปรเจกต์บนเครื่อง

หลังติดตั้ง package และสร้าง .env แล้ว ให้รันโปรเจกต์ด้วยคำสั่ง:

node index.js

ถ้าระบบเริ่มทำงานได้ปกติ จะเห็นข้อความประมาณว่า:

Server running on port 3000

หรือข้อความใกล้เคียง

ถ้าเปิดใช้งานในเครื่องตัวเอง ปกติจะเข้าผ่าน URL ลักษณะนี้:

http://localhost:3000

ถ้าหน้าเว็บขึ้น และ server ไม่ error แปลว่าระบบรันได้แล้ว

----------------------------------
6) วิธีอัปโหลดขึ้น Git Repository

ขั้นตอนนี้ใช้สำหรับเก็บโค้ดขึ้น GitHub หรือ Git provider อื่น ๆ เพื่อเตรียม deploy ต่อบน Render

ก่อนอัปขึ้น Git ให้เช็คก่อนว่า ห้ามอัป .env ขึ้น repo เด็ดขาด เพราะมี key ลับอยู่ข้างใน
OpenAI เองก็แนะนำว่า API key ต้องเก็บเป็น secret และไม่ควร expose ใน code หรือ public repository

6.1 เช็คก่อนว่ามี .gitignore

ในไฟล์ .gitignore ควรมีรายการอย่างน้อยประมาณนี้:

node_modules/
.env

ถ้ายังไม่มี ให้เพิ่ม

6.2 เปิด terminal ในโฟลเดอร์โปรเจกต์

เข้าไปที่โฟลเดอร์โปรเจกต์ก่อน เช่น

cd E:\_Work_Freelance\line-oa-income-ai-mvp
6.3 เริ่มต้น Git

ถ้าโฟลเดอร์นี้ยังไม่ได้เป็น git repo ให้พิมพ์:

git init
6.4 เพิ่มไฟล์เข้า staging
git add .
6.5 commit ครั้งแรก
git commit -m "Initial project setup"
6.6 สร้าง repository บน GitHub
เข้า GitHub
กดสร้าง repository ใหม่
ตั้งชื่อ repository
สร้าง repo แบบว่างไว้ก่อน
6.7 เชื่อม local repo กับ remote repo

สมมติ GitHub ให้ URL มาแบบนี้:

https://github.com/yourname/line-oa-income-ai-mvp.git

ให้พิมพ์:

git remote add origin https://github.com/yourname/line-oa-income-ai-mvp.git
6.8 push ขึ้น GitHub
git branch -M main
git push -u origin main

ถ้าขึ้นสำเร็จ จะเห็นไฟล์โปรเจกต์บน GitHub

----------------------------------
7) วิธีนำโปรเจกต์ไปใช้ต่อบน Render
7.1 เชื่อม Render กับ Git repository
เข้า Render
กดสร้าง Web Service ใหม่
เลือก connect กับ GitHub
เลือก repository ของโปรเจกต์นี้
7.2 ตั้งค่าพื้นฐาน

ค่าที่มักใช้มีประมาณนี้

Build Command
npm install
Start Command
node index.js
7.3 เพิ่ม Environment Variables

ในหน้า Render ให้เพิ่มค่าตัวแปรทั้งหมดจากไฟล์ .env ลงไปทีละตัว เช่น

LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET
BASE_URL
LIFF_ID
OPENAI_API_KEY
OPENAI_MODEL

Render จะเก็บค่าเหล่านี้เป็น secret ฝั่ง server แทนการใช้ .env บนเครื่อง deploy

7.4 Deploy

หลังตั้งค่าเสร็จ ให้กด deploy
ถ้าทุกอย่างถูกต้อง ระบบจะ build และรันขึ้นมาได้

เมื่อ deploy สำเร็จแล้ว Render จะให้ URL ของระบบ เช่น:

https://your-app-name.onrender.com

จากนั้นให้นำ URL นี้ไปอัปเดตในค่าของ BASE_URL ด้วย ถ้ายังไม่ได้ตั้งค่าให้ถูกต้อง

----------------------------------
8) วิธีนำ OpenAI API Key มาใส่

OpenAI ใช้ API key สำหรับยืนยันตัวตนเวลาเรียก API และแนะนำให้เก็บ key ไว้ใน environment variable ไม่ควรเขียนลงใน client-side code หรือแชร์ให้คนอื่นเห็น

8.1 ไปหน้า API Keys

เข้าสู่ระบบ OpenAI Platform แล้วไปที่หน้า API keys
หน้า docs และ help center ของ OpenAI ระบุว่าคุณสามารถสร้างและจัดการ Secret API key ได้จากหน้า API keys ของบัญชี/องค์กร

8.2 สร้าง key
กดสร้าง API key ใหม่
ตั้งชื่อ key ตามต้องการ
copy key ที่สร้างไว้ทันที
เก็บไว้ในที่ปลอดภัย

สำคัญ: อย่าแชร์ key นี้ให้คนอื่น และอย่าใส่ลงใน public repo

8.3 ใส่ลงใน .env

เปิดไฟล์ .env แล้วใส่ค่าแบบนี้:

OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-5.4
8.4 ถ้าใช้ Render

อย่าอัป .env ขึ้น Git
ให้ไปใส่ค่า OPENAI_API_KEY และ OPENAI_MODEL ในหน้า Environment Variables ของ Render แทน

----------------------------------
9) วิธีเช็คว่า OpenAI API key ใช้งานได้

หลังใส่ OPENAI_API_KEY แล้ว ให้ deploy หรือรัน server ใหม่

จากนั้นลองใช้ฟีเจอร์ AI Insight ในระบบ
ถ้าระบบตอบกลับได้ตามปกติ แปลว่า key ใช้งานได้แล้ว

ถ้ายังไม่ได้ อาการที่เจอบ่อยคือ:

key ใส่ผิด
ยังไม่ได้ใส่ใน Render
deploy ยังใช้ค่าเก่า
บัญชี OpenAI ยังไม่ได้ตั้งค่าการใช้งานฝั่ง API ให้พร้อม

----------------------------------
10) ถ้าแก้ .env แล้วต้องทำอะไรต่อ

ถ้าระบบรันในเครื่อง:

หยุด server
รันใหม่ด้วย
node index.js

ถ้าระบบรันบน Render:

บันทึกค่า Environment Variables
กด redeploy หรือรอ deploy ใหม่ตาม flow ของ Render

เพื่อให้ค่าที่แก้มีผลจริง

----------------------------------
11) สรุปคำสั่งที่ใช้บ่อย

ติดตั้ง package:
npm install

รันโปรเจกต์:
node index.js

เริ่ม git repo:
git init

เพิ่มไฟล์ทั้งหมด:
git add .
commit
git commit -m "Initial project setup"

push ขึ้น GitHub:
git branch -M main
git remote add origin https://github.com/yourname/your-repo.git
git push -u origin main

----------------------------------
12) ข้อควรระวัง
ห้ามอัปโหลด .env ขึ้น GitHub
ห้ามส่ง OPENAI_API_KEY ให้คนอื่น
ห้ามเขียน API key ลงในหน้าเว็บ frontend
ถ้าเปลี่ยน BASE_URL หรือ LIFF_ID ต้องเช็คให้ตรงกับระบบจริง
ถ้า deploy แล้ว dashboard เปิดไม่ได้ ให้เช็คค่า LIFF_ID, BASE_URL, และ environment variables ก่อนเป็นอันดับแรก