import type { SiteSettings } from "./site";
import type { TeamMember } from "./data";
import { OWNER_ID, type StaffMember } from "./availability";

/** Everyone who can hold a booking: the owner first, then the team members who take bookings. */
export function buildStaff(settings: SiteSettings, team: TeamMember[]): StaffMember[] {
  const owner: StaffMember = {
    id: OWNER_ID,
    name: settings.stylist,
    photoUrl: settings.portraitUrl || undefined,
    schedule: settings.ownerSchedule ?? null,
    takes: settings.ownerTakesBookings !== false,
    serviceIds: [],
  };
  const crew: StaffMember[] = team
    .filter((m) => m.takesBookings !== false)
    .map((m) => ({ id: m.id, name: m.name, role: m.role, photoUrl: m.photoUrl || undefined, schedule: m.schedule ?? null, takes: true, serviceIds: m.serviceIds ?? [] }));
  return [owner, ...crew];
}
