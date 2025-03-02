/**
 * ไฟล์จัดการข้อมูลสำหรับหน้าแอดมิน
 * รองรับการทำงานกับ Supabase API
 */

// ข้อมูลสำหรับการจำลองสถิติในแดชบอร์ด
const MOCK_STATS = {
    views: Math.floor(Math.random() * 5000) + 2000, // สุ่มจำนวนการเข้าชม 2,000-7,000
    activities: [
        {
            type: 'add',
            title: 'เพิ่มคำถามใหม่',
            text: 'มีการเพิ่มคำถามใหม่เกี่ยวกับการลงทะเบียนเข้าใช้งาน',
            time: '15 นาทีที่แล้ว',
            icon: 'fas fa-plus-circle',
            iconBg: '#3182ce'
        },
        {
            type: 'edit',
            title: 'แก้ไขคำถาม',
            text: 'แก้ไขคำถามเกี่ยวกับการลาป่วย',
            time: '2 ชั่วโมงที่แล้ว',
            icon: 'fas fa-edit',
            iconBg: '#dd6b20'
        },
        {
            type: 'login',
            title: 'ผู้ดูแลเข้าสู่ระบบ',
            text: 'ผู้ดูแลระบบเข้าสู่ระบบเพื่อจัดการข้อมูล',
            time: '5 ชั่วโมงที่แล้ว',
            icon: 'fas fa-sign-in-alt',
            iconBg: '#48bb78'
        },
        {
            type: 'category',
            title: 'เพิ่มหมวดหมู่ใหม่',
            text: 'เพิ่มหมวดหมู่ "การฝึกอบรม" สำหรับคำถามใหม่',
            time: '1 วันที่แล้ว',
            icon: 'fas fa-folder-plus',
            iconBg: '#805ad5'
        }
    ]
};

/**
 * โหลดข้อมูลสำหรับแดชบอร์ด
 */
