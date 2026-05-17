# Postman Files

Files:

- `dpg.postman_collection.json`
- `dpg.local.postman_environment.json`

## What This Collection Does

- runs the unified OTP auth flow
- stores the returned session token in `auth_token`
- stores the raw `set-cookie` header in `session_cookie`
- stores user fields in variables:
  - `user_id`
  - `user_email`
  - `user_phone`
  - `user_display_name`
- includes yellow_dot student and tutor item APIs with schema-valid example
  payloads
- includes action APIs for both supported yellow_dot directions:
  - student to `individual_tutor_weera_counsellor`
  - `individual_tutor_weera_counsellor` to student
- keeps internal instance-to-instance APIs in
  `Instance-to-Instance Network Calls`

Postman should also keep the Better Auth session cookie in its cookie jar
automatically for the same host. If student and tutor domains are hosted on
different instances, authenticate against each host before creating or updating
items there.

## Domain Instance Variables

The collection has separate settings for each yellow_dot domain so a tester can
point student and tutor traffic at different deployments:

- `student_instance_url`
- `student_instance_name`
- `student_instance_description`
- `tutor_instance_url`
- `tutor_instance_name`
- `tutor_instance_description`

The create-item requests update `student_item_id` and `tutor_item_id`. The
action requests use those variables by default, but you can replace them with
existing item IDs to test a newly created student against an existing tutor, or
a newly created tutor against an existing student.

## Recommended Order

1. `Auth / Check User`
2. `Auth / Request OTP`
3. `Auth / Verify OTP`
4. `Auth / Get Session`
5. `Network Schemas / Fetch Student Item Schema`
6. `Network Schemas / Fetch Tutor Item Schema`
7. `Items / Create Student Item`
8. `Items / Create Tutor Item`
9. `Items / Update Student Item` or `Items / Update Tutor Item`
10. `Actions / Student Connects To Tutor`
11. `Actions / Tutor Connects To Student`
12. `Actions / Fetch My Actions`
13. `Events / Fetch My Events`
14. `Instance-to-Instance Network Calls / Perform Network Action Student To Tutor`
    or `Perform Network Action Tutor To Student` for direct server-to-server
    diagnostics only

## About Schema Import

Partially possible.

What works well:

- you can call `GET /api/v1/network/schema/:network/:domain/:itemType`
- you can call `GET /api/v1/network/schemas`
- those responses help the user inspect the schema before filling payloads

What Postman does not do well by default:

- it does not automatically turn your runtime JSON Schema into a live request
  form for `item_state`, `requirements_snapshot`, or `event_payload`

So in the current collection:

- schema fetch requests are included
- request bodies are prefilled with example payloads
- variables are used where possible

## Action Payload Notes

- `Actions / Student Connects To Tutor` and
  `Actions / Tutor Connects To Student` are public source-instance APIs
- `Actions / Fetch My Actions` filters directly on stored `source_item_owner`
  and `target_item_owner`
- public action calls send the selected target item's `item_instance_url`
- public action calls do not send `source_instance_url`; the service derives
  that from its own runtime config
- `Instance-to-Instance Network Calls / Perform Network Action Student To Tutor`
  and `Perform Network Action Tutor To Student` are internal target-instance
  APIs for direct server-to-server testing
- `Events / Fetch My Events` filters directly on stored `source_item_owner` and
  `target_item_owner`
- `Instance-to-Instance Network Calls / Store Mirrored Event On Source Instance`
  uses the latest event contract with owner ids, `origin_instance_domain`,
  `action_status`, `update_count`, and item instance URLs
