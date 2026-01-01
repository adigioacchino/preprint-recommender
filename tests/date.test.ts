import { describe, it, expect, vi } from "vitest";

import { getPreprintDateRange } from "../src/utils/date.js";

describe("Date constructor for (lookBackDays, offsetDays) ", () => {
  it("build date for (1,0), should be full yesterday", async () => {
    const [startDay, endDay] = getPreprintDateRange(1, 0);

    const startExpected = new Date(new Date().setHours(0, 0, 0, 0));
    startExpected.setDate(startExpected.getDate() - 1);
    const endExpected = new Date(new Date().setHours(23, 59, 59, 999));
    endExpected.setDate(endExpected.getDate() - 1);
    expect(startDay.toISOString()).toBe(startExpected.toISOString());
    expect(endDay.toISOString()).toBe(endExpected.toISOString());
  });

  it("build date for (2,0), should be yesterday and day before", async () => {
    const [startDay, endDay] = getPreprintDateRange(2, 0);

    const startExpected = new Date(new Date().setHours(0, 0, 0, 0));
    startExpected.setDate(startExpected.getDate() - 2);
    const endExpected = new Date(new Date().setHours(23, 59, 59, 999));
    endExpected.setDate(endExpected.getDate() - 1);
    expect(startDay.toISOString()).toBe(startExpected.toISOString());
    expect(endDay.toISOString()).toBe(endExpected.toISOString());
  });

  it("build date for (2,1), should be day before yesterday and previous", async () => {
    const [startDay, endDay] = getPreprintDateRange(2, 1);

    const startExpected = new Date(new Date().setHours(0, 0, 0, 0));
    startExpected.setDate(startExpected.getDate() - 3);
    const endExpected = new Date(new Date().setHours(23, 59, 59, 999));
    endExpected.setDate(endExpected.getDate() - 2);
    expect(startDay.toISOString()).toBe(startExpected.toISOString());
    expect(endDay.toISOString()).toBe(endExpected.toISOString());
  });

  it("build date for (2,2), should be 4 and 3 days ago", async () => {
    const [startDay, endDay] = getPreprintDateRange(2, 2);

    const startExpected = new Date(new Date().setHours(0, 0, 0, 0));
    startExpected.setDate(startExpected.getDate() - 4);
    const endExpected = new Date(new Date().setHours(23, 59, 59, 999));
    endExpected.setDate(endExpected.getDate() - 3);
    expect(startDay.toISOString()).toBe(startExpected.toISOString());
    expect(endDay.toISOString()).toBe(endExpected.toISOString());
  });

  it("same for case (1,0), mocking that it's 00:01 am", async () => {
    // Mock to 00:01 in local time
    const mockDate = new Date(2024, 0, 15, 0, 1); // January 15, 2024 at 00:01
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const [startDay, endDay] = getPreprintDateRange(1, 0);

    // Expected: yesterday (Jan 14) full day in local time
    const startExpected = new Date(2024, 0, 14, 0, 0, 0, 0);
    const endExpected = new Date(2024, 0, 14, 23, 59, 59, 999);

    expect(startDay.toISOString()).toBe(startExpected.toISOString());
    expect(endDay.toISOString()).toBe(endExpected.toISOString());

    vi.useRealTimers();
  });

  it("same for case (1,0), mocking that it's 23:59 pm", async () => {
    // Mock to 23:59 in local time
    const mockDate = new Date(2024, 0, 15, 23, 59); // January 15, 2024 at 23:59
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const [startDay, endDay] = getPreprintDateRange(1, 0);

    // Expected: yesterday (Jan 14) full day in local time
    const startExpected = new Date(2024, 0, 14, 0, 0, 0, 0);
    const endExpected = new Date(2024, 0, 14, 23, 59, 59, 999);

    expect(startDay.toISOString()).toBe(startExpected.toISOString());
    expect(endDay.toISOString()).toBe(endExpected.toISOString());

    vi.useRealTimers();
  });

  it("same for case (2,1), mocking that it's 00:01 am", async () => {
    // Mock to 00:01 in local time
    const mockDate = new Date(2024, 0, 15, 0, 1); // January 15, 2024 at 00:01
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const [startDay, endDay] = getPreprintDateRange(2, 1);

    // Expected: 3 days ago to 2 days ago (Jan 12-13) in local time
    const startExpected = new Date(2024, 0, 12, 0, 0, 0, 0);
    const endExpected = new Date(2024, 0, 13, 23, 59, 59, 999);

    expect(startDay.toISOString()).toBe(startExpected.toISOString());
    expect(endDay.toISOString()).toBe(endExpected.toISOString());

    vi.useRealTimers();
  });

  it("same for case (2,1), mocking that it's 23:59 pm", async () => {
    // Mock to 23:59 in local time
    const mockDate = new Date(2024, 0, 15, 23, 59); // January 15, 2024 at 23:59
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const [startDay, endDay] = getPreprintDateRange(2, 1);

    // Expected: 3 days ago to 2 days ago (Jan 12-13) in local time
    const startExpected = new Date(2024, 0, 12, 0, 0, 0, 0);
    const endExpected = new Date(2024, 0, 13, 23, 59, 59, 999);

    expect(startDay.toISOString()).toBe(startExpected.toISOString());
    expect(endDay.toISOString()).toBe(endExpected.toISOString());

    vi.useRealTimers();
  });

  it("same for case (2,1), mocking that it's 00:01 am first Jan", async () => {
    // Mock to 00:01 in local time
    const mockDate = new Date(2026, 0, 1, 0, 1);
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const [startDay, endDay] = getPreprintDateRange(2, 1);

    // Expected: 3 days ago to 2 days ago (Dec 29-30, 2025) in local time
    const startExpected = new Date(2025, 11, 29, 0, 0, 0, 0);
    const endExpected = new Date(2025, 11, 30, 23, 59, 59, 999);

    expect(startDay.toISOString()).toBe(startExpected.toISOString());
    expect(endDay.toISOString()).toBe(endExpected.toISOString());
    vi.useRealTimers();
  });
});