function loadDashboardData() {
    try {
        // โหลดข้อมูลที่บันทึกไว้ก่อน (ถ้ามี)
        loadSavedData();
        
        // แสดงจำนวนคำถามทั้งหมด
        document.getElementById('totalQuestions').textContent = UI_STATE.questions.length;
        
        // แสดงจำนวนหมวดหมู่
        document.getElementById('totalCategories').textContent = UI_STATE.groups.length;
        
        // แสดงจำนวนการเข้าชม (สร้างขึ้นเพื่อการสาธิต)
        document.getElementById('totalViews').textContent = MOCK_STATS.views.toLocaleString();
        
        // แสดงวันที่อัปเดตล่าสุด
        document.getElementById('lastUpdate').textContent = CONFIG.lastUpdated;
        
        // สร้างตารางสถิติตามหมวดหมู่
        const categoryStatsTable = document.getElementById('categoryStatsTable');
        const tbody = categoryStatsTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        // จัดกลุ่มคำถามตามหมวดหมู่
        const groupedQuestions = {};
        UI_STATE.groups.forEach(group => {
            groupedQuestions[group] = UI_STATE.questions.filter(q => q.group === group).length;
        });
        
        // เพิ่มข้อมูลลงในตาราง
        UI_STATE.groups.forEach(group => {
            const tr = document.createElement('tr');
            
            // ไอคอนและชื่อหมวดหมู่
            const iconClass = CONFIG.groupIcons[group] || CONFIG.defaultGroupIcon;
            const tdCategory = document.createElement('td');
            tdCategory.innerHTML = `<i class="${iconClass}"></i> ${group}`;
            
            // จำนวนคำถาม
            const tdQuestions = document.createElement('td');
            tdQuestions.textContent = groupedQuestions[group];
            
            // จำนวนการเข้าชม (สร้างขึ้นเพื่อการสาธิต)
            const tdViews = document.createElement('td');
            const views = Math.floor(Math.random() * 1000) + 100; // สุ่มจำนวนการเข้าชม 100-1,100
            tdViews.textContent = views.toLocaleString();
            
            tr.appendChild(tdCategory);
            tr.appendChild(tdQuestions);
            tr.appendChild(tdViews);
            
            tbody.appendChild(tr);
        });
        
        // สร้างรายการกิจกรรมล่าสุด
        const recentActivities = document.getElementById('recentActivities');
        recentActivities.innerHTML = '';
        
        // โหลดกิจกรรมจากการบันทึก
        const activities = getRecentActivities(5);
        if (activities.length > 0) {
            // ถ้ามีกิจกรรมที่บันทึกไว้ ให้แสดงกิจกรรมนั้น
            activities.forEach(activity => {
                const li = document.createElement('li');
                
                // กำหนดสีและไอคอนตามประเภทกิจกรรม
                let icon = 'fas fa-info-circle';
                let iconBg = '#3182ce';
                
                switch (activity.action) {
                    case 'add':
                        icon = 'fas fa-plus-circle';
                        iconBg = '#3182ce';
                        break;
                    case 'edit':
                        icon = 'fas fa-edit';
                        iconBg = '#dd6b20';
                        break;
                    case 'delete':
                        icon = 'fas fa-trash-alt';
                        iconBg = '#e53e3e';
                        break;
                    case 'view':
                        icon = 'fas fa-eye';
                        iconBg = '#48bb78';
                        break;
                }
                
                const activityIcon = document.createElement('div');
                activityIcon.className = 'activity-icon';
                activityIcon.style.backgroundColor = iconBg + '20'; // เพิ่มความโปร่งใส
                activityIcon.style.color = iconBg;
                activityIcon.innerHTML = `<i class="${icon}"></i>`;
                
                const activityInfo = document.createElement('div');
                activityInfo.className = 'activity-info';
                activityInfo.innerHTML = `
                    <p><b>${activity.action === 'add' ? 'เพิ่ม' : activity.action === 'edit' ? 'แก้ไข' : activity.action === 'delete' ? 'ลบ' : 'ดู'}${activity.section}</b></p>
                    <p>${activity.description}</p>
                    <p class="activity-time">${formatTimeAgo(activity.timestamp)}</p>
                `;
                
                li.appendChild(activityIcon);
                li.appendChild(activityInfo);
                
                recentActivities.appendChild(li);
            });
        } else {
            // ถ้าไม่มีกิจกรรมที่บันทึกไว้ ให้แสดงข้อมูลตัวอย่าง
            MOCK_STATS.activities.forEach(activity => {
                const li = document.createElement('li');
                
                const activityIcon = document.createElement('div');
                activityIcon.className = 'activity-icon';
                activityIcon.style.backgroundColor = activity.iconBg + '20'; // เพิ่มความโปร่งใส
                activityIcon.style.color = activity.iconBg;
                activityIcon.innerHTML = `<i class="${activity.icon}"></i>`;
                
                const activityInfo = document.createElement('div');
                activityInfo.className = 'activity-info';
                activityInfo.innerHTML = `
                    <p><b>${activity.title}</b></p>
                    <p>${activity.text}</p>
                    <p class="activity-time">${activity.time}</p>
                `;
                
                li.appendChild(activityIcon);
                li.appendChild(activityInfo);
                
                recentActivities.appendChild(li);
            });
        }
        
        // บันทึกกิจกรรม
        logActivity('view', 'แดชบอร์ด', 'ดูแดชบอร์ด');
        
    } catch (error) {
        logError('เกิดข้อผิดพลาดในการโหลดข้อมูลแดชบอร์ด:', error);
        showError('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
    }
}

/**
 * โหลดข้อมูลคำถามและแสดงในตาราง
 */
function loadQuestionsData() {
    try {
        // โหลดข้อมูลที่บันทึกไว้ก่อน (ถ้ามี)
        loadSavedData();
        
        // โหลดหมวดหมู่ลงในตัวกรอง
        loadCategoriesForFilter();
        
        // ดึงข้อมูลคำถามที่กรองและจัดเรียงแล้ว
        let filteredQuestions = filterQuestions(UI_STATE.questions);
        
        // จัดเรียงคำถาม
        filteredQuestions = sortQuestions(filteredQuestions, ADMIN_UI_STATE.filters.sortFilter);
        
        // สร้าง pagination
        const totalItems = filteredQuestions.length;
        const currentPage = ADMIN_UI_STATE.pagination.currentPage;
        const itemsPerPage = ADMIN_UI_STATE.pagination.itemsPerPage;
        
        createPagination(totalItems, currentPage, itemsPerPage, 'questionsPagination');
        
        // ดึงข้อมูลเฉพาะในหน้าปัจจุบัน
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);
        
        // แสดงข้อมูลในตาราง
        const questionsTable = document.getElementById('questionsTable');
        const tbody = questionsTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        if (paginatedQuestions.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 6;
            td.className = 'empty-message';
            td.innerHTML = '<i class="fas fa-info-circle"></i> ไม่พบข้อมูลคำถาม';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }
        
        paginatedQuestions.forEach(question => {
            const tr = document.createElement('tr');
            
            // ID
            const tdId = document.createElement('td');
            tdId.textContent = question.id;
            
            // คำถาม
            const tdQuestion = document.createElement('td');
            tdQuestion.textContent = question.question;
            
            // หมวดหมู่
            const tdCategory = document.createElement('td');
            const iconClass = CONFIG.groupIcons[question.group] || CONFIG.defaultGroupIcon;
            tdCategory.innerHTML = `<i class="${iconClass}"></i> ${question.group}`;
            
            // วันที่สร้าง
            const tdCreatedAt = document.createElement('td');
            tdCreatedAt.textContent = formatThaiDate(question.created_at);
            
            // วันที่แก้ไข
            const tdUpdatedAt = document.createElement('td');
            tdUpdatedAt.textContent = question.updated_at ? formatThaiDate(question.updated_at) : formatThaiDate(question.created_at);
            
            // การจัดการ
            const tdActions = document.createElement('td');
            tdActions.className = 'action-buttons';
            
            // ปุ่มแก้ไข
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-info btn-icon';
            editBtn.title = 'แก้ไข';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.addEventListener('click', () => prepareEditQuestion(question.id));
            
            // ปุ่มลบ
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-icon';
            deleteBtn.title = 'ลบ';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.addEventListener('click', () => prepareConfirmDelete('question', question.id));
            
            tdActions.appendChild(editBtn);
            tdActions.appendChild(deleteBtn);
            
            tr.appendChild(tdId);
            tr.appendChild(tdQuestion);
            tr.appendChild(tdCategory);
            tr.appendChild(tdCreatedAt);
            tr.appendChild(tdUpdatedAt);
            tr.appendChild(tdActions);
            
            tbody.appendChild(tr);
        });
        
        // บันทึกกิจกรรม
        logActivity('view', 'คำถาม', 'ดูรายการคำถาม');
        
    } catch (error) {
        logError('เกิดข้อผิดพลาดในการโหลดข้อมูลคำถาม:', error);
        showError('ไม่สามารถโหลดข้อมูลคำถามได้');
    }
}

