export type ProviderNoticeDto = {
  id: string;
  eventType: "CLIENT_CANCELLED";
  clientName: string;
  start: string;
  end: string;
  createdAt: string;
};

export type NoticeListDto = {
  timezone: string;
  notices: ProviderNoticeDto[];
};
