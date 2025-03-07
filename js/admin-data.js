/**
 * ไฟล์จัดการข้อมูลสำหรับหน้าแอดมิน
 * รองรับการทำงานกับ Supabase API
 */

// ข้อมูลสำหรับการจำลองสถิติในแดชบอร์ด
const MOCK_STATS = {
  views: Math.floor(Math.random() * 5000) + 2000, // สุ่มจำนวนการเข้าชม 2,000-7,000
  activities: [
    // รายการกิจกรรมจำลอง (ไม่เปลี่ยนแปลง)
  ],
};

/**
 * แสดงข้อความแจ้งเตือนสำเร็จ
 * @param {string} message - ข้อความแจ้งเตือน
 */
function showSuccess(message) {
  // สร้าง success toast notification
  const toast = document.createElement("div");
  toast.className = "success-toast";
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

  const icon = document.createElement("i");
  icon.className = "fas fa-check-circle";
  icon.style.marginRight = "10px";

  const text = document.createElement("div");
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  document.body.appendChild(toast);

  // ให้ toast หายไปหลังจาก 3 วินาที
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.5s ease";
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 500);
  }, 3000);
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
 * บันทึกคำถาม (เพิ่มคำถามใหม่ หรือ แก้ไขคำถามเดิม)
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

    // โหลดข้อมูลใหม่
    if (ADMIN_UI_STATE.currentView === "questions") {
      loadQuestionsData();
    } else {
      switchAdminView("questions");
    }
  } catch (error) {
    hideLoadingOverlay();
    logError("เกิดข้อผิดพลาดในการบันทึกคำถาม:", error);
    showError("ไม่สามารถบันทึกคำถามได้");
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

    if (type === "question") {
      // ลบคำถาม
      const id = parseInt(itemId, 10);
      const index = UI_STATE.questions.findIndex((q) => q.id === id);

      if (index !== -1) {
        const question = UI_STATE.questions[index];

        try {
          // ลบใน Supabase
          await deleteQuestionFromSupabase(id);

          // ลบใน UI_STATE
          UI_STATE.questions.splice(index, 1);

          // บันทึกกิจกรรม
          logActivity(
            "delete",
            "คำถาม",
            `ลบคำถาม ID ${id}: ${question.question.substring(0, 30)}...`
          );

          showSuccess("ลบคำถามเรียบร้อยแล้ว");
        } catch (error) {
          logError("ไม่สามารถลบข้อมูลใน Supabase ได้:", error);
          showError("ไม่สามารถลบข้อมูลในฐานข้อมูลได้");
          throw error;
        }
      }

      // โหลดข้อมูลคำถามใหม่
      if (ADMIN_UI_STATE.currentView === "questions") {
        loadQuestionsData();
      }
    } else if (type === "category") {
      // ลบหมวดหมู่
      const index = UI_STATE.groups.findIndex((g) => g === itemId);

      if (index !== -1) {
        // อัปเดตหมวดหมู่ในคำถาม (กำหนดให้ไปอยู่ในหมวดหมู่แรก หรือไม่มีหมวดหมู่)
        const defaultGroup =
          UI_STATE.groups.length > 1
            ? UI_STATE.groups[0] === itemId
              ? UI_STATE.groups[1]
              : UI_STATE.groups[0]
            : "";

        // สร้าง Promise array สำหรับการอัพเดททั้งหมด
        const updatePromises = [];

        UI_STATE.questions.forEach((question) => {
          if (question.group === itemId) {
            question.group = defaultGroup;
            question.updated_at = new Date().toISOString();

            // เพิ่ม Promise ไปใน array
            if (question.id) {
              updatePromises.push(
                updateQuestionInSupabase(question.id, {
                  group: defaultGroup,
                  updated_at: question.updated_at,
                }).catch((error) => {
                  logError(
                    `ไม่สามารถอัพเดทหมวดหมู่สำหรับคำถาม ID ${question.id} ได้:`,
                    error
                  );
                })
              );
            }
          }
        });

        // รอให้การอัพเดททั้งหมดเสร็จสิ้น
        try {
          await Promise.allSettled(updatePromises);
        } catch (updateError) {
          logError(
            "เกิดข้อผิดพลาดในการอัพเดทคำถามหลังการลบหมวดหมู่:",
            updateError
          );
          showWarning("เกิดข้อผิดพลาดบางส่วนในการอัพเดทคำถาม");
        }

        // ลบหมวดหมู่จาก UI_STATE
        UI_STATE.groups.splice(index, 1);

        // ลบไอคอนของหมวดหมู่
        delete CONFIG.groupIcons[itemId];

        // บันทึกกิจกรรม
        logActivity("delete", "หมวดหมู่", `ลบหมวดหมู่: ${itemId}`);

        // แสดงข้อความแจ้งเตือน
        showSuccess("ลบหมวดหมู่เรียบร้อยแล้ว");
      }

      // โหลดข้อมูลหมวดหมู่ใหม่
      if (ADMIN_UI_STATE.currentView === "categories") {
        loadCategoriesData();
      }
    }

    // ซ่อน loading
    hideLoadingOverlay();

    // ปิด Modal
    toggleModal("confirmDeleteModal", false);
  } catch (error) {
    hideLoadingOverlay();
    logError("เกิดข้อผิดพลาดในการลบรายการ:", error);
    showError("ไม่สามารถลบรายการได้");
  }
}

