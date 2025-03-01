/**
 * ไฟล์จัดการ UI สำหรับระบบ FAQ
 * ดูแลการแสดงผลและการโต้ตอบกับผู้ใช้
 */

// DOM Elements - เก็บการอ้างอิง DOM elements ไว้ในตัวแปร
const DOM = {
    // หน้าจอหลัก
    categoryList: document.getElementById('categoryList'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    errorIndicator: document.getElementById('errorIndicator'),
    errorText: document.getElementById('errorText'),
    contentArea: document.getElementById('contentArea'),
    introContent: document.getElementById('introContent'),
    questionsContent: document.getElementById('questionsContent'),
    questionsTitle: document.getElementById('questionsTitle'),
    questionsContainer: document.getElementById('questionsContainer'),
    themeToggle: document.getElementById('themeToggle'),
    
    // การค้นหาและการจัดเรียง
    searchInput: document.getElementById('searchInput'),
    searchButton: document.getElementById('searchButton'),
    sortSelect: document.getElementById('sortSelect'),
    
    // ส่วนท้าย
    lastUpdated: document.getElementById('lastUpdated')
};

// State - เก็บสถานะของแอปพลิเคชัน
const UI_STATE = {
    questions: [],
    filteredQuestions: [],
    groups: [],
    selectedGroup: 'all',
    expandedQuestionId: null,
    isDarkMode: false,
    searchQuery: '',
    sortMethod: 'newest'
};

/**
 * แสดงข้อความกำลังโหลด
 */
function showLoading() {
    DOM.loadingIndicator.style.display = 'flex';
    DOM.errorIndicator.style.display = 'none';
    DOM.contentArea.style.display = 'none';
}

/**
 * ซ่อนข้อความกำลังโหลด
 */
function hideLoading() {
    DOM.loadingIndicator.style.display = 'none';
    DOM.contentArea.style.display = 'block';
}

/**
 * แสดงข้อความข้อผิดพลาด
 * @param {string} message - ข้อความแสดงข้อผิดพลาด 
 */
function showError(message) {
    DOM.loadingIndicator.style.display = 'none';
    DOM.errorText.textContent = message;
    DOM.errorIndicator.style.display = 'block';
}

/**
 * เพิ่มหมวดหมู่ลงในรายการ
 */
function populateCategoryList() {
    // ล้างรายการเดิม (ยกเว้น "ทั้งหมด")
    const allCategoryItem = DOM.categoryList.querySelector('.category-item[data-group="all"]');
    DOM.categoryList.innerHTML = '';
    DOM.categoryList.appendChild(allCategoryItem);
    
    // เพิ่มหมวดหมู่ใหม่
    if (UI_STATE.groups.length === 0) {
        logInfo('No groups found to populate the category list');
    }
    
    UI_STATE.groups.forEach(group => {
        if (!group) return; // ข้ามกรณีที่ group เป็น null หรือ undefined
        
        const li = document.createElement('li');
        li.className = 'category-item';
        li.textContent = ' ' + group;
        li.dataset.group = group;
        
        // เพิ่มไอคอนสำหรับหมวดหมู่
        const icon = document.createElement('i');
        icon.className = CONFIG.groupIcons[group] || CONFIG.defaultGroupIcon;
        li.prepend(icon);
        
        li.addEventListener('click', () => selectGroup(group));
        DOM.categoryList.appendChild(li);
    });
}

/**
 * แสดงเนื้อหาแนะนำ
 */
function showIntroduction() {
    DOM.introContent.style.display = 'block';
    DOM.questionsContent.style.display = 'none';
}

/**
 * แสดงคำถามทั้งหมด
 */
function showAllQuestions() {
    DOM.introContent.style.display = 'none';
    DOM.questionsContent.style.display = 'block';
    DOM.questionsTitle.innerHTML = '<i class="fas fa-question-circle"></i> คำถามทั้งหมด';
    
    renderQuestions();
}

/**
 * แสดงคำถามเฉพาะหมวดหมู่
 * @param {string} group - ชื่อหมวดหมู่ 
 */
function showGroupQuestions(group) {
    DOM.introContent.style.display = 'none';
    DOM.questionsContent.style.display = 'block';
    
    // เพิ่มไอคอนสำหรับหัวข้อหมวดหมู่
    const icon = CONFIG.groupIcons[group] || CONFIG.defaultGroupIcon;
    DOM.questionsTitle.innerHTML = `<i class="${icon}"></i> คำถามเกี่ยวกับ: ${group}`;
    
    UI_STATE.filteredQuestions = UI_STATE.questions.filter(q => q.group === group);
    renderQuestions();
}

/**
 * แสดงคำถามในคอนเทนเนอร์
 */
function renderQuestions() {
    // ล้างคำถามที่มีอยู่
    DOM.questionsContainer.innerHTML = '';
    
    // ใช้คำถามที่กรองและจัดเรียงแล้ว
    let questionsToRender = UI_STATE.filteredQuestions;
    
    // คัดกรองตามคำค้นหา
    if (UI_STATE.searchQuery) {
        questionsToRender = searchQuestions(questionsToRender, UI_STATE.searchQuery);
    }
    
    // จัดเรียงคำถาม
    questionsToRender = sortQuestions(questionsToRender, UI_STATE.sortMethod);
    
    if (questionsToRender.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.innerHTML = '<i class="fas fa-info-circle"></i> ไม่พบข้อมูลคำถามที่ตรงกับเงื่อนไข';
        DOM.questionsContainer.appendChild(emptyMessage);
        return;
    }
    
    // เพิ่มคำถามแต่ละข้อ
    questionsToRender.forEach(question => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        questionCard.id = `question-${question.id}`;
        
        if (UI_STATE.expandedQuestionId === question.id) {
            questionCard.classList.add('active');
        }
        
        const questionHeader = document.createElement('div');
        questionHeader.className = 'question-header';
        questionHeader.dataset.questionId = question.id;
        
        const questionTitle = document.createElement('h3');
        questionTitle.className = 'question-title';
        questionTitle.textContent = question.question;
        
        const questionIcon = document.createElement('span');
        questionIcon.className = 'question-icon';
        questionIcon.innerHTML = UI_STATE.expandedQuestionId === question.id ? 
            '<i class="fas fa-chevron-up"></i>' :
            '<i class="fas fa-chevron-down"></i>';
        
        questionHeader.appendChild(questionTitle);
        questionHeader.appendChild(questionIcon);
        
        const questionAnswer = document.createElement('div');
        questionAnswer.className = 'question-answer';
        if (UI_STATE.expandedQuestionId === question.id) {
            questionAnswer.classList.add('active');
        }
        
        const questionAnswerContent = document.createElement('div');
        questionAnswerContent.className = 'question-answer-content';
        questionAnswerContent.innerHTML = question.answer;
        
        // แสดงเวลาแก้ไขล่าสุด ถ้ามี
        if (question.created_at) {
            const timeInfo = document.createElement('div');
            timeInfo.className = 'time-info';
            timeInfo.innerHTML = `<small>อัปเดตล่าสุด: ${timeAgo(question.created_at)}</small>`;
            questionAnswerContent.appendChild(timeInfo);
        }
        
        questionAnswer.appendChild(questionAnswerContent);
        
        questionCard.appendChild(questionHeader);
        questionCard.appendChild(questionAnswer);
        
        DOM.questionsContainer.appendChild(questionCard);
    });
}

