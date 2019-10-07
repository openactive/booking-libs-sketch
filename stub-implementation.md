# StubImplementation
The following details a stub implementation of the abstract OpenActiveEngine

## In-memory arrays ("database")

- Opportunities table: SessionSeries, ScheduledSessions, Events, CourseInstances, FacilityUse, Slots
- Orders table
  - isLease
- OrderItems table
- Seller auth table (Seller <-> Auth) - OAuth adds Sellers to this list, but Auth stays the same - even if Seller adds and removes
- Seller table (booking systems only)
- OpenBookingAuthenticatedParty table (used to drive Orders feed)

## Open Data

### SessionSeries
- `openActiveEngine.rpdeOpenDataStub("SessionSeries", modified, id);`

### ScheduledSession
- `openActiveEngine.rpdeOpenDataStub("ScheduledSessions", modified, id);`

## Open Booking

### OrderQuote Creation (C1 & C2)
// N.B: below are dependencies of `openActiveEngine.processOrderQuoteCheckpoint(requestJson, uuid, auth)`
  - `getSeller(auth, id)`
    - Return a lookup from the Seller table based on auth
  - `getBookingService()`
    - Return hard-coded JSON for booking service

### OrderQuote Deletion
- `openActiveEngine.expireLease(uuid);` // is implemented on its own
  - Delete Order record with uuid, only if Order record isLease = true 

### Order Creation (B)
// N.B: below are dependencies of `openActiveEngine.processOrderBooking(requestJson, uuid)`

### Order Deletion
- `openActiveEngine.destroyOrder(uuid);`
  - Delete Order record with uuid, only if Order record isLease = false 

### Order Cancellation
// N.B: below are dependencies of `openActiveEngine.processOrderCancellation(requestJson, uuid);`

### Orders RPDE Feed
// N.B: below are dependencies of `openActiveEngine.outputOrderFeedPage(modified, id);`

### Order Status
- `openActiveEngine.getOrder(uuid);`

## Test harness
// N.B: below are dependencies of openActiveEngine.processTestCommand(command);
- `testCommandResetTestData()`
  - Reset the in-memory database to include all the test events
    - `"[OA-TEST] One Space Remaining"`
    - `"[OA-TEST] No Spaces"`
    - `"[OA-TEST] Conflicting Event 1"`
    - `"[OA-TEST] Conflicting Event 2"`
    - `"[OA-TEST] Provider Will Cancel"`
    - `"[OA-TEST] Provider Will Change Logistics"`
- `testCommandTriggerProviderCancellation()`
  - Trigger provider cancellation on opportunity named `"[OA-TEST] Provider Will Cancel"`
- `testCommandTriggerChangeOfLogistics()`
  - Trigger change of logistics on opportunity named `"[OA-TEST] Provider Will Change Logistics"`
  - Ideally by randomly adjusting either one of "name", "startDate", or "location" each time
  