/**
 * โหลดหมวดหมู่ลงในตัวกรอง
 */
function loadCategoriesForFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    // บันทึกค่าที่เลือกไว้
    const selectedValue = categoryFilter.value;
    
    // ล้างตัวเลือกเดิม (ยกเว้น "ทั้งหมด")
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // เพิ่มตัวเลือกหมวดหมู่
    UI_STATE.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        
        if (selectedValue && group === selectedValue) {
            option.selected = true;
        }
        
        categoryFilter.appendChild(option);
    });
}

/**
 * กรองคำถามตามเงื่อนไข
 * @param {Array} questions - ข้อมูลคำถามทั้งหมด
 * @returns {Array} - ข้อมูลคำถามที่กรองแล้ว
 */
function filterQuestions(questions) {
    let result = [...questions];
    
    // กรองตามหมวดหมู่
    if (ADMIN_UI_STATE.filters.categoryFilter !== 'all') {
        result = result.filter(q => q.group === ADMIN_UI_STATE.filters.categoryFilter);
    }
    
    // กรองตามคำค้นหา
    if (ADMIN_UI_STATE.filters.searchQuery) {
        const searchTerm = ADMIN_UI_STATE.filters.searchQuery.toLowerCase();
        result = result.filter(q => 
            q.question.toLowerCase().includes(searchTerm) || 
            q.answer.toLowerCase().includes(searchTerm)
        );
    }
    
    return result;
}

/**
 * โหลดข้อมูลหมวดหมู่และแสดงในตาราง
 */
function loadCategoriesData() {
    try {
        // โหลดข้อมูลที่บันทึกไว้ก่อน (ถ้ามี)
        loadSavedData();
        
        const categoriesTable = document.getElementById('categoriesTable');
        const tbody = categoriesTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        if (UI_STATE.groups.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 5;
            td.className = 'empty-message';
            td.innerHTML = '<i class="fas fa-info-circle"></i> ไม่พบข้อมูลหมวดหมู่';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }
        
        // จัดกลุ่มคำถามตามหมวดหมู่
        const groupedQuestions = {};
        UI_STATE.groups.forEach(group => {
            groupedQuestions[group] = UI_STATE.questions.filter(q => q.group === group).length;
        });
        
        // เพิ่มข้อมูลลงในตาราง
        UI_STATE.groups.forEach((group, index) => {
            const tr = document.createElement('tr');
            
            // ลำดับ
            const tdOrder = document.createElement('td');
            tdOrder.textContent = index + 1;
            
            // ชื่อหมวดหมู่
            const tdName = document.createElement('td');
            tdName.textContent = group;
            
            // ไอคอน
            const tdIcon = document.createElement('td');
            const iconClass = CONFIG.groupIcons[group] || CONFIG.defaultGroupIcon;
            tdIcon.innerHTML = `<i class="${iconClass}"></i> ${iconClass}`;
            
            // จำนวนคำถาม
            const tdCount = document.createElement('td');
            tdCount.textContent = groupedQuestions[group];
            
            // การจัดการ
            const tdActions = document.createElement('td');
            tdActions.className = 'action-buttons';
            
            // ปุ่มแก้ไข
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-info btn-icon';
            editBtn.title = 'แก้ไข';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.addEventListener('click', () => prepareEditCategory(group));
            
            // ปุ่มลบ
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-icon';
            deleteBtn.title = 'ลบ';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.addEventListener('click', () => prepareConfirmDelete('category', group));
            
            tdActions.appendChild(editBtn);
            tdActions.appendChild(deleteBtn);
            
            tr.appendChild(tdOrder);
            tr.appendChild(tdName);
            tr.appendChild(tdIcon);
            tr.appendChild(tdCount);
            tr.appendChild(tdActions);
            
            tbody.appendChild(tr);
        });
        
        // บันทึกกิจกรรม
        logActivity('view', 'หมวดหมู่', 'ดูรายการหมวดหมู่');
        
    } catch (error) {
        logError('เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่:', error);
        showError('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้');
    }
}

/**
 * โหลดข้อมูลการตั้งค่าและแสดงในฟอร์ม
 */
