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
 * เริ่มต้นแอปพลิเคชัน
 */
async function initApp() {
    try {
        // แสดง loading indicator
        showLoading();
        
        try {
            // พยายามค้นหาตารางและดึงข้อมูลจาก Supabase
            await findWorkingTable();
            const data = await fetchFAQData();
            
            // ดึงกลุ่มที่ไม่ซ้ำกันจากข้อมูล
            const groups = extractUniqueGroups(data);
            
            logInfo('Data loaded:', data.length, 'records');
            logInfo('Groups:', groups);
            
            // เตรียมพร้อม UI
            initializeUI(data, groups);
            
        } catch (fetchError) {
            logError('Error fetching data:', fetchError);
            
            // แสดงข้อความแจ้งเตือน
            hideLoading();
            showError('ไม่สามารถติดต่อฐานข้อมูลได้');
        }
        
    } catch (err) {
        logError('Error setting up application:', err);
        hideLoading();
        showError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + err.message);
    }
}

// เริ่มต้นแอปพลิเคชันเมื่อโหลดหน้าเสร็จ
document.addEventListener('DOMContentLoaded', initApp);