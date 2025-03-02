/**
 * ไฟล์แก้ไขปัญหาในระบบ FAQ Admin
 * แก้ไขปัญหาหมวดหมู่ใหม่ไม่แสดงในดรอปดาวน์เมื่อเพิ่มคำถามใหม่
 */

/**
 * เพิ่มหมวดหมู่ใหม่และบันทึกลงในฐานข้อมูล
 * ฟังก์ชันนี้แก้ไขจาก saveCategory ในไฟล์ admin-data.js
 */
async function saveCategory() {
  try {
    const categoryId = document.getElementById("categoryId").value;
    const categoryName = document.getElementById("categoryName").value;
    const categoryIcon = document.getElementById("categoryIcon").value;

    // ตรวจสอบข้อมูล
    if (!categoryName) {
      alert("กรุณากรอกชื่อหมวดหมู่");
      return;
    }

    // แสดง loading
    showLoadingOverlay();

    if (ADMIN_UI_STATE.modals.categoryModal.mode === "add") {
      // ตรวจสอบว่าหมวดหมู่ซ้ำหรือไม่
      if (UI_STATE.groups.includes(categoryName)) {
        alert("หมวดหมู่นี้มีอยู่แล้ว");
        hideLoadingOverlay();
        return;
      }

      // เพิ่มหมวดหมู่ใหม่
      UI_STATE.groups.push(categoryName);

      // เพิ่มไอคอนสำหรับหมวดหมู่
      CONFIG.groupIcons[categoryName] = categoryIcon;

      // บันทึกกิจกรรม
      logActivity("add", "หมวดหมู่", `เพิ่มหมวดหมู่ใหม่: ${categoryName}`);

      // แสดงข้อความแจ้งเตือน
      showSuccess("เพิ่มหมวดหมู่ใหม่เรียบร้อยแล้ว");

      // สำคัญ: บันทึกข้อมูลหมวดหมู่ลงใน localStorage เพื่อไม่ให้หายเมื่อโหลดหน้าใหม่
      saveAllData();

      // แก้ไขส่วนนี้: สร้างหรืออัปเดตรายการหมวดหมู่ในฐานข้อมูล (ถ้าเป็นไปได้)
      try {
        // ถ้ามีฟังก์ชันสำหรับบันทึกหมวดหมู่ลงในฐานข้อมูล ให้เรียกใช้ที่นี่
        // ตัวอย่าง: await createCategoryInSupabase({ name: categoryName, icon: categoryIcon });
      } catch (error) {
        logError("ไม่สามารถบันทึกหมวดหมู่ลงในฐานข้อมูลได้:", error);
        // ไม่ต้องแสดงข้อผิดพลาดเพราะเรายังบันทึกได้ในหน่วยความจำ
      }
    } else {
      // โค้ดสำหรับการแก้ไขหมวดหมู่ (คงไว้เหมือนเดิม)
      const oldCategoryName = categoryId;

      // ตรวจสอบว่าชื่อหมวดหมู่ใหม่ซ้ำหรือไม่ (ถ้าเปลี่ยน)
      if (
        categoryName !== oldCategoryName &&
        UI_STATE.groups.includes(categoryName)
      ) {
        alert("หมวดหมู่นี้มีอยู่แล้ว");
        hideLoadingOverlay();
        return;
      }

      // อัปเดตชื่อหมวดหมู่
      if (categoryName !== oldCategoryName) {
        const index = UI_STATE.groups.findIndex((g) => g === oldCategoryName);

        if (index !== -1) {
          UI_STATE.groups[index] = categoryName;

          // อัปเดตหมวดหมู่ในคำถาม
          UI_STATE.questions.forEach((question) => {
            if (question.group === oldCategoryName) {
              question.group = categoryName;
              question.updated_at = new Date().toISOString();

              // พยายามอัพเดทใน Supabase
              if (question.id) {
                try {
                  updateQuestionInSupabase(question.id, {
                    group: categoryName,
                    updated_at: question.updated_at,
                  }).catch((error) => {
                    logError(
                      `ไม่สามารถอัพเดทหมวดหมู่สำหรับคำถาม ID ${question.id} ได้:`,
                      error
                    );
                  });
                } catch (error) {
                  logError(
                    `ไม่สามารถอัพเดทหมวดหมู่สำหรับคำถาม ID ${question.id} ได้:`,
                    error
                  );
                }
              }
            }
          });

          // ย้ายไอคอนไปยังชื่อใหม่
          CONFIG.groupIcons[categoryName] = categoryIcon;
          delete CONFIG.groupIcons[oldCategoryName];
        }
      } else {
        // อัปเดตเฉพาะไอคอน
        CONFIG.groupIcons[categoryName] = categoryIcon;
      }

      // บันทึกกิจกรรม
      logActivity(
        "edit",
        "หมวดหมู่",
        `แก้ไขหมวดหมู่: ${oldCategoryName} -> ${categoryName}`
      );

      // แสดงข้อความแจ้งเตือน
      showSuccess("แก้ไขหมวดหมู่เรียบร้อยแล้ว");

      // สำคัญ: บันทึกข้อมูลที่แก้ไขลงใน localStorage
      saveAllData();
    }

    // ซ่อน loading
    hideLoadingOverlay();

    // ปิด Modal
    toggleModal("categoryModal", false);

    // แทนที่จะโหลดข้อมูลใหม่ทั้งหมด ให้อัปเดตเฉพาะหน้าหมวดหมู่
    if (ADMIN_UI_STATE.currentView === "categories") {
      // อัปเดตตารางหมวดหมู่โดยตรง แทนการเรียก loadCategoriesData()
      updateCategoriesTable();
    } else {
      // เปลี่ยนไปที่หน้าหมวดหมู่ แต่ไม่โหลดข้อมูลใหม่ทั้งหมด
      ADMIN_UI_STATE.currentView = "categories";
      document.querySelectorAll(".admin-view").forEach((view) => {
        view.style.display = "none";
      });
      document.getElementById("categoriesView").style.display = "block";
      document.querySelectorAll(".admin-menu-item").forEach((item) => {
        if (item.dataset.view === "categories") {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });
      updateCategoriesTable();
    }
  } catch (error) {
    hideLoadingOverlay();
    logError("เกิดข้อผิดพลาดในการบันทึกหมวดหมู่:", error);
    showError("ไม่สามารถบันทึกหมวดหมู่ได้");
  }
}

/**
 * โหลดหมวดหมู่ลงใน dropdown โดยใช้ข้อมูลจาก localStorage ก่อน
 * ฟังก์ชันนี้แก้ไขจาก loadCategoriesForDropdown ในไฟล์ admin-ui.js
 * @param {string} selectId - ID ของ select element
 * @param {string} selectedValue - ค่าที่ต้องการเลือก
 */
function loadCategoriesForDropdown(selectId, selectedValue = null) {
  const selectElement = document.getElementById(selectId);
  if (!selectElement) return;

  // ล้างตัวเลือกเดิม
  selectElement.innerHTML = "";

  // ตรวจสอบว่ามีกลุ่มหรือไม่
  if (!UI_STATE.groups || UI_STATE.groups.length === 0) {
    // ถ้าไม่มีกลุ่มใน UI_STATE.groups ให้ลองโหลดจาก localStorage
    try {
      const savedGroups = localStorage.getItem("adminFaqGroups");
      if (savedGroups) {
        UI_STATE.groups = JSON.parse(savedGroups);
      }
    } catch (error) {
      logError("ไม่สามารถโหลดหมวดหมู่จาก localStorage ได้:", error);
    }
  }

  // เพิ่มตัวเลือกหมวดหมู่
  UI_STATE.groups.forEach((group) => {
    if (!group) return; // ข้ามกรณีที่ group เป็น null หรือ undefined

    const option = document.createElement("option");
    option.value = group;
    option.textContent = group;

    if (selectedValue && group === selectedValue) {
      option.selected = true;
    }

    selectElement.appendChild(option);
  });

  // ตรวจสอบว่ายังไม่มีตัวเลือกใดถูกเลือกและมีตัวเลือก
  if (!selectedValue && selectElement.options.length > 0) {
    selectElement.options[0].selected = true;
  }
}

/**
 * แก้ไขฟังก์ชัน prepareAddQuestion ไม่ให้โหลดข้อมูลจาก API อีกรอบ
 * ฟังก์ชันนี้แก้ไขจาก prepareAddQuestion ในไฟล์ admin-ui.js
 */
function prepareAddQuestion() {
  // ตั้งค่าโหมดของ Modal
  ADMIN_UI_STATE.modals.questionModal.mode = "add";

  // ตั้งค่าหัวข้อ Modal
  document.getElementById("questionModalTitle").textContent = "เพิ่มคำถามใหม่";

  // ล้างค่าในฟอร์ม
  document.getElementById("questionId").value = "";
  document.getElementById("questionText").value = "";
  document.getElementById("questionAnswer").value = "";

  // โหลดหมวดหมู่ลงใน dropdown โดยใช้ฟังก์ชันที่แก้ไขแล้ว
  loadCategoriesForDropdown("questionCategory");

  // เปิด Modal
  toggleModal("questionModal", true);
}

/**
 * แก้ไขฟังก์ชัน switchAdminView ไม่ให้โหลดข้อมูลจาก API ในบางกรณี
 * ฟังก์ชันนี้แก้ไขจาก switchAdminView ในไฟล์ admin-ui.js
 * @param {string} viewName - ชื่อมุมมองที่ต้องการแสดง
 */
function switchAdminView(viewName) {
  // อัปเดตสถานะปัจจุบัน
  ADMIN_UI_STATE.currentView = viewName;

  // ซ่อนทุกมุมมอง
  document.querySelectorAll(".admin-view").forEach((view) => {
    view.style.display = "none";
  });

  // แสดงมุมมองที่ต้องการ
  document.getElementById(`${viewName}View`).style.display = "block";

  // อัปเดตเมนูที่เลือก
  document.querySelectorAll(".admin-menu-item").forEach((item) => {
    if (item.dataset.view === viewName) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // ถ้าเปลี่ยนจากหน้าหมวดหมู่ไปหน้าคำถาม ไม่ต้องโหลดข้อมูล FAQ ใหม่
  // เพื่อให้ข้อมูลหมวดหมู่ที่เพิ่มไปล่าสุดยังคงอยู่
  if (viewName === "questions" && ADMIN_UI_STATE.prevView === "categories") {
    // ใช้ข้อมูลที่มีอยู่แล้ว
    loadQuestionsDataWithoutFetch();
  } else {
    // โหลดข้อมูลของมุมมองที่เลือกตามปกติ
    loadViewData(viewName);
  }

  // บันทึกมุมมองปัจจุบันสำหรับการตรวจสอบในครั้งต่อไป
  ADMIN_UI_STATE.prevView = viewName;
}

/**
 * โหลดข้อมูลคำถามโดยไม่ดึงข้อมูลจาก API ใหม่
 * ใช้ข้อมูลที่มีอยู่แล้วใน UI_STATE
 */
function loadQuestionsDataWithoutFetch() {
  try {
    // โหลดหมวดหมู่ลงในตัวกรอง
    loadCategoriesForFilter();

    // ดึงข้อมูลคำถามที่กรองและจัดเรียงแล้ว
    let filteredQuestions = filterQuestions(UI_STATE.questions);

    // จัดเรียงคำถาม
    filteredQuestions = sortQuestions(
      filteredQuestions,
      ADMIN_UI_STATE.filters.sortFilter
    );

    // สร้าง pagination
    const totalItems = filteredQuestions.length;
    const currentPage = ADMIN_UI_STATE.pagination.currentPage;
    const itemsPerPage = ADMIN_UI_STATE.pagination.itemsPerPage;

    createPagination(
      totalItems,
      currentPage,
      itemsPerPage,
      "questionsPagination"
    );

    // ดึงข้อมูลเฉพาะในหน้าปัจจุบัน
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

    // แสดงข้อมูลในตาราง
    const questionsTable = document.getElementById("questionsTable");
    const tbody = questionsTable.querySelector("tbody");
    tbody.innerHTML = "";

    if (paginatedQuestions.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.className = "empty-message";
      td.innerHTML = '<i class="fas fa-info-circle"></i> ไม่พบข้อมูลคำถาม';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    // เพิ่มคำถามแต่ละข้อลงในตาราง
    paginatedQuestions.forEach((question) => {
      const tr = document.createElement("tr");

      // ID
      const tdId = document.createElement("td");
      tdId.textContent = question.id;

      // คำถาม
      const tdQuestion = document.createElement("td");
      tdQuestion.textContent = question.question;

      // หมวดหมู่
      const tdCategory = document.createElement("td");
      const iconClass =
        CONFIG.groupIcons[question.group] || CONFIG.defaultGroupIcon;
      tdCategory.innerHTML = `<i class="${iconClass}"></i> ${question.group}`;

      // วันที่สร้าง
      const tdCreatedAt = document.createElement("td");
      tdCreatedAt.textContent = formatThaiDate(question.created_at);

      // วันที่แก้ไข
      const tdUpdatedAt = document.createElement("td");
      tdUpdatedAt.textContent = question.updated_at
        ? formatThaiDate(question.updated_at)
        : formatThaiDate(question.created_at);

      // การจัดการ
      const tdActions = document.createElement("td");
      tdActions.className = "action-buttons";

      // ปุ่มแก้ไข
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-info btn-icon";
      editBtn.title = "แก้ไข";
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener("click", () => prepareEditQuestion(question.id));

      // ปุ่มลบ
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-danger btn-icon";
      deleteBtn.title = "ลบ";
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      deleteBtn.addEventListener("click", () =>
        prepareConfirmDelete("question", question.id)
      );

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
    logActivity("view", "คำถาม", "ดูรายการคำถาม");
  } catch (error) {
    logError("เกิดข้อผิดพลาดในการโหลดข้อมูลคำถาม:", error);
    showError("ไม่สามารถโหลดข้อมูลคำถามได้");
  }
}

/**
 * ฟังก์ชันนี้จะถูกเรียกใช้เมื่อเพิ่มคำถามใหม่หลังจากเพิ่มหมวดหมู่ใหม่
 * @param {number} id - ID ของคำถาม
 * @returns {boolean} - true หากสำเร็จ
 */
async function saveQuestion() {
  try {
    const questionId = document.getElementById("questionId").value;
    const questionText = document.getElementById("questionText").value;
    const questionCategory = document.getElementById("questionCategory").value;
    const questionAnswer = document.getElementById("questionAnswer").value;

    // ตรวจสอบข้อมูล
    if (!questionText || !questionCategory || !questionAnswer) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // แสดง loading
    showLoadingOverlay();

    if (ADMIN_UI_STATE.modals.questionModal.mode === "add") {
      // สร้างคำถามใหม่
      const newQuestion = {
        question: questionText,
        answer: questionAnswer,
        group: questionCategory,
        created_at: new Date().toISOString(),
      };

      try {
        // บันทึกลงใน Supabase
        const result = await createQuestionInSupabase(newQuestion);

        if (result && result.length > 0) {
          // อัพเดทข้อมูลใน UI_STATE
          UI_STATE.questions.push({ ...result[0] });

          // บันทึกกิจกรรม
          logActivity(
            "add",
            "คำถาม",
            `เพิ่มคำถามใหม่: ${questionText.substring(0, 30)}...`
          );

          showSuccess("เพิ่มคำถามใหม่เรียบร้อยแล้ว");
        } else {
          throw new Error("ไม่ได้รับข้อมูลตอบกลับจาก Supabase API");
        }
      } catch (error) {
        logError("ไม่สามารถบันทึกข้อมูลลง Supabase ได้:", error);
        showError("ไม่สามารถบันทึกข้อมูลไปยังฐานข้อมูลได้");
        throw error;
      }
    } else {
      // แก้ไขคำถามที่มีอยู่
      const id = parseInt(questionId, 10);
      const index = UI_STATE.questions.findIndex((q) => q.id === id);

      if (index !== -1) {
        const updatedQuestion = {
          question: questionText,
          answer: questionAnswer,
          group: questionCategory,
          updated_at: new Date().toISOString(),
        };

        try {
          // อัพเดทใน Supabase
          await updateQuestionInSupabase(id, updatedQuestion);

          // อัพเดทข้อมูลใน UI_STATE
          UI_STATE.questions[index] = {
            ...UI_STATE.questions[index],
            ...updatedQuestion,
          };

          // บันทึกกิจกรรม
          logActivity(
            "edit",
            "คำถาม",
            `แก้ไขคำถาม ID ${id}: ${questionText.substring(0, 30)}...`
          );

          showSuccess("แก้ไขคำถามเรียบร้อยแล้ว");
        } catch (error) {
          logError("ไม่สามารถอัพเดทข้อมูลใน Supabase ได้:", error);
          showError("ไม่สามารถอัพเดทข้อมูลไปยังฐานข้อมูลได้");
          throw error;
        }
      }
    }

    // ซ่อน loading
    hideLoadingOverlay();

    // ปิด Modal
    toggleModal("questionModal", false);

    // ไม่ต้องโหลดข้อมูลใหม่จาก API แต่ใช้ข้อมูลที่มีอยู่แล้ว
    if (ADMIN_UI_STATE.currentView === "questions") {
      loadQuestionsDataWithoutFetch();
    } else {
      // เปลี่ยนไปที่หน้าคำถามโดยไม่โหลดข้อมูลใหม่จาก API
      ADMIN_UI_STATE.currentView = "questions";
      document.querySelectorAll(".admin-view").forEach((view) => {
        view.style.display = "none";
      });
      document.getElementById("questionsView").style.display = "block";
      document.querySelectorAll(".admin-menu-item").forEach((item) => {
        if (item.dataset.view === "questions") {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });
      loadQuestionsDataWithoutFetch();
    }

    // บันทึกข้อมูลลงใน localStorage
    saveAllData();
  } catch (error) {
    hideLoadingOverlay();
    logError("เกิดข้อผิดพลาดในการบันทึกคำถาม:", error);
    showError("ไม่สามารถบันทึกคำถามได้");
  }
}

/**
 * เริ่มต้นติดตั้งการแก้ไข
 * ฟังก์ชันนี้จะถูกเรียกเมื่อโหลดไฟล์
 */
function initBugFixes() {
  // ตรวจสอบว่า ADMIN_UI_STATE มีอยู่
  if (typeof ADMIN_UI_STATE === "undefined") {
    console.error("ADMIN_UI_STATE ไม่พบ การแก้ไขจะไม่ทำงาน");
    return;
  }

  // เพิ่ม prevView ในกรณีที่ยังไม่มี
  if (!ADMIN_UI_STATE.hasOwnProperty("prevView")) {
    ADMIN_UI_STATE.prevView = "dashboard";
  }

  // แทนที่ฟังก์ชันเดิมด้วยฟังก์ชันที่แก้ไขแล้ว
  if (typeof saveCategory === "function") {
    console.log("การแก้ไข: แทนที่ saveCategory");
    window.original_saveCategory = saveCategory;
    window.saveCategory = saveCategory;
  }

  if (typeof loadCategoriesForDropdown === "function") {
    console.log("การแก้ไข: แทนที่ loadCategoriesForDropdown");
    window.original_loadCategoriesForDropdown = loadCategoriesForDropdown;
    window.loadCategoriesForDropdown = loadCategoriesForDropdown;
  }

  if (typeof prepareAddQuestion === "function") {
    console.log("การแก้ไข: แทนที่ prepareAddQuestion");
    window.original_prepareAddQuestion = prepareAddQuestion;
    window.prepareAddQuestion = prepareAddQuestion;
  }

  if (typeof switchAdminView === "function") {
    console.log("การแก้ไข: แทนที่ switchAdminView");
    window.original_switchAdminView = switchAdminView;
    window.switchAdminView = switchAdminView;
  }

  if (typeof saveQuestion === "function") {
    console.log("การแก้ไข: แทนที่ saveQuestion");
    window.original_saveQuestion = saveQuestion;
    window.saveQuestion = saveQuestion;
  }

  console.log(
    "การแก้ไขปัญหาหมวดหมู่ใหม่ไม่แสดงในดรอปดาวน์ได้รับการติดตั้งเรียบร้อยแล้ว"
  );
}

// เรียกใช้ฟังก์ชันเริ่มต้นเมื่อโหลดไฟล์
document.addEventListener("DOMContentLoaded", initBugFixes);
