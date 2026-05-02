const REPORT_TYPES = new Set([
  "participation",
  "serviceActivity",
  "queueStats",
]);

const CANCELLED_STATUSES = new Set(["canceled", "cancelled", "no-show", "no_show"]);

function isValidReportType(reportType) {
  return REPORT_TYPES.has(reportType);
}

function parseDate(value, fieldName, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${fieldName} must be a valid date.`);
    error.statusCode = 400;
    throw error;
  }
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

function parsePositiveInt(value, fieldName) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    const error = new Error(`${fieldName} must be a positive whole number.`);
    error.statusCode = 400;
    throw error;
  }
  return number;
}

function normalizeFilters(query = {}) {
  const startDate = parseDate(query.startDate, "startDate");
  const endDate = parseDate(query.endDate, "endDate", true);

  if (startDate && endDate && startDate > endDate) {
    const error = new Error("startDate must be before endDate.");
    error.statusCode = 400;
    throw error;
  }

  return {
    startDate,
    endDate,
    serviceId: parsePositiveInt(query.serviceId, "serviceId"),
    queueId: parsePositiveInt(query.queueId, "queueId"),
    user: typeof query.user === "string" ? query.user.trim() : "",
    status: typeof query.status === "string" ? query.status.trim().toLowerCase() : "",
  };
}

function buildEntryWhere(filters) {
  const where = {};

  if (filters.startDate || filters.endDate) {
    where.joinTime = {};
    if (filters.startDate) where.joinTime.gte = filters.startDate;
    if (filters.endDate) where.joinTime.lte = filters.endDate;
  }

  if (filters.queueId) {
    where.queueId = filters.queueId;
  }

  if (filters.user) {
    where.guestName = { contains: filters.user };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.serviceId) {
    where.queue = { serviceId: filters.serviceId };
  }

  return where;
}

function avg(numbers) {
  const usable = numbers.filter((value) => Number.isFinite(value));
  if (!usable.length) return null;
  return Math.round((usable.reduce((sum, value) => sum + value, 0) / usable.length) * 10) / 10;
}

function toIso(value) {
  return value ? new Date(value).toISOString() : null;
}

function formatQueueName(queue) {
  return `Queue ${queue.id}`;
}

function estimatedWaitMinutes(entry) {
  const duration = Number(entry.queue?.service?.duration);
  const position = Number(entry.position);
  if (!Number.isFinite(duration) || !Number.isFinite(position) || duration <= 0 || position <= 0) {
    return null;
  }
  return duration * position;
}

function mapParticipationEntry(entry) {
  return {
    customerName: entry.guestName,
    customerId: null,
    queueId: entry.queueId,
    queueName: formatQueueName(entry.queue),
    serviceId: entry.queue.serviceId,
    serviceName: entry.queue.service.name,
    joinTime: toIso(entry.joinTime),
    serviceStartTime: null,
    completionTime: null,
    status: entry.status,
    waitTimeMinutes: estimatedWaitMinutes(entry),
  };
}

async function getParticipationReport(prisma, filters) {
  const entries = await prisma.queueEntry.findMany({
    where: buildEntryWhere(filters),
    include: { queue: { include: { service: true } } },
    orderBy: { joinTime: "desc" },
  });

  return {
    columns: [
      "customerName",
      "customerId",
      "queueName",
      "serviceName",
      "joinTime",
      "serviceStartTime",
      "completionTime",
      "status",
      "waitTimeMinutes",
    ],
    rows: entries.map(mapParticipationEntry),
  };
}

async function getServiceActivityReport(prisma, filters) {
  const entries = await prisma.queueEntry.findMany({
    where: buildEntryWhere(filters),
    include: { queue: { include: { service: true } } },
    orderBy: { joinTime: "desc" },
  });

  const groups = new Map();

  entries.forEach((entry) => {
    const key = `${entry.queue.serviceId}:${entry.queueId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        serviceId: entry.queue.serviceId,
        serviceName: entry.queue.service.name,
        queueId: entry.queueId,
        queueName: formatQueueName(entry.queue),
        usersInQueue: 0,
        numberServed: 0,
        numberCancelledNoShow: 0,
        averageWaitTimeMinutes: null,
        activityDateTime: null,
        totalEntries: 0,
        waitTimes: [],
      });
    }

    const group = groups.get(key);
    group.totalEntries += 1;
    if (entry.status === "waiting") group.usersInQueue += 1;
    if (entry.status === "served") group.numberServed += 1;
    if (CANCELLED_STATUSES.has(entry.status)) group.numberCancelledNoShow += 1;
    if (!group.activityDateTime || entry.joinTime > new Date(group.activityDateTime)) {
      group.activityDateTime = toIso(entry.joinTime);
    }

    const wait = estimatedWaitMinutes(entry);
    if (wait !== null) group.waitTimes.push(wait);
  });

  const rows = Array.from(groups.values()).map((group) => ({
    serviceId: group.serviceId,
    serviceName: group.serviceName,
    queueId: group.queueId,
    queueName: group.queueName,
    usersInQueue: group.usersInQueue,
    numberServed: group.numberServed,
    numberCancelledNoShow: group.numberCancelledNoShow,
    averageWaitTimeMinutes: avg(group.waitTimes),
    activityDateTime: group.activityDateTime,
    totalEntries: group.totalEntries,
  }));

  return {
    columns: [
      "serviceName",
      "queueName",
      "usersInQueue",
      "numberServed",
      "numberCancelledNoShow",
      "averageWaitTimeMinutes",
      "activityDateTime",
      "totalEntries",
    ],
    rows,
  };
}

