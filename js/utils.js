/**
 * ไฟล์ฟังก์ชันช่วยเหลือสำหรับระบบ FAQ
 * รวมฟังก์ชันที่ใช้ทั่วไปในระบบ
 */

/**
 * บันทึกข้อมูลทั่วไปลงใน Console (สำหรับการพัฒนา)
 * @param {...any} args - ข้อมูลที่ต้องการบันทึก
 */
function logInfo(...args) {
    console.log('[INFO]', ...args);
}

/**
 * บันทึกข้อผิดพลาดลงใน Console
 * @param {string} message - ข้อความแสดงข้อผิดพลาด
 * @param {Error} error - ออบเจ็กต์ Error
 */
function logError(message, error) {
    console.error('[ERROR]', message, error);
    
    // สำหรับการใช้งานจริง คุณอาจเพิ่มการส่งข้อผิดพลาดไปยังระบบติดตามข้อผิดพลาด
    // sendErrorToTrackingSystem(message, error);
}

/**
 * ฟังก์ชันส่งข้อผิดพลาดไปยังระบบติดตามข้อผิดพลาด (ตัวอย่าง)
 * @param {string} message - ข้อความแสดงข้อผิดพลาด
 * @param {Error} error - ออบเจ็กต์ Error
 */
function sendErrorToTrackingSystem(message, error) {
    // โค้ดสำหรับส่งข้อผิดพลาดไปยังระบบติดตามข้อผิดพลาด
    // เช่น Sentry, Rollbar, LogRocket ฯลฯ
    // ใช้เมื่อต้องการติดตามข้อผิดพลาดในสภาพแวดล้อมการผลิตจริง
}

/**
 * ฟังก์ชันตรวจสอบว่าข้อความว่างเปล่าหรือไม่
 * @param {string} str - ข้อความที่ต้องการตรวจสอบ
 * @returns {boolean} - true ถ้าข้อความว่างเปล่าหรือมีเพียงช่องว่าง
 */
function isEmpty(str) {
    return !str || str.trim() === '';
}

/**
 * ฟังก์ชันแปลงวันที่เป็นรูปแบบไทย
 * @param {string} dateStr - สตริงวันที่ (เช่น "2025-01-15T09:30:00")
 * @returns {string} - วันที่ในรูปแบบไทย (เช่น "15 ม.ค. 2568")
 */
function formatThaiDate(dateStr) {
    try {
        const date = new Date(dateStr);
        const thaiMonths = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        
        // แปลงปีคริสต์ศักราชเป็นพุทธศักราช
        const thaiYear = date.getFullYear() + 543;
        
        return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${thaiYear}`;
    } catch (error) {
        logError('Error formatting date:', error);
        return dateStr; // คืนค่าเดิมถ้าเกิดข้อผิดพลาด
    }
}

/**
 * ฟังก์ชันแปลงวันที่เป็นเวลาที่ผ่านมา (เช่น "5 นาทีที่แล้ว", "2 วันที่แล้ว")
 * @param {string} dateStr - สตริงวันที่ (เช่น "2025-01-15T09:30:00")
 * @returns {string} - ข้อความแสดงเวลาที่ผ่านมา
 */
function timeAgo(dateStr) {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffSeconds = Math.floor((now - date) / 1000);
        
        // เวลาที่ผ่านมาน้อยกว่า 1 นาที
        if (diffSeconds < 60) {
            return 'เมื่อสักครู่';
        }
        
        // เวลาที่ผ่านมาน้อยกว่า 1 ชั่วโมง
        if (diffSeconds < 3600) {
            const minutes = Math.floor(diffSeconds / 60);
            return `${minutes} นาทีที่แล้ว`;
        }
        
        // เวลาที่ผ่านมาน้อยกว่า 1 วัน
        if (diffSeconds < 86400) {
            const hours = Math.floor(diffSeconds / 3600);
            return `${hours} ชั่วโมงที่แล้ว`;
        }
        
        // เวลาที่ผ่านมาน้อยกว่า 30 วัน
        if (diffSeconds < 2592000) {
            const days = Math.floor(diffSeconds / 86400);
            return `${days} วันที่แล้ว`;
        }
        
        // เวลาที่ผ่านมามากกว่า 30 วัน
        return formatThaiDate(dateStr);
    } catch (error) {
        logError('Error calculating time ago:', error);
        return dateStr; // คืนค่าเดิมถ้าเกิดข้อผิดพลาด
    }
}

/**
 * ฟังก์ชันกรองข้อความให้ปลอดภัยจาก XSS
 * @param {string} html - ข้อความ HTML ที่ต้องการกรอง
 * @returns {string} - ข้อความ HTML ที่ผ่านการกรองแล้ว
 */
function sanitizeHTML(html) {
    if (!html) return '';
    
    // แทนที่อักขระพิเศษด้วยรหัส HTML entities
    return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * ฟังก์ชันค้นหาข้อความในคำถามและคำตอบ
 * @param {Array} questions - รายการคำถาม
 * @param {string} query - คำค้นหา
 * @returns {Array} - รายการคำถามที่ตรงกับคำค้นหา
 */
function searchQuestions(questions, query) {
    if (!query || isEmpty(query)) {
        return questions;
    }
    
    const searchTerm = query.toLowerCase().trim();
    
    return questions.filter(question => {
        const questionText = question.question.toLowerCase();
        const answerText = question.answer.toLowerCase();
        
        return questionText.includes(searchTerm) || answerText.includes(searchTerm);
    });
}

/**
 * ฟังก์ชันจัดเรียงคำถาม
 * @param {Array} questions - รายการคำถามที่ต้องการจัดเรียง
 * @param {string} sortBy - วิธีการจัดเรียง (newest, oldest, alphabetical)
 * @returns {Array} - รายการคำถามที่จัดเรียงแล้ว
 */
function sortQuestions(questions, sortBy = 'newest') {
    if (!questions || !Array.isArray(questions)) {
        return [];
    }
    
    const sortedQuestions = [...questions];
    
    switch (sortBy) {
        case 'newest':
            // จัดเรียงตามวันที่สร้างล่าสุด
            return sortedQuestions.sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
                const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
                return dateB - dateA;
            });
        
        case 'oldest':
            // จัดเรียงตามวันที่สร้างเก่าสุด
            return sortedQuestions.sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
                const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
                return dateA - dateB;
            });
        
        case 'alphabetical':
            // จัดเรียงตามตัวอักษร (ก-ฮ)
            return sortedQuestions.sort((a, b) => {
                return a.question.localeCompare(b.question, 'th');
            });
        
        default:
            // ค่าเริ่มต้นคือจัดเรียงตาม ID
            return sortedQuestions.sort((a, b) => b.id - a.id);
    }
}
