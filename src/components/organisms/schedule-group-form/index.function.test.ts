import { describe, expect, it } from "vitest";
import {
  calculatedEndTime,
  formatDuration,
  formValuesFromRules,
  summarizeCapacity,
  summarizeDays,
  summarizeDurations,
  summarizeRanges,
  validateSchedule,
} from "./index.function";

describe("schedule group form helpers", () => {
  it("accepts arbitrary start minutes and configurable durations", () => {
    expect(
      validateSchedule({
        name: "Semana",
        days: [1, 2, 3, 4, 5],
        ranges: [
          {
            startTime: "08:17",
            slotDurationMinutes: 45,
            appointmentCount: 5,
          },
          {
            startTime: "13:20",
            slotDurationMinutes: 45,
            appointmentCount: 6,
          },
        ],
        isActive: true,
      }),
    ).toBeUndefined();
  });

  it("rejects overlaps and schedules that cross midnight", () => {
    expect(
      validateSchedule({
        name: "Semana",
        days: [1],
        ranges: [
          {
            startTime: "08:00",
            slotDurationMinutes: 60,
            appointmentCount: 4,
          },
          {
            startTime: "11:00",
            slotDurationMinutes: 60,
            appointmentCount: 2,
          },
        ],
        isActive: false,
      }),
    ).toMatch(/sobrepor/i);

    expect(
      validateSchedule({
        name: "Semana",
        days: [1],
        ranges: [
          {
            startTime: "15:20",
            slotDurationMinutes: 90,
            appointmentCount: 6,
          },
        ],
        isActive: false,
      }),
    ).toMatch(/meia-noite/i);
  });

  it("calculates the end from start, duration and appointment count", () => {
    expect(
      calculatedEndTime({
        startTime: "15:20",
        slotDurationMinutes: 40,
        appointmentCount: 3,
      }),
    ).toBe("17:20");
  });

  it("formats durations for the schedule summary", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(90)).toBe("1h 30min");
  });

  it("hydrates and summarizes a canonical cartesian rule set", () => {
    const rules = [
      {
        id: "1",
        groupId: "g",
        dayOfWeek: 1 as const,
        startTime: "08:00:00",
        endTime: "12:00:00",
        slotDurationMinutes: 60,
        appointmentCount: 4,
      },
      {
        id: "2",
        groupId: "g",
        dayOfWeek: 2 as const,
        startTime: "08:00:00",
        endTime: "12:00:00",
        slotDurationMinutes: 60,
        appointmentCount: 4,
      },
      {
        id: "3",
        groupId: "g",
        dayOfWeek: 3 as const,
        startTime: "08:00:00",
        endTime: "12:00:00",
        slotDurationMinutes: 60,
        appointmentCount: 4,
      },
      {
        id: "4",
        groupId: "g",
        dayOfWeek: 4 as const,
        startTime: "08:00:00",
        endTime: "12:00:00",
        slotDurationMinutes: 60,
        appointmentCount: 4,
      },
      {
        id: "5",
        groupId: "g",
        dayOfWeek: 5 as const,
        startTime: "08:00:00",
        endTime: "12:00:00",
        slotDurationMinutes: 60,
        appointmentCount: 4,
      },
    ];

    expect(formValuesFromRules(rules)).toEqual({
      days: [1, 2, 3, 4, 5],
      ranges: [
        {
          startTime: "08:00",
          slotDurationMinutes: 60,
          appointmentCount: 4,
        },
      ],
    });
    expect(summarizeDays(rules)).toBe("Segunda a sexta");
    expect(summarizeRanges(rules)).toBe("08:00–12:00");
    expect(summarizeDurations(rules)).toBe("1h");
    expect(summarizeCapacity(rules)).toBe("4 atendimentos por dia");
  });
});