/**
 * โหลดข้อมูลสำหรับแดชบอร์ด
 */
async function loadDashboardData() {
  try {
    // โหลดข้อมูล FAQ
    await loadFAQData();

    // แสดงจำนวนคำถามทั้งหมด
    document.getElementById("totalQuestions").textContent =
      UI_STATE.questions.length;

    // แสดงจำนวนหมวดหมู่
    document.getElementById("totalCategories").textContent =
      UI_STATE.groups.length;

    // แสดงจำนวนการเข้าชม (สร้างขึ้นเพื่อการสาธิต)
    document.getElementById("totalViews").textContent =
      MOCK_STATS.views.toLocaleString();

    // แสดงวันที่อัปเดตล่าสุด
    document.getElementById("lastUpdate").textContent = CONFIG.lastUpdated;

    // สร้างตารางสถิติตามหมวดหมู่
    const categoryStatsTable = document.getElementById("categoryStatsTable");
    const tbody = categoryStatsTable.querySelector("tbody");
    tbody.innerHTML = "";

    // จัดกลุ่มคำถามตามหมวดหมู่
    const groupedQuestions = {};
    UI_STATE.groups.forEach((group) => {
      groupedQuestions[group] = UI_STATE.questions.filter(
        (q) => q.group === group
      ).length;
    });

    // เพิ่มข้อมูลลงในตาราง
    UI_STATE.groups.forEach((group) => {
      const tr = document.createElement("tr");

      // ไอคอนและชื่อหมวดหมู่
      const iconClass = CONFIG.groupIcons[group] || CONFIG.defaultGroupIcon;
      const tdCategory = document.createElement("td");
      tdCategory.innerHTML = `<i class="${iconClass}"></i> ${group}`;

      // จำนวนคำถาม
      const tdQuestions = document.createElement("td");
      tdQuestions.textContent = groupedQuestions[group];

      // จำนวนการเข้าชม (สร้างขึ้นเพื่อการสาธิต)
      const tdViews = document.createElement("td");
      const views = Math.floor(Math.random() * 1000) + 100; // สุ่มจำนวนการเข้าชม 100-1,100
      tdViews.textContent = views.toLocaleString();

      tr.appendChild(tdCategory);
      tr.appendChild(tdQuestions);
      tr.appendChild(tdViews);

      tbody.appendChild(tr);
    });

    // สร้างรายการกิจกรรมล่าสุด
    const recentActivities = document.getElementById("recentActivities");
    recentActivities.innerHTML = "";

    // โหลดกิจกรรมจากการบันทึก
    const activities = getRecentActivities(5);
    if (activities.length > 0) {
      // ถ้ามีกิจกรรมที่บันทึกไว้ ให้แสดงกิจกรรมนั้น
      activities.forEach((activity) => {
        const li = document.createElement("li");

        // กำหนดสีและไอคอนตามประเภทกิจกรรม
        let icon = "fas fa-info-circle";
        let iconBg = "#3182ce";

        switch (activity.action) {
          case "add":
            icon = "fas fa-plus-circle";
            iconBg = "#3182ce";
            break;
          case "edit":
            icon = "fas fa-edit";
            iconBg = "#dd6b20";
            break;
          case "delete":
            icon = "fas fa-trash-alt";
            iconBg = "#e53e3e";
            break;
          case "view":
            icon = "fas fa-eye";
            iconBg = "#48bb78";
            break;
        }

        const activityIcon = document.createElement("div");
        activityIcon.className = "activity-icon";
        activityIcon.style.backgroundColor = iconBg + "20"; // เพิ่มความโปร่งใส
        activityIcon.style.color = iconBg;
        activityIcon.innerHTML = `<i class="${icon}"></i>`;

        const activityInfo = document.createElement("div");
        activityInfo.className = "activity-info";
        activityInfo.innerHTML = `
                    <p><b>${
                      activity.action === "add"
                        ? "เพิ่ม"
                        : activity.action === "edit"
                        ? "แก้ไข"
                        : activity.action === "delete"
                        ? "ลบ"
                        : "ดู"
                    }${activity.section}</b></p>
                    <p>${activity.description}</p>
                    <p class="activity-time">${formatTimeAgo(
                      activity.timestamp
                    )}</p>
                `;

        li.appendChild(activityIcon);
        li.appendChild(activityInfo);
        recentActivities.appendChild(li);
      });
    }

    // บันทึกกิจกรรม
    logActivity("view", "แดชบอร์ด", "ดูแดชบอร์ด");
  } catch (error) {
    logError("เกิดข้อผิดพลาดในการโหลดข้อมูลแดชบอร์ด:", error);
    showError("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้");
  }
}

