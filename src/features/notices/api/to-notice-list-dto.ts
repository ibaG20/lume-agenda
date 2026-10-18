import type { NoticeListDto, ProviderNoticeDto } from "../types";

function toNotice(data: ProviderNoticeDto): ProviderNoticeDto {
  return {
    id: data.id,
    eventType: data.eventType,
    clientName: data.clientName,
    start: data.start,
    end: data.end,
    createdAt: data.createdAt,
  };
}

export function toNoticeListDto(data: NoticeListDto): NoticeListDto {
  return {
    timezone: data.timezone || "America/Sao_Paulo",
    notices: (data.notices ?? []).map(toNotice),
  };
}
