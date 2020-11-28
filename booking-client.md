
## Orders Booking Engine architecture

- Configured to work with one broker / whatever broker info is passed in!

- Fully guest-checkout, no customer storage. And hence Orders or Events feed by customer - only webhook for Order success.

- Translates the various feeds and notifications into a whole bunch of webhooks

- Wraps the core part of the booking flow

- Includes OAuth flow for new Seller registration


Make Orders against providers, e.g:

https://openactive-ms/bookingsystems/{booking_system_id}/orders/{uuid}

-> Maps to the booking system


## Run validator over all feeds



## Database

Opportunities (joins to itself for Facilites and SessionSeries)
- Allows to search on geo, activities, etc. for "Event", "SessionSeries", "FacilityUse" (using location-> JSONB || superEvent->location-> to include EventSeries)
  - Though this isn't the primary function of this store, this MVP search, used primarily for test harness, could be expanded later
- Allows to join to OrderItems for "Event", "Slot", "ScheduledSession"
- Includes "parentId" which joins from ScheduledSession->SessionSeries
- Includes "sellerId" which joins to Seller table to indicate "bookable"

// Note compares value from C1, C2, and B with feed values to check they are the same - and errors if not.

OrderItems (join Events <-> Orders)

Orders

Invoices

Seller
- SellerID
- PaymentConfiguration

System (1:1 with dataset site)
- Feed
- Booking Endpoints
- API Key

// Assume Payments and Refunds are handled in their own system

## Config params
// Env var: auth token for local webhooks (to secure them in e.g. Heroku environments)

## Endpoints

### Search (Postgres): Opportunities - by ID, by name (for testing), and (stretch) by lat/lng.
-- Also includes the "is bookable" calculation based on a join with the Seller table
-- Though this can be ignored for testing, as the actual endpoint should be tested for a response

### RDPE feed of all Opportunities 
-- Can be easily consumed by an app with existing search functionality

### Admin: RegisterBookingSystem (accepts dataset site, or data catalogue?)
// Env var: dataset site directory, to automatically register booking systems

### Admin: RegisterSeller
### Admin: OAuthRegisterSeller
### Admin: RegisterPaymentConfigurationWithSeller
/booking-systems/{system_id}/sellers/{seller_id}
GET /booking-systems
PUT/DELETE /booking-systems/{system_id} - this is a feed, and auth credential for a booking system instance
GET /booking-systems/{system_id}/sellers
PUT/DELETE /booking-systems/{system_id}/sellers/{seller_id} - this is a seller within the feed, including PaymentConfiguration

Registers feeds with Harvester Microservice?


### Invoices (versioned)
/booking-systems/{system_id}/orders/{order_id}/invoices/latest - Latest
/booking-systems/{system_id}/orders/{order_id}/invoices/1 - GET
/booking-systems/{system_id}/orders/{order_id}/invoices - LIST

## Orders get
/booking-systems/{system_id}/orders/{order_id}

## Booking system Orders get/delete (primarily for testing)
GET/DELETE /booking-systems/{system_id}/origin-orders/{order_id}

## PATCH for Cancellation
- Looks up the Seller to get auth details (errors otherwise)
- Pass through (background triggers below handle actual work here)

// N.B Every passthrough runs validation on the input and output models

### C1 - pass through
//TODO: Do we partition the list by system_id? Or just infer it from the Seller? How do I know which provider a particular opportunity is from?

/booking-systems/{system_id}/orders/{order_id} - LIST
- Includes "seller" ID in submitted OrderQuote
- Looks up the Seller to get auth details, based on associated booking system (errors otherwise)
- Include OrderItem level error if opportunity details OR Seller returned by B do not match with latest feed contents

### C2 - pass through
- Includes "seller" ID in submitted OrderQuote
- Looks up the Seller to get auth details, based on associated booking system (errors otherwise)
- Include OrderItem level error if opportunity details OR Seller returned by B do not match with latest feed contents
  - Customer should be advised that the details of this opportunity have been updated while booking, and to try again shortly (auto-refresh call to C2 to try again every 10 seconds - displaying "30 seconds" to the user - until the details are accurate)

### B - return Order without associated invoice? Invoice can be retrieved via GET as needed?
- Includes "seller" ID in submitted OrderQuote
- Includes external "payment" blob with all necessary tokens for selected payment service
- Looks up the Seller to get auth details (errors otherwise)
- Store Order (retrievable via GET)
- Call Payment Authorisation Webhook -> including Order (with full details augmented from feed), Seller (with full details augmented from feed), PaymentConfiguration data, and external "payment" blob returning new external "payment" blob and "payment" for Booking System
- Call B - pass through (replacing Integrated "payment" with Open Booking "payment"), return any errors and initiate rollback
- Error if Seller details in B do not match Seller details in feed, and roll back (delete Booking)
- Error if logistics details returned by B do not match with feed contents, and roll back (delete Booking)
- Call Payment Capture Webhook -> including Order (with full details augmented from feed), Seller (with full details from B) and PaymentConfiguration data, and updated "payment" blob returning new external "payment" blob and "payment" for Booking System
- Generate Invoice and store version of it locally
- Call Customer Notification Webhook -> including Order (with full details augmented from feed), Seller, Invoice and PaymentConfiguration data, and final external "payment" blob (may also be used to store invoice)
  - Includes Invoice ID which can be used for later retrieval
  - This should be used to update the Broker system state, as if process fails after Payment capture this may be triggered async

// Include rollback procedure for case where these fail, which retries webhook if failed

## Background triggers (RPDE harvesting)

Harvesting occurs in pages. In order for processing to be robust, a page must acknowledged only after all its contents have been written.

Harvesting also runs items through validator and stores errors against each

Includes JSON diff library to detect changes, which trigger appropriate notifications: https://www.npmjs.com/package/diff-json

### Harvest Orders feed
- Step 1: Write the changes to the DB, which updates the timestamps - just store the whole page. In doing this read the previous content and mark the page as "substantive" if the difference is worth writing home about. If a "substantive" change is already present, add to the array of changes. Only acknowledge new page after all written, otherwise write them again.
- Step 2: Process each "substantive" page in turn with a single web hook call, cancelling etc as appropriate

- Accept "patch" on existing data structure

- If changes:
  - Trigger Customer Notification Webhook
- If cancellation:
  - N.B cancellation from feed not marked as processed until this process is complete
  - Trigger idempotent Refund Webhook -> including Order (with full details augmented from feed), Seller and PaymentConfiguration data
  - Update Invoice and store locally
  - Call Customer Notification Webhook -> including Order (with full details augmented from feed), Seller, Invoice and PaymentConfiguration data (may also be used to store invoice)
    - This should be used to update the Broker system state

### Harvest Opportunities feed
Key fields are pulled out of the Event that qualify as "substantive changes", and included in the SQL for the same of comparison

- Step 1: Write the changes to the DB, which updates the timestamps - just store the whole page. In doing this read the previous content and mark the page as "substantive" if the difference is worth writing home about. If a "substantive" change is already present, add to the array of changes. Only acknowledge new page after all written, otherwise write them again.
  - Note substantive changes are stored on the Order (repeated for each order) and not on the Opportunity
- Step 2: Process each "substantive" changed Order in turn with a single web hook call

- If changes to logistics:
  - Trigger Customer Notification Webhook for Orders related to the relevant events



### Integration guide

-- 
