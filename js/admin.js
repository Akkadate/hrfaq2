/**
 * ไฟล์หลักสำหรับหน้าแอดมิน
 */

// สร้างตัวแปรเก็บสถานะของแอปพลิเคชัน (คล้ายกับใน main.js)
const UI_STATE = {
  questions: [],
  filteredQuestions: [],
  groups: [],
  selectedGroup: "all",
  expandedQuestionId: null,
  isDarkMode: false,
  searchQuery: "",
  sortMethod: "newest",
};

/**
 * เริ่มต้นหน้าแอดมิน
 */
function initAdminPage() {
  // ตรวจสอบสถานะการเข้าสู่ระบบ
  checkAuthStatus();

  // ติดตั้ง Event Listeners
  setupAuthEventListeners();
  setupUIEventListeners();
}

/**
 * โหลดข้อมูล FAQ จาก API
 */
async function loadFAQData() {
  try {
    logInfo("Loading FAQ data from API");

    try {
      // พยายามดึงข้อมูลจาก Supabase
      await findWorkingTable();

      const data = await fetchFAQData();
      logInfo("ข้อมูลที่โหลดจาก API:", data.length, "รายการ");

      // ดึงกลุ่มที่ไม่ซ้ำกันจากข้อมูล
      const groups = extractUniqueGroups(data);

      // เตรียมข้อมูลสำหรับการใช้งานในหน้าแอดมิน
      UI_STATE.questions = data;
      UI_STATE.groups = groups;
      UI_STATE.filteredQuestions = [...data];

      return true;
    } catch (apiError) {
      logError("ไม่สามารถโหลดข้อมูลจาก API ได้:", apiError);
      throw apiError;
    }
  } catch (error) {
    logError("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
    throw error;
  }
}

/**
 * ฟังก์ชันดึงข้อมูล FAQ จาก Supabase
 * @returns {Promise} - Promise ที่ส่งคืนข้อมูล FAQ
 */
async function fetchFAQData() {
  try {
    const url = `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.table}`;
    const headers = {
      apikey: CONFIG.supabase.key,
      Authorization: `Bearer ${CONFIG.supabase.key}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Supabase API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logError("Error fetching FAQ data:", error);
    throw error;
  }
}

/**
 * ดึงข้อมูลหมวดหมู่ที่ไม่ซ้ำกันจากข้อมูลคำถาม
 * @param {Array} questions - ข้อมูลคำถามทั้งหมด
 * @returns {Array} - หมวดหมู่ที่ไม่ซ้ำกัน
 */
function extractUniqueGroups(questions) {
  const uniqueGroupsSet = new Set();

  questions.forEach((item) => {
    if (item.group) {
      uniqueGroupsSet.add(item.group);
    }
  });

  return Array.from(uniqueGroupsSet);
}

/**
 * เริ่มต้นแอปพลิเคชันเมื่อเข้าสู่ระบบ
 */
async function initAdminApp() {
  // แสดงข้อความกำลังโหลด
  showLoadingOverlay();

  try {
    // โหลดข้อมูล FAQ
    try {
      await loadFAQData();

      // ซ่อนข้อความกำลังโหลด
      hideLoadingOverlay();

      // แสดงหน้าเริ่มต้น (แดชบอร์ด)
      switchAdminView("dashboard");
    } catch (error) {
      logError("ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้:", error);
      hideLoadingOverlay();
      showError("ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้");
    }
  } catch (error) {
    logError("เกิดข้อผิดพลาดในการเริ่มต้นแอปพลิเคชัน:", error);
    hideLoadingOverlay();
    showError(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}`);
  }
}

/**
 * สร้างและแสดงตัวโหลดแบบ overlay
 */
function showLoadingOverlay() {
  // ตรวจสอบว่ามี loading overlay อยู่แล้วหรือไม่
  if (document.getElementById("admin-loading-overlay")) {
    document.getElementById("admin-loading-overlay").style.display = "flex";
    return;
  }

  // สร้าง loading overlay
  const overlay = document.createElement("div");
  overlay.id = "admin-loading-overlay";
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

  const loadingBox = document.createElement("div");
  loadingBox.style.cssText = `
        background-color: white;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        text-align: center;
    `;

  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  spinner.style.cssText = `
        width: 50px;
        height: 50px;
        border: 5px solid rgba(66, 153, 225, 0.3);
        border-radius: 50%;
        border-top-color: #3182ce;
        animation: spin 1s ease-in-out infinite;
        margin: 0 auto 15px;
    `;

  const loadingText = document.createElement("div");
  loadingText.textContent = "กำลังโหลดข้อมูล...";
  loadingText.style.cssText = `
        color: #4a5568;
        font-size: 16px;
        font-weight: 500;
    `;

  // สร้าง keyframes สำหรับ animation
  if (!document.getElementById("loading-spinner-keyframes")) {
    const keyframes = document.createElement("style");
    keyframes.id = "loading-spinner-keyframes";
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
 * ซ่อนตัวโหลดแบบ overlay
 */
function hideLoadingOverlay() {
  const overlay = document.getElementById("admin-loading-overlay");
  if (overlay) {
    overlay.style.display = "none";
  }
}

/**
 * แสดงข้อความแสดงข้อผิดพลาด
 * @param {string} message - ข้อความแสดงข้อผิดพลาด
 */
function showError(message) {
  // สร้าง error toast notification
  const toast = document.createElement("div");
  toast.className = "error-toast";
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

  const icon = document.createElement("i");
  icon.className = "fas fa-exclamation-circle";
  icon.style.marginRight = "10px";

  const text = document.createElement("div");
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  document.body.appendChild(toast);

  // ให้ toast หายไปหลังจาก 5 วินาที
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.5s ease";
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 500);
  }, 5000);
}

