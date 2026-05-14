import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

const initialVisits = [];

const statusConfig = {
  open: {
    label: "Upcoming",
    icon: CalendarDaysIcon,
    badge: "bg-blue-100 text-blue-700",
    row: "border-l-blue-500 bg-blue-50/70",
  },
  inprogress: {
    label: "In Progress",
    icon: ClockIcon,
    badge: "bg-amber-100 text-amber-700",
    row: "border-l-amber-500 bg-amber-50/70",
  },
  closed: {
    label: "Completed",
    icon: CheckCircleIcon,
    badge: "bg-green-100 text-green-700",
    row: "border-l-green-500 bg-green-50/70",
  },
  missed: {
    label: "Missed",
    icon: XCircleIcon,
    badge: "bg-red-100 text-red-700",
    row: "border-l-red-500 bg-red-50/70",
  },
};

const statusFilters = ["all", "open", "inprogress", "closed", "missed"];

function getFilteredVisits(allVisits, query, statusFilter) {
  return allVisits.filter((visit) => {
    const searchableText = `${visit.location} ${visit.assignee} ${visit.description}`.toLowerCase();
    const matchesSearch = searchableText.includes(query.trim().toLowerCase());
    const matchesStatus = statusFilter === "all" || visit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

function getVisitCounts(allVisits) {
  return allVisits.reduce(
    (acc, visit) => {
      if (!Object.prototype.hasOwnProperty.call(acc, visit.status)) {
        acc[visit.status] = 0;
      }
      acc[visit.status] += 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, open: 0, inprogress: 0, closed: 0, missed: 0 }
  );
}

function createVisitFromForm(formVisit, id = Date.now()) {
  const requiredFields = [formVisit.location, formVisit.assignee, formVisit.description];
  const isValid = requiredFields.every((field) => String(field || "").trim().length > 0);

  if (!isValid) {
    return null;
  }

  return {
    ...formVisit,
    location: formVisit.location.trim(),
    assignee: formVisit.assignee.trim(),
    description: formVisit.description.trim(),
    id,
  };
}

function runDashboardTests() {
  const emptyCounts = getVisitCounts([]);

  console.assert(emptyCounts.total === 0, "Empty dashboard should start with zero visits.");
  console.assert(emptyCounts.open === 0, "No open visits should exist initially.");
  console.assert(getFilteredVisits([], "", "all").length === 0, "Empty visits list should return no results.");

  const newVisit = createVisitFromForm(
    {
      date: "2026-05-20",
      time: "09:00 AM",
      location: "  Test Site  ",
      assignee: "  Test User  ",
      description: "  Test description  ",
      status: "open",
    },
    99
  );

  console.assert(newVisit.id === 99, "New visit should use the provided id.");
  console.assert(newVisit.location === "Test Site", "New visit location should be trimmed.");
  console.assert(
    createVisitFromForm({ location: "", assignee: "A", description: "B", status: "open" }) === null,
    "Invalid visits should not be created."
  );

  console.assert(
    getCalendarDays(2026, 4).length > 0,
    "Calendar should generate days correctly."
  );
}

runDashboardTests();

export default function SiteVisitsDashboard() {
  const [siteVisits, setSiteVisits] = useState(initialVisits);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teamMessage, setTeamMessage] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [messagePriority, setMessagePriority] = useState("Important");
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [newVisit, setNewVisit] = useState(getDefaultNewVisit());

  const filteredVisits = useMemo(() => {
    return getFilteredVisits(siteVisits, query, statusFilter);
  }, [siteVisits, query, statusFilter]);

  const counts = useMemo(() => getVisitCounts(siteVisits), [siteVisits]);

  function publishTeamMessage() {
    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage) return;
    setTeamMessage(trimmedMessage);
    setDraftMessage("");
  }

  function addNewVisit() {
    const createdVisit = createVisitFromForm(newVisit);

    if (!createdVisit) {
      setFormError("Please fill location, assignee, and description before adding a visit.");
      return;
    }

    setSiteVisits((current) => [...current, createdVisit]);
    setNewVisit(getDefaultNewVisit());
    setFormError("");
    setShowVisitModal(false);
  }

  function closeVisitModal() {
    setFormError("");
    setShowVisitModal(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-r from-blue-700 via-cyan-600 to-violet-600 p-6 text-white shadow-xl shadow-blue-200/60">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <VemcoLogo />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-100">VEMCO Site Operations</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">Upcoming Site Visit Dashboard</h1>
                <p className="mt-2 max-w-2xl text-sm text-blue-50">
                  Track visit date, time, location, assignee, description, and status in one colorful command center.
                </p>
              </div>
            </div>
            <Button className="bg-white text-blue-700 hover:bg-blue-50" onClick={() => setShowVisitModal(true)}>
              + New Site Visit
            </Button>
          </div>
        </div>

        <TeamMessageBanner
          message={teamMessage}
          draftMessage={draftMessage}
          priority={messagePriority}
          onDraftChange={setDraftMessage}
          onPriorityChange={setMessagePriority}
          onPublish={publishTeamMessage}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard title="Upcoming" count={counts.open} icon={CalendarDaysIcon} className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50" iconClassName="bg-blue-600 text-white" />
          <SummaryCard title="In Progress" count={counts.inprogress} icon={ClockIcon} className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50" iconClassName="bg-amber-500 text-white" />
          <SummaryCard title="Completed" count={counts.closed} icon={CheckCircleIcon} className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50" iconClassName="bg-emerald-500 text-white" />
          <SummaryCard title="Missed" count={counts.missed} icon={XCircleIcon} className="border-rose-200 bg-gradient-to-br from-rose-50 to-red-50" iconClassName="bg-rose-500 text-white" />
        </div>

        <VisitStatusVisualization counts={counts} visits={siteVisits} />

        <SiteVisitCalendar visits={filteredVisits} />

        <Card>
          <div className="p-5">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by location, assignee, or description"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      statusFilter === status
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-200"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    {status === "all" ? "All" : statusConfig[status].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden grid-cols-[1fr_1fr_1.1fr_1fr_1.6fr_0.8fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
                <div>Date & Time</div>
                <div>Location</div>
                <div>Assignee</div>
                <div>Status</div>
                <div>Description</div>
                <div>Action</div>
              </div>

              <div className="divide-y divide-slate-200 bg-white">
                {filteredVisits.length > 0 ? (
                  filteredVisits.map((visit, index) => {
                    const config = statusConfig[visit.status] || statusConfig.open;
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={visit.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className={`grid gap-3 border-l-4 p-4 md:grid-cols-[1fr_1fr_1.1fr_1fr_1.6fr_0.8fr] md:items-center ${config.row}`}
                      >
                        <div>
                          <p className="font-semibold">{formatDate(visit.date)}</p>
                          <p className="text-sm text-slate-500">{visit.time}</p>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <span>{visit.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <UserIcon className="h-4 w-4 text-slate-400" />
                          <span>{visit.assignee}</span>
                        </div>
                        <div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.badge}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{visit.description}</p>
                        <Button variant="outline">View</Button>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No site visits match your search or filter.
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {showVisitModal && (
          <NewVisitModal
            visit={newVisit}
            error={formError}
            onChange={setNewVisit}
            onClose={closeVisitModal}
            onSave={addNewVisit}
          />
        )}
      </div>
    </div>
  );
}

function getDefaultNewVisit() {
  return {
    date: "2026-05-20",
    time: "09:00 AM",
    location: "",
    assignee: "",
    description: "",
    status: "open",
  };
}

function TeamMessageBanner({ message, draftMessage, priority, onDraftChange, onPriorityChange, onPublish }) {
  const priorityStyles = {
    Info: "from-blue-500 to-cyan-500",
    Important: "from-violet-600 to-blue-600",
    Urgent: "from-rose-600 to-orange-500",
  };

  return (
    <Card className="overflow-hidden border-blue-100">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
        <div className={`bg-gradient-to-r ${priorityStyles[priority]} p-5 text-white`}>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/20 p-3 ring-1 ring-white/30">
              <BellIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-white/30">
                Team Message · {priority}
              </div>
              <h2 className="text-xl font-black tracking-tight">Operations Announcement</h2>
              <p className="mt-2 text-sm leading-6 text-white/90">{message}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/90 p-5">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Send message to team</h3>
              <p className="text-xs text-slate-500">Add a dashboard-wide note for site visit assignees.</p>
            </div>
            <select
              value={priority}
              onChange={(event) => onPriorityChange(event.target.value)}
              className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 outline-none"
            >
              <option>Info</option>
              <option>Important</option>
              <option>Urgent</option>
            </select>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={draftMessage}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder="Type team message here..."
              className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
            <Button onClick={onPublish}>Publish</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function NewVisitModal({ visit, error, onChange, onClose, onSave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Add New Site Visit</h2>
            <p className="text-sm text-slate-500">Create a new visit and instantly publish it to the dashboard.</p>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            aria-label="Close new visit form"
          >
            X
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <input value={visit.date} type="date" onChange={(e) => onChange({ ...visit, date: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-400" />
          <input value={visit.time} placeholder="Time" onChange={(e) => onChange({ ...visit, time: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-400" />
          <input value={visit.location} placeholder="Location" onChange={(e) => onChange({ ...visit, location: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-400" />
          <input value={visit.assignee} placeholder="Assignee" onChange={(e) => onChange({ ...visit, assignee: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-400" />

          <select value={visit.status} onChange={(e) => onChange({ ...visit, status: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-400">
            <option value="open">Upcoming</option>
            <option value="inprogress">In Progress</option>
            <option value="closed">Completed</option>
            <option value="missed">Missed</option>
          </select>

          <textarea value={visit.description} placeholder="Visit description" onChange={(e) => onChange({ ...visit, description: e.target.value })} className="min-h-[120px] rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-400 md:col-span-2" />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Add Site Visit</Button>
        </div>
      </div>
    </div>
  );
}

function SiteVisitCalendar({ visits }) {
  const calendarDate = new Date("2026-05-01T00:00:00");
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const days = getCalendarDays(year, month);
  const visitsByDate = getVisitsByDate(visits);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const weekendHeaderStyles = {
    0: "bg-red-50 text-red-600",
    6: "bg-indigo-50 text-indigo-600",
  };

  return (
    <Card>
      <div className="p-5">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Site Visit Calendar</h2>
            <p className="text-sm text-slate-500">
              Calendar view of visits with status colors, time, assignee, and location.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            {new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(calendarDate)}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
          <CalendarLegend color="bg-blue-500" label="Upcoming" />
          <CalendarLegend color="bg-amber-500" label="In Progress" />
          <CalendarLegend color="bg-green-500" label="Completed" />
          <CalendarLegend color="bg-red-500" label="Missed" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-7 bg-slate-50 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`border-r border-slate-200 px-2 py-3 last:border-r-0 ${weekendHeaderStyles[index] || ""}`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dateKey = toDateKey(day.date);
              const dayVisits = visitsByDate[dateKey] || [];
              const isCurrentMonth = day.date.getMonth() === month;
              const dayOfWeek = day.date.getDay();
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              return (
                <div
                  key={dateKey}
                  className={`min-h-[135px] border-r border-t border-slate-200 p-2 last:border-r-0 ${
                    isCurrentMonth
                      ? isSunday
                        ? "bg-red-50/60"
                        : isSaturday
                          ? "bg-indigo-50/60"
                          : "bg-white"
                      : "bg-slate-50 text-slate-400"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-sm font-bold ${isCurrentMonth ? "text-slate-700" : "text-slate-400"}`}>
                      {day.date.getDate()}
                    </span>
                    {dayVisits.length > 0 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {dayVisits.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {dayVisits.map((visit) => {
                      const config = statusConfig[visit.status] || statusConfig.open;
                      const dotClass = getCalendarDotClass(visit.status);

                      return (
                        <div
                          key={visit.id}
                          className={`rounded-xl border px-2 py-1.5 text-xs shadow-sm ${getCalendarVisitClass(visit.status)}`}
                          title={`${visit.time} - ${visit.location} - ${visit.assignee}`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
                            <span className="truncate">{visit.time}</span>
                          </div>
                          <p className="mt-0.5 truncate font-semibold">{visit.location}</p>
                          <p className="truncate text-[11px] opacity-80">{visit.assignee}</p>
                          <p className="truncate text-[10px] font-semibold opacity-70">{config.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CalendarLegend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-600">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  const lastDay = new Date(year, month + 1, 0);
  const endDate = new Date(lastDay);
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

  const days = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    days.push({ date: new Date(current) });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function getVisitsByDate(allVisits) {
  return allVisits.reduce((acc, visit) => {
    if (!acc[visit.date]) {
      acc[visit.date] = [];
    }
    acc[visit.date].push(visit);
    return acc;
  }, {});
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCalendarDotClass(status) {
  const dotClasses = {
    open: "bg-blue-500",
    inprogress: "bg-amber-500",
    closed: "bg-green-500",
    missed: "bg-red-500",
  };

  return dotClasses[status] || "bg-slate-400";
}

function getCalendarVisitClass(status) {
  const classes = {
    open: "border-blue-200 bg-blue-50 text-blue-900",
    inprogress: "border-amber-200 bg-amber-50 text-amber-900",
    closed: "border-green-200 bg-green-50 text-green-900",
    missed: "border-red-200 bg-red-50 text-red-900",
  };

  return classes[status] || "border-slate-200 bg-slate-50 text-slate-800";
}

function VisitStatusVisualization({ counts, visits }) {
  const assigneeData = getVisitsPerAssignee(visits);

  const pieSegments = [
    { label: "Upcoming", value: counts.open, color: "#3b82f6" },
    { label: "In Progress", value: counts.inprogress, color: "#f59e0b" },
    { label: "Completed", value: counts.closed, color: "#22c55e" },
    { label: "Missed", value: counts.missed, color: "#ef4444" },
  ];

  return (
    <Card>
      <div className="p-5">
        <div className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Visit Status Overview</h2>
            <p className="text-sm text-slate-500">Visual breakdown of all site visits by current status.</p>
          </div>
          <p className="text-sm font-semibold text-slate-600">Total visits: {counts.total}</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <PieChartCard segments={pieSegments} total={counts.total} />
          <AssigneeBarChart data={assigneeData} />
        </div>
      </div>
    </Card>
  );
}

function PieChartCard({ segments, total }) {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <Card>
      <div className="flex h-full min-h-0 flex-col p-5">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Visits Distribution</h3>
          <p className="text-sm text-slate-500">
            Overview of upcoming, in-progress, completed, and missed visits.
          </p>
        </div>

        <div className="mt-6 grid flex-1 items-center gap-6 md:grid-cols-[minmax(180px,0.9fr)_minmax(180px,1fr)]">
          <div className="relative mx-auto flex aspect-square w-full max-w-[260px] items-center justify-center">
            <svg className="h-full w-full" viewBox="0 0 220 220">
              <g transform="translate(110,110) rotate(-90)">
                {segments.map((segment, index) => {
                  const fraction = total > 0 ? segment.value / total : 0;
                  const dash = fraction * circumference;
                  const gap = circumference - dash;
                  const offset = -cumulative * circumference;
                  cumulative += fraction;

                  return (
                    <circle
                      key={segment.label}
                      r={radius}
                      cx="0"
                      cy="0"
                      fill="transparent"
                      stroke={segment.color}
                      strokeWidth="24"
                      strokeDasharray={`${dash} ${gap}`}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold leading-none text-slate-800">{total}</span>
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Total Visits
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            {segments.map((segment) => {
              const percentage = total > 0 ? Math.round((segment.value / total) * 100) : 0;

              return (
                <div
                  key={segment.label}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{segment.label}</p>
                      <p className="text-xs text-slate-500">{segment.value} visits</p>
                    </div>
                  </div>

                  <span className="text-sm font-bold text-slate-700">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function AssigneeBarChart({ data }) {
  const maxVisits = Math.max(...data.map((item) => item.count), 1);

  const personColors = [
    { bar: "bg-blue-500", avatar: "bg-blue-100 text-blue-700" },
    { bar: "bg-emerald-500", avatar: "bg-emerald-100 text-emerald-700" },
    { bar: "bg-amber-500", avatar: "bg-amber-100 text-amber-700" },
    { bar: "bg-rose-500", avatar: "bg-rose-100 text-rose-700" },
    { bar: "bg-violet-500", avatar: "bg-violet-100 text-violet-700" },
    { bar: "bg-cyan-500", avatar: "bg-cyan-100 text-cyan-700" },
    { bar: "bg-orange-500", avatar: "bg-orange-100 text-orange-700" },
    { bar: "bg-pink-500", avatar: "bg-pink-100 text-pink-700" },
  ];

  return (
    <Card>
      <div className="p-5">
        <div className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-800">
              Visits Assigned Per Person
            </h3>
            <p className="text-sm text-slate-500">
              Workload visualization showing how many site visits are assigned to each team member.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {data.map((item, index) => {
            const width = `${(item.count / maxVisits) * 100}%`;
            const colorSet = personColors[index % personColors.length];

            return (
              <div key={item.assignee}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${colorSet.avatar}`}>
                      {item.assignee
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </div>
                    <span className="font-semibold text-slate-700">{item.assignee}</span>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {item.count} Visits
                  </span>
                </div>

                <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                    className={`h-full rounded-full ${colorSet.bar}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function getVisitsPerAssignee(allVisits) {
  const grouped = allVisits.reduce((acc, visit) => {
    acc[visit.assignee] = (acc[visit.assignee] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([assignee, count]) => ({ assignee, count }))
    .sort((a, b) => b.count - a.count || a.assignee.localeCompare(b.assignee));
}

function SummaryCard({ title, count, icon: Icon, className, iconClassName = "bg-white/80 text-slate-700" }) {
  return (
    <Card className={`${className} shadow-lg shadow-slate-200/60`}>
      <div className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-semibold text-slate-600">{title}</p>
          <p className="mt-1 text-3xl font-black tracking-tight">{count}</p>
        </div>
        <div className={`rounded-2xl p-3 shadow-sm ${iconClassName}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

function Card({ children, className = "" }) {
  return <div className={`rounded-3xl border border-white/80 bg-white/90 shadow-lg shadow-slate-200/60 backdrop-blur ${className}`}>{children}</div>;
}

function VemcoLogo() {
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1E5BFF] via-[#1146D8] to-[#0085FF] p-4 shadow-2xl shadow-blue-900/30 ring-1 ring-white/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_40%)]" />

      <div className="relative flex flex-col items-center">
        <div className="overflow-hidden rounded-[22px] border border-white/30 bg-white shadow-xl">
          <div className="flex items-stretch overflow-hidden rounded-[22px]">
            <div className="bg-[#0A4A8A] px-5 py-3">
              <span className="block text-[2.15rem] font-black lowercase leading-none tracking-tight text-white">
                vemco
              </span>
            </div>

            <div className="flex items-center bg-white px-5 py-3">
              <span className="block text-[2.15rem] font-black lowercase leading-none tracking-tight text-black">
                group
              </span>
            </div>
          </div>

          <div className="bg-white px-4 py-2 text-center">
            <p className="text-[11px] font-bold tracking-wide text-slate-600 sm:text-xs">
              Data Analytics, Insights &amp; Actions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const baseClasses = "rounded-2xl px-5 py-2.5 text-sm font-semibold transition";
  const variantClasses =
    variant === "outline"
      ? "border border-blue-100 bg-white text-blue-700 hover:bg-blue-50"
      : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-200/60 hover:from-blue-700 hover:to-cyan-600";

  return (
    <button className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}

function SvgIcon({ children, className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function CalendarDaysIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </SvgIcon>
  );
}

function CheckCircleIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </SvgIcon>
  );
}

function ClockIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </SvgIcon>
  );
}

function MapPinIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </SvgIcon>
  );
}

function SearchIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </SvgIcon>
  );
}

function BellIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </SvgIcon>
  );
}

function UserIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </SvgIcon>
  );
}

function XCircleIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </SvgIcon>
  );
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}
