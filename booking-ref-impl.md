# OpenActive Reference implementation

The booking reference implementation is incredibly simple, and simply provides an example of the endpoints of OpenActive implemented using "StubImplementation", which is available as open source code annotated and to inspect.

It is designed to be copy-and-pasted on Day 1 of the implementation, to allow the developer to get a working implementation within their booking system.

The entire library system is designed to be modular, with helper classes that can be used independently (for those who prefer flexibility), and an abstract OpenActiveEngine that can be implemented (for those who prefer a quicker, more prescribed approach).

# Endpoints

// Note that StubReferenceImplementation is available to get an implementation working immediately
openActiveEngine = OpenActiveEngine.StubImplementation

## Dataset Site
- GET /openactive
- return openActiveEngine.renderSimpleDatasetSite("Our Parks Sessions", "Our Parks",
  true, true, false, false, "https://ourparks.org.uk/openactive", "https://github.com/ourparks/opendata", "Our Parks", "Our Parks - turn up tone up!", "hello@ourparks.org.uk",
  "https://ourparks.org.uk/", "https://ourparks.org.uk/logo.png", "https://ourparks.org.uk/bg.jpg",
  "https://ourparks.org.uk/opendata/", "https://ourparks.org.uk/openbooking/");

## Open Data

### SessionSeries
- GET /open-data/session-series?afterModified={modified}&afterId={id}
  - return openActiveEngine.rpdeOpenDataPage("SessionSeries", modified, id);

### ScheduledSession
- GET /open-data/scheduled-sessions?afterModified={modified}&afterId={id}
  - return openActiveEngine.rpdeOpenDataPage("ScheduledSessions", modified, id);

## Open Booking

### OrderQuote Creation (C1 & C2)
- PATCH /open-booking/order-quote/{uuid}
  - return openActiveEngine.processOrderQuoteCheckpoint(authKey, requestJson, uuid);

### OrderQuote Deletion
- DELETE /open-booking/order-quotes/{uuid}
  - return openActiveEngine.expireLease(uuid);

### Order Creation (B)
- PUT /open-booking/orders/{uuid}
  - return openActiveEngine.processOrderBooking(authKey, requestJson, uuid)

### Order Deletion
- DELETE /open-booking/orders/{uuid}
  - return openActiveEngine.destroyOrder(authKey, uuid);

### Order Cancellation
- PATCH /open-booking/orders/{uuid}
  - return openActiveEngine.processOrderCancellation(authKey, requestJson, uuid);

### Orders RPDE Feed
- GET /open-booking/orders-rpde?afterModified={modified}&afterId={id}
  - return openActiveEngine.outputOrderFeedPage(authKey, modified, id);

### Order Status
- GET /open-booking/orders/{uuid}
  - return openActiveEngine.getOrder(authKey, uuid);

### Lease Cleanup
- // Note this endpoint should be secured with an API key in production!
- // This endpoint is designed to be called using a CRON job every 10 minutes (e.g. with wget) or similar
- GET /open-booking/lease-cleanup?key=58ea215f-47f6-4944-9b81-5ea3d9d0a817
  - return openActiveEngine.leaseCleanup();

## Test harness
This endpoints allows the test harness to reset test data and trigger certain events

### Test-harness endpoint
- // Note this endpoint should not be available in production!
- POST /open-booking/test-harness-commands/{command}
  - return openActiveEngine.processTestCommand(command);