/**
 * การจัดการการเลือกหมวดหมู่
 * @param {string} group - ชื่อหมวดหมู่ที่เลือก 
 */
function selectGroup(group) {
    // อัปเดตหมวดหมู่ที่เลือก
    UI_STATE.selectedGroup = group;
    UI_STATE.expandedQuestionId = null;
    
    // อัปเดตคลาส active ในรายการหมวดหมู่
    document.querySelectorAll('.category-item').forEach(item => {
        if ((item.dataset.group === 'all' && group === 'all') || 
            (item.dataset.group === group)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // รีเซ็ตการค้นหาและการจัดเรียง
    UI_STATE.searchQuery = '';
    if (DOM.searchInput) DOM.searchInput.value = '';
    
    // แสดงคำถามสำหรับหมวดหมู่ที่เลือก
    if (group === 'all') {
        UI_STATE.filteredQuestions = [...UI_STATE.questions];
        showAllQuestions();
    } else {
        showGroupQuestions(group);
    }
}

/**
 * สลับการแสดงคำตอบ
 * @param {number} id - ID ของคำถาม 
 */
function toggleQuestion(id) {
    if (UI_STATE.expandedQuestionId === id) {
        // ซ่อนคำถามปัจจุบัน
        UI_STATE.expandedQuestionId = null;
    } else {
        // แสดงคำถามที่คลิก
        UI_STATE.expandedQuestionId = id;
    }
    
    // วาดคำถามใหม่เพื่ออัปเดตสถานะการแสดง
    renderQuestions();
}

/**
 * สลับโหมดกลางคืน/กลางวัน
 */
function toggleDarkMode() {
    UI_STATE.isDarkMode = !UI_STATE.isDarkMode;
    document.body.classList.toggle('dark-mode', UI_STATE.isDarkMode);
    
    // เปลี่ยนไอคอนของปุ่มสลับธีม
    DOM.themeToggle.innerHTML = UI_STATE.isDarkMode ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
    
    // บันทึกการตั้งค่าลงใน localStorage
    localStorage.setItem('darkMode', UI_STATE.isDarkMode ? 'true' : 'false');
}

/**
 * ตรวจสอบการตั้งค่าธีมเมื่อโหลดหน้า
 */
function checkSavedTheme() {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
        toggleDarkMode();
    }
}

/**
 * ค้นหาคำถาม
 */
function handleSearch() {
    const query = DOM.searchInput.value.trim();
    UI_STATE.searchQuery = query;
    renderQuestions();
}

/**
 * จัดการการเปลี่ยนแปลงวิธีการจัดเรียง
 */
function handleSortChange() {
    UI_STATE.sortMethod = DOM.sortSelect.value;
    renderQuestions();
}

/**
 * การติดตั้ง Event Listeners
 */
function setupEventListeners() {
    // ปุ่มสลับธีม
    DOM.themeToggle.addEventListener('click', toggleDarkMode);
    
    // Event delegation สำหรับการคลิกที่คำถาม
    DOM.questionsContainer.addEventListener('click', (event) => {
        const questionHeader = event.target.closest('.question-header');
        if (questionHeader) {
            const questionId = parseInt(questionHeader.dataset.questionId);
            toggleQuestion(questionId);
        }
    });
    
    // การเลือกหมวดหมู่ "ทั้งหมด"
    DOM.categoryList.querySelector('.category-item[data-group="all"]').addEventListener('click', () => selectGroup('all'));
    
    // การค้นหา
    if (DOM.searchButton && DOM.searchInput) {
        DOM.searchButton.addEventListener('click', handleSearch);
        DOM.searchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // การจัดเรียง
    if (DOM.sortSelect) {
        DOM.sortSelect.addEventListener('change', handleSortChange);
    }
}

/**
 * อัปเดตข้อมูล "Last Updated" ในส่วนท้าย
 */
function updateFooterInfo() {
    if (DOM.lastUpdated) {
        DOM.lastUpdated.textContent = CONFIG.lastUpdated;
    }
}

/**
 * แสดงเนื้อหาหลังการโหลดเสร็จสิ้น
 */
function finishLoading() {
    // ซ่อนตัวแสดงการโหลดและแสดงเนื้อหา
    hideLoading();
    
    // อัปเดตรายการหมวดหมู่
    populateCategoryList();
    
    // อัปเดตข้อมูลส่วนท้าย
    updateFooterInfo();
    
    // แสดงคำแนะนำเริ่มต้น
    showIntroduction();
}

/**
 * เตรียมพร้อม UI เมื่อโหลดข้อมูลเสร็จ
 * @param {Array} questions - ข้อมูลคำถามทั้งหมด
 * @param {Array} groups - ข้อมูลหมวดหมู่ทั้งหมด
 */
function initializeUI(questions, groups) {
    // เก็บข้อมูลลงใน state
    UI_STATE.questions = questions;
    UI_STATE.filteredQuestions = [...questions];
    UI_STATE.groups = groups;
    
    // ติดตั้ง Event Listeners
    setupEventListeners();
    
    // ตรวจสอบการตั้งค่าธีม
    checkSavedTheme();
    
    // แสดงเนื้อหา
    finishLoading();
}
