
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
 * ฟังก์ชันดึงข้อมูล FAQ จาก Supabase หรือ Cache
 * @returns {Promise} - Promise ที่ส่งคืนข้อมูล FAQ
 */
async function fetchFAQData() {
    // ตรวจสอบว่ามีการเปิดใช้งาน Cache หรือไม่
    if (CONFIG.cache.enabled) {
        // ตรวจสอบว่ามีข้อมูลใน Local Storage หรือไม่
        const cachedData = localStorage.getItem(CONFIG.cache.storageKeys.faqData);
        const cacheTime = localStorage.getItem(CONFIG.cache.storageKeys.faqDataTime);
        
        // ถ้ามีข้อมูลและข้อมูลไม่เก่าเกิน cache duration
        if (cachedData && cacheTime && (Date.now() - cacheTime < CONFIG.cache.duration)) {
            logInfo('Using cached data');
            return JSON.parse(cachedData);
        }
    }
    
    try {
        // ถ้าไม่มีข้อมูลหรือข้อมูลเก่า ให้เรียก API
        const data = await fetchFromSupabase(CONFIG.supabase.table, {
            method: 'GET',
            headers: {
                'Range': '0-999',
                'Prefer': 'count=exact',
            }
        });
        
        // บันทึกข้อมูลลงใน Local Storage ถ้าเปิดใช้งาน Cache
        if (CONFIG.cache.enabled && data) {
            localStorage.setItem(CONFIG.cache.storageKeys.faqData, JSON.stringify(data));
            localStorage.setItem(CONFIG.cache.storageKeys.faqDataTime, Date.now().toString());
            logInfo('Data cached to local storage');
        }
        
        return data;
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
