# notify-status

Deployed as an Edge Function (currently v2). Emails the customer when an
appointment is confirmed or moved.

Full source and reasoning are recorded in the deployment and summarised in
`../../phase1_booking_system.sql`. Retrieve the live source with:

    supabase functions download notify-status

Trigger: `on_booking_status_change()` fires on the transition into
`confirmed`, or on an `appointment_date` / `appointment_time` change while
already confirmed. An edit touching neither sends nothing.
