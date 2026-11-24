# Appsmith widgets and bindings (page "Page1")

| Widget | Type | Key settings |
|---|---|---|
| StartInput | Input (single-line text) | Label "Start time (HH:MM, UTC)", default `09:00`, placeholder `HH:MM` |
| DurationInput | Input (single-line text) | Label "Duration (minutes, 1-120)", default `30` |
| BlockedSwitch | Switch | Label "Room is blocked", default off |
| CheckButton | Button | Label "Check availability", onClick `{{Availability.run()}}` |
| ResultText | Text | Bound to `appsmith.store.lastResult` (status, reasonCode, message, bookingsUnchanged) |
| BookingsTable | Table | Table data `{{Availability.BOOKINGS}}` (read-only) |
| InfoText | Text | Title, demo clock, note that checks never change bookings |

JS Object: `Availability` (see `Availability.jsobject.js`). No datasources, no queries, no connectors.
