/**
 * ไฟล์จัดการ UI สำหรับหน้าแอดมิน
 */

// ตัวแปรเก็บสถานะของ UI
const ADMIN_UI_STATE = {
    currentView: 'dashboard',  // มุมมองปัจจุบัน (dashboard, questions, categories, settings)
    modals: {
        questionModal: {
            isOpen: false,
            mode: 'add'  // add หรือ edit
        },
        categoryModal: {
            isOpen: false,
            mode: 'add'  // add หรือ edit
        },
        confirmDeleteModal: {
            isOpen: false,
            type: null,  // question หรือ category
            itemId: null
        }
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1
    },
    filters: {
        categoryFilter: 'all',
        sortFilter: 'newest',
        searchQuery: ''
    },
    icons: [
        'fas fa-folder', 'fas fa-folder-open', 'fas fa-archive',
        'fas fa-calendar-alt', 'fas fa-money-bill-wave', 'fas fa-user-edit',
        'fas fa-shield-alt', 'fas fa-cog', 'fas fa-users', 'fas fa-building',
        'fas fa-graduation-cap', 'fas fa-chart-line', 'fas fa-car',
        'fas fa-plane', 'fas fa-home', 'fas fa-book', 'fas fa-bookmark',
        'fas fa-file-alt', 'fas fa-briefcase', 'fas fa-bell', 'fas fa-gift',
        'fas fa-heart', 'fas fa-star', 'fas fa-lightbulb', 'fas fa-gem',
        'fas fa-trophy', 'fas fa-id-card', 'fas fa-key', 'fas fa-lock',
        'fas fa-map-marker-alt', 'fas fa-clock', 'fas fa-laptop',
        'fas fa-mobile-alt', 'fas fa-tablet-alt', 'fas fa-desktop',
        'fas fa-envelope', 'fas fa-phone', 'fas fa-camera', 'fas fa-video',
        'fas fa-music', 'fas fa-film', 'fas fa-gamepad', 'fas fa-tags',
        'fas fa-credit-card', 'fas fa-shopping-cart', 'fas fa-comment',
        'fas fa-comments', 'fas fa-clipboard', 'fas fa-newspaper'
    ]
};

/**
 * เปลี่ยนมุมมองในหน้าแอดมิน
 * @param {string} viewName - ชื่อมุมมองที่ต้องการแสดง
 */
