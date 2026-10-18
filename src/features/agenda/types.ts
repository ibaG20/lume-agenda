export type AgendaSlotState = "available" | "booked" | "blocked";

export type AgendaSlot = {
  start: string;
  end: string;
  state: AgendaSlotState;
  appointmentId?: string;
  overrideId?: string;
  clientName?: string;
};

export type DailyAgendaDto = {
  date: string;
  timezone: string;
  slots: AgendaSlot[];
};
