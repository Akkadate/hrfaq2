
/**
 * ไฟล์หลักสำหรับระบบ FAQ
 * จัดการการเริ่มต้นของแอปพลิเคชัน
 */

/**
 * ดึงข้อมูลหมวดหมู่ที่ไม่ซ้ำกันจากข้อมูลคำถาม
 * @param {Array} questions - ข้อมูลคำถามทั้งหมด
 * @returns {Array} - หมวดหมู่ที่ไม่ซ้ำกัน
 */
function extractUniqueGroups(questions) {
    const uniqueGroupsSet = new Set();
    
    questions.forEach(item => {
        if (item.group) {
            uniqueGroupsSet.add(item.group);
        }
    });
    
    return Array.from(uniqueGroupsSet);
}

/**
 * ใช้ข้อมูลตัวอย่าง
 */
function useDemo() {
    logInfo('Using demo data');
    
    const questions = DEMO_DATA;
    const groups = extractUniqueGroups(questions);
    
    initializeUI(questions, groups);
}

/**
 * เริ่มต้นแอปพลิเคชัน
 */
async function initApp() {
    try {
        // แสดง loading indicator
        showLoading();
        
        // ตั้งค่า timeout เพื่อให้ไม่ค้างอยู่ที่การโหลด
        const timeoutId = setTimeout(() => {
            logInfo('Loading timeout reached, using demo data');
            useDemo();
        }, CONFIG.apiTimeout);
        
        try {
            // พยายามค้นหาตารางและดึงข้อมูลจาก Supabase
            await findWorkingTable();
            const data = await fetchFAQData();
            
            // ยกเลิก timeout เมื่อดึงข้อมูลสำเร็จ
            clearTimeout(timeoutId);
            
            // ดึงกลุ่มที่ไม่ซ้ำกันจากข้อมูล
            const groups = extractUniqueGroups(data);
            
            logInfo('Data loaded:', data.length, 'records');
            logInfo('Groups:', groups);
            
            // เตรียมพร้อม UI
            initializeUI(data, groups);
            
        } catch (fetchError) {
            // ยกเลิก timeout เมื่อเกิดข้อผิดพลาด
            clearTimeout(timeoutId);
            logError('Error fetching data:', fetchError);
            
            // ใช้ข้อมูลตัวอย่าง
            useDemo();
        }
        
    } catch (err) {
        logError('Error setting up application:', err);
        showError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + err.message);
        
        // ยังคงพยายามแสดงข้อมูลตัวอย่าง
        useDemo();
    }
}

// เริ่มต้นแอปพลิเคชันเมื่อโหลดหน้าเสร็จ
document.addEventListener('DOMContentLoaded', initApp);