function loadSettingsData() {
    try {
        // แสดงการตั้งค่า Supabase
        document.getElementById('supabaseUrl').value = CONFIG.supabase.url;
        document.getElementById('supabaseKey').value = CONFIG.supabase.key;
        document.getElementById('supabaseTable').value = CONFIG.supabase.table;
        
        // แสดงการตั้งค่าแคช
        document.getElementById('enableCache').checked = CONFIG.cache.enabled;
        document.getElementById('cacheDuration').value = CONFIG.cache.duration;
        
        // แสดงการตั้งค่าทั่วไป
        document.getElementById('appVersion').value = CONFIG.version;
        
        // แปลงวันที่เป็นรูปแบบที่ใช้กับ input type="date"
        const lastUpdatedParts = CONFIG.lastUpdated.split(' ');
        
        // สร้างวันที่แบบ yyyy-mm-dd
        let dateValue = '';
        
        try {
            // ถ้าวันที่อยู่ในรูปแบบไทย ให้แปลงเป็นรูปแบบสากล
            const day = parseInt(lastUpdatedParts[0], 10);
            
            const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                                'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            const monthIndex = thaiMonths.indexOf(lastUpdatedParts[1]);
            
            // แปลงปีพุทธศักราชเป็นคริสต์ศักราช
            const thaiYear = parseInt(lastUpdatedParts[2], 10);
            const year = thaiYear - 543;
            
            if (day && monthIndex !== -1 && year) {
                const month = monthIndex + 1;
                dateValue = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            } else {
                // ถ้าไม่สามารถแปลงได้ ให้ใช้วันที่ปัจจุบัน
                const today = new Date();
                dateValue = today.toISOString().split('T')[0];
            }
        } catch (e) {
            // ถ้าเกิดข้อผิดพลาด ให้ใช้วันที่ปัจจุบัน
            const today = new Date();
            dateValue = today.toISOString().split('T')[0];
        }
        
        document.getElementById('lastUpdatedDate').value = dateValue;
        
        // บันทึกกิจกรรม
        logActivity('view', 'การตั้งค่า', 'ดูการตั้งค่าระบบ');
        
    } catch (error) {
        logError('เกิดข้อผิดพลาดในการโหลดข้อมูลการตั้งค่า:', error);
        showError('ไม่สามารถโหลดข้อมูลการตั้งค่าได้');
    }
}

/**
 * บันทึกการตั้งค่า
 */
function saveSettings() {
    try {
        // อัปเดตการตั้งค่า Supabase
        CONFIG.supabase.url = document.getElementById('supabaseUrl').value;
        CONFIG.supabase.key = document.getElementById('supabaseKey').value;
        CONFIG.supabase.table = document.getElementById('supabaseTable').value;
        
        // อัปเดตการตั้งค่าแคช
        CONFIG.cache.enabled = document.getElementById('enableCache').checked;
        CONFIG.cache.duration = parseInt(document.getElementById('cacheDuration').value, 10);
        
        // อัปเดตการตั้งค่าทั่วไป
        CONFIG.version = document.getElementById('appVersion').value;
        
        // แปลงวันที่จาก input type="date" เป็นข้อความ
        const dateInput = document.getElementById('lastUpdatedDate').value;
        const date = new Date(dateInput);
        CONFIG.lastUpdated = formatThaiDate(date);
        
        // อัปเดตการแสดงวันที่ในส่วนท้าย
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = CONFIG.lastUpdated;
        }
        
        // บันทึกการตั้งค่าลงใน localStorage
        localStorage.setItem('adminFaqConfig', JSON.stringify(CONFIG));
        
        // บันทึกกิจกรรม
        logActivity('edit', 'การตั้งค่า', 'อัปเดตการตั้งค่าระบบ');
        
        // แสดงข้อความแจ้งเตือน
        showSuccess('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    } catch (error) {
        logError('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า:', error);
        showError('ไม่สามารถบันทึกการตั้งค่าได้');
    }
}

/**
 * ฟังก์ชันสำหรับการเรียก Supabase API
 * @param {string} endpoint - endpoint ของ API
 * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
 * @param {Object} body - ข้อมูลที่จะส่งไปกับ request (สำหรับ POST, PATCH)
 * @param {Object} params - พารามิเตอร์ query string
 * @returns {Promise} - Promise ที่ส่งคืนผลลัพธ์
 */
async function callSupabaseApi(endpoint, method, body = null, params = {}) {
    try {
        let url = `${CONFIG.supabase.url}/rest/v1/${endpoint}`;
        
        // เพิ่ม query string parameters
        if (Object.keys(params).length > 0) {
            const queryParams = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
                queryParams.append(key, value);
            }
            url += `?${queryParams.toString()}`;
        }
        
        const headers = {
            'apikey': CONFIG.supabase.key,
            'Authorization': `Bearer ${CONFIG.supabase.key}`,
            'Content-Type': 'application/json',
            'Prefer': method === 'POST' ? 'return=representation' : ''
        };
        
        const requestOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        };
        
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
            throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
        }
        
        // สำหรับ DELETE ไม่จำเป็นต้องมี response body
        if (method === 'DELETE') {
            return true;
        }
        
        // สำหรับ GET, POST, PATCH ให้ส่งคืน response body
        return await response.json();
    } catch (error) {
        logError(`Error calling Supabase API (${method} ${endpoint}):`, error);
        throw error;
    }
}

