/* Hotel operations demo — English copy.
   Canonical data keys stay English. */

(function () {
  "use strict";

  var STRINGS = {
    en: {
      langToggleAria: "Language",
      scrollCue: "Scroll",
      scrollCueAria: "Scroll to demo",
      navOverview: "Overview",
      navColleagues: "Colleagues",
      navTasks: "Tasks",
      navTaskTypes: "Task types",
      navMessages: "Messages",
      backDemos: "Bespoke AI demos",
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
    }
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

  function locLabel(lang, x) {
    var floor;
    if (x.floor === "L") floor = t(lang, "lobby");
    else if (x.floor === "Any") floor = t(lang, "anyFloor");
    else floor = t(lang, "floorN", { n: x.floor });
    var wing = x.wing === "Any" ? null : x.wing;
    var room = roomLabel(lang, x.room);
    return [floor, wing, room].filter(Boolean).join(" · ");
  }

  function roomLabel(lang, room) {
    return room || "";
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
    return t(lang, "nAlerts", { n: n });
  }

  function overviewSub(lang, vars) {
    return t(lang, "overviewSub", vars);
  }

  window.HOTEL_I18N = {
    t: t,
    role: function (lang, v) { return v || ""; },
    category: function (lang, v) { return v || ""; },
    wing: function (lang, v) { return v || ""; },
    status: function (lang, v) { return v || ""; },
    priority: function (lang, v) { return v || ""; },
    taskName: function (lang, v) { return v || ""; },
    description: function (lang, id, fallback) { return fallback || ""; },
    recurrence: function (lang, v) { return v || ""; },
    verification: function (lang, v) { return v || ""; },
    zone: function (lang, emp) { return emp ? emp.zone : ""; },
    messageText: function (lang, m) { return m ? m.text : ""; },
    room: roomLabel,
    locLabel: locLabel,
    floorLabel: floorLabel,
    kind: kindLabel,
    alertsCount: alertsCount,
    overviewSub: overviewSub
  };
})();
