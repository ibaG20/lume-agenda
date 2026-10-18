import { describe, expect, it } from "vitest";
import { toNoticeListDto } from "./to-notice-list-dto";

describe("toNoticeListDto", () => {
  it("keeps the notice text and drops contact fields", () => {
    const dto = toNoticeListDto({
      timezone: "America/Sao_Paulo",
      notices: [
        {
          id: "notice-1",
          eventType: "CLIENT_CANCELLED",
          clientName: "Ana Souza",
          start: "2026-10-19T12:00:00.000Z",
          end: "2026-10-19T13:00:00.000Z",
          createdAt: "2026-10-18T18:00:00.000Z",
          email: "ana@example.com",
          phone: "11999999999",
        } as never,
      ],
    });

    expect(dto.notices[0]).toEqual({
      id: "notice-1",
      eventType: "CLIENT_CANCELLED",
      clientName: "Ana Souza",
      start: "2026-10-19T12:00:00.000Z",
      end: "2026-10-19T13:00:00.000Z",
      createdAt: "2026-10-18T18:00:00.000Z",
    });
    expect(JSON.stringify(dto)).not.toContain("ana@example.com");
  });

  it("preserves booking events", () => {
    const dto = toNoticeListDto({
      timezone: "America/Sao_Paulo",
      notices: [
        {
          id: "notice-2",
          eventType: "CLIENT_BOOKED",
          clientName: "Bia Lima",
          start: "2026-10-20T12:00:00.000Z",
          end: "2026-10-20T13:00:00.000Z",
          createdAt: "2026-10-18T19:00:00.000Z",
        },
      ],
    });

    expect(dto.notices[0]?.eventType).toBe("CLIENT_BOOKED");
  });
});
