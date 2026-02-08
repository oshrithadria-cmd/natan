// ===== Multi-Language Support =====

const translations = {
    he: {
        dir: 'rtl',
        // Login
        login_title: 'יומן ניהול משימות',
        login_subtitle: 'מעקב אחר עבודות ופרויקטי בנייה',
        login_label: 'בחר את שמך לכניסה למערכת',
        login_placeholder: 'בחר שם...',
        login_btn: 'כניסה למערכת',
        // Header
        app_title: 'יומן ניהול משימות',
        app_subtitle: 'מעקב אחר עבודות ופרויקטי בנייה',
        stat_total: 'סה"כ',
        stat_working: 'בעבודה',
        stat_waiting: 'בהמתנה',
        stat_completed: 'הושלמו',
        logout_title: 'התנתק',
        // Form
        form_title: 'הוספת משימה חדשה',
        lbl_worker: 'שם העובד',
        lbl_project: 'מספר פרויקט',
        lbl_worktype: 'סוג עבודה',
        lbl_priority: 'דחיפות פרויקט',
        lbl_status: 'סטטוס משימה',
        lbl_start_date: 'תאריך קבלת העבודה',
        lbl_end_date: 'תאריך סיום העבודה',
        lbl_description: 'תיאור העבודה',
        ph_worker: 'הכנס את שם העובד',
        ph_project: 'הכנס מספר פרויקט',
        ph_worktype: 'בחר סוג עבודה',
        ph_priority: 'בחר רמת דחיפות',
        ph_description: 'תאר את העבודה שבוצעה...',
        hint_enddate: 'השאר ריק אם העבודה לא הסתיימה',
        btn_add: 'הוסף משימה',
        btn_update: 'עדכן משימה',
        btn_cancel_edit: 'ביטול עריכה',
        // Priority options
        opt_critical: 'קריטי - דרוש טיפול מיידי',
        opt_high: 'גבוה - דחוף',
        opt_medium: 'בינוני - רגיל',
        opt_low: 'נמוך - לא דחוף',
        // Status options
        opt_working: 'בעבודה',
        opt_waiting: 'בהמתנה',
        opt_completed: 'הושלם',
        // Priority short labels
        priority_critical: 'קריטי',
        priority_high: 'גבוה',
        priority_medium: 'בינוני',
        priority_low: 'נמוך',
        // Status labels
        status_working: 'בעבודה',
        status_waiting: 'בהמתנה',
        status_completed: 'הושלם',
        // Filter
        filter_all: 'הכל',
        filter_working: 'בעבודה',
        filter_waiting: 'בהמתנה',
        filter_completed: 'הושלמו',
        filter_all_users: 'כולם',
        filter_my_tasks: 'המשימות שלי',
        ph_search: 'חיפוש לפי שם, פרויקט או תיאור...',
        btn_export: 'ייצוא לאקסל',
        // Table
        th_num: '#',
        th_worker: 'שם העובד',
        th_project: 'מספר פרויקט',
        th_worktype: 'סוג עבודה',
        th_description: 'תיאור העבודה',
        th_priority: 'דחיפות',
        th_start: 'תאריך קבלה',
        th_end: 'תאריך סיום',
        th_status: 'סטטוס',
        th_updated: 'עודכן אחרון',
        th_actions: 'פעולות',
        // Empty
        empty_title: 'אין משימות עדיין',
        empty_text: 'הוסף את המשימה הראשונה שלך באמצעות הטופס למעלה',
        // Modal
        modal_delete_title: 'מחיקת משימה',
        modal_delete_text: 'האם אתה בטוח שברצונך למחוק את המשימה?',
        modal_delete_text2: 'פעולה זו אינה ניתנת לביטול.',
        btn_delete: 'מחק',
        btn_cancel: 'ביטול',
        // Toasts
        toast_added: 'המשימה נוספה בהצלחה',
        toast_updated: 'המשימה עודכנה בהצלחה',
        toast_deleted: 'המשימה נמחקה',
        toast_status_changed: 'הסטטוס שונה ל',
        toast_export_ok: 'הקובץ יורד בהצלחה',
        toast_export_empty: 'אין משימות לייצוא',
        // Tooltips
        tip_status: 'שנה סטטוס',
        tip_edit: 'ערוך',
        tip_delete: 'מחק',
        tip_sort_priority: 'מיין לפי דחיפות',
        tip_drag: 'גרור לשינוי סדר',
        // Time Tracking
        th_work_time: 'זמן עבודה',
        time_days_short: 'י ',
        time_days_full: 'ימים',
        time_hours_full: 'שעות',
        time_minutes_full: 'דקות',
        // Summary Dashboard
        summary_title: 'סיכום שעות עבודה',
        summary_btn: 'סיכום שעות',
        summary_per_project: 'זמן לפי פרויקט',
        summary_day: 'היום',
        summary_week: 'השבוע',
        summary_month: 'החודש',
        summary_total: 'סה"כ',
        summary_worker: 'עובד',
        summary_project: 'פרויקט',
        summary_time: 'זמן עבודה',
        summary_no_data: 'אין נתונים להצגה',
        summary_all_workers: 'כל העובדים',
        summary_export: 'ייצוא סיכום לאקסל',
    },

    en: {
        dir: 'ltr',
        login_title: 'Task Management Journal',
        login_subtitle: 'Track construction work & projects',
        login_label: 'Select your name to enter the system',
        login_placeholder: 'Select name...',
        login_btn: 'Enter System',
        app_title: 'Task Management Journal',
        app_subtitle: 'Track construction work & projects',
        stat_total: 'Total',
        stat_working: 'Working',
        stat_waiting: 'Waiting',
        stat_completed: 'Done',
        logout_title: 'Logout',
        form_title: 'Add New Task',
        lbl_worker: 'Worker Name',
        lbl_project: 'Project Number',
        lbl_worktype: 'Work Type',
        lbl_priority: 'Project Priority',
        lbl_status: 'Task Status',
        lbl_start_date: 'Start Date',
        lbl_end_date: 'End Date',
        lbl_description: 'Work Description',
        ph_worker: 'Enter worker name',
        ph_project: 'Enter project number',
        ph_worktype: 'Select work type',
        ph_priority: 'Select priority level',
        ph_description: 'Describe the work performed...',
        hint_enddate: 'Leave empty if work is not finished',
        btn_add: 'Add Task',
        btn_update: 'Update Task',
        btn_cancel_edit: 'Cancel Edit',
        opt_critical: 'Critical - Immediate action required',
        opt_high: 'High - Urgent',
        opt_medium: 'Medium - Normal',
        opt_low: 'Low - Not urgent',
        opt_working: 'Working',
        opt_waiting: 'Waiting',
        opt_completed: 'Completed',
        priority_critical: 'Critical',
        priority_high: 'High',
        priority_medium: 'Medium',
        priority_low: 'Low',
        status_working: 'Working',
        status_waiting: 'Waiting',
        status_completed: 'Completed',
        filter_all: 'All',
        filter_working: 'Working',
        filter_waiting: 'Waiting',
        filter_completed: 'Completed',
        filter_all_users: 'Everyone',
        filter_my_tasks: 'My Tasks',
        ph_search: 'Search by name, project or description...',
        btn_export: 'Export to Excel',
        th_num: '#',
        th_worker: 'Worker',
        th_project: 'Project #',
        th_worktype: 'Type',
        th_description: 'Description',
        th_priority: 'Priority',
        th_start: 'Start Date',
        th_end: 'End Date',
        th_status: 'Status',
        th_updated: 'Last Updated',
        th_actions: 'Actions',
        empty_title: 'No tasks yet',
        empty_text: 'Add your first task using the form above',
        modal_delete_title: 'Delete Task',
        modal_delete_text: 'Are you sure you want to delete this task?',
        modal_delete_text2: 'This action cannot be undone.',
        btn_delete: 'Delete',
        btn_cancel: 'Cancel',
        toast_added: 'Task added successfully',
        toast_updated: 'Task updated successfully',
        toast_deleted: 'Task deleted',
        toast_status_changed: 'Status changed to ',
        toast_export_ok: 'File downloaded successfully',
        toast_export_empty: 'No tasks to export',
        tip_status: 'Change status',
        tip_edit: 'Edit',
        tip_delete: 'Delete',
        tip_sort_priority: 'Sort by priority',
        tip_drag: 'Drag to reorder',
        // Time Tracking
        th_work_time: 'Work Time',
        time_days_short: 'd ',
        time_days_full: 'days',
        time_hours_full: 'hours',
        time_minutes_full: 'minutes',
        // Summary Dashboard
        summary_title: 'Work Hours Summary',
        summary_btn: 'Hours Summary',
        summary_per_project: 'Time per Project',
        summary_day: 'Today',
        summary_week: 'This Week',
        summary_month: 'This Month',
        summary_total: 'Total',
        summary_worker: 'Worker',
        summary_project: 'Project',
        summary_time: 'Work Time',
        summary_no_data: 'No data to display',
        summary_all_workers: 'All Workers',
        summary_export: 'Export Summary to Excel',
    },

    ru: {
        dir: 'ltr',
        login_title: 'Журнал управления задачами',
        login_subtitle: 'Отслеживание строительных работ и проектов',
        login_label: 'Выберите ваше имя для входа в систему',
        login_placeholder: 'Выберите имя...',
        login_btn: 'Войти в систему',
        app_title: 'Журнал управления задачами',
        app_subtitle: 'Отслеживание строительных работ и проектов',
        stat_total: 'Всего',
        stat_working: 'В работе',
        stat_waiting: 'Ожидание',
        stat_completed: 'Готово',
        logout_title: 'Выйти',
        form_title: 'Добавить новую задачу',
        lbl_worker: 'Имя работника',
        lbl_project: 'Номер проекта',
        lbl_worktype: 'Тип работы',
        lbl_priority: 'Приоритет проекта',
        lbl_status: 'Статус задачи',
        lbl_start_date: 'Дата начала работы',
        lbl_end_date: 'Дата окончания работы',
        lbl_description: 'Описание работы',
        ph_worker: 'Введите имя работника',
        ph_project: 'Введите номер проекта',
        ph_worktype: 'Выберите тип работы',
        ph_priority: 'Выберите уровень приоритета',
        ph_description: 'Опишите выполненную работу...',
        hint_enddate: 'Оставьте пустым если работа не завершена',
        btn_add: 'Добавить задачу',
        btn_update: 'Обновить задачу',
        btn_cancel_edit: 'Отменить редактирование',
        opt_critical: 'Критический - Требуется немедленно',
        opt_high: 'Высокий - Срочно',
        opt_medium: 'Средний - Обычный',
        opt_low: 'Низкий - Не срочно',
        opt_working: 'В работе',
        opt_waiting: 'Ожидание',
        opt_completed: 'Завершено',
        priority_critical: 'Критический',
        priority_high: 'Высокий',
        priority_medium: 'Средний',
        priority_low: 'Низкий',
        status_working: 'В работе',
        status_waiting: 'Ожидание',
        status_completed: 'Завершено',
        filter_all: 'Все',
        filter_working: 'В работе',
        filter_waiting: 'Ожидание',
        filter_completed: 'Завершено',
        filter_all_users: 'Все сотрудники',
        filter_my_tasks: 'Мои задачи',
        ph_search: 'Поиск по имени, проекту или описанию...',
        btn_export: 'Экспорт в Excel',
        th_num: '#',
        th_worker: 'Работник',
        th_project: '№ Проекта',
        th_worktype: 'Тип',
        th_description: 'Описание',
        th_priority: 'Приоритет',
        th_start: 'Дата начала',
        th_end: 'Дата конца',
        th_status: 'Статус',
        th_updated: 'Обновлено',
        th_actions: 'Действия',
        empty_title: 'Задач пока нет',
        empty_text: 'Добавьте первую задачу с помощью формы выше',
        modal_delete_title: 'Удалить задачу',
        modal_delete_text: 'Вы уверены что хотите удалить эту задачу?',
        modal_delete_text2: 'Это действие нельзя отменить.',
        btn_delete: 'Удалить',
        btn_cancel: 'Отмена',
        toast_added: 'Задача добавлена успешно',
        toast_updated: 'Задача обновлена успешно',
        toast_deleted: 'Задача удалена',
        toast_status_changed: 'Статус изменён на ',
        toast_export_ok: 'Файл загружен успешно',
        toast_export_empty: 'Нет задач для экспорта',
        tip_status: 'Изменить статус',
        tip_edit: 'Редактировать',
        tip_delete: 'Удалить',
        tip_sort_priority: 'Сортировать по приоритету',
        tip_drag: 'Перетащите для изменения порядка',
        // Time Tracking
        th_work_time: 'Время работы',
        time_days_short: 'д ',
        time_days_full: 'дней',
        time_hours_full: 'часов',
        time_minutes_full: 'минут',
        // Summary Dashboard
        summary_title: 'Сводка рабочих часов',
        summary_btn: 'Сводка часов',
        summary_per_project: 'Время по проектам',
        summary_day: 'Сегодня',
        summary_week: 'На этой неделе',
        summary_month: 'В этом месяце',
        summary_total: 'Всего',
        summary_worker: 'Работник',
        summary_project: 'Проект',
        summary_time: 'Время работы',
        summary_no_data: 'Нет данных для отображения',
        summary_all_workers: 'Все работники',
        summary_export: 'Экспорт сводки в Excel',
    },

    am: {
        dir: 'ltr',
        login_title: 'የስራ ማስተዳደሪያ ማስታወሻ',
        login_subtitle: 'የግንባታ ስራዎችን እና ፕሮጀክቶችን ይከታተሉ',
        login_label: 'ወደ ስርዓቱ ለመግባት ስምዎን ይምረጡ',
        login_placeholder: 'ስም ይምረጡ...',
        login_btn: 'ወደ ስርዓቱ ግባ',
        app_title: 'የስራ ማስተዳደሪያ ማስታወሻ',
        app_subtitle: 'የግንባታ ስራዎችን እና ፕሮጀክቶችን ይከታተሉ',
        stat_total: 'ጠቅላላ',
        stat_working: 'በስራ ላይ',
        stat_waiting: 'በመጠበቅ',
        stat_completed: 'ተጠናቅቋል',
        logout_title: 'ውጣ',
        form_title: 'አዲስ ስራ ጨምር',
        lbl_worker: 'የሰራተኛ ስም',
        lbl_project: 'የፕሮጀክት ቁጥር',
        lbl_worktype: 'የስራ አይነት',
        lbl_priority: 'የፕሮጀክት ቅድሚያ',
        lbl_status: 'የስራ ሁኔታ',
        lbl_start_date: 'ስራ የተቀበለበት ቀን',
        lbl_end_date: 'ስራ ያለቀበት ቀን',
        lbl_description: 'የስራ ዝርዝር',
        ph_worker: 'የሰራተኛውን ስም ያስገቡ',
        ph_project: 'የፕሮጀክት ቁጥር ያስገቡ',
        ph_worktype: 'የስራ አይነት ይምረጡ',
        ph_priority: 'የቅድሚያ ደረጃ ይምረጡ',
        ph_description: 'የተሰራውን ስራ ይግለጹ...',
        hint_enddate: 'ስራው ካላለቀ ባዶ ይተውት',
        btn_add: 'ስራ ጨምር',
        btn_update: 'ስራ አዘምን',
        btn_cancel_edit: 'ማስተካከል ሰርዝ',
        opt_critical: 'ወሳኝ - አስቸኳይ እርምጃ ያስፈልጋል',
        opt_high: 'ከፍተኛ - አስቸኳይ',
        opt_medium: 'መካከለኛ - መደበኛ',
        opt_low: 'ዝቅተኛ - አስቸኳይ አይደለም',
        opt_working: 'በስራ ላይ',
        opt_waiting: 'በመጠበቅ',
        opt_completed: 'ተጠናቅቋል',
        priority_critical: 'ወሳኝ',
        priority_high: 'ከፍተኛ',
        priority_medium: 'መካከለኛ',
        priority_low: 'ዝቅተኛ',
        status_working: 'በስራ ላይ',
        status_waiting: 'በመጠበቅ',
        status_completed: 'ተጠናቅቋል',
        filter_all: 'ሁሉም',
        filter_working: 'በስራ ላይ',
        filter_waiting: 'በመጠበቅ',
        filter_completed: 'ተጠናቅቋል',
        filter_all_users: 'ሁሉም ሰራተኞች',
        filter_my_tasks: 'የኔ ስራዎች',
        ph_search: 'በስም፣ ፕሮጀክት ወይም ዝርዝር ፈልግ...',
        btn_export: 'ወደ ኤክሴል ላክ',
        th_num: '#',
        th_worker: 'ሰራተኛ',
        th_project: 'ፕሮጀክት #',
        th_worktype: 'አይነት',
        th_description: 'ዝርዝር',
        th_priority: 'ቅድሚያ',
        th_start: 'የጀመረበት',
        th_end: 'ያለቀበት',
        th_status: 'ሁኔታ',
        th_updated: 'የተዘመነ',
        th_actions: 'ድርጊቶች',
        empty_title: 'ምንም ስራ የለም',
        empty_text: 'ከላይ ያለውን ቅጽ በመጠቀም የመጀመሪያ ስራዎን ያክሉ',
        modal_delete_title: 'ስራ ሰርዝ',
        modal_delete_text: 'ይህን ስራ መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት?',
        modal_delete_text2: 'ይህ ድርጊት ሊቀለበስ አይችልም።',
        btn_delete: 'ሰርዝ',
        btn_cancel: 'ተወው',
        toast_added: 'ስራ በተሳካ ሁኔታ ተጨምሯል',
        toast_updated: 'ስራ በተሳካ ሁኔታ ተዘምኗል',
        toast_deleted: 'ስራ ተሰርዟል',
        toast_status_changed: 'ሁኔታ ተቀይሯል ወደ ',
        toast_export_ok: 'ፋይሉ በተሳካ ሁኔታ ወርዷል',
        toast_export_empty: 'ለመላክ ስራ የለም',
        tip_status: 'ሁኔታ ቀይር',
        tip_edit: 'አርትዕ',
        tip_delete: 'ሰርዝ',
        tip_sort_priority: 'በቅድሚያ ደርድር',
        tip_drag: 'ለማስተካከል ይጎትቱ',
        // Time Tracking
        th_work_time: 'የስራ ጊዜ',
        time_days_short: 'ቀ ',
        time_days_full: 'ቀናት',
        time_hours_full: 'ሰዓታት',
        time_minutes_full: 'ደቂቃዎች',
        // Summary Dashboard
        summary_title: 'የስራ ሰዓት ማጠቃለያ',
        summary_btn: 'ሰዓት ማጠቃለያ',
        summary_per_project: 'በፕሮጀክት ጊዜ',
        summary_day: 'ዛሬ',
        summary_week: 'በዚህ ሳምንት',
        summary_month: 'በዚህ ወር',
        summary_total: 'ጠቅላላ',
        summary_worker: 'ሰራተኛ',
        summary_project: 'ፕሮጀክት',
        summary_time: 'የስራ ጊዜ',
        summary_no_data: 'ምንም መረጃ የለም',
        summary_all_workers: 'ሁሉም ሰራተኞች',
        summary_export: 'ማጠቃለያ ወደ ኤክሴል ላክ',
    }
};