/**
 * แสดงข้อความเตือน
 * @param {string} message - ข้อความเตือน
 */
function showWarning(message) {
  // สร้าง warning toast notification
  const toast = document.createElement("div");
  toast.className = "warning-toast";
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

  const icon = document.createElement("i");
  icon.className = "fas fa-exclamation-triangle";
  icon.style.marginRight = "10px";

  const text = document.createElement("div");
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  document.body.appendChild(toast);

  // ให้ toast หายไปหลังจาก 5 วินาที
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.5s ease";
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 500);
  }, 5000);
}

/**
 * ดึงหมวดหมู่ที่ไม่ซ้ำกันจากข้อมูลคำถาม
 * @param {Array} questions - ข้อมูลคำถามทั้งหมด
 * @returns {Array} - หมวดหมู่ที่ไม่ซ้ำกัน
 */
function extractUniqueGroups(questions) {
  const uniqueGroupsSet = new Set();

  questions.forEach((item) => {
    if (item.group) {
      uniqueGroupsSet.add(item.group);
    }
  });

  return Array.from(uniqueGroupsSet);
}

/**
 * บันทึกข้อมูลทั้งหมดลงใน localStorage
 */
function saveAllData() {
  try {
    // บันทึกข้อมูลคำถาม
    localStorage.setItem(
      "adminFaqQuestions",
      JSON.stringify(UI_STATE.questions)
    );

    // บันทึกข้อมูลหมวดหมู่
    localStorage.setItem("adminFaqGroups", JSON.stringify(UI_STATE.groups));

    // บันทึกไอคอนของหมวดหมู่
    localStorage.setItem(
      "adminFaqGroupIcons",
      JSON.stringify(CONFIG.groupIcons)
    );

    // บันทึกการตั้งค่า
    localStorage.setItem("adminFaqConfig", JSON.stringify(CONFIG));

    logInfo("บันทึกข้อมูลลงใน localStorage เรียบร้อยแล้ว");
    return true;
  } catch (error) {
    logError("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", error);
    return false;
  }
}

/**
 * โหลดข้อมูลที่บันทึกไว้ใน localStorage
 */