async function getQueueStatsReport(prisma, filters) {
  const entries = await prisma.queueEntry.findMany({
    where: buildEntryWhere(filters),
    include: { queue: { include: { service: true } } },
    orderBy: { joinTime: "desc" },
  });

  const peakGroups = new Map();
  const breakdownGroups = new Map();

  entries.forEach((entry) => {
    const hour = new Date(entry.joinTime);
    hour.setMinutes(0, 0, 0);
    const hourKey = hour.toISOString();
    peakGroups.set(hourKey, (peakGroups.get(hourKey) || 0) + 1);

    const breakdownKey = `${entry.queue.serviceId}:${entry.queueId}`;
    if (!breakdownGroups.has(breakdownKey)) {
      breakdownGroups.set(breakdownKey, {
        serviceId: entry.queue.serviceId,
        serviceName: entry.queue.service.name,
        queueId: entry.queueId,
        queueName: formatQueueName(entry.queue),
        totalEntries: 0,
        served: 0,
        waiting: 0,
        cancelledNoShow: 0,
      });
    }

    const group = breakdownGroups.get(breakdownKey);
    group.totalEntries += 1;
    if (entry.status === "served") group.served += 1;
    if (entry.status === "waiting") group.waiting += 1;
    if (CANCELLED_STATUSES.has(entry.status)) group.cancelledNoShow += 1;
  });

  const peakUsagePeriods = Array.from(peakGroups.entries())
    .map(([periodStart, totalEntries]) => ({ periodStart, totalEntries }))
    .sort((a, b) => b.totalEntries - a.totalEntries || a.periodStart.localeCompare(b.periodStart))
    .slice(0, 5);

  const breakdown = Array.from(breakdownGroups.values())
    .sort((a, b) => b.totalEntries - a.totalEntries || a.serviceName.localeCompare(b.serviceName));

  const rows = breakdown.map((item) => ({
    ...item,
    totalUsersServed: item.served,
    averageWaitTimeMinutes: avg(
      entries
        .filter((entry) => entry.queue.serviceId === item.serviceId && entry.queueId === item.queueId)
        .map(estimatedWaitMinutes)
    ),
    peakUsagePeriods: peakUsagePeriods.map((period) => `${period.periodStart} (${period.totalEntries})`).join("; "),
  }));

  return {
    columns: [
      "serviceName",
      "queueName",
      "totalUsersServed",
      "averageWaitTimeMinutes",
      "totalEntries",
      "waiting",
      "cancelledNoShow",
      "peakUsagePeriods",
    ],
    rows,
    summary: {
      totalUsersServed: entries.filter((entry) => entry.status === "served").length,
      averageWaitTimeMinutes: avg(entries.map(estimatedWaitMinutes)),
      totalQueueEntries: entries.length,
      peakUsagePeriods,
      breakdown,
    },
  };
}

async function generateReport(prisma, reportType, rawFilters) {
  if (!isValidReportType(reportType)) {
    const error = new Error("reportType must be participation, serviceActivity, or queueStats.");
    error.statusCode = 400;
    throw error;
  }

  const filters = normalizeFilters(rawFilters);

  if (reportType === "participation") {
    return getParticipationReport(prisma, filters);
  }

  if (reportType === "serviceActivity") {
    return getServiceActivityReport(prisma, filters);
  }

  return getQueueStatsReport(prisma, filters);
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(columns, rows) {
  const header = columns.map(csvEscape).join(",");
  const body = rows.map((row) => columns.map((column) => csvEscape(row[column])).join(","));
  return [header, ...body].join("\n");
}

module.exports = {
  generateReport,
  toCsv,
};