/**
 * สร้างคำถามใหม่ใน Supabase
 * @param {Object} question - ข้อมูลคำถาม
 * @returns {Promise<Object>} - ข้อมูลคำถามที่สร้าง
 */
async function createQuestionInSupabase(question) {
    return await callSupabaseApi(CONFIG.supabase.table, 'POST', question);
}

/**
 * อัปเดตคำถามใน Supabase
 * @param {number} id - ID ของคำถาม
 * @param {Object} question - ข้อมูลคำถามที่จะอัปเดต
 * @returns {Promise<boolean>} - true หากสำเร็จ
 */
async function updateQuestionInSupabase(id, question) {
    return await callSupabaseApi(CONFIG.supabase.table, 'PATCH', question, { id: `eq.${id}` });
}

/**
 * ลบคำถามจาก Supabase
 * @param {number} id - ID ของคำถาม
 * @returns {Promise<boolean>} - true หากสำเร็จ
 */
async function deleteQuestionFromSupabase(id) {
    return await callSupabaseApi(CONFIG.supabase.table, 'DELETE', null, { id: `eq.${id}` });
}

/**
 * บันทึกคำถาม (เพิ่มคำถามใหม่ หรือ แก้ไขคำถามเดิม)
 */
async function saveQuestion() {
    try {
        const questionId = document.getElementById('questionId').value;
        const questionText = document.getElementById('questionText').value;
        const questionCategory = document.getElementById('questionCategory').value;
        const questionAnswer = document.getElementById('questionAnswer').value;
        
        // ตรวจสอบข้อมูล
        if (!questionText || !questionCategory || !questionAnswer) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        
        // แสดง loading
        showLoadingOverlay();
        
        if (ADMIN_UI_STATE.modals.questionModal.mode === 'add') {
            // สร้างคำถามใหม่
            const newQuestion = {
                question: questionText,
                answer: questionAnswer,
                group: questionCategory,
                created_at: new Date().toISOString()
            };
            
            try {
                // บันทึกลงใน Supabase
                const result = await createQuestionInSupabase(newQuestion);
                
                if (result && result.length > 0) {
                    // อัพเดทข้อมูลใน UI_STATE
                    UI_STATE.questions.push({...result[0]});
                    
                    // บันทึกกิจกรรม
                    logActivity('add', 'คำถาม', `เพิ่มคำถามใหม่: ${questionText.substring(0, 30)}...`);
                    
                    showSuccess('เพิ่มคำถามใหม่เรียบร้อยแล้ว');
                    
                    // บันทึกข้อมูลลง localStorage
                    saveAllData();
                } else {
                    throw new Error('ไม่ได้รับข้อมูลตอบกลับจาก Supabase API');
                }
            } catch (error) {
                logError('ไม่สามารถบันทึกข้อมูลลง Supabase ได้:', error);
                showWarning('ไม่สามารถบันทึกข้อมูลไปยังฐานข้อมูลได้ - บันทึกในเครื่องเท่านั้น');
                
                // ยังคงบันทึกไว้ใน localStorage เมื่อพบปัญหา
                const newId = Math.max(...UI_STATE.questions.map(q => q.id || 0), 0) + 1;
                UI_STATE.questions.push({
                    id: newId,
                    question: questionText,
                    answer: questionAnswer,
                    group: questionCategory,
                    created_at: new Date().toISOString()
                });
                saveAllData();
            }
        } else {
            // แก้ไขคำถามที่มีอยู่
            const id = parseInt(questionId, 10);
            const index = UI_STATE.questions.findIndex(q => q.id === id);
            
            if (index !== -1) {
                const updatedQuestion = {
                    question: questionText,
                    answer: questionAnswer,
                    group: questionCategory,
                    updated_at: new Date().toISOString()
                };
                
                try {
                    // อัพเดทใน Supabase
                    await updateQuestionInSupabase(id, updatedQuestion);
                    
                    // อัพเดทข้อมูลใน UI_STATE
                    UI_STATE.questions[index] = {
                        ...UI_STATE.questions[index],
                        ...updatedQuestion
                    };
                    
                    // บันทึกกิจกรรม
                    logActivity('edit', 'คำถาม', `แก้ไขคำถาม ID ${id}: ${questionText.substring(0, 30)}...`);
                    
                    showSuccess('แก้ไขคำถามเรียบร้อยแล้ว');
                    
                    // บันทึกข้อมูลลง localStorage
                    saveAllData();
                } catch (error) {
                    logError('ไม่สามารถอัพเดทข้อมูลใน Supabase ได้:', error);
                    showWarning('ไม่สามารถอัพเดทข้อมูลไปยังฐานข้อมูลได้ - บันทึกในเครื่องเท่านั้น');
                    
                    // ยังคงอัพเดทใน localStorage เมื่อพบปัญหา
                    UI_STATE.questions[index] = {
                        ...UI_STATE.questions[index],
                        ...updatedQuestion
                    };
                    saveAllData();
                }
            }
        }
        
        // ซ่อน loading
        hideLoadingOverlay();
        
        // ปิด Modal
        toggleModal('questionModal', false);
        
        // โหลดข้อมูลใหม่
        if (ADMIN_UI_STATE.currentView === 'questions') {
            loadQuestionsData();
        } else {
            switchAdminView('questions');
        }
    } catch (error) {
        hideLoadingOverlay();
        logError('เกิดข้อผิดพลาดในการบันทึกคำถาม:', error);
        showError('ไม่สามารถบันทึกคำถามได้');
    }
}