/**
 * โหลดข้อมูลคำถามและแสดงในตาราง
 */
async function loadQuestionsData() {
  try {
    // โหลดข้อมูล FAQ
    await loadFAQData();

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
 * โหลดข้อมูลหมวดหมู่และแสดงในตาราง
 */
async function loadCategoriesData() {
  try {
    // โหลดข้อมูล FAQ
    await loadFAQData();

    const categoriesTable = document.getElementById("categoriesTable");
    const tbody = categoriesTable.querySelector("tbody");
    tbody.innerHTML = "";

    if (UI_STATE.groups.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.className = "empty-message";
      td.innerHTML = '<i class="fas fa-info-circle"></i> ไม่พบข้อมูลหมวดหมู่';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    // จัดกลุ่มคำถามตามหมวดหมู่
    const groupedQuestions = {};
    UI_STATE.groups.forEach((group) => {
      groupedQuestions[group] = UI_STATE.questions.filter(
        (q) => q.group === group
      ).length;
    });

    // เพิ่มข้อมูลลงในตาราง
    UI_STATE.groups.forEach((group, index) => {
      const tr = document.createElement("tr");

      // ลำดับ
      const tdOrder = document.createElement("td");
      tdOrder.textContent = index + 1;

      // ชื่อหมวดหมู่
      const tdName = document.createElement("td");
      tdName.textContent = group;

      // ไอคอน
      const tdIcon = document.createElement("td");
      const iconClass = CONFIG.groupIcons[group] || CONFIG.defaultGroupIcon;
      tdIcon.innerHTML = `<i class="${iconClass}"></i> ${iconClass}`;

      // จำนวนคำถาม
      const tdCount = document.createElement("td");
      tdCount.textContent = groupedQuestions[group];

      // การจัดการ
      const tdActions = document.createElement("td");
      tdActions.className = "action-buttons";

      // ปุ่มแก้ไข
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-info btn-icon";
      editBtn.title = "แก้ไข";
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener("click", () => prepareEditCategory(group));

      // ปุ่มลบ
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-danger btn-icon";
      deleteBtn.title = "ลบ";
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      deleteBtn.addEventListener("click", () =>
        prepareConfirmDelete("category", group)
      );

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
    logActivity("view", "หมวดหมู่", "ดูรายการหมวดหมู่");
  } catch (error) {
    logError("เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่:", error);
    showError("ไม่สามารถโหลดข้อมูลหมวดหมู่ได้");
  }
}

/**
 * บันทึกหมวดหมู่
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
    } else {
      // แก้ไขหมวดหมู่ที่มีอยู่
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
          const updatePromises = [];

          UI_STATE.questions.forEach((question) => {
            if (question.group === oldCategoryName) {
              question.group = categoryName;
              question.updated_at = new Date().toISOString();

              // พยายามอัพเดทใน Supabase
              if (question.id) {
                const updatePromise = updateQuestionInSupabase(question.id, {
                  group: categoryName,
                  updated_at: question.updated_at,
                }).catch((error) => {
                  logError(
                    `ไม่สามารถอัพเดทหมวดหมู่สำหรับคำถาม ID ${question.id} ได้:`,
                    error
                  );
                });

                updatePromises.push(updatePromise);
              }
            }
          });

          // รอให้การอัพเดทเสร็จสิ้น
          try {
            await Promise.allSettled(updatePromises);
          } catch (updateError) {
            logError(
              "เกิดข้อผิดพลาดในการอัพเดทคำถามหลังการเปลี่ยนชื่อหมวดหมู่:",
              updateError
            );
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
      logActivity(
        "edit",
        "หมวดหมู่",
        `แก้ไขหมวดหมู่: ${oldCategoryName} -> ${categoryName}`
      );

      // แสดงข้อความแจ้งเตือน
      showSuccess("แก้ไขหมวดหมู่เรียบร้อยแล้ว");
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
      switchAdminView("categories");
    }
  } catch (error) {
    hideLoadingOverlay();
    logError("เกิดข้อผิดพลาดในการบันทึกหมวดหมู่:", error);
    showError("ไม่สามารถบันทึกหมวดหมู่ได้");
  }
}
// ฟังก์ชันใหม่สำหรับอัปเดตตารางหมวดหมู่โดยไม่ต้องโหลดข้อมูลจาก API ใหม่
function updateCategoriesTable() {
  try {
    const categoriesTable = document.getElementById("categoriesTable");
    const tbody = categoriesTable.querySelector("tbody");
    tbody.innerHTML = "";

    if (UI_STATE.groups.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.className = "empty-message";
      td.innerHTML = '<i class="fas fa-info-circle"></i> ไม่พบข้อมูลหมวดหมู่';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    // จัดกลุ่มคำถามตามหมวดหมู่
    const groupedQuestions = {};
    UI_STATE.groups.forEach((group) => {
      groupedQuestions[group] = UI_STATE.questions.filter(
        (q) => q.group === group
      ).length;
    });

    // เพิ่มข้อมูลลงในตาราง
    UI_STATE.groups.forEach((group, index) => {
      const tr = document.createElement("tr");

      // ลำดับ
      const tdOrder = document.createElement("td");
      tdOrder.textContent = index + 1;

      // ชื่อหมวดหมู่
      const tdName = document.createElement("td");
      tdName.textContent = group;

      // ไอคอน
      const tdIcon = document.createElement("td");
      const iconClass = CONFIG.groupIcons[group] || CONFIG.defaultGroupIcon;
      tdIcon.innerHTML = `<i class="${iconClass}"></i> ${iconClass}`;

      // จำนวนคำถาม
      const tdCount = document.createElement("td");
      tdCount.textContent = groupedQuestions[group] || 0;

      // การจัดการ
      const tdActions = document.createElement("td");
      tdActions.className = "action-buttons";

      // ปุ่มแก้ไข
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-info btn-icon";
      editBtn.title = "แก้ไข";
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener("click", () => prepareEditCategory(group));

      // ปุ่มลบ
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-danger btn-icon";
      deleteBtn.title = "ลบ";
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      deleteBtn.addEventListener("click", () =>
        prepareConfirmDelete("category", group)
      );

      tdActions.appendChild(editBtn);
      tdActions.appendChild(deleteBtn);

      tr.appendChild(tdOrder);
      tr.appendChild(tdName);
      tr.appendChild(tdIcon);
      tr.appendChild(tdCount);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });
  } catch (error) {
    logError("เกิดข้อผิดพลาดในการอัปเดตตารางหมวดหมู่:", error);
  }
}
/**
 * โหลดข้อมูลการตั้งค่าและแสดงในฟอร์ม
 */
function loadSettingsData() {
  try {
    // แสดงการตั้งค่า Supabase
    document.getElementById("supabaseUrl").value = CONFIG.supabase.url;
    document.getElementById("supabaseKey").value = CONFIG.supabase.key;
    document.getElementById("supabaseTable").value = CONFIG.supabase.table;

    // แสดงการตั้งค่าแคช (ถ้ายังมีการใช้งาน)
    if (document.getElementById("enableCache")) {
      document.getElementById("enableCache").checked = false; // เปลี่ยนเป็นปิดเพราะเราไม่ใช้ระบบแคชแล้ว
    }

    if (document.getElementById("cacheDuration")) {
      document.getElementById("cacheDuration").value = 0;
    }

    // แสดงการตั้งค่าทั่วไป
    document.getElementById("appVersion").value = CONFIG.version;

    // แปลงวันที่เป็นรูปแบบที่ใช้กับ input type="date"
    const lastUpdatedParts = CONFIG.lastUpdated.split(" ");

    // สร้างวันที่แบบ yyyy-mm-dd
    let dateValue = "";

    try {
      // ถ้าวันที่อยู่ในรูปแบบไทย ให้แปลงเป็นรูปแบบสากล
      const day = parseInt(lastUpdatedParts[0], 10);

      const thaiMonths = [
        "ม.ค.",
        "ก.พ.",
        "มี.ค.",
        "เม.ย.",
        "พ.ค.",
        "มิ.ย.",
        "ก.ค.",
        "ส.ค.",
        "ก.ย.",
        "ต.ค.",
        "พ.ย.",
        "ธ.ค.",
      ];
      const monthIndex = thaiMonths.indexOf(lastUpdatedParts[1]);

      // แปลงปีพุทธศักราชเป็นคริสต์ศักราช
      const thaiYear = parseInt(lastUpdatedParts[2], 10);
      const year = thaiYear - 543;

      if (day && monthIndex !== -1 && year) {
        const month = monthIndex + 1;
        dateValue = `${year}-${month.toString().padStart(2, "0")}-${day
          .toString()
          .padStart(2, "0")}`;
      } else {
        // ถ้าไม่สามารถแปลงได้ ให้ใช้วันที่ปัจจุบัน
        const today = new Date();
        dateValue = today.toISOString().split("T")[0];
      }
    } catch (e) {
      // ถ้าเกิดข้อผิดพลาด ให้ใช้วันที่ปัจจุบัน
      const today = new Date();
      dateValue = today.toISOString().split("T")[0];
    }

    document.getElementById("lastUpdatedDate").value = dateValue;

    // บันทึกกิจกรรม
    logActivity("view", "การตั้งค่า", "ดูการตั้งค่าระบบ");
  } catch (error) {
    logError("เกิดข้อผิดพลาดในการโหลดข้อมูลการตั้งค่า:", error);
    showError("ไม่สามารถโหลดข้อมูลการตั้งค่าได้");
  }
}

/**
 * บันทึกการตั้งค่า
 */
function saveSettings() {
  try {
    // อัปเดตการตั้งค่า Supabase
    CONFIG.supabase.url = document.getElementById("supabaseUrl").value;
    CONFIG.supabase.key = document.getElementById("supabaseKey").value;
    CONFIG.supabase.table = document.getElementById("supabaseTable").value;

    // อัปเดตการตั้งค่าทั่วไป
    CONFIG.version = document.getElementById("appVersion").value;

    // แปลงวันที่จาก input type="date" เป็นข้อความ
    const dateInput = document.getElementById("lastUpdatedDate").value;
    const date = new Date(dateInput);
    CONFIG.lastUpdated = formatThaiDate(date);

    // อัปเดตการแสดงวันที่ในส่วนท้าย
    const lastUpdatedElement = document.getElementById("lastUpdated");
    if (lastUpdatedElement) {
      lastUpdatedElement.textContent = CONFIG.lastUpdated;
    }

    // บันทึกกิจกรรม
    logActivity("edit", "การตั้งค่า", "อัปเดตการตั้งค่าระบบ");

    // แสดงข้อความแจ้งเตือน
    showSuccess("บันทึกการตั้งค่าเรียบร้อยแล้ว");
  } catch (error) {
    logError("เกิดข้อผิดพลาดในการบันทึกการตั้งค่า:", error);
    showError("ไม่สามารถบันทึกการตั้งค่าได้");
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
    // สร้างข้อมูลกิจกรรมใหม่
    const newActivity = {
      action,
      section,
      description,
      timestamp: new Date().toISOString(),
      user: getAuthData()?.user?.username || "unknown",
    };

    // ดึงกิจกรรมที่มีอยู่
    let activities = [];
    try {
      const savedActivities = sessionStorage.getItem("adminFaqActivities");
      if (savedActivities) {
        activities = JSON.parse(savedActivities);
      }
    } catch (parseError) {
      activities = [];
    }

    // เพิ่มกิจกรรมใหม่ไว้ที่ตำแหน่งแรก
    activities.unshift(newActivity);

    // จำกัดจำนวนกิจกรรมที่เก็บไว้ (เก็บแค่ 50 รายการล่าสุด)
    if (activities.length > 50) {
      activities.length = 50;
    }

    // บันทึกลงใน sessionStorage (ใช้ sessionStorage แทน localStorage)
    sessionStorage.setItem("adminFaqActivities", JSON.stringify(activities));
  } catch (error) {
    logError("เกิดข้อผิดพลาดในการบันทึกกิจกรรม:", error);
  }
}

/**
 * โหลดกิจกรรมล่าสุด
 * @param {number} limit - จำนวนกิจกรรมที่ต้องการโหลด
 * @returns {Array} - รายการกิจกรรม
 */
function getRecentActivities(limit = 10) {
  try {
    // ดึงกิจกรรมจาก sessionStorage
    const savedActivities = sessionStorage.getItem("adminFaqActivities");
    if (savedActivities) {
      const activities = JSON.parse(savedActivities);
      return activities.slice(0, limit);
    }
    return [];
  } catch (error) {
    logError("เกิดข้อผิดพลาดในการโหลดกิจกรรม:", error);
    return [];
  }
}

/**
 * โหลดหมวดหมู่ลงในตัวกรอง
 */
function loadCategoriesForFilter() {
  const categoryFilter = document.getElementById("categoryFilter");
  if (!categoryFilter) return;

  // บันทึกค่าที่เลือกไว้
  const selectedValue = categoryFilter.value;

  // ล้างตัวเลือกเดิม (ยกเว้น "ทั้งหมด")
  while (categoryFilter.options.length > 1) {
    categoryFilter.remove(1);
  }

  // เพิ่มตัวเลือกหมวดหมู่
  UI_STATE.groups.forEach((group) => {
    const option = document.createElement("option");
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
  if (ADMIN_UI_STATE.filters.categoryFilter !== "all") {
    result = result.filter(
      (q) => q.group === ADMIN_UI_STATE.filters.categoryFilter
    );
  }

  // กรองตามคำค้นหา
  if (ADMIN_UI_STATE.filters.searchQuery) {
    const searchTerm = ADMIN_UI_STATE.filters.searchQuery.toLowerCase();
    result = result.filter(
      (q) =>
        q.question.toLowerCase().includes(searchTerm) ||
        q.answer.toLowerCase().includes(searchTerm)
    );
  }

  return result;
}

/**
 * จัดเรียงคำถาม
 * @param {Array} questions - รายการคำถามที่ต้องการจัดเรียง
 * @param {string} sortBy - วิธีการจัดเรียง (newest, oldest, alphabetical)
 * @returns {Array} - รายการคำถามที่จัดเรียงแล้ว
 */
function sortQuestions(questions, sortBy = "newest") {
  if (!questions || !Array.isArray(questions)) {
    return [];
  }

  const sortedQuestions = [...questions];

  switch (sortBy) {
    case "newest":
      // จัดเรียงตามวันที่สร้างล่าสุด
      return sortedQuestions.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA;
      });

    case "oldest":
      // จัดเรียงตามวันที่สร้างเก่าสุด
      return sortedQuestions.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateA - dateB;
      });

    case "alphabetical":
      // จัดเรียงตามตัวอักษร (ก-ฮ)
      return sortedQuestions.sort((a, b) => {
        return a.question.localeCompare(b.question, "th");
      });

    default:
      // ค่าเริ่มต้นคือจัดเรียงตาม ID
      return sortedQuestions.sort((a, b) => b.id - a.id);
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
      apikey: CONFIG.supabase.key,
      Authorization: `Bearer ${CONFIG.supabase.key}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Supabase API error: ${response.status} ${response.statusText}`
      );
    }

    return true;
  } catch (error) {
    logError("Error deleting question from Supabase:", error);
    throw error;
  }
}

/**
 * แสดงข้อความแจ้งเตือนข้อผิดพลาด
 * @param {string} message - ข้อความแจ้งเตือน
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
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 500);
  }, 5000);
}

/**
 * แสดงข้อความแจ้งเตือนเตือน
 * @param {string} message - ข้อความแจ้งเตือน
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

  // ให้ toast หายไปหลังจาก 4 วินาที
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.5s ease";
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 500);
  }, 4000);
}

/**
 * สร้างคำถามใหม่ใน Supabase
 * @param {Object} question - ข้อมูลคำถาม
 * @returns {Promise<Object>} - ข้อมูลคำถามที่สร้าง
 */
async function createQuestionInSupabase(question) {
  try {
    const url = `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.table}`;
    const headers = {
      apikey: CONFIG.supabase.key,
      Authorization: `Bearer ${CONFIG.supabase.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(question),
    });

    if (!response.ok) {
      throw new Error(
        `Supabase API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    logError("Error creating question in Supabase:", error);
    throw error;
  }
}

/**
 * อัปเดตคำถามใน Supabase
 * @param {number} id - ID ของคำถาม
 * @param {Object} question - ข้อมูลคำถามที่จะอัปเดต
 * @returns {Promise<boolean>} - true หากสำเร็จ
 */
async function updateQuestionInSupabase(id, question) {
  try {
    const url = `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.table}?id=eq.${id}`;
    const headers = {
      apikey: CONFIG.supabase.key,
      Authorization: `Bearer ${CONFIG.supabase.key}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(question),
    });

    if (!response.ok) {
      throw new Error(
        `Supabase API error: ${response.status} ${response.statusText}`
      );
    }

    return true;
  } catch (error) {
    logError("Error updating question in Supabase:", error);
    throw error;
  }
}
