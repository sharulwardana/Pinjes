import { route, readJson, ok } from "@/server/api";
import { RATE_LIMITS } from "@/server/rate-limit";
import { createBookingSchema } from "@/features/booking/schemas";
import { createBooking } from "@/server/services/bookings";

export const POST = route(
  { auth: true, rateLimit: { ...RATE_LIMITS.booking, key: "booking" } },
  async ({ req, user }) => {
    const input = await readJson(req, createBookingSchema);
    const booking = await createBooking(
      user,
      input.productId,
      input.startDate,
      input.endDate,
      input.customerNote
    );
    return ok(booking);
  },
);