let currentLang = localStorage.getItem('appLang') || 'he';

function T(key) {
    return (translations[currentLang] && translations[currentLang][key]) || translations['he'][key] || key;
}

function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('appLang', lang);
    const dir = translations[lang].dir;

    // Update document direction
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang === 'am' ? 'am' : lang);

    // Update all data-i18n elements (textContent)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = T(el.dataset.i18n);
    });

    // Update all data-i18n-placeholder elements
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        el.placeholder = T(el.dataset.i18nPh);
    });

    // Update all data-i18n-title elements
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = T(el.dataset.i18nTitle);
    });

    // Update select options
    document.querySelectorAll('[data-i18n-opt]').forEach(el => {
        el.textContent = T(el.dataset.i18nOpt);
    });

    // Update language selector active state
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update CSS direction-dependent styles
    document.querySelectorAll('.form-group select').forEach(sel => {
        if (dir === 'rtl') {
            sel.style.backgroundPosition = 'left 10px center';
            sel.style.paddingLeft = '32px';
            sel.style.paddingRight = '13px';
        } else {
            sel.style.backgroundPosition = 'right 10px center';
            sel.style.paddingRight = '32px';
            sel.style.paddingLeft = '13px';
        }
    });

    // Update table text-align
    document.querySelectorAll('th').forEach(th => {
        th.style.textAlign = dir === 'rtl' ? 'right' : 'left';
    });

    // Update logout margin
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        if (dir === 'rtl') { logoutBtn.style.marginRight = '-4px'; logoutBtn.style.marginLeft = '0'; }
        else { logoutBtn.style.marginLeft = '-4px'; logoutBtn.style.marginRight = '0'; }
    }

    // Re-render tasks with new language
    if (typeof renderTasks === 'function') renderTasks();
}

function initLanguage() {
    switchLanguage(currentLang);
}