function switchAdminView(viewName) {
    // อัปเดตสถานะปัจจุบัน
    ADMIN_UI_STATE.currentView = viewName;
    
    // ซ่อนทุกมุมมอง
    document.querySelectorAll('.admin-view').forEach(view => {
        view.style.display = 'none';
    });
    
    // แสดงมุมมองที่ต้องการ
    document.getElementById(`${viewName}View`).style.display = 'block';
    
    // อัปเดตเมนูที่เลือก
    document.querySelectorAll('.admin-menu-item').forEach(item => {
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // โหลดข้อมูลของมุมมองที่เลือก
    loadViewData(viewName);
}

/**
 * โหลดข้อมูลสำหรับมุมมองที่กำลังแสดง
 * @param {string} viewName - ชื่อมุมมองที่ต้องการโหลดข้อมูล
 */
function loadViewData(viewName) {
    switch (viewName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'questions':
            loadQuestionsData();
            break;
        case 'categories':
            loadCategoriesData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

/**
 * เปิด/ปิด Modal
 * @param {string} modalId - ID ของ Modal ที่ต้องการเปิด/ปิด
 * @param {boolean} open - true เพื่อเปิด, false เพื่อปิด
 */
function toggleModal(modalId, open) {
    const modal = document.getElementById(modalId);
    
    if (open) {
        modal.style.display = 'flex';
        
        // อัปเดตสถานะของ modal
        if (modalId === 'questionModal') {
            ADMIN_UI_STATE.modals.questionModal.isOpen = true;
        } else if (modalId === 'categoryModal') {
            ADMIN_UI_STATE.modals.categoryModal.isOpen = true;
        } else if (modalId === 'confirmDeleteModal') {
            ADMIN_UI_STATE.modals.confirmDeleteModal.isOpen = true;
        }
    } else {
        modal.style.display = 'none';
        
        // รีเซ็ตสถานะของ modal
        if (modalId === 'questionModal') {
            ADMIN_UI_STATE.modals.questionModal.isOpen = false;
        } else if (modalId === 'categoryModal') {
            ADMIN_UI_STATE.modals.categoryModal.isOpen = false;
        } else if (modalId === 'confirmDeleteModal') {
            ADMIN_UI_STATE.modals.confirmDeleteModal.isOpen = false;
            ADMIN_UI_STATE.modals.confirmDeleteModal.itemId = null;
            ADMIN_UI_STATE.modals.confirmDeleteModal.type = null;
        }
    }
}

/**
 * เตรียม Modal สำหรับเพิ่มคำถามใหม่
 */
function prepareAddQuestion() {
    // ตั้งค่าโหมดของ Modal
    ADMIN_UI_STATE.modals.questionModal.mode = 'add';
    
    // ตั้งค่าหัวข้อ Modal
    document.getElementById('questionModalTitle').textContent = 'เพิ่มคำถามใหม่';
    
    // ล้างค่าในฟอร์ม
    document.getElementById('questionId').value = '';
    document.getElementById('questionText').value = '';
    document.getElementById('questionAnswer').value = '';
    
    // โหลดหมวดหมู่ลงใน dropdown
    loadCategoriesForDropdown('questionCategory');
    
    // เปิด Modal
    toggleModal('questionModal', true);
}

/**
 * เตรียม Modal สำหรับแก้ไขคำถาม
 * @param {number} questionId - ID ของคำถามที่ต้องการแก้ไข
 */
function prepareEditQuestion(questionId) {
    // ตั้งค่าโหมดของ Modal
    ADMIN_UI_STATE.modals.questionModal.mode = 'edit';
    
    // ตั้งค่าหัวข้อ Modal
    document.getElementById('questionModalTitle').textContent = 'แก้ไขคำถาม';
    
    // โหลดข้อมูลคำถาม
    const question = findQuestionById(questionId);
    
    if (question) {
        document.getElementById('questionId').value = question.id;
        document.getElementById('questionText').value = question.question;
        document.getElementById('questionAnswer').value = question.answer;
        
        // โหลดหมวดหมู่ลงใน dropdown
        loadCategoriesForDropdown('questionCategory', question.group);
    }
    
    // เปิด Modal
    toggleModal('questionModal', true);
}

/**
 * โหลดหมวดหมู่ลงใน dropdown
 * @param {string} selectId - ID ของ select element
 * @param {string} selectedValue - ค่าที่ต้องการเลือก
 */
function loadCategoriesForDropdown(selectId, selectedValue = null) {
    const selectElement = document.getElementById(selectId);
    
    // ล้างตัวเลือกเดิม
    selectElement.innerHTML = '';
    
    // เพิ่มตัวเลือกหมวดหมู่
    UI_STATE.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        
        if (selectedValue && group === selectedValue) {
            option.selected = true;
        }
        
        selectElement.appendChild(option);
    });
}

/**
 * เตรียม Modal สำหรับเพิ่มหมวดหมู่ใหม่
 */
function prepareAddCategory() {
    // ตั้งค่าโหมดของ Modal
    ADMIN_UI_STATE.modals.categoryModal.mode = 'add';
    
    // ตั้งค่าหัวข้อ Modal
    document.getElementById('categoryModalTitle').textContent = 'เพิ่มหมวดหมู่ใหม่';
    
    // ล้างค่าในฟอร์ม
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryIcon').value = 'fas fa-folder';
    
    // รีเซ็ตไอคอนที่เลือก
    document.getElementById('selectedIcon').innerHTML = '<i class="fas fa-folder"></i>';
    
    // สร้างตัวเลือกไอคอน
    generateIconOptions();
    
    // เปิด Modal
    toggleModal('categoryModal', true);
}

/**
 * เตรียม Modal สำหรับแก้ไขหมวดหมู่
 * @param {string} categoryName - ชื่อของหมวดหมู่ที่ต้องการแก้ไข
 */
function prepareEditCategory(categoryName) {
    // ตั้งค่าโหมดของ Modal
    ADMIN_UI_STATE.modals.categoryModal.mode = 'edit';
    
    // ตั้งค่าหัวข้อ Modal
    document.getElementById('categoryModalTitle').textContent = 'แก้ไขหมวดหมู่';
    
    // หาข้อมูลไอคอนของหมวดหมู่
    const iconClass = CONFIG.groupIcons[categoryName] || CONFIG.defaultGroupIcon;
    
    // ตั้งค่าในฟอร์ม
    document.getElementById('categoryId').value = categoryName;
    document.getElementById('categoryName').value = categoryName;
    document.getElementById('categoryIcon').value = iconClass;
    
    // ตั้งค่าไอคอนที่เลือก
    document.getElementById('selectedIcon').innerHTML = `<i class="${iconClass}"></i>`;
    
    // สร้างตัวเลือกไอคอน
    generateIconOptions(iconClass);
    
    // เปิด Modal
    toggleModal('categoryModal', true);
}

/**
 * สร้างตัวเลือกไอคอนใน Modal
 * @param {string} selectedIcon - ไอคอนที่เลือกอยู่
 */
function generateIconOptions(selectedIcon = 'fas fa-folder') {
    const iconGrid = document.getElementById('iconGrid');
    
    // ล้างตัวเลือกเดิม
    iconGrid.innerHTML = '';
    
    // เพิ่มตัวเลือกไอคอน
    ADMIN_UI_STATE.icons.forEach(iconClass => {
        const iconOption = document.createElement('div');
        iconOption.className = `icon-option ${iconClass === selectedIcon ? 'selected' : ''}`;
        iconOption.dataset.icon = iconClass;
        iconOption.innerHTML = `<i class="${iconClass}"></i>`;
        
        iconOption.addEventListener('click', function() {
            // อัปเดตไอคอนที่เลือก
            document.querySelectorAll('.icon-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            this.classList.add('selected');
            
            // อัปเดตไอคอนที่แสดง
            document.getElementById('selectedIcon').innerHTML = `<i class="${iconClass}"></i>`;
            document.getElementById('categoryIcon').value = iconClass;
        });
        
        iconGrid.appendChild(iconOption);
    });
}

/**
 * เตรียม Modal สำหรับยืนยันการลบ
 * @param {string} type - ประเภทของรายการที่ต้องการลบ (question หรือ category)
 * @param {string|number} itemId - ID หรือชื่อของรายการที่ต้องการลบ
 */
function prepareConfirmDelete(type, itemId) {
    // ตั้งค่าสถานะของ Modal
    ADMIN_UI_STATE.modals.confirmDeleteModal.type = type;
    ADMIN_UI_STATE.modals.confirmDeleteModal.itemId = itemId;
    
    // ตั้งค่าข้อความยืนยัน
    let confirmMessage = 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?';
    
    if (type === 'question') {
        const question = findQuestionById(itemId);
        if (question) {
            confirmMessage = `คุณแน่ใจหรือไม่ว่าต้องการลบคำถาม "${question.question}"?`;
        }
    } else if (type === 'category') {
        confirmMessage = `คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${itemId}"?<br><br><strong class="text-danger">คำเตือน:</strong> การลบหมวดหมู่จะส่งผลกระทบต่อคำถามที่อยู่ในหมวดหมู่นี้`;
    }
    
    document.getElementById('confirmDeleteMessage').innerHTML = confirmMessage;
    
    // เปิด Modal
    toggleModal('confirmDeleteModal', true);
}

/**
 * ค้นหาข้อมูลคำถามจาก ID
 * @param {number} id - ID ของคำถาม
 * @returns {Object|null} - ข้อมูลคำถาม หรือ null ถ้าไม่พบ
 */
function findQuestionById(id) {
    id = parseInt(id, 10);
    return UI_STATE.questions.find(question => question.id === id) || null;
}

/**
 * สร้าง Pagination
 * @param {number} totalItems - จำนวนรายการทั้งหมด
 * @param {number} currentPage - หน้าปัจจุบัน
 * @param {number} itemsPerPage - จำนวนรายการต่อหน้า
 * @param {string} containerId - ID ของ container ที่จะใส่ pagination
 */
function createPagination(totalItems, currentPage, itemsPerPage, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    // คำนวณจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // อัปเดตสถานะ pagination
    ADMIN_UI_STATE.pagination.currentPage = currentPage;
    ADMIN_UI_STATE.pagination.totalPages = totalPages;
    
    if (totalPages <= 1) {
        return;
    }
    
    // สร้างปุ่มหน้าก่อนหน้า
    const prevBtn = document.createElement('span');
    prevBtn.className = `pagination-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    
    if (currentPage > 1) {
        prevBtn.addEventListener('click', () => {
            goToPage(currentPage - 1);
        });
    }
    
    container.appendChild(prevBtn);
    
    // กำหนดช่วงหน้าที่จะแสดง
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // สร้างปุ่มหน้าแรก (ถ้าจำเป็น)
    if (startPage > 1) {
        const firstBtn = document.createElement('span');
        firstBtn.className = 'pagination-item';
        firstBtn.textContent = '1';
        firstBtn.addEventListener('click', () => {
            goToPage(1);
        });
        container.appendChild(firstBtn);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-item disabled';
            ellipsis.textContent = '...';
            container.appendChild(ellipsis);
        }
    }
    
    // สร้างปุ่มหน้า
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('span');
        pageBtn.className = `pagination-item ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        
        if (i !== currentPage) {
            pageBtn.addEventListener('click', () => {
                goToPage(i);
            });
        }
        
        container.appendChild(pageBtn);
    }
    
    // สร้างปุ่มหน้าสุดท้าย (ถ้าจำเป็น)
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-item disabled';
            ellipsis.textContent = '...';
            container.appendChild(ellipsis);
        }
        
        const lastBtn = document.createElement('span');
        lastBtn.className = 'pagination-item';
        lastBtn.textContent = totalPages;
        lastBtn.addEventListener('click', () => {
            goToPage(totalPages);
        });
        container.appendChild(lastBtn);
    }
    
    // สร้างปุ่มหน้าถัดไป
    const nextBtn = document.createElement('span');
    nextBtn.className = `pagination-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    
    if (currentPage < totalPages) {
        nextBtn.addEventListener('click', () => {
            goToPage(currentPage + 1);
        });
    }
    
    container.appendChild(nextBtn);
}

/**
 * เปลี่ยนหน้า
 * @param {number} pageNumber - หน้าที่ต้องการไป
 */
function goToPage(pageNumber) {
    ADMIN_UI_STATE.pagination.currentPage = pageNumber;
    loadQuestionsData();
}

/**
 * ติดตั้ง Event Listeners สำหรับ UI
 */
function setupUIEventListeners() {
    // Event Listeners สำหรับเมนู
    document.querySelectorAll('.admin-menu-item').forEach(item => {
        if (item.dataset.view) {
            item.addEventListener('click', function() {
                switchAdminView(this.dataset.view);
            });
        }
    });
    
    // Event Listeners สำหรับปุ่มแอคชันต่างๆ
    
    // ปุ่มเพิ่มคำถามใหม่
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', prepareAddQuestion);
    }
    
    // ปุ่มเพิ่มหมวดหมู่ใหม่
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', prepareAddCategory);
    }
    
    // ปุ่มรีเฟรชสถิติในแดชบอร์ด
    const refreshStats = document.getElementById('refreshStats');
    if (refreshStats) {
        refreshStats.addEventListener('click', loadDashboardData);
    }
    
    // Event Listeners สำหรับ Modals
    
    // ปุ่มปิด Modal คำถาม
    const closeQuestionModal = document.getElementById('closeQuestionModal');
    if (closeQuestionModal) {
        closeQuestionModal.addEventListener('click', () => toggleModal('questionModal', false));
    }
    
    // ปุ่มยกเลิกใน Modal คำถาม
    const cancelQuestionBtn = document.getElementById('cancelQuestionBtn');
    if (cancelQuestionBtn) {
        cancelQuestionBtn.addEventListener('click', () => toggleModal('questionModal', false));
    }
    
    // ปุ่มบันทึกใน Modal คำถาม
    const saveQuestionBtn = document.getElementById('saveQuestionBtn');
    if (saveQuestionBtn) {
        saveQuestionBtn.addEventListener('click', saveQuestion);
    }
    
    // ปุ่มปิด Modal หมวดหมู่
    const closeCategoryModal = document.getElementById('closeCategoryModal');
    if (closeCategoryModal) {
        closeCategoryModal.addEventListener('click', () => toggleModal('categoryModal', false));
    }
    
    // ปุ่มยกเลิกใน Modal หมวดหมู่
    const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', () => toggleModal('categoryModal', false));
    }
    
    // ปุ่มบันทึกใน Modal หมวดหมู่
    const saveCategoryBtn = document.getElementById('saveCategoryBtn');
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', saveCategory);
    }
    
    // ปุ่มปิด Modal ยืนยันการลบ
    const closeConfirmModal = document.getElementById('closeConfirmModal');
    if (closeConfirmModal) {
        closeConfirmModal.addEventListener('click', () => toggleModal('confirmDeleteModal', false));
    }
    
    // ปุ่มยกเลิกการลบ
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => toggleModal('confirmDeleteModal', false));
    }
    
    // ปุ่มยืนยันการลบ
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    
    // Event Listeners สำหรับฟิลเตอร์และการค้นหา
    
    // ตัวกรองหมวดหมู่
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            ADMIN_UI_STATE.filters.categoryFilter = this.value;
            loadQuestionsData();
        });
    }
    
    // ตัวกรองการจัดเรียง
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            ADMIN_UI_STATE.filters.sortFilter = this.value;
            loadQuestionsData();
        });
    }
    
    // การค้นหาคำถาม
    const questionSearch = document.getElementById('questionSearch');
    const questionSearchBtn = document.getElementById('questionSearchBtn');
    
    if (questionSearch && questionSearchBtn) {
        questionSearchBtn.addEventListener('click', function() {
            ADMIN_UI_STATE.filters.searchQuery = questionSearch.value.trim();
            loadQuestionsData();
        });
        
        questionSearch.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                ADMIN_UI_STATE.filters.searchQuery = this.value.trim();
                loadQuestionsData();
            }
        });
    }
    
    // Event Listeners สำหรับการตั้งค่า
    
    // ฟอร์มการตั้งค่า
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(event) {
            event.preventDefault();
            saveSettings();
        });
    }
    
    // ปุ่มรีเซ็ตการตั้งค่า
    const resetSettings = document.getElementById('resetSettings');
    if (resetSettings) {
        resetSettings.addEventListener('click', loadSettingsData);
    }
    
    // ตัวเลือกแสดง/ซ่อนรหัสผ่านในการตั้งค่า
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const inputId = this.dataset.for;
            const input = document.getElementById(inputId);
            
            if (input.type === 'password') {
                input.type = 'text';
                this.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                this.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });
    
    // ตัวเลือกการจัดการ Rich Text
    document.querySelectorAll('.rich-text-toolbar button').forEach(button => {
        button.addEventListener('click', function() {
            const format = this.dataset.format;
            const textarea = document.getElementById('questionAnswer');
            
            // บันทึกตำแหน่งเคอร์เซอร์
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = textarea.value.substring(start, end);
            
            let replacement = '';
            
            switch (format) {
                case 'bold':
                    replacement = `<b>${selectedText}</b>`;
                    break;
                case 'italic':
                    replacement = `<i>${selectedText}</i>`;
                    break;
                case 'underline':
                    replacement = `<u>${selectedText}</u>`;
                    break;
                case 'line-break':
                    replacement = `<br>${selectedText}`;
                    break;
                case 'list':
                    // แยกข้อความเป็นบรรทัด
                    const lines = selectedText.split('\n');
                    replacement = '<ul>\n';
                    
                    lines.forEach(line => {
                        if (line.trim() !== '') {
                            replacement += `<li>${line}</li>\n`;
                        }
                    });
                    
                    replacement += '</ul>';
                    break;
            }
            
            // แทนที่ข้อความที่เลือก
            textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
            
            // ตั้งค่าตำแหน่งเคอร์เซอร์ใหม่
            textarea.selectionStart = start + replacement.length;
            textarea.selectionEnd = start + replacement.length;
            
            // โฟกัสที่ textarea
            textarea.focus();
        });
    });
}