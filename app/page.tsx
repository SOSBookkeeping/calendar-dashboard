"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  Menu,
  Moon,
  Plus,
  Settings,
  Sun,
  Trash2,
  Users,
  Workflow,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";

type CalendarItem = {
  id: number;
  kind: "event" | "task";
  title: string;
  source: string;
  date: string;
  time: string;
  category: string;
  done?: boolean;
};

type Client = {
  id: number;
  name: string;
  service: string;
  nextAction: string;
  status: string;
};

type WorkflowItem = {
  id: number;
  name: string;
  stage: string;
  owner: string;
};

const STORAGE_KEYS = {
  items: "sos-dashboard-items",
  clients: "sos-dashboard-clients",
};

const defaultClients: Client[] = [
  { id: 1, name: "Acorn Retail Ltd", service: "Bookkeeping", nextAction: "Send VAT summary", status: "Active" },
  { id: 2, name: "Northfield Fitness", service: "Payroll", nextAction: "Approve payroll run", status: "Waiting" },
  { id: 3, name: "Mason Electrical", service: "Year End", nextAction: "Request missing invoices", status: "Urgent" },
  { id: 4, name: "Willow Cafe", service: "Monthly accounts", nextAction: "Bank reconciliation", status: "Active" },
];

const sampleWorkflows: WorkflowItem[] = [
  { id: 1, name: "Client onboarding", stage: "Docs pending", owner: "Shane" },
  { id: 2, name: "VAT return cycle", stage: "Review", owner: "SOS Team" },
  { id: 3, name: "Payroll processing", stage: "Awaiting approval", owner: "Admin" },
  { id: 4, name: "Year-end accounts", stage: "In progress", owner: "Practice" },
];

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function sameDay(a: Date, b: Date) {
  return formatDateKey(a) === formatDateKey(b);
}