function loadSavedData() {
  try {
    // โหลดข้อมูลคำถาม
    const savedQuestions = localStorage.getItem("adminFaqQuestions");
    if (savedQuestions) {
      UI_STATE.questions = JSON.parse(savedQuestions);
      UI_STATE.filteredQuestions = [...UI_STATE.questions];
    } else {
      return false; // ไม่มีข้อมูลใน localStorage
    }

    // โหลดข้อมูลหมวดหมู่
    const savedGroups = localStorage.getItem("adminFaqGroups");
    if (savedGroups) {
      UI_STATE.groups = JSON.parse(savedGroups);
    } else {
      return false;
    }

    // โหลดไอคอนของหมวดหมู่
    const savedGroupIcons = localStorage.getItem("adminFaqGroupIcons");
    if (savedGroupIcons) {
      const groupIcons = JSON.parse(savedGroupIcons);
      // อัปเดตไอคอนในการตั้งค่า
      Object.keys(groupIcons).forEach((group) => {
        CONFIG.groupIcons[group] = groupIcons[group];
      });
    }

    // โหลดการตั้งค่า
    const savedConfig = localStorage.getItem("adminFaqConfig");
    if (savedConfig) {
      const configObj = JSON.parse(savedConfig);
      // อัปเดตการตั้งค่าแต่ละส่วน
      if (configObj.supabase) {
        CONFIG.supabase = { ...CONFIG.supabase, ...configObj.supabase };
      }
      if (configObj.cache) {
        CONFIG.cache = { ...CONFIG.cache, ...configObj.cache };
      }
      if (configObj.version) {
        CONFIG.version = configObj.version;
      }
      if (configObj.lastUpdated) {
        CONFIG.lastUpdated = configObj.lastUpdated;
      }
    }

    logInfo("โหลดข้อมูลจาก localStorage เรียบร้อยแล้ว");
    return true;
  } catch (error) {
    logError("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
    return false;
  }
}

// เริ่มต้นหน้าแอดมินเมื่อโหลดหน้าเสร็จ
document.addEventListener("DOMContentLoaded", initAdminPage);

// บันทึกข้อมูลเมื่อออกจากหน้า
window.addEventListener("beforeunload", function () {
  if (isAuthenticated()) {
    saveAllData();
  }
});

/**
 * ฟังก์ชันค้นหาตาราง FAQ ที่มีอยู่ใน Supabase
 * @returns {Promise<string[]>} - Promise ที่ส่งคืนรายชื่อตารางที่พบ
 */
async function findAvailableTables() {
  const possibleTableNames = ["faq"];
  const availableTables = [];

  for (const tableName of possibleTableNames) {
    try {
      const url = `${CONFIG.supabase.url}/rest/v1/${tableName}?limit=1`;
      const headers = {
        apikey: CONFIG.supabase.key,
        Authorization: `Bearer ${CONFIG.supabase.key}`,
      };

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

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
    // ถ้ามีตารางถูกกำหนดไว้แล้วใน CONFIG ให้ใช้ตารางนั้นเลย
    if (CONFIG.supabase.table) {
      // ตรวจสอบว่าตารางนี้มีอยู่จริงหรือไม่
      const url = `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.table}?limit=1`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          apikey: CONFIG.supabase.key,
          Authorization: `Bearer ${CONFIG.supabase.key}`,
        },
      });

      if (response.ok) {
        logInfo(`Table "${CONFIG.supabase.table}" is accessible`);
        return CONFIG.supabase.table;
      }
    }

    // ถ้าไม่มีตารางถูกกำหนดไว้หรือตารางที่กำหนดไว้ไม่มีอยู่จริง
    const tables = await findAvailableTables();

    if (tables.length > 0) {
      logInfo("Available tables:", tables);
      // อัปเดตค่าตารางที่จะใช้งาน
      CONFIG.supabase.table = tables[0];
      return tables[0];
    } else {
      throw new Error("No accessible tables found in the database");
    }
  } catch (error) {
    logError("Error finding tables:", error);
    throw error;
  }
}
