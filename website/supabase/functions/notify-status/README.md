# notify-status

Emails the customer when an appointment is confirmed or moved. Source is
`index.ts` in this directory.

Until 2026-08-31 the source existed **only inside the Supabase deployment** and
this file told you to run `supabase functions download notify-status` to get
it. That was a single point of failure — delete or overwrite the function and
the code was gone. It is now in git like the other two. Edit here, deploy from
here, and do not let the deployed copy become the only copy again.

Trigger: `on_booking_status_change()` fires on the transition into
`confirmed`, or on an `appointment_date` / `appointment_time` change while
already confirmed. An edit touching neither sends nothing.

`is_reschedule` is set by that trigger when the slot moved on a booking the
client has already been told about; it only changes the wording.

Deployed with `verify_jwt: true`, like `notify-booking` and `send-scheduled`.
The call arrives from the database via `pg_net`, not from a browser.

Further reasoning is recorded in `../../phase1_booking_system.sql`.