function startOfWeekMonday(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function prettyDate(date: Date) {
  return date.toLocaleDateString("en-IE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SidebarItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
        active ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

function WeekDayCard({
  date,
  selected,
  isToday,
  count,
  onClick,
}: {
  date: Date;
  selected: boolean;
  isToday: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        selected ? "border-blue-400 bg-blue-500/15" : "border-slate-700 bg-slate-900 hover:bg-slate-800"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-slate-300">
            {date.toLocaleDateString("en-IE", { weekday: "short" })}
          </p>
          <p className="mt-1 text-2xl font-bold text-white">{date.getDate()}</p>
        </div>
        {isToday && (
          <Badge className="rounded-full border border-emerald-400/30 bg-emerald-500/20 text-emerald-300">
            Today
          </Badge>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-400">
        {count} item{count === 1 ? "" : "s"}
      </p>
    </button>
  );
}

function AgendaItemCard({
  item,
  onToggleTask,
  onDelete,
}: {
  item: CalendarItem;
  onToggleTask: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Card className="rounded-2xl border-slate-700 bg-slate-900 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 rounded-2xl bg-slate-800 p-3 text-slate-100">
              {item.kind === "event" ? <CalendarDays className="h-5 w-5" /> : <ListTodo className="h-5 w-5" />}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`text-base font-semibold text-white ${item.done ? "line-through opacity-60" : ""}`}>
                  {item.title}
                </h3>
                <Badge variant="outline" className="rounded-full border-slate-500 text-slate-100">
                  {item.category}
                </Badge>
                <Badge variant="outline" className="rounded-full border-slate-500 text-slate-300">
                  {item.kind}
                </Badge>
              </div>

              <p className="mt-1 text-sm text-slate-300">{item.source}</p>

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-4 w-4" /> {item.time}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {item.kind === "task" && (
              <Checkbox checked={!!item.done} onCheckedChange={() => onToggleTask(item.id)} />
            )}
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SOSDashboard() {
  const today = new Date();
  const todayKey = formatDateKey(today);

  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeekMonday(today));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [items, setItems] = useState<CalendarItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newKind, setNewKind] = useState<"event" | "task">("event");

  const [newClientName, setNewClientName] = useState("");
  const [newClientService, setNewClientService] = useState("");
  const [newClientAction, setNewClientAction] = useState("");
  const [newClientStatus, setNewClientStatus] = useState("");

  useEffect(() => {
    const defaultItems: CalendarItem[] = [
      {
        id: 1,
        kind: "event",
        title: "Team Standup",
        source: "Google Calendar",
        date: todayKey,
        time: "09:00 - 09:30",
        category: "Work",
      },
      {
        id: 2,
        kind: "task",
        title: "Submit quarterly report",
        source: "Microsoft To Do",
        date: todayKey,
        time: "Due 14:00",
        category: "Priority",
        done: false,
      },
      {
        id: 3,
        kind: "event",
        title: "Client call - Acorn Retail Ltd",
        source: "Outlook",
        date: todayKey,
        time: "11:30 - 12:00",
        category: "Client",
      },
      {
        id: 4,
        kind: "task",
        title: "Bank reconciliation",
        source: "Dashboard",
        date: formatDateKey(addDays(today, 1)),
        time: "Due 13:00",
        category: "Accounts",
        done: false,
      },
      {
        id: 5,
        kind: "event",
        title: "VAT review meeting",
        source: "Google Calendar",
        date: formatDateKey(addDays(today, 2)),
        time: "15:00 - 16:00",
        category: "VAT",
      },
      {
        id: 6,
        kind: "task",
        title: "Request missing invoices",
        source: "Dashboard",
        date: formatDateKey(addDays(today, 4)),
        time: "Due anytime",
        category: "Urgent",
        done: false,
      },
    ];

    try {
      const storedItems = localStorage.getItem(STORAGE_KEYS.items);
      const storedClients = localStorage.getItem(STORAGE_KEYS.clients);

      setItems(storedItems ? JSON.parse(storedItems) : defaultItems);
      setClients(storedClients ? JSON.parse(storedClients) : defaultClients);
    } catch {
      setItems(defaultItems);
      setClients(defaultClients);
    } finally {
      setHasLoaded(true);
    }
  }, [todayKey]);

  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(items));
  }, [items, hasLoaded]);

  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients));
  }, [clients, hasLoaded]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const selectedItems = useMemo(() => {
    return items
      .filter((item) => item.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [items, selectedDate]);

  const openTasks = items.filter((x) => x.kind === "task" && !x.done).length;
  const todayCount = items.filter((x) => x.date === todayKey).length;

  const itemsThisWeek = items.filter((item) =>
    weekDays.some((day) => item.date === formatDateKey(day))
  ).length;

  const addItem = () => {
    if (!newTitle.trim()) return;

    const newItem: CalendarItem = {
      id: Date.now(),
      kind: newKind,
      title: newTitle.trim(),
      source: newSource.trim() || "Dashboard",
      date: selectedDate,
      time: newTime.trim() || (newKind === "event" ? "09:00 - 10:00" : "Due anytime"),
      category: newCategory.trim() || "General",
      done: false,
    };

    setItems((current) => [...current, newItem]);
    setNewTitle("");
    setNewTime("");
    setNewCategory("");
    setNewSource("");
    setNewKind("event");
  };

  const addClient = () => {
    if (!newClientName.trim()) return;

    const client: Client = {
      id: Date.now(),
      name: newClientName.trim(),
      service: newClientService.trim() || "Bookkeeping",
      nextAction: newClientAction.trim() || "Follow up required",
      status: newClientStatus.trim() || "Active",
    };

    setClients((current) => [client, ...current]);
    setNewClientName("");
    setNewClientService("");
    setNewClientAction("");
    setNewClientStatus("");
  };

  const toggleTask = (id: number) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const deleteItem = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const deleteClient = (id: number) => {
    setClients((current) => current.filter((client) => client.id !== id));
  };

  const selectedDateObj = new Date(`${selectedDate}T12:00:00`);

  return (
    <div className={darkMode ? "min-h-screen bg-slate-950 text-slate-50" : "min-h-screen bg-slate-50 text-slate-900"}>
      <div className="flex min-h-screen">
        {sidebarOpen && (
          <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-900 p-5 lg:block">
            <div className="mb-8 flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-slate-700 bg-white">
                <Image src="/sos-logo.jpg" alt="SOS Bookkeeping logo" fill className="object-cover" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">SOS Bookkeeping</h2>
                <p className="text-sm text-slate-400">Weekly planner</p>
              </div>
            </div>

            <div className="space-y-2">
              <SidebarItem icon={<LayoutDashboard className="h-5 w-5" />} label="Dashboard" active />
              <SidebarItem icon={<CalendarDays className="h-5 w-5" />} label="Calendar" />
              <SidebarItem icon={<ListTodo className="h-5 w-5" />} label="Tasks" />
              <SidebarItem icon={<Users className="h-5 w-5" />} label="Clients" />
              <SidebarItem icon={<Workflow className="h-5 w-5" />} label="Workflows" />
              <SidebarItem icon={<Briefcase className="h-5 w-5" />} label="Jobs" />
              <SidebarItem icon={<ListChecks className="h-5 w-5" />} label="Deadlines" />
              <SidebarItem icon={<Settings className="h-5 w-5" />} label="Settings" />
            </div>

            <div className="mt-8 rounded-3xl border border-slate-700 bg-slate-800 p-4">
              <p className="text-sm font-semibold text-white">Quick summary</p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Today</span>
                  <strong>{todayCount}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>This week</span>
                  <strong>{itemsThisWeek}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Open tasks</span>
                  <strong>{openTasks}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Clients</span>
                  <strong>{clients.length}</strong>
                </div>
              </div>
            </div>
          </aside>
        )}

        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800 p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="mt-1 rounded-2xl border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>

                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                      SOS Bookkeeping Dashboard
                    </h1>
                    <p className="mt-2 text-slate-200">
                      Weekly calendar with saved clients and saved tasks/events.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
                    onClick={() => setDarkMode(!darkMode)}
                  >
                    {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </Button>
                </div>
              </div>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card className="rounded-2xl border-slate-700 bg-slate-900 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-300">Today</CardDescription>
                  <CardTitle className="text-4xl">{todayCount}</CardTitle>
                </CardHeader>
              </Card>

              <Card className="rounded-2xl border-slate-700 bg-slate-900 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-300">This week</CardDescription>
                  <CardTitle className="text-4xl">{itemsThisWeek}</CardTitle>
                </CardHeader>
              </Card>

              <Card className="rounded-2xl border-slate-700 bg-slate-900 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-300">Open tasks</CardDescription>
                  <CardTitle className="text-4xl">{openTasks}</CardTitle>
                </CardHeader>
              </Card>

              <Card className="rounded-2xl border-slate-700 bg-slate-900 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-300">Clients</CardDescription>
                  <CardTitle className="text-4xl">{clients.length}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="rounded-2xl border-slate-700 bg-slate-900 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle className="text-2xl text-white">Weekly Calendar</CardTitle>
                    <CardDescription className="text-slate-300">Monday to Sunday</CardDescription>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="rounded-2xl border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
                      onClick={() => setWeekStart((current) => addDays(current, -7))}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-2xl border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
                      onClick={() => {
                        const start = startOfWeekMonday(new Date());
                        setWeekStart(start);
                        setSelectedDate(formatDateKey(new Date()));
                      }}
                    >
                      This Week
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-2xl border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
                      onClick={() => setWeekStart((current) => addDays(current, 7))}
                    >
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-7">
                  {weekDays.map((day) => {
                    const key = formatDateKey(day);
                    const count = items.filter((item) => item.date === key).length;

                    return (
                      <WeekDayCard
                        key={key}
                        date={day}
                        selected={selectedDate === key}
                        isToday={sameDay(day, today)}
                        count={count}
                        onClick={() => setSelectedDate(key)}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <Card className="rounded-2xl border-slate-700 bg-slate-900 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">
                      Agenda for {prettyDate(selectedDateObj)}
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Click any day above to switch view.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {selectedItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                        No events or tasks for this day yet.
                      </div>
                    ) : (
                      selectedItems.map((item) => (
                        <AgendaItemCard
                          key={item.id}
                          item={item}
                          onToggleTask={toggleTask}
                          onDelete={deleteItem}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="rounded-2xl border-slate-700 bg-slate-900 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Add Item</CardTitle>
                    <CardDescription className="text-slate-300">
                      Add an event or task to the selected day.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        onClick={() => setNewKind("event")}
                        variant={newKind === "event" ? "default" : "outline"}
                        className={`rounded-2xl ${newKind !== "event" ? "border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800" : ""}`}
                      >
                        Event
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setNewKind("task")}
                        variant={newKind === "task" ? "default" : "outline"}
                        className={`rounded-2xl ${newKind !== "task" ? "border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800" : ""}`}
                      >
                        Task
                      </Button>
                    </div>

                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Title"
                      className="rounded-2xl border-slate-600 bg-slate-800 text-white"
                    />
                    <Input
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      placeholder={newKind === "event" ? "09:00 - 10:00" : "Due 14:00"}
                      className="rounded-2xl border-slate-600 bg-slate-800 text-white"
                    />
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Category"
                      className="rounded-2xl border-slate-600 bg-slate-800 text-white"
                    />
                    <Input
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      placeholder="Source"
                      className="rounded-2xl border-slate-600 bg-slate-800 text-white"
                    />

                    <Button onClick={addItem} className="w-full rounded-2xl">
                      <Plus className="mr-2 h-4 w-4" /> Add to {selectedDate}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-700 bg-slate-900 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Add Client</CardTitle>
                    <CardDescription className="text-slate-300">
                      Save a client to this dashboard.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <Input
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Client name"
                      className="rounded-2xl border-slate-600 bg-slate-800 text-white"
                    />
                    <Input
                      value={newClientService}
                      onChange={(e) => setNewClientService(e.target.value)}
                      placeholder="Service"
                      className="rounded-2xl border-slate-600 bg-slate-800 text-white"
                    />
                    <Input
                      value={newClientAction}
                      onChange={(e) => setNewClientAction(e.target.value)}
                      placeholder="Next action"
                      className="rounded-2xl border-slate-600 bg-slate-800 text-white"
                    />
                    <Input
                      value={newClientStatus}
                      onChange={(e) => setNewClientStatus(e.target.value)}
                      placeholder="Status"
                      className="rounded-2xl border-slate-600 bg-slate-800 text-white"
                    />

                    <Button onClick={addClient} className="w-full rounded-2xl">
                      <Plus className="mr-2 h-4 w-4" /> Add Client
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-700 bg-slate-900 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Clients</CardTitle>
                    <CardDescription className="text-slate-300">
                      Saved locally in this browser.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {clients.map((client) => (
                      <div key={client.id} className="rounded-2xl bg-slate-800 p-4 text-slate-100">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{client.name}</p>
                            <p className="mt-1 text-sm opacity-80">{client.service}</p>
                            <p className="mt-2 text-sm">{client.nextAction}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="rounded-full border-slate-500 text-slate-100">
                              {client.status}
                            </Badge>
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-2xl border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
                              onClick={() => deleteClient(client.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-700 bg-slate-900 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Workflows</CardTitle>
                    <CardDescription className="text-slate-300">
                      Current process stages.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {sampleWorkflows.map((flow) => (
                      <div key={flow.id} className="rounded-2xl bg-slate-800 p-4 text-slate-100">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{flow.name}</p>
                            <p className="mt-1 text-sm opacity-80">{flow.stage}</p>
                          </div>
                          <Badge variant="outline" className="rounded-full border-slate-500 text-slate-100">
                            {flow.owner}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}