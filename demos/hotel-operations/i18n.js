/* Hotel operations demo — English / Arabic copy.
   Canonical data keys stay English. This file translates at display time. */

(function () {
  "use strict";

  var STRINGS = {
    en: {
      langToggleAria: "Language",
      navOverview: "Overview",
      navColleagues: "Colleagues",
      navTasks: "Tasks",
      navTaskTypes: "Task types",
      navMessages: "Messages",
      backDemos: "Bespoke demos",
      brandName: "The Marlow",
      brandSub: "Fifth Avenue Operations",
      footer: "Rooms Division · v2.4",
      camerasOnline: "All camera zones online",
      occupancy: "Occupancy 91%",
      goodAfternoon: "Good afternoon, Elena",
      overviewSub: "{day} · {onDuty} colleagues on duty · {open} tasks open today",
      assignATask: "Assign a task",
      sendAMessage: "Send a message",
      statOverdue: "Overdue",
      statInProgress: "In progress",
      statCompletedToday: "Completed today",
      statOnTimeRate: "On-time rate",
      statAlertsSent: "Alerts sent",
      subTasks: "tasks",
      subToday: "today",
      subAlerts: "by assistant today",
      propertyGlance: "Property at a glance",
      openWorkByFloor: "Open work by floor and wing",
      legendAllClear: "All clear",
      seeAllOnFloor: "See all on this floor",
      nothingOpenHere: "Nothing open here right now.",
      due: "due",
      onDutyNow: "On duty now",
      allColleagues: "All colleagues",
      nextPrefix: "Next: ",
      at: "at",
      nothingScheduled: "nothing scheduled",
      messageBtn: "Message",
      recentAlerts: "Recent alerts and reminders",
      messageCenter: "Message center",
      to: "To",
      assistant: "Assistant",
      you: "You",
      colleaguesTitle: "Colleagues",
      colleaguesSub: "Performance, assignments and conversations for each team member.",
      searchNameRole: "Search by name or role",
      onDuty: "On duty",
      offDuty: "Off duty",
      shift: "Shift",
      nOverdue: "{n} overdue",
      overallScore: "Overall score",
      assignTask: "Assign task",
      completed7d: "Completed (7 days)",
      onTime: "On time",
      avgVsAllotted: "Average vs. allotted",
      assignedNow: "Assigned now",
      assignedTasks: "Assigned tasks",
      nOpen: "{n} open",
      nothingAssigned: "Nothing assigned. Add a task from the button above.",
      completedLog: "Completed log",
      minLate: "{n} min late",
      minEarly: "{n} min early",
      conversation: "Conversation",
      conversationHint: "Assistant sends alerts automatically when a task passes its deadline",
      noMessagesYet: "No messages yet. Say hello or send a reminder below.",
      tasksTitle: "Tasks",
      tasksSub: "Every scheduled, active and completed task across the property.",
      addOneOff: "Add one-off task",
      whenAll: "All",
      whenCurrent: "Current",
      whenUpcoming: "Upcoming",
      whenPast: "Past",
      searchTask: "Search task, room or colleague",
      ariaStatus: "Status",
      ariaTeam: "Team",
      ariaCategory: "Category",
      ariaFloor: "Floor",
      filterAll: "All",
      clear: "Clear",
      thTask: "Task",
      thLocation: "Location",
      thAssignedTo: "Assigned to",
      thWindow: "Window",
      thStatus: "Status",
      thPriority: "Priority",
      oneOff: "one-off",
      done: "Done",
      noTasksMatch: "No tasks match these filters. Clear them or add a one-off task.",
      errTaskName: "Give the task a name so colleagues recognise it in their list.",
      errAllotted: "Allotted time must be at least 1 minute.",
      toastTypeSaved: "Task type saved",
      any: "Any",
      taskTypesTitle: "Task types",
      taskTypesSub: "Define the recurring, trackable work each team is responsible for. The assistant uses the allotted time and escalation window to send reminders automatically.",
      newTaskType: "New task type",
      taskName: "Task name",
      phEveningTurndown: "e.g. Evening turndown",
      descAndStandard: "Description and standard",
      phDescription: "What a complete, on-standard result looks like. This is what the colleague sees.",
      category: "Category",
      assignedToTeam: "Assigned to team",
      floor: "Floor",
      wing: "Wing",
      roomOrArea: "Room or area",
      optional: "Optional",
      allottedMin: "Allotted time (min)",
      escalateAfter: "Escalate after (min late)",
      defaultPriority: "Default priority",
      schedule: "Schedule",
      phSchedule: "Daily 18:00–21:00, every 2 hours, on arrival…",
      verifiedBy: "Verified by",
      phVerified: "Camera zone, sensor, sign-off",
      reset: "Reset",
      saveTaskType: "Save task type",
      existingTypes: "Existing task types",
      nDefined: "{n} defined",
      tplMeta: "{allotted} min allotted · escalates after {esc} min · {recurrence}",
      verifiedByMeta: "verified by {v}",
      messagesTitle: "Message center",
      messagesSub: "Everything sent to colleagues by you or the assistant, in one place.",
      filterAlerts: "Alerts",
      filterReplies: "Replies",
      prefixAssistant: "Assistant: ",
      prefixYou: "You: ",
      noConversations: "No conversations in this view.",
      errModalName: "Name the task so the colleague knows what to do.",
      errStartTime: "Start time should look like 14:30.",
      toastAssignedTo: "Assigned to {name}",
      modalTitle: "Add a one-off task",
      modalSub: "Assigned directly to one colleague. The assistant will remind them if it runs late.",
      labelTask: "Task",
      phDeliverPillows: "e.g. Deliver extra pillows to 1108",
      assignTo: "Assign to",
      offDutyParen: "(off duty)",
      startToday: "Start (today)",
      priority: "Priority",
      notesForColleague: "Notes for the colleague",
      phNotes: "Guest preferences, access details, anything they should know.",
      cancel: "Cancel",
      quickSend: "Quick send:",
      remindNext: "Remind about next task",
      checkIn: "Check in",
      urgentCallIn: "Urgent call-in",
      phMessage: "Message {name}…",
      send: "Send",
      toastSent: "Sent",
      toastAlertSent: "Alert sent",
      toastReminderSent: "Reminder sent",
      toastPriority: "Priority set to {p}",
      toastOverdueAlert: "Assistant alerted {name} about an overdue task",
      aColleague: "a colleague",
      lobby: "Lobby",
      anyFloor: "Any floor",
      floorN: "Floor {n}",
      cellOpen: "{floor} · {wing}: {n} open",
      reminderBody: "Reminder: {name}{room} is due at {time}.",
      inRoom: " in {room}",
      checkInBody: "Please check in with the front desk when you have a moment.",
      urgentBody: "Priority change: please pause current work and see the front desk immediately.",
      overdueAlert: "{name}{room} passed its {time} deadline. Reply with a status update, or let me know if you need support.",
      kindAlert: "alert",
      kindReminder: "reminder",
      kindMessage: "message",
      nAlert: "{n} alert",
      nAlerts: "{n} alerts"
    },
    ar: {
      langToggleAria: "اللغة",
      navOverview: "نظرة عامة",
      navColleagues: "الزملاء",
      navTasks: "المهام",
      navTaskTypes: "أنواع المهام",
      navMessages: "الرسائل",
      backDemos: "عروض بيسكوك",
      brandName: "The Marlow",
      brandSub: "عمليات الجادة الخامسة",
      footer: "قسم الغرف · الإصدار 2.4",
      camerasOnline: "جميع مناطق الكاميرات متصلة",
      occupancy: "نسبة الإشغال 91%",
      goodAfternoon: "مساء الخير، Elena",
      overviewDuty: {
        one: "زميل واحد في الخدمة",
        two: "زميلان في الخدمة",
        few: "زملاء في الخدمة",
        many: "زميلاً في الخدمة"
      },
      overviewOpen: {
        one: "مهمة واحدة مفتوحة اليوم",
        two: "مهمتان مفتوحتان اليوم",
        few: "مهام مفتوحة اليوم",
        many: "مهمة مفتوحة اليوم"
      },
      assignATask: "إسناد مهمة",
      sendAMessage: "إرسال رسالة",
      statOverdue: "متأخرة",
      statInProgress: "قيد التنفيذ",
      statCompletedToday: "مكتملة اليوم",
      statOnTimeRate: "نسبة الالتزام بالوقت",
      statAlertsSent: "تنبيهات مُرسلة",
      subTasks: "مهام",
      subToday: "اليوم",
      subAlerts: "من المساعد الآلي اليوم",
      propertyGlance: "نظرة على المنشأة",
      openWorkByFloor: "العمل المفتوح حسب الطابق والجناح",
      legendAllClear: "لا مهام مفتوحة",
      seeAllOnFloor: "عرض جميع مهام هذا الطابق",
      nothingOpenHere: "لا توجد مهام مفتوحة هنا حالياً.",
      due: "موعدها",
      onDutyNow: "في الخدمة الآن",
      allColleagues: "جميع الزملاء",
      nextPrefix: "التالي: ",
      at: "في",
      nothingScheduled: "لا شيء مجدول",
      messageBtn: "رسالة",
      recentAlerts: "التنبيهات والتذكيرات الأخيرة",
      messageCenter: "مركز الرسائل",
      to: "إلى",
      assistant: "المساعد الآلي",
      you: "أنت",
      colleaguesTitle: "الزملاء",
      colleaguesSub: "الأداء والمهام والمحادثات لكل عضو في الفريق.",
      searchNameRole: "البحث بالاسم أو الدور",
      onDuty: "في الخدمة",
      offDuty: "خارج الخدمة",
      shift: "الوردية",
      nOverdue: "{n} متأخرة",
      overallScore: "التقييم العام",
      assignTask: "إسناد مهمة",
      completed7d: "مكتملة (7 أيام)",
      onTime: "في الوقت",
      avgVsAllotted: "المتوسط مقابل الوقت المخصص",
      assignedNow: "مُسندة الآن",
      assignedTasks: "المهام المسندة",
      nOpen: "{n} مفتوحة",
      nothingAssigned: "لا توجد مهام مسندة. أضف مهمة من الزر أعلاه.",
      completedLog: "سجل الإنجاز",
      minLate: "متأخرة {n} د",
      minEarly: "مبكرة {n} د",
      conversation: "المحادثة",
      conversationHint: "يُرسل المساعد الآلي تنبيهات تلقائياً عند تجاوز المهمة موعدها",
      noMessagesYet: "لا رسائل بعد. ابدأ بتحية أو أرسل تذكيراً أدناه.",
      tasksTitle: "المهام",
      tasksSub: "جميع المهام المجدولة والجارية والمكتملة في المنشأة.",
      addOneOff: "إضافة مهمة لمرة واحدة",
      whenAll: "الكل",
      whenCurrent: "الجارية",
      whenUpcoming: "القادمة",
      whenPast: "السابقة",
      searchTask: "البحث بالمهمة أو الغرفة أو الزميل",
      ariaStatus: "الحالة",
      ariaTeam: "الفريق",
      ariaCategory: "الفئة",
      ariaFloor: "الطابق",
      filterAll: "الكل",
      clear: "مسح",
      thTask: "المهمة",
      thLocation: "الموقع",
      thAssignedTo: "مُسندة إلى",
      thWindow: "الفترة",
      thStatus: "الحالة",
      thPriority: "الأولوية",
      oneOff: "لمرة واحدة",
      done: "أُنجزت",
      noTasksMatch: "لا توجد مهام مطابقة لعوامل التصفية هذه. امسحها أو أضف مهمة لمرة واحدة.",
      errTaskName: "أدخل اسماً للمهمة حتى يتعرّف عليها الزملاء في قائمتهم.",
      errAllotted: "يجب ألا يقل الوقت المخصص عن دقيقة واحدة.",
      toastTypeSaved: "تم حفظ نوع المهمة",
      any: "أي",
      taskTypesTitle: "أنواع المهام",
      taskTypesSub: "حدّد الأعمال المتكررة والقابلة للتتبع التي يتولاها كل فريق. يستخدم المساعد الآلي الوقت المخصص ونافذة التصعيد لإرسال التذكيرات تلقائياً.",
      newTaskType: "نوع مهمة جديد",
      taskName: "اسم المهمة",
      phEveningTurndown: "مثال: الخدمة المسائية",
      descAndStandard: "الوصف والمعيار",
      phDescription: "وصف النتيجة المكتملة وفق المعيار. هذا ما يراه الزميل.",
      category: "الفئة",
      assignedToTeam: "مُسندة إلى الفريق",
      floor: "الطابق",
      wing: "الجناح",
      roomOrArea: "الغرفة أو المنطقة",
      optional: "اختياري",
      allottedMin: "الوقت المخصص (دقيقة)",
      escalateAfter: "التصعيد بعد (دقائق تأخير)",
      defaultPriority: "الأولوية الافتراضية",
      schedule: "الجدول",
      phSchedule: "يومياً 18:00–21:00، كل ساعتين، عند الوصول…",
      verifiedBy: "يُتحقق عبر",
      phVerified: "نطاق الكاميرا، مستشعر، اعتماد",
      reset: "إعادة تعيين",
      saveTaskType: "حفظ نوع المهمة",
      existingTypes: "أنواع المهام الحالية",
      nDefined: "{n} مُعرَّفة",
      tplMeta: "{allotted} دقيقة مخصصة · يُصعَّد بعد {esc} دقيقة · {recurrence}",
      verifiedByMeta: "يُتحقق عبر {v}",
      messagesTitle: "مركز الرسائل",
      messagesSub: "كل ما ترسله أنت أو المساعد الآلي إلى الزملاء، في مكان واحد.",
      filterAlerts: "التنبيهات",
      filterReplies: "الردود",
      prefixAssistant: "المساعد الآلي: ",
      prefixYou: "أنت: ",
      noConversations: "لا محادثات في هذا العرض.",
      errModalName: "سمِّ المهمة حتى يعرف الزميل المطلوب.",
      errStartTime: "يجب أن يبدو وقت البدء مثل 14:30.",
      toastAssignedTo: "أُسندت إلى {name}",
      modalTitle: "إضافة مهمة لمرة واحدة",
      modalSub: "تُسند مباشرة إلى زميل واحد. يذكّره المساعد الآلي إذا تأخرت.",
      labelTask: "المهمة",
      phDeliverPillows: "مثال: توصيل وسائد إضافية إلى 1108",
      assignTo: "إسناد إلى",
      offDutyParen: "(خارج الخدمة)",
      startToday: "البدء (اليوم)",
      priority: "الأولوية",
      notesForColleague: "ملاحظات للزميل",
      phNotes: "تفضيلات النزيل، تفاصيل الدخول، وأي معلومة ينبغي أن يعرفها.",
      cancel: "إلغاء",
      quickSend: "إرسال سريع:",
      remindNext: "تذكير بالمهمة التالية",
      checkIn: "تحقق من الحالة",
      urgentCallIn: "استدعاء عاجل",
      phMessage: "رسالة إلى {name}…",
      send: "إرسال",
      toastSent: "أُرسلت",
      toastAlertSent: "أُرسل التنبيه",
      toastReminderSent: "أُرسل التذكير",
      toastPriority: "تم ضبط الأولوية على {p}",
      toastOverdueAlert: "نبّه المساعد الآلي {name} بشأن مهمة متأخرة",
      aColleague: "زميل",
      lobby: "الردهة",
      anyFloor: "أي طابق",
      floorN: "الطابق {n}",
      cellOpen: "{floor} · {wing}: {n} مفتوحة",
      reminderBody: "تذكير: {name}{room} موعدها {time}.",
      inRoom: " في {room}",
      checkInBody: "يُرجى التواصل مع مكتب الاستقبال عند تيسّر الوقت.",
      urgentBody: "تغيير في الأولوية: يُرجى إيقاف العمل الحالي والتوجه إلى مكتب الاستقبال فوراً.",
      overdueAlert: "تجاوزت {name}{room} موعدها المحدد {time}. يُرجى الرد بتحديث الحالة، أو أخبرني إذا كنت تحتاج إلى دعم.",
      kindAlert: "تنبيه",
      kindReminder: "تذكير",
      kindMessage: "رسالة",
      nAlert: "تنبيه واحد",
      nAlerts: "{n} تنبيهات"
    }
  };

  var ROLES = {
    "Housekeeping": "التدبير الفندقي",
    "Front Desk": "مكتب الاستقبال",
    "Concierge": "الكونسيرج",
    "In-Room Dining": "خدمة الغرف",
    "Maintenance": "الصيانة",
    "Security": "الأمن",
    "Valet": "صف السيارات",
    "Spa": "السبا"
  };

  var CATEGORIES = {
    "Room refresh": "تجديد الغرفة",
    "Turndown": "الخدمة المسائية",
    "Public areas": "المناطق العامة",
    "Guest request": "طلب نزيل",
    "Inspection": "تفتيش",
    "Delivery": "توصيل",
    "Safety check": "فحص السلامة",
    "Arrival prep": "تجهيز الوصول"
  };

  var WINGS = {
    East: "الشرقي",
    West: "الغربي",
    North: "الشمالي"
  };

  var STATUSES = {
    Scheduled: "مجدولة",
    "In progress": "قيد التنفيذ",
    Completed: "مكتملة",
    Overdue: "متأخرة"
  };

  var PRIORITIES = {
    Low: "منخفضة",
    Normal: "عادية",
    High: "عالية",
    Urgent: "عاجلة"
  };

  var TASK_NAMES = {
    "Morning room refresh": "تجديد الغرفة الصباحي",
    "Evening turndown": "الخدمة المسائية",
    "Lobby floral inspection": "تفتيش ورود الردهة",
    "VIP arrival prep": "تجهيز وصول كبار الشخصيات",
    "Pool deck safety walk": "جولة سلامة سطح المسبح",
    "In-room dining delivery": "توصيل خدمة الغرف",
    "Restaurant reservation confirmations": "تأكيد حجوزات المطاعم",
    "Tray retrieval": "استرداد الصواني",
    "Repair leaking bath fixture": "إصلاح تسريب في تجهيزات الحمام",
    "Replace corridor bulb": "استبدال لمبة الممر",
    "Check-in queue support": "دعم طابور تسجيل الوصول",
    "Spa suite reset": "إعادة تهيئة جناح السبا",
    "Garage sweep": "جولة المرآب",
    "Luggage staging for group arrival": "تجهيز الأمتعة لوصول مجموعة"
  };

  var DESCRIPTIONS = {
    tp1: "تجديد كامل لغرفة مشغولة: المفروشات، مستلزمات الحمام، فحص الميني بار، والأسطح. تُعاد جدولة الغرف التي عليها لافتة «الرجاء عدم الإزعاج» بعد 90 دقيقة.",
    tp2: "طيّ السرير، إغلاق الستائر، ترتيب النعال، استبدال المناشف، ووضع البطاقة والشوكولاتة.",
    tp3: "فحص التنسيقات عند المدخل والاستقبال والصالة. تسجيل الذبول أو نقص منسوب الماء وإبلاغ منسّق الزهور.",
    tp4: "تجهيز الجناح وفق ملف النزيل: هدية الترحيب، الوسائد المفضلة، درجة الحرارة، وميني بار مُنتقى.",
    tp5: "التجوال حول محيط السطح بالكامل، وفحص معدات الإنقاذ والدرابزين الزجاجي ولافتات الأرضية المبللة.",
    tp6: "التوصيل من وقت إصدار التذكرة. يُجدول استرداد الصينية بعد 45 دقيقة من التسليم."
  };

  var RECURRENCE = {
    "Daily, per occupied room": "يومياً، لكل غرفة مشغولة",
    "Daily, 18:00–21:00": "يومياً، 18:00–21:00",
    "Daily, 10:30": "يومياً، 10:30",
    "Triggered by PMS arrival flag": "يُفعَّل بإشارة وصول من نظام إدارة الفندق",
    "Every 2 hours, 08:00–22:00": "كل ساعتين، 08:00–22:00",
    "Triggered by order": "يُفعَّل بالطلب",
    Daily: "يومياً"
  };

  var VERIFICATION = {
    "Corridor camera + door sensor": "كاميرا الممر + مستشعر الباب",
    "Corridor camera": "كاميرا الممر",
    "Lobby cameras 1–4": "كاميرات الردهة 1–4",
    "Corridor camera + manager sign-off": "كاميرا الممر + اعتماد المدير",
    "Rooftop cameras 1–3": "كاميرات السطح 1–3",
    "Service elevator + corridor camera": "مصعد الخدمة + كاميرا الممر"
  };

  var ZONES = {
    e1: "الطوابق 7–9، الجناح الشرقي",
    e2: "الطوابق 10–12، الجناح الغربي",
    e3: "الردهة، الاستقبال",
    e4: "الردهة، مكتب الكونسيرج",
    e5: "مطبخ الخدمة، جميع الطوابق",
    e6: "متنقل",
    e7: "الردهة والمرآب",
    e8: "المدخل المغطى",
    e9: "السبا، الطابق 3 الشمالي",
    e10: "الطوابق 2–6، الجناح الشرقي",
    e11: "الردهة، الاستقبال"
  };

  var ROOMS = {
    "1201 Penthouse": "1201 البنتهاوس",
    "Concierge desk": "مكتب الكونسيرج",
    "Pool deck": "سطح المسبح",
    "Corridor, near 318": "الممر، قرب 318",
    Reception: "الاستقبال",
    "Treatment room 2": "غرفة العلاج 2",
    "Garage P1": "المرآب P1",
    "Porte-cochère": "المدخل المغطى"
  };

  var MESSAGES = {
    m1: "تجاوز تجهيز وصول كبار الشخصيات للجناح 1201 الموعد المحدد 13:45. وصول النزيل المتوقع 15:10. يُرجى الرد عند اكتمال تجهيز الجناح أو إذا كنت تحتاج إلى مساعدة.",
    m2: "ما زلت أنتظر توصيل الزهور للجناح. كل شيء آخر جاهز.",
    m3: "مفهوم. منسّق الزهور على بعد 10 دقائق — ابقَ في الطابق 12 وأكمِل عند وصوله.",
    m4: "اكتمل تجديد الغرفة 903 بعد 9 دقائق من الوقت المخصص. لا إجراء مطلوب — سُجّل للمراجعة الأسبوعية.",
    m5: "يُرجى إضافة شرفة بار السطح إلى جولتك في 16:00. يبدأ تجهيز الفعالية في 17:00.",
    m6: "حسناً.",
    m7: "إصلاح تجهيزات حمام الغرفة 507 موعده 14:30. النزيل خارج الغرفة حالياً حتى 15:00.",
    m8: "طلب نزيل الغرفة 611 وصول الحلوى بشكل منفصل — أبقِها حتى يطلبها.",
    m9: "أكّد مطعم Le Bernardin حجز آل ويتفيلد في 20:00. بقي اثنان."
  };

  function interpolate(s, vars) {
    if (!vars) return s;
    Object.keys(vars).forEach(function (k) {
      s = s.split("{" + k + "}").join(vars[k] == null ? "" : String(vars[k]));
    });
    return s;
  }

  function t(lang, key, vars) {
    var pack = STRINGS[lang] || STRINGS.en;
    var s = pack[key] || STRINGS.en[key] || key;
    return interpolate(s, vars);
  }

  function ar(map, lang, key) {
    if (!key) return "";
    if (lang !== "ar") return key;
    return map[key] || key;
  }

  function locLabel(lang, x) {
    var floor;
    if (x.floor === "L") floor = t(lang, "lobby");
    else if (x.floor === "Any") floor = t(lang, "anyFloor");
    else floor = t(lang, "floorN", { n: x.floor });
    var wing = x.wing === "Any" ? null : ar(WINGS, lang, x.wing);
    var room = roomLabel(lang, x.room);
    return [floor, wing, room].filter(Boolean).join(" · ");
  }

  function roomLabel(lang, room) {
    if (!room) return "";
    return ar(ROOMS, lang, room);
  }

  function floorLabel(lang, f) {
    if (f === "L") return t(lang, "lobby");
    if (f === "Any") return t(lang, "any");
    return t(lang, "floorN", { n: f });
  }

  function kindLabel(lang, kind) {
    if (kind === "alert") return t(lang, "kindAlert");
    if (kind === "reminder") return t(lang, "kindReminder");
    return t(lang, "kindMessage");
  }

  function alertsCount(lang, n) {
    if (n === 1) return t(lang, "nAlert", { n: n });
    if (lang === "ar" && n === 2) return "تنبيهان";
    return t(lang, "nAlerts", { n: n });
  }

  function countPhrase(n, forms) {
    if (n === 1) return forms.one;
    if (n === 2) return forms.two;
    if (n >= 3 && n <= 10) return n + " " + forms.few;
    return n + " " + forms.many;
  }

  function overviewSub(lang, vars) {
    if (lang !== "ar") return t(lang, "overviewSub", vars);
    return vars.day + " · " + countPhrase(Number(vars.onDuty), STRINGS.ar.overviewDuty) +
      " · " + countPhrase(Number(vars.open), STRINGS.ar.overviewOpen);
  }

  window.HOTEL_I18N = {
    t: t,
    role: function (lang, v) { return ar(ROLES, lang, v); },
    category: function (lang, v) { return ar(CATEGORIES, lang, v); },
    wing: function (lang, v) { return ar(WINGS, lang, v); },
    status: function (lang, v) { return ar(STATUSES, lang, v); },
    priority: function (lang, v) { return ar(PRIORITIES, lang, v); },
    taskName: function (lang, v) { return ar(TASK_NAMES, lang, v); },
    description: function (lang, id, fallback) {
      if (lang !== "ar") return fallback || "";
      return DESCRIPTIONS[id] || fallback || "";
    },
    recurrence: function (lang, v) { return ar(RECURRENCE, lang, v); },
    verification: function (lang, v) { return ar(VERIFICATION, lang, v); },
    zone: function (lang, emp) {
      if (!emp) return "";
      if (lang !== "ar") return emp.zone;
      return ZONES[emp.id] || emp.zone;
    },
    messageText: function (lang, m) {
      if (!m) return "";
      if (lang !== "ar") return m.text;
      return MESSAGES[m.id] || m.text;
    },
    room: roomLabel,
    locLabel: locLabel,
    floorLabel: floorLabel,
    kind: kindLabel,
    alertsCount: alertsCount,
    overviewSub: overviewSub
  };
})();
