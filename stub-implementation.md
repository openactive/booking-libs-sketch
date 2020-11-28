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
- `openActiveEngine.rpdeOpenDataPage("SessionSeries", modified, id, testMode);`

### ScheduledSession
- `openActiveEngine.rpdeOpenDataPage("ScheduledSessions", modified, id, testMode);`

## Open Booking

### Optional overrides
// Note these URLs do not actually need to resolve to actual endpoints, they are a URL to make them namespaced and hence globally unique
  - `getOfferUrlTemplate() => "https://ourparks.org.uk/events/{event_id}#/offers/{offer_id}"`
  - `getOpportunityUrlTemplate() => "https://ourparks.org.uk/events/{event_id}/sub-events/{session_id}"`
  - `getOrderItemUrlTemplate() => "https://ourparks.org.uk/orders/{order_id}/order-items/{order_items}"`

### OrderQuote Creation (C1 & C2)
// N.B: below are dependencies of `openActiveEngine.processOrderQuoteCheckpoint(requestJson, uuid, auth)`
  - `fetchCheckpointData(orderId,  authKey, orderQuote)`
    - Preload any data (useful for mapping to an existing API), which can be used via getOrderItem calls later
    - Not used in stub
    - OURPARKS: Return null
  - `getSeller(auth, id)`
    - Return a lookup from the Seller table based on auth
    - Or for single seller system, return hard-coded JSON for seller
    - OURPARKS: Return static JSON
  - `getBookingService()`
    - Return hard-coded JSON for booking service
    - OURPARKS: Return null
  - `getCustomerSupportedFields()`
    - Return supported subset of Person or Organization fields 
    - OURPARKS: Adjust for only fields required
  - `getBrokerSupportedFields()`
    - Return supported subset of Person fields
  - `getOrderItem(orderItem, opportunityIdComponents, offerIdComponents, seller, taxPayeeRelationship, data)`
    - Retrieve full OrderItem from specified light orderItem (using mainly ID)
    - Return potential errors:
      - SellerMismatchError: Opportunity not available under Seller associated with specified auth key
      - OpportunityNotFoundError: Opportunity not found
    - Note that opportunity type should not be used to determine OrderItem (and is not required), id alone is sufficient
    - OURPARKS: SELECT * FROM events where id = opportunityIdComponents["event_id"]
  - `leaseOrCheckBookable(mutable orderedItems, draftOrderQuote, checkpointStage, seller.taxMode, taxPayeeRelationship, payer, authKey, data )`
    - Only required if leasing or conflict possible / complex booking criteria

### OrderQuote Deletion
- `openActiveEngine.expireLease(uuid);` // is implemented on its own
  - Delete Order record with uuid, only if Order record isLease = true 

### Order Creation (B)
// TODO: Continue from here
// N.B: below are dependencies of `openActiveEngine.processOrderBooking(requestJson, uuid)`
  - Implementation of OrderQuote Creation (C1 & C2)
  - `fetchCheckpointData(orderId,  authKey, orderQuote)`
    - Preload any data (useful for mapping to an existing API), which can be used via getOrderItem calls later
    - Not used in stub
    - OURPARKS: Return null
  - `processBooking(draftOrder, checkpointStage, seller.taxMode, taxPayeeRelationship, payer, authKey, data)`
    - Process booking
  - `orderItemComponents = bookOrderItem(orderItem, opportunityIdComponents, offerIdComponents, seller, taxPayeeRelationship, data)`

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
- `testCustomerNotice()`
  - Trigger customerNotice update on opportunity named `"[OA-TEST] Provider Will Send Customer Notice"`