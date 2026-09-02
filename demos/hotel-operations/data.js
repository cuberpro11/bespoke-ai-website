/* Hotel operations demo — seed data and helpers.
   Dates are Date objects (not JSON) so the simulated clock can compare them. */

(function () {
  "use strict";

  var BASE_NOW = new Date("2026-09-01T14:20:00");

  function t(h, m, dayOffset) {
    var d = new Date(BASE_NOW);
    d.setDate(d.getDate() + (dayOffset || 0));
    d.setHours(h, m, 0, 0);
    return d;
  }

  var ROLES = ["Housekeeping", "Front Desk", "Concierge", "In-Room Dining", "Maintenance", "Security", "Valet", "Spa"];
  var CATEGORIES = ["Room refresh", "Turndown", "Public areas", "Guest request", "Inspection", "Delivery", "Safety check", "Arrival prep"];
  var WINGS = ["East", "West", "North"];
  var FLOORS = ["L", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  var EMPLOYEES = [
    { id: "e1", name: "Marisol Vega", role: "Housekeeping", shift: "07:00–15:30", onDuty: true, zone: "Floors 7–9, East", initials: "MV" },
    { id: "e2", name: "Daniel Okafor", role: "Housekeeping", shift: "07:00–15:30", onDuty: true, zone: "Floors 10–12, West", initials: "DO" },
    { id: "e3", name: "Priya Natarajan", role: "Front Desk", shift: "06:30–15:00", onDuty: true, zone: "Lobby, reception", initials: "PN" },
    { id: "e4", name: "Tomasz Kowalski", role: "Concierge", shift: "10:00–18:30", onDuty: true, zone: "Lobby, concierge desk", initials: "TK" },
    { id: "e5", name: "Léa Fontaine", role: "In-Room Dining", shift: "11:00–19:30", onDuty: true, zone: "Service kitchen, all floors", initials: "LF" },
    { id: "e6", name: "Hector Ruiz", role: "Maintenance", shift: "08:00–16:30", onDuty: true, zone: "Roaming", initials: "HR" },
    { id: "e7", name: "Amara Bello", role: "Security", shift: "12:00–20:30", onDuty: true, zone: "Lobby & garage", initials: "AB" },
    { id: "e8", name: "Kenji Sato", role: "Valet", shift: "12:00–20:30", onDuty: true, zone: "Porte-cochère", initials: "KS" },
    { id: "e9", name: "Sofia Marchetti", role: "Spa", shift: "09:00–17:30", onDuty: true, zone: "Spa, floor 3 North", initials: "SM" },
    { id: "e10", name: "Owen Blake", role: "Housekeeping", shift: "15:00–23:30", onDuty: false, zone: "Floors 2–6, East", initials: "OB" },
    { id: "e11", name: "Nadia Haddad", role: "Front Desk", shift: "15:00–23:30", onDuty: false, zone: "Lobby, reception", initials: "NH" }
  ];

  var TEMPLATES = [
    { id: "tp1", name: "Morning room refresh", category: "Room refresh", role: "Housekeeping", floor: "Any", wing: "Any", room: "", allotted: 35, recurrence: "Daily, per occupied room", priority: "Normal", verification: "Corridor camera + door sensor", escalation: 10, description: "Full refresh of an occupied room: linens, bath amenities, minibar check, surfaces. Do-not-disturb rooms are re-queued after 90 minutes." },
    { id: "tp2", name: "Evening turndown", category: "Turndown", role: "Housekeeping", floor: "Any", wing: "Any", room: "", allotted: 12, recurrence: "Daily, 18:00–21:00", priority: "Normal", verification: "Corridor camera", escalation: 15, description: "Turn down bed, close drapes, set slippers, replace towels, place card and chocolate." },
    { id: "tp3", name: "Lobby floral inspection", category: "Inspection", role: "Concierge", floor: "L", wing: "North", room: "", allotted: 15, recurrence: "Daily, 10:30", priority: "Low", verification: "Lobby cameras 1–4", escalation: 30, description: "Check arrangements at entrance, reception and lounge. Log wilting or water level issues to florist." },
    { id: "tp4", name: "VIP arrival prep", category: "Arrival prep", role: "Housekeeping", floor: "Any", wing: "Any", room: "", allotted: 45, recurrence: "Triggered by PMS arrival flag", priority: "High", verification: "Corridor camera + manager sign-off", escalation: 5, description: "Suite staging per guest profile: welcome amenity, preferred pillows, temperature, curated minibar." },
    { id: "tp5", name: "Pool deck safety walk", category: "Safety check", role: "Security", floor: "12", wing: "West", room: "", allotted: 20, recurrence: "Every 2 hours, 08:00–22:00", priority: "High", verification: "Rooftop cameras 1–3", escalation: 5, description: "Walk the full deck perimeter, check lifesaving equipment, glass railings, and wet-floor signage." },
    { id: "tp6", name: "In-room dining delivery", category: "Delivery", role: "In-Room Dining", floor: "Any", wing: "Any", room: "", allotted: 25, recurrence: "Triggered by order", priority: "High", verification: "Service elevator + corridor camera", escalation: 5, description: "Deliver from ticket time. Tray retrieval scheduled 45 minutes after delivery." }
  ];

  var TASKS = [
    { id: "t1", name: "Morning room refresh", category: "Room refresh", employeeId: "e1", floor: "8", wing: "East", room: "804", status: "In progress", priority: "Normal", start: t(13, 50), due: t(14, 25), completedAt: null, source: "tp1" },
    { id: "t2", name: "Morning room refresh", category: "Room refresh", employeeId: "e1", floor: "8", wing: "East", room: "812", status: "Scheduled", priority: "Normal", start: t(14, 30), due: t(15, 5), completedAt: null, source: "tp1" },
    { id: "t3", name: "Morning room refresh", category: "Room refresh", employeeId: "e1", floor: "7", wing: "East", room: "718", status: "Completed", priority: "Normal", start: t(12, 40), due: t(13, 15), completedAt: t(13, 8), source: "tp1" },
    { id: "t4", name: "Morning room refresh", category: "Room refresh", employeeId: "e1", floor: "9", wing: "East", room: "903", status: "Completed", priority: "Normal", start: t(11, 30), due: t(12, 5), completedAt: t(12, 14), source: "tp1" },
    { id: "t5", name: "VIP arrival prep", category: "Arrival prep", employeeId: "e2", floor: "12", wing: "West", room: "1201 Penthouse", status: "Overdue", priority: "High", start: t(13, 0), due: t(13, 45), completedAt: null, source: "tp4" },
    { id: "t6", name: "Morning room refresh", category: "Room refresh", employeeId: "e2", floor: "11", wing: "West", room: "1108", status: "Scheduled", priority: "Normal", start: t(14, 45), due: t(15, 20), completedAt: null, source: "tp1" },
    { id: "t7", name: "Morning room refresh", category: "Room refresh", employeeId: "e2", floor: "10", wing: "West", room: "1004", status: "Completed", priority: "Normal", start: t(11, 0), due: t(11, 35), completedAt: t(11, 30), source: "tp1" },
    { id: "t8", name: "Lobby floral inspection", category: "Inspection", employeeId: "e4", floor: "L", wing: "North", room: "", status: "Completed", priority: "Low", start: t(10, 30), due: t(10, 45), completedAt: t(10, 41), source: "tp3" },
    { id: "t9", name: "Restaurant reservation confirmations", category: "Guest request", employeeId: "e4", floor: "L", wing: "North", room: "Concierge desk", status: "In progress", priority: "Normal", start: t(14, 0), due: t(14, 40), completedAt: null, source: null },
    { id: "t10", name: "In-room dining delivery", category: "Delivery", employeeId: "e5", floor: "6", wing: "East", room: "611", status: "In progress", priority: "High", start: t(14, 5), due: t(14, 22), completedAt: null, source: "tp6" },
    { id: "t11", name: "Tray retrieval", category: "Delivery", employeeId: "e5", floor: "4", wing: "West", room: "415", status: "Scheduled", priority: "Low", start: t(14, 50), due: t(15, 5), completedAt: null, source: "tp6" },
    { id: "t12", name: "Pool deck safety walk", category: "Safety check", employeeId: "e7", floor: "12", wing: "West", room: "Pool deck", status: "Scheduled", priority: "High", start: t(16, 0), due: t(16, 20), completedAt: null, source: "tp5" },
    { id: "t13", name: "Pool deck safety walk", category: "Safety check", employeeId: "e7", floor: "12", wing: "West", room: "Pool deck", status: "Completed", priority: "High", start: t(14, 0), due: t(14, 20), completedAt: t(14, 12), source: "tp5" },
    { id: "t14", name: "Repair leaking bath fixture", category: "Guest request", employeeId: "e6", floor: "5", wing: "North", room: "507", status: "In progress", priority: "High", start: t(13, 30), due: t(14, 30), completedAt: null, source: null },
    { id: "t15", name: "Replace corridor bulb", category: "Public areas", employeeId: "e6", floor: "3", wing: "East", room: "Corridor, near 318", status: "Scheduled", priority: "Low", start: t(15, 0), due: t(15, 20), completedAt: null, source: null },
    { id: "t16", name: "Check-in queue support", category: "Guest request", employeeId: "e3", floor: "L", wing: "North", room: "Reception", status: "In progress", priority: "Normal", start: t(14, 0), due: t(16, 0), completedAt: null, source: null },
    { id: "t17", name: "Evening turndown", category: "Turndown", employeeId: "e10", floor: "4", wing: "East", room: "402–418", status: "Scheduled", priority: "Normal", start: t(18, 0), due: t(20, 30), completedAt: null, source: "tp2" },
    { id: "t18", name: "Evening turndown", category: "Turndown", employeeId: "e10", floor: "5", wing: "East", room: "502–518", status: "Scheduled", priority: "Normal", start: t(18, 0, 1), due: t(20, 30, 1), completedAt: null, source: "tp2" },
    { id: "t19", name: "Spa suite reset", category: "Room refresh", employeeId: "e9", floor: "3", wing: "North", room: "Treatment room 2", status: "Completed", priority: "Normal", start: t(13, 0), due: t(13, 20), completedAt: t(13, 18), source: null },
    { id: "t20", name: "Garage sweep", category: "Safety check", employeeId: "e7", floor: "L", wing: "West", room: "Garage P1", status: "Completed", priority: "Normal", start: t(21, 0, -1), due: t(21, 20, -1), completedAt: t(21, 33, -1), source: null },
    { id: "t21", name: "Morning room refresh", category: "Room refresh", employeeId: "e1", floor: "7", wing: "East", room: "712", status: "Completed", priority: "Normal", start: t(10, 0, -1), due: t(10, 35, -1), completedAt: t(10, 30, -1), source: "tp1" },
    { id: "t22", name: "Luggage staging for group arrival", category: "Arrival prep", employeeId: "e8", floor: "L", wing: "West", room: "Porte-cochère", status: "Scheduled", priority: "Normal", start: t(15, 30), due: t(16, 15), completedAt: null, source: null }
  ];

  var MESSAGES = [
    { id: "m1", employeeId: "e2", from: "ai", kind: "alert", text: "VIP arrival prep for 1201 Penthouse passed its 13:45 deadline. Guest ETA is 15:10. Reply when the suite is staged or if you need a second pair of hands.", time: t(13, 50) },
    { id: "m2", employeeId: "e2", from: "employee", kind: "message", text: "Still waiting on the florist delivery for the suite. Everything else is done.", time: t(13, 58) },
    { id: "m3", employeeId: "e2", from: "manager", kind: "message", text: "Understood. Florist is 10 minutes out — stay on 12 and finish once it lands.", time: t(14, 2) },
    { id: "m4", employeeId: "e1", from: "ai", kind: "reminder", text: "Room 903 refresh finished 9 minutes past its allotted time. No action needed — flagged for the weekly review.", time: t(12, 15) },
    { id: "m5", employeeId: "e7", from: "manager", kind: "message", text: "Please add the rooftop bar terrace to your 16:00 walk. Event set-up starts at 17:00.", time: t(13, 20) },
    { id: "m6", employeeId: "e7", from: "employee", kind: "message", text: "Will do.", time: t(13, 24) },
    { id: "m7", employeeId: "e6", from: "ai", kind: "reminder", text: "Room 507 bath fixture repair is due at 14:30. Guest is currently out of the room until 15:00.", time: t(14, 15) },
    { id: "m8", employeeId: "e5", from: "manager", kind: "message", text: "Guest in 611 asked for the dessert to arrive separately — hold it until they call down.", time: t(14, 10) },
    { id: "m9", employeeId: "e4", from: "employee", kind: "message", text: "Le Bernardin confirmed for the Whitfields at 20:00. Two more to go.", time: t(14, 12) }
  ];

  function localeTag(lang) {
    return lang === "ar" ? "ar-AE" : "en-US";
  }
  function fmtTime(d, lang) {
    return d.toLocaleTimeString(localeTag(lang), {
      hour: "2-digit", minute: "2-digit", hour12: false, numberingSystem: "latn"
    });
  }
  function fmtDay(d, lang) {
    return d.toLocaleDateString(localeTag(lang), {
      weekday: "short", month: "short", day: "numeric", numberingSystem: "latn"
    });
  }
  function sameDay(a, b) {
    return a.toDateString() === b.toDateString();
  }
  function fmtWhen(d, now, lang) {
    return sameDay(d, now) ? fmtTime(d, lang) : fmtDay(d, lang) + " " + fmtTime(d, lang);
  }
  function minutesBetween(a, b) {
    return Math.round((b - a) / 60000);
  }
  function locLabel(x) {
    return [
      x.floor === "L" ? "Lobby" : x.floor === "Any" ? "Any floor" : "Floor " + x.floor,
      x.wing === "Any" ? null : x.wing,
      x.room
    ].filter(Boolean).join(" · ");
  }

  var STATUS_COLOR = { "Scheduled": "#8b8d95", "In progress": "#2454d8", "Completed": "#128a70", "Overdue": "#dc2626" };
  var PRIORITIES = ["Low", "Normal", "High", "Urgent"];
  var PRIORITY_COLOR = { Low: "#8b8d95", Normal: "#53555d", High: "#a8702c", Urgent: "#dc2626" };

  function employeeStats(emp, tasks) {
    var mine = tasks.filter(function (x) { return x.employeeId === emp.id; });
    var done = mine.filter(function (x) { return x.status === "Completed"; });
    var onTime = done.filter(function (x) { return x.completedAt <= x.due; });
    var overdue = mine.filter(function (x) { return x.status === "Overdue"; });
    var active = mine.filter(function (x) { return x.status === "In progress" || x.status === "Scheduled"; });
    var avgDelta = done.length
      ? Math.round(done.reduce(function (s, x) { return s + minutesBetween(x.due, x.completedAt); }, 0) / done.length)
      : 0;
    var onTimeRate = done.length ? onTime.length / done.length : 1;
    var score = Math.max(0, Math.min(100, Math.round(
      72 * onTimeRate + 28 * (done.length / Math.max(1, done.length + overdue.length)) - overdue.length * 6
    )));
    return { mine: mine, done: done, onTime: onTime, overdue: overdue, active: active, avgDelta: avgDelta, onTimeRate: onTimeRate, score: score };
  }

  var EMPTY_TEMPLATE = {
    name: "", description: "", category: CATEGORIES[0], role: ROLES[0],
    floor: "Any", wing: "Any", room: "", allotted: 30, recurrence: "Daily",
    priority: "Normal", verification: "", escalation: 10
  };

  window.HOTEL = {
    BASE_NOW: BASE_NOW,
    t: t,
    ROLES: ROLES,
    CATEGORIES: CATEGORIES,
    WINGS: WINGS,
    FLOORS: FLOORS,
    EMPLOYEES: EMPLOYEES,
    TEMPLATES: TEMPLATES,
    TASKS: TASKS,
    MESSAGES: MESSAGES,
    fmtTime: fmtTime,
    fmtDay: fmtDay,
    sameDay: sameDay,
    fmtWhen: fmtWhen,
    minutesBetween: minutesBetween,
    locLabel: locLabel,
    STATUS_COLOR: STATUS_COLOR,
    PRIORITIES: PRIORITIES,
    PRIORITY_COLOR: PRIORITY_COLOR,
    employeeStats: employeeStats,
    EMPTY_TEMPLATE: EMPTY_TEMPLATE
  };
})();
