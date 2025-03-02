/**
 * ไฟล์จัดการ API สำหรับระบบ FAQ
 * จัดการการเชื่อมต่อกับ Supabase API
 */

/**
 * ฟังก์ชันดึงข้อมูลจาก Supabase พร้อมระยะเวลาหมดเวลา
 * @param {string} url - URL ของ API
 * @param {Object} options - ตัวเลือกสำหรับการเรียก API
 * @param {number} timeout - ระยะเวลาหมดเวลาในมิลลิวินาที
 * @returns {Promise} - Promise ที่ส่งคืนผลการเรียก API
 */
function fetchWithTimeout(url, options, timeout = CONFIG.apiTimeout) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
}

/**
 * ฟังก์ชันดึงข้อมูลจาก Supabase
 * @param {string} endpoint - Endpoint API
 * @param {Object} options - ตัวเลือกสำหรับการเรียก API
 * @returns {Promise} - Promise ที่ส่งคืนข้อมูลจาก API
 */
async function fetchFromSupabase(endpoint, options = {}) {
    const url = `${CONFIG.supabase.url}/rest/v1/${endpoint}`;
    const headers = {
        'apikey': CONFIG.supabase.key,
        'Authorization': `Bearer ${CONFIG.supabase.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers
    };

    try {
        logInfo('Fetching from:', url);
        const response = await fetchWithTimeout(url, {
            ...options,
            headers
        }, CONFIG.apiTimeout);

        if (!response.ok) {
            throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        logInfo('Data fetched successfully:', data.length, 'records');
        return data;
    } catch (error) {
        logError('Error fetching from Supabase:', error);
        throw error;
    }
}

/**
 * ฟังก์ชันดึงข้อมูล FAQ จาก Supabase
 * @returns {Promise} - Promise ที่ส่งคืนข้อมูล FAQ
 */
async function fetchFAQData() {
    try {
        // ดึงข้อมูลจาก Supabase โดยตรง
        return await fetchFromSupabase(CONFIG.supabase.table, {
            method: 'GET',
            headers: {
                'Range': '0-999',
                'Prefer': 'count=exact',
            }
        });
    } catch (error) {
        logError('Error fetching FAQ data:', error);
        throw error;
    }
}

/**
 * ฟังก์ชันค้นหาตาราง FAQ ที่มีอยู่ใน Supabase
 * @returns {Promise<string[]>} - Promise ที่ส่งคืนรายชื่อตารางที่พบ
 */
async function findAvailableTables() {
    const possibleTableNames = ['faq', 'FAQ', 'faqs', 'hr_faq', 'hr_faqs', 'hrfaq', 'qa', 'qas', 'questions'];
    const availableTables = [];
    
    for (const tableName of possibleTableNames) {
        try {
            const testUrl = `${CONFIG.supabase.url}/rest/v1/${tableName}?limit=1`;
            const response = await fetchWithTimeout(testUrl, {
                method: 'GET',
                headers: {
                    'apikey': CONFIG.supabase.key,
                    'Authorization': `Bearer ${CONFIG.supabase.key}`
                }
            }, CONFIG.apiTimeout / 2); // ใช้เวลาครึ่งหนึ่งของ timeout หลัก
            
            if (response.ok) {
                logInfo(`Table "${tableName}" exists and is accessible`);
                availableTables.push(tableName);
            }
        } catch (err) {
            logInfo(`Table "${tableName}" is not accessible`);
        }
    }
    
    return availableTables;
}

/**
 * ฟังก์ชันค้นหาและใช้ตารางที่มีอยู่
 * @returns {Promise<string>} - Promise ที่ส่งคืนชื่อตารางที่ใช้งานได้ตัวแรก
 */
async function findWorkingTable() {
    try {
        const tables = await findAvailableTables();
        
        if (tables.length > 0) {
            logInfo('Available tables:', tables);
            // อัปเดตค่าตารางที่จะใช้งาน
            CONFIG.supabase.table = tables[0];
            return tables[0];
        } else {
            throw new Error('No accessible tables found in the database');
        }
    } catch (error) {
        logError('Error finding tables:', error);
        throw error;
    }
}

/**
 * สร้างคำถามใหม่ใน Supabase
 * @param {Object} question - ข้อมูลคำถาม
 * @returns {Promise<Object>} - ข้อมูลคำถามที่สร้าง
 */
async function createQuestionInSupabase(question) {
    return await fetchFromSupabase(CONFIG.supabase.table, {
        method: 'POST',
        body: question
    });
}

/**
 * อัปเดตคำถามใน Supabase
 * @param {number} id - ID ของคำถาม
 * @param {Object} question - ข้อมูลคำถามที่จะอัปเดต
 * @returns {Promise<boolean>} - true หากสำเร็จ
 */
async function updateQuestionInSupabase(id, question) {
    return await fetchFromSupabase(CONFIG.supabase.table, {
        method: 'PATCH',
        body: question,
        params: { id: `eq.${id}` }
    });
}

/**
 * ลบคำถามจาก Supabase
 * @param {number} id - ID ของคำถาม
 * @returns {Promise<boolean>} - true หากสำเร็จ
 */
async function deleteQuestionFromSupabase(id) {
    return await fetchFromSupabase(CONFIG.supabase.table, {
        method: 'DELETE',
        params: { id: `eq.${id}` }
    });
}

/**
 * ยืนยันการลบรายการ
 */
async function confirmDelete() {
    try {
        const type = ADMIN_UI_STATE.modals.confirmDeleteModal.type;
        const itemId = ADMIN_UI_STATE.modals.confirmDeleteModal.itemId;
        
        // แสดง loading
        showLoadingOverlay();
        
        if (type === 'question') {
            // ลบคำถาม
            const id = parseInt(itemId, 10);
            const index = UI_STATE.questions.findIndex(q => q.id === id);
            
            if (index !== -1) {
                const question = UI_STATE.questions[index];
                
                try {
                    // ลบใน Supabase
                    await deleteQuestionFromSupabase(id);
                    
                    // ลบใน UI_STATE
                    UI_STATE.questions.splice(index, 1);
                    
                    // บันทึกกิจกรรม
                    logActivity('delete', 'คำถาม', `ลบคำถาม ID ${id}: ${question.question.substring(0, 30)}...`);
                    
                    showSuccess('ลบคำถามเรียบร้อยแล้ว');
                } catch (error) {
                    logError('ไม่สามารถลบข้อมูลใน Supabase ได้:', error);
                    showError('ไม่สามารถลบข้อมูลในฐานข้อมูลได้');
                    throw error;
                }
            }
            
            // โหลดข้อมูลคำถามใหม่
            if (ADMIN_UI_STATE.currentView === 'questions') {
                loadQuestionsData();
            }
        } else if (type === 'category') {
            // ... โค้ดส่วนของการลบหมวดหมู่ ...
        }
        
        // ซ่อน loading
        hideLoadingOverlay();
        
        // ปิด Modal
        toggleModal('confirmDeleteModal', false);
    } catch (error) {
        hideLoadingOverlay();
        logError('เกิดข้อผิดพลาดในการลบรายการ:', error);
        showError('ไม่สามารถลบรายการได้');
    }
}

/**
 * ลบคำถามจาก Supabase
 * @param {number} id - ID ของคำถาม
 * @returns {Promise<boolean>} - true หากสำเร็จ
 */
async function deleteQuestionFromSupabase(id) {
    try {
        const url = `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.table}?id=eq.${id}`;
        const headers = {
            'apikey': CONFIG.supabase.key,
            'Authorization': `Bearer ${CONFIG.supabase.key}`,
            'Content-Type': 'application/json'
        };

        const response = await fetchWithTimeout(url, {
            method: 'DELETE',
            headers
        }, CONFIG.apiTimeout);

        if (!response.ok) {
            throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
        }

        return true;
    } catch (error) {
        logError('Error deleting question from Supabase:', error);
        throw error;
    }
}