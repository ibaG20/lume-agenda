export type CancellationPreviewDto = {
  appointmentId: string;
  start: string;
  end: string;
  status: "CONFIRMED" | "CANCELLED";
  providerName: string;
  publicSlug: string;
  timezone: string;
};

export type CancelAppointmentDto = {
  appointmentId: string;
  status: "CANCELLED";
};