/**
 * บันทึกหมวดหมู่
 */
async function saveCategory() {
    try {
        const categoryId = document.getElementById('categoryId').value;
        const categoryName = document.getElementById('categoryName').value;
        const categoryIcon = document.getElementById('categoryIcon').value;
        
        // ตรวจสอบข้อมูล
        if (!categoryName) {
            alert('กรุณากรอกชื่อหมวดหมู่');
            return;
        }
        
        // แสดง loading
        showLoadingOverlay();
        
        if (ADMIN_UI_STATE.modals.categoryModal.mode === 'add') {
            // ตรวจสอบว่าหมวดหมู่ซ้ำหรือไม่
            if (UI_STATE.groups.includes(categoryName)) {
                alert('หมวดหมู่นี้มีอยู่แล้ว');
                hideLoadingOverlay();
                return;
            }
            
            // เพิ่มหมวดหมู่ใหม่
            UI_STATE.groups.push(categoryName);
            
            // เพิ่มไอคอนสำหรับหมวดหมู่
            CONFIG.groupIcons[categoryName] = categoryIcon;
            
            // บันทึกกิจกรรม
            logActivity('add', 'หมวดหมู่', `เพิ่มหมวดหมู่ใหม่: ${categoryName}`);
            
            // แสดงข้อความแจ้งเตือน
            showSuccess('เพิ่มหมวดหมู่ใหม่เรียบร้อยแล้ว');
        } else {
            // แก้ไขหมวดหมู่ที่มีอยู่
            const oldCategoryName = categoryId;
            
            // ตรวจสอบว่าชื่อหมวดหมู่ใหม่ซ้ำหรือไม่ (ถ้าเปลี่ยน)
            if (categoryName !== oldCategoryName && UI_STATE.groups.includes(categoryName)) {
                alert('หมวดหมู่นี้มีอยู่แล้ว');
                hideLoadingOverlay();
                return;
            }
            
            // อัปเดตชื่อหมวดหมู่
            if (categoryName !== oldCategoryName) {
                const index = UI_STATE.groups.findIndex(g => g === oldCategoryName);
                
                if (index !== -1) {
                    UI_STATE.groups[index] = categoryName;
                    
                    // อัปเดตหมวดหมู่ในคำถาม
                    const updatePromises = [];
                    
                    UI_STATE.questions.forEach(question => {
                        if (question.group === oldCategoryName) {
                            question.group = categoryName;
                            question.updated_at = new Date().toISOString();
                            
                            // พยายามอัพเดทใน Supabase
                            if (question.id) {
                                const updatePromise = updateQuestionInSupabase(question.id, {
                                    group: categoryName,
                                    updated_at: question.updated_at
                                }).catch(error => {
                                    logError(`ไม่สามารถอัพเดทหมวดหมู่สำหรับคำถาม ID ${question.id} ได้:`, error);
                                });
                                
                                updatePromises.push(updatePromise);
                            }
                        }
                    });
                    
                    // รอให้การอัพเดทเสร็จสิ้น
                    try {
                        await Promise.allSettled(updatePromises);
                    } catch (updateError) {
                        logError('เกิดข้อผิดพลาดในการอัพเดทคำถามหลังการเปลี่ยนชื่อหมวดหมู่:', updateError);
                    }
                    
                    // ย้ายไอคอนไปยังชื่อใหม่
                    CONFIG.groupIcons[categoryName] = categoryIcon;
                    delete CONFIG.groupIcons[oldCategoryName];
                }
            } else {
                // อัปเดตเฉพาะไอคอน
                CONFIG.groupIcons[categoryName] = categoryIcon;
            }
            
            // บันทึกกิจกรรม
            logActivity('edit', 'หมวดหมู่', `แก้ไขหมวดหมู่: ${oldCategoryName} -> ${categoryName}`);
            
            // แสดงข้อความแจ้งเตือน
            showSuccess('แก้ไขหมวดหมู่เรียบร้อยแล้ว');
        }
        
        // บันทึกข้อมูลลงใน localStorage
        saveAllData();
        
        // ซ่อน loading
        hideLoadingOverlay();
        
        // ปิด Modal
        toggleModal('categoryModal', false);
        
        // โหลดข้อมูลใหม่
        if (ADMIN_UI_STATE.currentView === 'categories') {
            loadCategoriesData();
        } else {
            switchAdminView('categories');
        }
    } catch (error) {
        hideLoadingOverlay();
        logError('เกิดข้อผิดพลาดในการบันทึกหมวดหมู่:', error);
        showError('ไม่สามารถบันทึกหมวดหมู่ได้');
    }
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
                    showWarning('ไม่สามารถลบข้อมูลในฐานข้อมูลได้ - ลบในเครื่องเท่านั้น');
                    
                    // ยังคงลบใน localStorage เมื่อพบปัญหา
                    UI_STATE.questions.splice(index, 1);
                }
                
                // บันทึกข้อมูลลงใน localStorage
                saveAllData();
            }
            
            // โหลดข้อมูลคำถามใหม่
            if (ADMIN_UI_STATE.currentView === 'questions') {
                loadQuestionsData();
            }
        } else if (type === 'category') {
            // ลบหมวดหมู่
            const index = UI_STATE.groups.findIndex(g => g === itemId);
            
            if (index !== -1) {
                // อัปเดตหมวดหมู่ในคำถาม (กำหนดให้ไปอยู่ในหมวดหมู่แรก หรือไม่มีหมวดหมู่)
                const defaultGroup = UI_STATE.groups.length > 1 ? 
                    (UI_STATE.groups[0] === itemId ? UI_STATE.groups[1] : UI_STATE.groups[0]) : '';
                
                // สร้าง Promise array สำหรับการอัพเดททั้งหมด
                const updatePromises = [];
                
                UI_STATE.questions.forEach(question => {
                    if (question.group === itemId) {
                        question.group = defaultGroup;
                        question.updated_at = new Date().toISOString();
                        
                        // เพิ่ม Promise ไปใน array
                        if (question.id) {
                            updatePromises.push(
                                updateQuestionInSupabase(question.id, {
                                    group: defaultGroup,
                                    updated_at: question.updated_at
                                }).catch(error => {
                                    logError(`ไม่สามารถอัพเดทหมวดหมู่สำหรับคำถาม ID ${question.id} ได้:`, error);
                                })
                            );
                        }
                    }
                });
                
                // รอให้การอัพเดททั้งหมดเสร็จสิ้น
                try {
                    await Promise.allSettled(updatePromises);
                } catch (updateError) {
                    logError('เกิดข้อผิดพลาดในการอัพเดทคำถามหลังการลบหมวดหมู่:', updateError);
                    showWarning('เกิดข้อผิดพลาดบางส่วนในการอัพเดทคำถาม');
                }
                
                // ลบหมวดหมู่จาก UI_STATE
                UI_STATE.groups.splice(index, 1);
                
                // ลบไอคอนของหมวดหมู่
                delete CONFIG.groupIcons[itemId];
                
                // บันทึกกิจกรรม
                logActivity('delete', 'หมวดหมู่', `ลบหมวดหมู่: ${itemId}`);
                
                // แสดงข้อความแจ้งเตือน
                showSuccess('ลบหมวดหมู่เรียบร้อยแล้ว');
                
                // บันทึกข้อมูลลงใน localStorage
                saveAllData();
            }
            
            // โหลดข้อมูลหมวดหมู่ใหม่
            if (ADMIN_UI_STATE.currentView === 'categories') {
                loadCategoriesData();
            }
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
 * แสดงข้อความแจ้งเตือนสำเร็จ
 * @param {string} message - ข้อความแจ้งเตือน
 */
function showSuccess(message) {
    // สร้าง success toast notification
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #38a169;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        display: flex;
        align-items: center;
        max-width: 80%;
    `;
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-check-circle';
    icon.style.marginRight = '10px';
    
    const text = document.createElement('div');
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    document.body.appendChild(toast);
    
    // ให้ toast หายไปหลังจาก 3 วินาที
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 500);
    }, 3000);
}

/**
 * แสดงข้อความเตือน
 * @param {string} message - ข้อความเตือน
 */
function showWarning(message) {
    // สร้าง warning toast notification
    const toast = document.createElement('div');
    toast.className = 'warning-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #dd6b20;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        display: flex;
        align-items: center;
        max-width: 80%;
    `;
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-exclamation-triangle';
    icon.style.marginRight = '10px';
    
    const text = document.createElement('div');
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    document.body.appendChild(toast);
    
    // ให้ toast หายไปหลังจาก 4 วินาที
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 500);
    }, 4000);
}

