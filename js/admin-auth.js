/**
 * ไฟล์สำหรับจัดการการรับรองตัวตนและความปลอดภัยของหน้าแอดมิน
 */

// การตั้งค่าสำหรับการรับรองตัวตน
const AUTH_CONFIG = {
    // ชื่อ key ที่ใช้ในการเก็บข้อมูลใน localStorage
    storageKey: 'faq_admin_auth',
    
    // ระยะเวลาการหมดอายุของ session (24 ชั่วโมง)
    sessionExpiry: 24 * 60 * 60 * 1000,
    
    // ข้อมูลการเข้าสู่ระบบเริ่มต้น (สำหรับการทดสอบ)
    // ในระบบจริง ควรใช้การเข้ารหัสที่ปลอดภัยกว่านี้
    defaultCredentials: {
        username: 'admin',
        password: 'admin1234',
        role: 'admin'
    }
};

/**
 * ตรวจสอบว่าผู้ใช้เข้าสู่ระบบหรือไม่
 * @returns {boolean} - true หากผู้ใช้เข้าสู่ระบบแล้ว
 */
function isAuthenticated() {
    const authData = getAuthData();
    
    if (!authData) return false;
    
    // ตรวจสอบว่า session หมดอายุหรือไม่
    if (Date.now() > authData.expiresAt) {
        logout();
        return false;
    }
    
    return true;
}

/**
 * ดึงข้อมูลการรับรองตัวตนจาก localStorage
 * @returns {Object|null} - ข้อมูลการรับรองตัวตน หรือ null ถ้าไม่มี
 */
function getAuthData() {
    const authData = localStorage.getItem(AUTH_CONFIG.storageKey);
    
    if (!authData) return null;
    
    try {
        return JSON.parse(authData);
    } catch (error) {
        logError('Error parsing auth data:', error);
        return null;
    }
}

/**
 * บันทึกข้อมูลการรับรองตัวตนลงใน localStorage
 * @param {Object} userData - ข้อมูลผู้ใช้
 */
function setAuthData(userData) {
    const authData = {
        user: {
            username: userData.username,
            role: userData.role
        },
        expiresAt: Date.now() + AUTH_CONFIG.sessionExpiry
    };
    
    localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(authData));
}

/**
 * ลบข้อมูลการรับรองตัวตนออกจาก localStorage
 */
function clearAuthData() {
    localStorage.removeItem(AUTH_CONFIG.storageKey);
}

/**
 * ตรวจสอบการเข้าสู่ระบบ
 * @param {string} username - ชื่อผู้ใช้
 * @param {string} password - รหัสผ่าน
 * @returns {Object} - ผลลัพธ์การเข้าสู่ระบบ
 */
function login(username, password) {
    // ในระบบจริง ควรเรียกใช้ API เพื่อตรวจสอบการเข้าสู่ระบบ
    // ตัวอย่างนี้ใช้ข้อมูลเริ่มต้นเพื่อทดสอบ
    
    if (username === AUTH_CONFIG.defaultCredentials.username && 
        password === AUTH_CONFIG.defaultCredentials.password) {
        
        const userData = {
            username: username,
            role: AUTH_CONFIG.defaultCredentials.role
        };
        
        setAuthData(userData);
        
        return {
            success: true,
            user: userData
        };
    }
    
    return {
        success: false,
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
    };
}

/**
 * ออกจากระบบ
 */
function logout() {
    clearAuthData();
    window.location.reload();
}

/**
 * ตรวจสอบสถานะการเข้าสู่ระบบและแสดงหน้าที่เหมาะสม
 */
function checkAuthStatus() {
    if (isAuthenticated()) {
        showAdminSection();
        // เริ่มต้นแอปพลิเคชันหลังจากเข้าสู่ระบบสำเร็จ
        initAdminApp();
    } else {
        showLoginSection();
    }
}

/**
 * แสดงหน้าเข้าสู่ระบบ
 */
function showLoginSection() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById('headerActions').style.display = 'none';
}

/**
 * แสดงหน้าแอดมิน
 */
function showAdminSection() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'block';
    document.getElementById('headerActions').style.display = 'block';
    
    // แสดงชื่อผู้ใช้ที่เข้าสู่ระบบ (ถ้าต้องการ)
    const authData = getAuthData();
    if (authData && authData.user) {
        // อาจจะเพิ่มโค้ดแสดงชื่อผู้ใช้ที่นี่
    }
}

/**
 * ติดตั้ง Event Listeners สำหรับฟอร์มเข้าสู่ระบบ
 */
function setupAuthEventListeners() {
    // ฟอร์มเข้าสู่ระบบ
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            const loginResult = login(username, password);
            
            if (loginResult.success) {
                showAdminSection();
                // เริ่มต้นแอปพลิเคชันหลังจากเข้าสู่ระบบสำเร็จ
                initAdminApp();
            } else {
                // แสดงข้อความผิดพลาด
                const loginError = document.getElementById('loginError');
                const loginErrorText = document.getElementById('loginErrorText');
                
                loginErrorText.textContent = loginResult.message;
                loginError.style.display = 'flex';
                
                // ล้างรหัสผ่าน
                document.getElementById('password').value = '';
            }
        });
    }
    
    // ปุ่มแสดง/ซ่อนรหัสผ่าน
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                passwordInput.type = 'password';
                this.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    }
    
    // ปุ่มออกจากระบบ
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            logout();
        });
    }
    
    // ให้ซ่อนข้อความแสดงข้อผิดพลาดเมื่อผู้ใช้เริ่มพิมพ์
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    [usernameInput, passwordInput].forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                document.getElementById('loginError').style.display = 'none';
            });
        }
    });
}