/**
 * แสดงข้อความผิดพลาด
 * @param {string} message - ข้อความผิดพลาด
 */
function showError(message) {
    // สร้าง error toast notification
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #e53e3e;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        display: flex;
        align-items: center;
        max-width: 80%;
    `;
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-exclamation-circle';
    icon.style.marginRight = '10px';
    
    const text = document.createElement('div');
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    document.body.appendChild(toast);
    
    // ให้ toast หายไปหลังจาก 5 วินาที
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 500);
    }, 5000);
}

/**
 * แสดง loading overlay
 */
function showLoadingOverlay() {
    // ตรวจสอบว่ามี loading overlay อยู่แล้วหรือไม่
    if (document.getElementById('admin-loading-overlay')) {
        document.getElementById('admin-loading-overlay').style.display = 'flex';
        return;
    }
    
    // สร้าง loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'admin-loading-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    
    const loadingBox = document.createElement('div');
    loadingBox.style.cssText = `
        background-color: white;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        text-align: center;
    `;
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.style.cssText = `
        width: 50px;
        height: 50px;
        border: 5px solid rgba(66, 153, 225, 0.3);
        border-radius: 50%;
        border-top-color: #3182ce;
        animation: spin 1s ease-in-out infinite;
        margin: 0 auto 15px;
    `;
    
    const loadingText = document.createElement('div');
    loadingText.textContent = 'กำลังประมวลผล...';
    loadingText.style.cssText = `
        color: #4a5568;
        font-size: 16px;
        font-weight: 500;
    `;
    
    // สร้าง keyframes สำหรับ animation
    if (!document.getElementById('loading-spinner-keyframes')) {
        const keyframes = document.createElement('style');
        keyframes.id = 'loading-spinner-keyframes';
        keyframes.innerHTML = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(keyframes);
    }
    
    loadingBox.appendChild(spinner);
    loadingBox.appendChild(loadingText);
    overlay.appendChild(loadingBox);
    document.body.appendChild(overlay);
}

/**
 * ซ่อน loading overlay
 */
function hideLoadingOverlay() {
    const overlay = document.getElementById('admin-loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * บันทึกกิจกรรม
 * @param {string} action - ประเภทการกระทำ (add, edit, delete, view)
 * @param {string} section - ส่วนที่ทำการกระทำ (คำถาม, หมวดหมู่, การตั้งค่า)
 * @param {string} description - รายละเอียดการกระทำ
 */
function logActivity(action, section, description) {
    try {
        const activities = JSON.parse(localStorage.getItem('adminFaqActivities') || '[]');
        
        // เพิ่มกิจกรรมใหม่
        activities.unshift({
            action,
            section,
            description,
            timestamp: new Date().toISOString(),
            user: getAuthData()?.user?.username || 'unknown'
        });
        
        // จำกัดจำนวนกิจกรรมที่เก็บไว้ (เก็บแค่ 50 รายการล่าสุด)
        if (activities.length > 50) {
            activities.length = 50;
        }
        
        // บันทึกลงใน localStorage
        localStorage.setItem('adminFaqActivities', JSON.stringify(activities));
    } catch (error) {
        logError('เกิดข้อผิดพลาดในการบันทึกกิจกรรม:', error);
    }
}

/**
 * โหลดกิจกรรมล่าสุด
 * @param {number} limit - จำนวนกิจกรรมที่ต้องการโหลด
 * @returns {Array} - รายการกิจกรรม
 */
function getRecentActivities(limit = 10) {
    try {
        const activities = JSON.parse(localStorage.getItem('adminFaqActivities') || '[]');
        return activities.slice(0, limit);
    } catch (error) {
        logError('เกิดข้อผิดพลาดในการโหลดกิจกรรม:', error);
        return [];
    }
}

/**
 * แปลงเวลาเป็นรูปแบบ "เมื่อ XX นาที/ชั่วโมง/วันที่แล้ว"
 * @param {string} dateStr - วันที่ที่ต้องการแปลง
 * @returns {string} - ข้อความแสดงเวลาที่ผ่านมา
 */
function formatTimeAgo(dateStr) {
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
 * บันทึกข้อมูลทั้งหมดลงใน localStorage
 */

/**
 * โหลดข้อมูลที่บันทึกไว้ใน localStorage
 */
function loadSavedData() {
    try {
        // โหลดข้อมูลคำถาม
        const savedQuestions = localStorage.getItem('adminFaqQuestions');
        if (savedQuestions) {
            UI_STATE.questions = JSON.parse(savedQuestions);
            UI_STATE.filteredQuestions = [...UI_STATE.questions];
        }
        
        // โหลดข้อมูลหมวดหมู่
        const savedGroups = localStorage.getItem('adminFaqGroups');
        if (savedGroups) {
            UI_STATE.groups = JSON.parse(savedGroups);
        }
        
        // โหลดไอคอนของหมวดหมู่
        const savedGroupIcons = localStorage.getItem('adminFaqGroupIcons');
        if (savedGroupIcons) {
            const groupIcons = JSON.parse(savedGroupIcons);
            // อัปเดตไอคอนในการตั้งค่า
            Object.keys(groupIcons).forEach(group => {
                CONFIG.groupIcons[group] = groupIcons[group];
            });
        }
        
        // โหลดการตั้งค่า
        const savedConfig = localStorage.getItem('adminFaqConfig');
        if (savedConfig) {
            const configObj = JSON.parse(savedConfig);
            // อัปเดตการตั้งค่าแต่ละส่วน
            if (configObj.supabase) {
                CONFIG.supabase = {...CONFIG.supabase, ...configObj.supabase};
            }
            if (configObj.cache) {
                CONFIG.cache = {...CONFIG.cache, ...configObj.cache};
            }
            if (configObj.version) {
                CONFIG.version = configObj.version;
            }
            if (configObj.lastUpdated) {
                CONFIG.lastUpdated = configObj.lastUpdated;
            }
        }
        
        logInfo('โหลดข้อมูลจาก localStorage เรียบร้อยแล้ว');
        return true;
    } catch (error) {
        logError('เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
        return false;
    }
}